<template>
  <div class="domains-container">
    <van-nav-bar title="域名管理" fixed />
    
    <div class="domains-content">
      <!-- 搜索和筛选 -->
      <!-- <div class="search-section">
        <van-search
          v-model="searchValue"
          placeholder="搜索域名"
          @search="onSearch"
          @clear="onClear"
        />
        <van-dropdown-menu>
          <van-dropdown-item v-model="statusFilter" :options="statusOptions" />
          <van-dropdown-item v-model="wechatStatusFilter" :options="wechatStatusOptions" />
          <van-dropdown-item v-model="typeFilter" :options="typeOptions" />
        </van-dropdown-menu>
      </div> -->
      
      <!-- 操作按钮 -->
      <div class="action-section">
        <van-button type="primary" icon="plus" @click="showAddDialog = true">
          批量新增
        </van-button>
        <van-button 
          :type="isSelectionMode ? 'default' : 'success'" 
          :icon="isSelectionMode ? 'cross' : 'copy'" 
          @click="toggleSelectionMode"
        >
          {{ isSelectionMode ? '取消选择' : '批量复制' }}
        </van-button>
        <van-button 
          v-if="isSelectionMode" 
          type="warning" 
          icon="check" 
          @click="toggleSelectAll"
        >
          {{ isAllSelected ? '取消全选' : '全选' }}
        </van-button>
        <van-button 
          v-if="isSelectionMode && selectedDomains.size > 0" 
          type="primary" 
          icon="copy" 
          @click="copySelectedDomains"
        >
          复制 ({{ selectedDomains.size }})
        </van-button>
      </div>
      
      <!-- 域名列表 -->
      <div class="list-section">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-cell-group>
            <van-cell
              v-for="domain in domainList"
              :key="domain.id"
              :title="domain.topName"
              :label="`微信状态: ${getWechatStatusText(domain.wechatStatus)} | 协议: ${domain.protocol} | 创建: ${formatTime(domain.createTime)}`"
              @click="isSelectionMode ? toggleDomainSelection(domain) : selectDomain(domain)"
            >
              <template #right-icon>
                <van-checkbox 
                  v-if="isSelectionMode"
                  :model-value="selectedDomains.has(domain.id)"
                  @click.stop="toggleDomainSelection(domain)"
                />
                <van-icon 
                  v-else
                  name="ellipsis" 
                  @click.stop="showDomainActions(domain)" 
                />
              </template>
            </van-cell>
          </van-cell-group>
        </van-list>
      </div>
    </div>
    
    <!-- 批量新增对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="批量新增域名"
      show-cancel-button
      @confirm="onAddConfirm"
    >
      <van-field
        v-model="addForm.domains"
        type="textarea"
        label="域名列表"
        placeholder="请输入域名，每行一个"
        rows="4"
      />
      <van-field
        v-model="protocolText"
        label="协议"
        placeholder="请选择协议"
        readonly
        is-link
        @click="showProtocolPicker = true"
      />
      <van-field
        v-model="statusText"
        label="状态"
        placeholder="请选择状态"
        readonly
        is-link
        @click="showStatusPicker = true"
      />
    </van-dialog>
    
    <!-- 域名操作弹窗 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="onActionSelect"
    />
    
    <!-- 协议选择器 -->
    <van-popup v-model:show="showProtocolPicker" position="bottom">
      <van-picker
        :columns="protocolPickerOptions"
        @confirm="onProtocolConfirm"
        @cancel="showProtocolPicker = false"
      />
    </van-popup>
    
    <!-- 状态选择器 -->
    <van-popup v-model:show="showStatusPicker" position="bottom">
      <van-picker
        :columns="statusPickerOptions"
        @confirm="onStatusConfirm"
        @cancel="showStatusPicker = false"
      />
    </van-popup>
    
    <!-- 域名详情弹窗 -->
    <van-popup v-model:show="showDomainDetail" position="bottom" :style="{ height: '60%' }">
      <div class="domain-detail">
        <div class="detail-header">
          <h3>域名详情</h3>
          <van-icon name="cross" @click="showDomainDetail = false" />
        </div>
        <div class="detail-content" v-if="selectedDomain">
          <van-cell title="域名地址" :value="selectedDomain.topName" />
          <van-cell title="状态" :value="getStatusText(selectedDomain.status)" />
          <van-cell title="微信状态" :value="getWechatStatusText(selectedDomain.wechatStatus)" />
          <van-cell title="协议" :value="selectedDomain.protocol" />
          <van-cell title="是否测试域名" :value="selectedDomain.isForTesting ? '是' : '否'" />
          <van-cell title="是否绑定" :value="selectedDomain.isBind ? '是' : '否'" />
          <van-cell title="创建时间" :value="formatTime(selectedDomain.createTime)" />
          <van-cell title="检查时间" :value="formatTime(selectedDomain.checkTime)" />
        </div>
        <div class="detail-actions">
          <van-button type="primary" @click="toggleBlock">
            {{ selectedDomain?.wechatStatus === 2 ? '解除封禁' : '封禁域名' }}
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { SuperDomainApi as DomainApi } from '@/api'

const searchValue = ref('')
const statusFilter = ref('all')
const wechatStatusFilter = ref('all')
const typeFilter = ref('all')
const loading = ref(false)
const finished = ref(false)
const showAddDialog = ref(false)
const showActionSheet = ref(false)
const showDomainDetail = ref(false)
const showProtocolPicker = ref(false)
const showStatusPicker = ref(false)
const selectedDomain = ref(null)

// 选择相关
const selectedDomains = ref(new Set())
const isSelectionMode = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const domainList = ref([])
const addForm = reactive({
  domains: '',
  protocol: 'http',  // 默认协议：HTTP
  status: 1          // 默认状态：启用
})

const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '正常', value: 1 },
  { text: '异常', value: 0 }
]

const wechatStatusOptions = [
  { text: '全部微信状态', value: 'all' },
  { text: '正常', value: 1 },
  { text: '封禁', value: 2 }
]

const typeOptions = [
  { text: '全部类型', value: 'all' },
  { text: '正式域名', value: false },
  { text: '测试域名', value: true }
]

const protocolPickerOptions = [
  { text: 'HTTP', value: 'http' },
  { text: 'HTTPS', value: 'https' }
]

const statusPickerOptions = [
  { text: '启用', value: 1 },
  { text: '禁用', value: 2 }
]

const actionSheetActions = ref([
  { name: '复制', value: 'copy' },
  { name: '查看详情', value: 'detail' },
  { name: '封禁', value: 'toggleBlock' },
  { name: '删除', value: 'delete' }
])

// 计算属性：是否全选
const isAllSelected = computed(() => {
  return domainList.value.length > 0 && selectedDomains.value.size === domainList.value.length
})

// 计算属性：协议显示文本
const protocolText = computed(() => {
  const option = protocolPickerOptions.find(opt => opt.value === addForm.protocol)
  return option ? option.text : ''
})

// 计算属性：状态显示文本
const statusText = computed(() => {
  const option = statusPickerOptions.find(opt => opt.value === addForm.status)
  return option ? option.text : ''
})

// 获取域名列表
const getDomainList = async (page = 1, isRefresh = false) => {
  try {
    if (isRefresh) {
      domainList.value = []
      currentPage.value = 1
      finished.value = false
    }
    
    const params = {
      page: page,
      pageSize: pageSize.value
    }
    
    // 添加搜索条件
    if (searchValue.value.trim()) {
      params.keyword = searchValue.value.trim()
    }
    
    // 添加状态筛选
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    
    // 添加微信状态筛选
    if (wechatStatusFilter.value !== 'all') {
      params.wechatStatus = wechatStatusFilter.value
    }
    
    // 添加类型筛选
    if (typeFilter.value !== 'all') {
      params.isForTesting = typeFilter.value
    }
    
    const response = await DomainApi.getDomainList(params)
    
    if (response.code === 200) {
      const { list, total: totalCount } = response.data
      
      if (isRefresh) {
        domainList.value = list || []
      } else {
        domainList.value = [...domainList.value, ...(list || [])]
      }
      
      total.value = totalCount || 0
      currentPage.value = page
      
      // 判断是否还有更多数据
      if (domainList.value.length >= total.value) {
        finished.value = true
      }
    } else {
      showToast(response.message || '获取域名列表失败')
    }
  } catch (error) {
    console.error('获取域名列表失败:', error)
    showToast('获取域名列表失败，请重试')
  } finally {
    loading.value = false
  }
}

const onLoad = () => {
  if (loading.value || finished.value) return
  
  loading.value = true
  getDomainList(currentPage.value + 1)
}

// 状态映射函数
const getStatusText = (status) => {
  const statusMap = {
    1: '正常',
    0: '异常'
  }
  return statusMap[status] || '未知'
}

const getWechatStatusText = (status) => {
  const statusMap = {
    1: '正常',
    2: '封禁'
  }
  return statusMap[status] || '未知'
}

// 时间格式化
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const onSearch = (value) => {
  searchValue.value = value
  getDomainList(1, true)
}

const onClear = () => {
  searchValue.value = ''
  getDomainList(1, true)
}

// 切换选择模式
const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value
  if (!isSelectionMode.value) {
    // 退出选择模式时清空选择
    selectedDomains.value.clear()
  }
}

// 切换域名选择状态
const toggleDomainSelection = (domain) => {
  if (selectedDomains.value.has(domain.id)) {
    selectedDomains.value.delete(domain.id)
  } else {
    selectedDomains.value.add(domain.id)
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedDomains.value.clear()
  } else {
    // 全选
    domainList.value.forEach(domain => {
      selectedDomains.value.add(domain.id)
    })
  }
}

// 复制选中域名（带协议格式）
const copySelectedDomains = () => {
  if (selectedDomains.value.size === 0) {
    showToast('请先选择要复制的域名')
    return
  }
  
  // 获取选中的域名列表，格式为 协议://域名
  const selectedDomainUrls = domainList.value
    .filter(domain => selectedDomains.value.has(domain.id))
    .map(domain => `${domain.protocol}://${domain.topName}`)
  
  if (selectedDomainUrls.length === 0) {
    showToast('没有选中的域名')
    return
  }
  
  // 用换行符连接域名
  const domainText = selectedDomainUrls.join('\n')
  
  // 复制到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(domainText).then(() => {
      showToast(`已复制 ${selectedDomainUrls.length} 个域名`)
    }).catch(() => {
      showToast('复制失败')
    })
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = domainText
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      showToast(`已复制 ${selectedDomainUrls.length} 个域名`)
    } catch (err) {
      showToast('复制失败')
    }
    document.body.removeChild(textArea)
  }
}

// 批量复制功能（原有功能，保持兼容）
const batchCopy = () => {
  if (selectedDomains.value.size === 0) {
    showToast('请先选择要复制的域名')
    return
  }
  
  // 获取选中的域名列表
  const selectedDomainNames = domainList.value
    .filter(domain => selectedDomains.value.has(domain.id))
    .map(domain => domain.topName)
  
  if (selectedDomainNames.length === 0) {
    showToast('没有选中的域名')
    return
  }
  
  // 用换行符连接域名
  const domainText = selectedDomainNames.join('\n')
  
  // 复制到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(domainText).then(() => {
      showToast(`已复制 ${selectedDomainNames.length} 个域名`)
      // 复制成功后退出选择模式
      isSelectionMode.value = false
      selectedDomains.value.clear()
    }).catch(() => {
      showToast('复制失败')
    })
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = domainText
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      showToast(`已复制 ${selectedDomainNames.length} 个域名`)
      // 复制成功后退出选择模式
      isSelectionMode.value = false
      selectedDomains.value.clear()
    } catch (err) {
      showToast('复制失败')
    }
    document.body.removeChild(textArea)
  }
} 
const onAddConfirm = async () => {
  if (!addForm.domains.trim()) {
    showToast('请输入域名列表')
    return
  }
  
  if (!addForm.protocol) {
    showToast('请选择协议')
    return
  }
  
  if (!addForm.status) {
    showToast('请选择状态')
    return
  }
  
  try {
    const domains = addForm.domains.split('\n').filter(domain => domain.trim())
    if (domains.length === 0) {
      showToast('请输入有效的域名')
      return
    }
    
    // 将域名列表用换行符连接
    const topName = domains.join('\n')
    
    const response = await DomainApi.addDomain({
      topName: topName,
      status: addForm.status,
      protocol: addForm.protocol,
      IsForTesting: false, 
    })
    
    if (response.code === 200) {
      showToast('新增域名成功')
      showAddDialog.value = false
      addForm.domains = ''
      addForm.protocol = ''
      addForm.status = ''
      // 刷新列表
      getDomainList(1, true)
    } else {
      showToast(response.message || '新增域名失败')
    }
  } catch (error) {
    console.error('新增域名失败:', error)
    showToast('新增域名失败，请重试')
  }
}

const selectDomain = (domain) => {
  selectedDomain.value = domain
  showDomainDetail.value = true
}

const showDomainActions = (domain) => {
  selectedDomain.value = domain
  showActionSheet.value = true
}

const toggleBlock = async () => {
  if (!selectedDomain.value) return
  
  try {
    const isCurrentlyBlocked = selectedDomain.value.wechatStatus === 2
    const newStatus = isCurrentlyBlocked ? 1 : 2
    
    const response = await DomainApi.wechatBan({
      id: selectedDomain.value.id,
      status: newStatus
    })
    
    if (response.code === 200) {
      selectedDomain.value.wechatStatus = newStatus
      showToast(isCurrentlyBlocked ? '域名已解封' : '域名已封禁')
      // 刷新列表
      getDomainList(1, true)
    } else {
      showToast(response.message || '操作失败')
    }
  } catch (error) {
    console.error('封禁/解封操作失败:', error)
    showToast('操作失败，请重试')
  }
}

const onActionSelect = (action) => {
  switch (action.value) {
    case 'copy':
      // 复制域名到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(selectedDomain.value.topName).then(() => {
          showToast('复制成功')
        }).catch(() => {
          showToast('复制失败')
        })
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = selectedDomain.value.topName
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          showToast('复制成功')
        } catch (err) {
          showToast('复制失败')
        }
        document.body.removeChild(textArea)
      }
      break
    case 'detail':
      showDomainDetail.value = true
      break
    case 'toggleBlock':
      toggleBlock()
      break
    case 'delete':
      showConfirmDialog({
        title: '确认删除',
        message: '确定要删除这个域名吗？'
      }).then(async () => {
        try {
          const response = await DomainApi.delDomain({
            id: selectedDomain.value.id
          })
          
          if (response.code === 200) {
            showToast('删除成功')
            // 刷新列表
            getDomainList(1, true)
          } else {
            showToast(response.message || '删除失败')
          }
        } catch (error) {
          console.error('删除域名失败:', error)
          showToast('删除失败，请重试')
        }
      }).catch(() => {
        // 用户取消
      })
      break
  }
  showActionSheet.value = false
}

const onProtocolConfirm = ({ selectedOptions }) => {
  addForm.protocol = selectedOptions[0].value
  showProtocolPicker.value = false
}

const onStatusConfirm = ({ selectedOptions }) => {
  addForm.status = selectedOptions[0].value
  showStatusPicker.value = false
}

// 监听筛选器变化
watch([statusFilter, wechatStatusFilter, typeFilter], () => {
  getDomainList(1, true)
})

onMounted(() => {
  getDomainList(1, true)
})
</script>

<style scoped>
.domains-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px; /* 为底部tabbar留出空间 */
}

.domains-content {
  padding: 60px 16px 16px;
}

.search-section {
  margin-bottom: 16px;
}

.action-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.action-section .van-button {
  flex: 0 1 auto;
  min-width: 80px;
  white-space: nowrap;
}

/* 移动端优化：当按钮较多时，使用更小的按钮 */
@media (max-width: 480px) {
  .action-section .van-button {
    min-width: 70px;
    font-size: 12px;
    padding: 0 8px;
  }
}

.list-section {
  margin-top: 16px;
}

.domain-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
