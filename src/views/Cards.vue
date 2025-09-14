<template>
  <div class="cards-container">
    <van-nav-bar title="卡密管理" fixed />
    
    <div class="cards-content">
      <!-- 搜索条件 -->
      <div class="search-section">
        <van-collapse v-model="activeCollapse">
          <van-collapse-item title="搜索条件" name="search">
            <van-form @submit="onSearch">
              <van-field
                v-model="searchForm.cardID"
                name="cardID"
                label="卡密ID"
                placeholder="请输入卡密ID"
                label-width="80px"
              />
              <van-field
                v-model="searchForm.cardTypeText"
                name="cardType"
                label="卡密类型"
                placeholder="请选择卡密类型"
                label-width="80px"
                is-link
                readonly
                @click="showTypePicker = true"
              />
              <van-field
                v-model="searchForm.dayText"
                name="day"
                label="卡密天数"
                placeholder="请选择卡密天数"
                label-width="80px"
                is-link
                readonly
                @click="showDayPicker = true"
              />
              <van-field
                v-model="searchForm.loginStatusText"
                name="loginStatus"
                label="登录状态"
                placeholder="请选择登录状态"
                label-width="80px"
                is-link
                readonly
                @click="showLoginPicker = true"
              />
              <van-field
                v-model="searchForm.saleStatusText"
                name="saleStatus"
                label="销售状态"
                placeholder="请选择销售状态"
                label-width="80px"
                is-link
                readonly
                @click="showSalePicker = true"
              />
              <van-field
                v-model="searchForm.expireStatusText"
                name="expireStatus"
                label="过期状态"
                placeholder="请选择过期状态"
                label-width="80px"
                is-link
                readonly
                @click="showExpirePicker = true"
              />
              <van-field
                v-model="searchForm.expireTime"
                name="expireTime"
                label="过期时间"
                placeholder="请选择过期时间范围"
                label-width="80px"
                is-link
                readonly
                @click="showExpireTimePicker = true"
              />
              <van-field
                v-model="searchForm.loginTime"
                name="loginTime"
                label="登录时间"
                placeholder="请选择登录时间范围"
                label-width="80px"
                is-link
                readonly
                @click="showLoginTimePicker = true"
              />
              <div class="search-buttons">
                <van-button type="primary" native-type="submit" block>
                  搜索
                </van-button>
                <van-button type="default" @click="resetSearch" block>
                  重置
                </van-button>
              </div>
            </van-form>
          </van-collapse-item>
        </van-collapse>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-section">
        <van-button type="primary" icon="plus" @click="showAddDialog = true">
          批量新增
        </van-button>
        <van-button type="success" icon="copy" @click="toggleBatchMode">
          {{ isBatchMode ? '取消批量' : '批量复制' }}
        </van-button>
      </div>
      
      <!-- 批量操作区域 -->
      <div v-if="isBatchMode" class="batch-section">
        <div class="batch-header">
          <van-checkbox v-model="selectAll" @change="onSelectAllChange">
            全选 ({{ selectedCards.length }}/{{ cardList.length }})
          </van-checkbox>
          <van-button type="primary" size="small" @click="batchCopy" :disabled="selectedCards.length === 0">
            复制选中 ({{ selectedCards.length }})
          </van-button>
        </div>
      </div>
      
      <!-- 卡密列表 -->
      <div class="list-section">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <van-cell-group>
              <van-cell
                v-for="card in cardList"
                :key="card.id"
                :title="card.cardId"
                :label="`天数: ${card.day}天 | 状态: ${getSaleStatusLabel(card.saleStatus)} | 过期: ${formatExpireTime(card.expireTime*1000)} \n 备注: ${card.remark} `"
                :style="{ backgroundColor: getCardBackgroundColor(card) }"
                @click="isBatchMode ? toggleCardSelection(card) : selectCard(card)"
              >
                <template #left-icon v-if="isBatchMode">
                  <van-checkbox 
                    :model-value="selectedCards.includes(card.id)"
                    @click.stop="toggleCardSelection(card)"
                  />
                </template>
                <template #right-icon> 
                  <div class="card-actions">
                    <van-icon name="label-o" @click.stop="simpleCopy(card.cardId)" class="copy-icon" />
                    <van-button 
                      v-if="card.saleStatus === 1" 
                      type="primary" 
                      size="mini" 
                      @click.stop="distributeCard(card)"
                      class="distribute-btn"
                    >
                      下发
                    </van-button>
                  </div>
                </template>
              </van-cell>
            </van-cell-group>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>
    
    <!-- 批量新增对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="批量新增卡密"
      show-cancel-button
      @confirm="onAddConfirm"
      @cancel="onAddCancel"
    >
      <div class="add-form-container">
        <van-field
          v-model="addForm.num"
          type="number"
          label="数量"
          placeholder="请输入新增数量"
          :rules="[{ required: true, message: '请输入数量' }]"
        />
        
        <van-field
          v-model="addForm.days"
          type="number"
          label="天数"
          placeholder="请输入卡密天数"
          :rules="[{ required: true, message: '请输入天数' }]"
        />
        
        <!-- 快捷天数按钮 -->
        <div class="quick-days">
          <span class="quick-days-label">快捷选择：</span>
          <van-button 
            size="small" 
            :type="parseInt(addForm.days) === 1 ? 'primary' : 'default'"
            @click="setQuickDays(1)"
          >
            1天
          </van-button>
          <van-button 
            size="small" 
            :type="parseInt(addForm.days) === 7 ? 'primary' : 'default'"
            @click="setQuickDays(7)"
          >
            7天
          </van-button>
          <van-button 
            size="small" 
            :type="parseInt(addForm.days) === 30 ? 'primary' : 'default'"
            @click="setQuickDays(30)"
          >
            30天
          </van-button>
        </div>
        
        <van-field
          v-model="addForm.remark"
          label="备注"
          placeholder="请输入备注信息（可选）"
          type="textarea"
          rows="3"
        />
        
        <div class="form-info">
          <van-tag type="primary">卡密类型：正式卡</van-tag>
        </div>
      </div>
    </van-dialog>
    
    <!-- 卡密操作弹窗 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="onActionSelect"
    />
    
    <!-- 卡密详情弹窗 -->
    <van-popup v-model:show="showCardDetail" position="bottom" :style="{ height: '70%' }">
      <div class="card-detail">
        <div class="detail-header">
          <h3>卡密详情</h3>
          <van-icon name="cross" @click="showCardDetail = false" />
        </div>
        <div class="detail-content" v-if="selectedCard">
          <van-cell title="卡密ID" :value="selectedCard.cardId" />
          <van-cell title="密码" :value="selectedCard.password || '无'" />
          <van-cell title="卡密类型" :value="getCardTypeLabel(selectedCard.cardType)" />
          <van-cell title="卡密天数" :value="selectedCard.day + '天'" />
          <van-cell title="销售状态" :value="getSaleStatusLabel(selectedCard.saleStatus)" />
          <van-cell title="登录状态" :value="getLoginStatusLabel(selectedCard.loginStatus)" />
          <van-cell title="过期时间" :value="formatTime(selectedCard.expireTime)" />
          <van-cell title="上次登录时间" :value="selectedCard.lastLoginTime ? formatTime(selectedCard.lastLoginTime) : '未登录'" />
          <van-cell title="域名" :value="selectedCard.domains ? selectedCard.domains.join(', ') : '无'" />
          <van-cell title="备注" :value="selectedCard.remark || '无'" />
        </div>
      </div>
    </van-popup>

    <!-- 选择器弹窗 -->
    <van-popup v-model:show="showTypePicker" position="bottom">
      <van-picker
        :columns="typeOptions"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showDayPicker" position="bottom">
      <van-picker
        :columns="daysOptions"
        @confirm="onDayConfirm"
        @cancel="showDayPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showLoginPicker" position="bottom">
      <van-picker
        :columns="loginOptions"
        @confirm="onLoginConfirm"
        @cancel="showLoginPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showSalePicker" position="bottom">
      <van-picker
        :columns="saleOptions"
        @confirm="onSaleConfirm"
        @cancel="showSalePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showExpirePicker" position="bottom">
      <van-picker
        :columns="expireStatusOptions"
        @confirm="onExpireConfirm"
        @cancel="showExpirePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showExpireTimePicker" position="bottom">
      <div class="datetime-picker-container">
        <div class="picker-header">
          <van-button type="default" @click="showExpireTimePicker = false">取消</van-button>
          <span class="picker-title">选择过期时间范围</span>
          <van-button type="primary" @click="onExpireTimeConfirm">确定</van-button>
        </div>
        <van-field
          v-model="expireTimeStart"
          label="开始时间"
          placeholder="选择开始时间"
          readonly
          @click="showExpireStartPicker = true"
        />
        <van-field
          v-model="expireTimeEnd"
          label="结束时间"
          placeholder="选择结束时间"
          readonly
          @click="showExpireEndPicker = true"
        />
      </div>
    </van-popup>

    <van-popup v-model:show="showLoginTimePicker" position="bottom">
      <div class="datetime-picker-container">
        <div class="picker-header">
          <van-button type="default" @click="showLoginTimePicker = false">取消</van-button>
          <span class="picker-title">选择登录时间范围</span>
          <van-button type="primary" @click="onLoginTimeConfirm">确定</van-button>
        </div>
        <van-field
          v-model="loginTimeStart"
          label="开始时间"
          placeholder="选择开始时间"
          readonly
          @click="showLoginStartPicker = true"
        />
        <van-field
          v-model="loginTimeEnd"
          label="结束时间"
          placeholder="选择结束时间"
          readonly
          @click="showLoginEndPicker = true"
        />
      </div>
    </van-popup>

    <!-- 时间选择器 -->
    <van-popup v-model:show="showExpireStartPicker" position="bottom">
      <van-date-picker
        v-model="expireStartDate"
        title="选择开始日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onExpireStartConfirm"
        @cancel="showExpireStartPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showExpireEndPicker" position="bottom">
      <van-date-picker
        v-model="expireEndDate"
        title="选择结束日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onExpireEndConfirm"
        @cancel="showExpireEndPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showLoginStartPicker" position="bottom">
      <van-date-picker
        v-model="loginStartDate"
        title="选择开始日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onLoginStartConfirm"
        @cancel="showLoginStartPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showLoginEndPicker" position="bottom">
      <van-date-picker
        v-model="loginEndDate"
        title="选择结束日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onLoginEndConfirm"
        @cancel="showLoginEndPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { getCardList, batchAddCards, updateStatus } from '@/api/card'


// 搜索相关
const activeCollapse = ref([])
const loading = ref(false)
const finished = ref(false)
const showAddDialog = ref(false)
const showActionSheet = ref(false)
const showCardDetail = ref(false)
const selectedCard = ref(null)

// 批量选择相关
const isBatchMode = ref(false)
const selectedCards = ref([])
const selectAll = ref(false)

// 选择器显示状态
const showTypePicker = ref(false)
const showDayPicker = ref(false)
const showLoginPicker = ref(false)
const showSalePicker = ref(false)
const showExpirePicker = ref(false)
const showExpireTimePicker = ref(false)
const showLoginTimePicker = ref(false)
const showExpireStartPicker = ref(false)
const showExpireEndPicker = ref(false)
const showLoginStartPicker = ref(false)
const showLoginEndPicker = ref(false)

// 数据
const cardList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const refreshing = ref(false)

// 搜索表单
const searchForm = reactive({
  cardID: '',
  cardType: 1,
  cardTypeText: '',
  day: 0,
  dayText: '',
  loginStatus: 0,
  loginStatusText: '',
  saleStatus: 0,
  saleStatusText: '',
  expireStatus: 0,
  expireStatusText: '',
  expireTime: '',
  loginTime: ''
})

// 时间范围
const expireTimeRange = ref([])
const loginTimeRange = ref([])

// 时间选择相关
const expireTimeStart = ref('')
const expireTimeEnd = ref('')
const loginTimeStart = ref('')
const loginTimeEnd = ref('')
const expireStartDate = ref(new Date())
const expireEndDate = ref(new Date())
const loginStartDate = ref(new Date())
const loginEndDate = ref(new Date())

// 日期选择器配置
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

// 新增表单
const addForm = reactive({
  num: '',
  days: 1,
  remark: ''
})

// 操作选项
const actionSheetActions = ref([
  { name: '复制', value: 'copy' },
  { name: '查看详情', value: 'detail' },
  { name: '删除', value: 'delete' }
])

// 选项配置
const typeOptions = [
  { text: '正式卡', value: 1 },
  { text: '测试卡', value: 2 }
]

const daysOptions = [
  { text: '请选择卡密天数', value: 0 },
  { text: '日卡', value: 1 },
  { text: '周卡', value: 7 },
  { text: '月卡', value: 30 }
]

const loginOptions = [
  { text: '未登录过', value: 1 },
  { text: '登录过', value: 2 }
]

const saleOptions = [
  { text: '未出售', value: 0 },
  { text: '销售中', value: 1 },
  { text: '下架', value: 2 },
  { text: '已出售', value: 3 }
]

const expireStatusOptions = [
  { text: '未过期', value: 1 },
  { text: '已过期', value: 2 }
]

// 获取卡密列表
const loadCardList = async (isRefresh = false) => {
  try {
    loading.value = true
    if (isRefresh) {
      currentPage.value = 1
      cardList.value = []
    }

    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      cardID: searchForm.cardID || '',
      cardType: searchForm.cardType,
      day: searchForm.day,
      loginStatus: searchForm.loginStatus,
      saleStatus: searchForm.saleStatus,
      expireStatus: searchForm.expireStatus,
      expireTime: searchForm.expireTime ? [searchForm.expireTime[0], searchForm.expireTime[1]] : [],
      loginTime: searchForm.loginTime ? [searchForm.loginTime[0], searchForm.loginTime[1]] : [],
      lastLoginTimeEnd: searchForm.loginTime ? new Date(searchForm.loginTime[1]).getTime() : 0,
      lastLoginTimeStart: searchForm.loginTime ? new Date(searchForm.loginTime[0]).getTime() : 0,
      expireEndTime: searchForm.expireTime ? new Date(searchForm.expireTime[1]).getTime() : 0,
      expireStartTime: searchForm.expireTime ? new Date(searchForm.expireTime[0]).getTime() : 0
    }

    const response = await getCardList(params)
    if (response.code === 200) {
      if (isRefresh) {
        cardList.value = response.data.list
      } else {
        cardList.value = [...cardList.value, ...response.data.list]
      }
      total.value = response.data.total
      
      // 判断是否还有更多数据
      if (cardList.value.length >= total.value) {
        finished.value = true
      }
    } else {
      showToast(response.message || '获取卡密列表失败')
      // 请求失败时设置 finished 为 true，防止无限请求
      finished.value = true
    }
  } catch (error) {
    console.error('获取卡密列表失败:', error)
    showToast('获取卡密列表失败')
    // 请求失败时设置 finished 为 true，防止无限请求
    finished.value = true
  } finally {
    loading.value = false
  }
}

const onLoad = () => {
  // 增加页码
  currentPage.value++
  loadCardList()
}

const onRefresh = async () => {
  refreshing.value = true
  // 重置页码和列表
  currentPage.value = 1
  cardList.value = []
  finished.value = false
  
  try {
    await loadCardList(true)
  } finally {
    refreshing.value = false
  }
}

const onSearch = () => {
  loadCardList(true)
}

const resetSearch = () => {
  // 重置字符串类型字段
  searchForm.cardID = ''
  searchForm.expireTime = ''
  searchForm.loginTime = ''
  
  // 重置 int 类型字段
  searchForm.cardType = 1
  searchForm.day = 0
  searchForm.loginStatus = 0
  searchForm.saleStatus = 0
  searchForm.expireStatus = 0
  
  // 重置显示文本字段
  searchForm.cardTypeText = ''
  searchForm.dayText = ''
  searchForm.loginStatusText = ''
  searchForm.saleStatusText = ''
  searchForm.expireStatusText = ''
  
  expireTimeRange.value = []
  loginTimeRange.value = []
  expireTimeStart.value = ''
  expireTimeEnd.value = ''
  loginTimeStart.value = ''
  loginTimeEnd.value = ''
  loadCardList(true)
}

// 选择器确认事件
const onTypeConfirm = ({ selectedValues, selectedOptions }) => {
  searchForm.cardType = selectedValues[0]
  searchForm.cardTypeText = selectedOptions[0].text
  showTypePicker.value = false
}

const onDayConfirm = ({ selectedValues, selectedOptions }) => {
  searchForm.day = selectedValues[0]
  searchForm.dayText = selectedOptions[0].text
  showDayPicker.value = false
}

const onLoginConfirm = ({ selectedValues, selectedOptions }) => {
  searchForm.loginStatus = selectedValues[0]
  searchForm.loginStatusText = selectedOptions[0].text
  showLoginPicker.value = false
}

const onSaleConfirm = ({ selectedValues, selectedOptions }) => {
  searchForm.saleStatus = selectedValues[0]
  searchForm.saleStatusText = selectedOptions[0].text
  showSalePicker.value = false
}

const onExpireConfirm = ({ selectedValues, selectedOptions }) => {
  searchForm.expireStatus = selectedValues[0]
  searchForm.expireStatusText = selectedOptions[0].text
  showExpirePicker.value = false
}

const onExpireTimeConfirm = () => {
  if (expireTimeStart.value && expireTimeEnd.value) {
    searchForm.expireTime = [expireTimeStart.value, expireTimeEnd.value]
  }
  showExpireTimePicker.value = false
}

const onLoginTimeConfirm = () => {
  if (loginTimeStart.value && loginTimeEnd.value) {
    searchForm.loginTime = [loginTimeStart.value, loginTimeEnd.value]
  }
  showLoginTimePicker.value = false
}

// 时间选择确认事件
const onExpireStartConfirm = ({ selectedValues }) => {
  expireTimeStart.value = formatDateFromValues(selectedValues)
  showExpireStartPicker.value = false
}

const onExpireEndConfirm = ({ selectedValues }) => {
  expireTimeEnd.value = formatDateFromValues(selectedValues)
  showExpireEndPicker.value = false
}

const onLoginStartConfirm = ({ selectedValues }) => {
  loginTimeStart.value = formatDateFromValues(selectedValues)
  showLoginStartPicker.value = false
}

const onLoginEndConfirm = ({ selectedValues }) => {
  loginTimeEnd.value = formatDateFromValues(selectedValues)
  showLoginEndPicker.value = false
}

// 格式化日期
const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 从选择器值格式化日期
const formatDateFromValues = (values) => {
  if (values && values.length >= 3) {
    const [year, month, day] = values
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return ''
}

// 工具函数
const getCardTypeLabel = (type) => {
  const option = typeOptions.find(item => item.value === type)
  return option ? option.label : '未知'
}

const getSaleStatusLabel = (status) => {
  console.log('status -> ', status)
  const option = saleOptions.find(item => item.value === status)
  return option ? option.text : '未知'
}

const getLoginStatusLabel = (status) => {
  const option = loginOptions.find(item => item.value === status)
  return option ? option.text : '未知'
}

const formatExpireTime = (expireTime) => {
  console.log('expopire', expireTime)
  if (!expireTime) return '未设置'
  
  // 如果是毫秒时间戳
  if (typeof expireTime === 'number' && expireTime > 0) {
    const date = new Date(expireTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 如果是字符串格式的日期
  if (typeof expireTime === 'string') {
    const date = new Date(expireTime)
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
  
  return '格式错误'
}

const getCardBackgroundColor = (card) => {
  // 未出售显示白色背景
  if (card.saleStatus === 0) {
    return '#ffffff'
  }
  
// 已出售的卡片，检查是否过期
  if (!card.expireTime) {
    return '#ffffff' // 没有过期时间，显示白色
  }
  
  const now = new Date().getTime()
  const expireTime = typeof card.expireTime === 'number' ? card.expireTime * 1000 : new Date(card.expireTime).getTime()
  // 已过期显示红色背景
  if (now > expireTime) {
    return '#ffebee' // 浅红色背景
  }
  
  return '#ffffff' // 默认白色背景
}

const formatTime = (timestamp) => {
  if (!timestamp) return '无'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 切换批量模式
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  if (!isBatchMode.value) {
    // 退出批量模式时清空选择
    selectedCards.value = []
    selectAll.value = false
  }
}

// 切换单个卡片选择
const toggleCardSelection = (card) => {
  const index = selectedCards.value.indexOf(card.id)
  if (index > -1) {
    selectedCards.value.splice(index, 1)
  } else {
    selectedCards.value.push(card.id)
  }
  updateSelectAllStatus()
}

// 全选/取消全选
const onSelectAllChange = (checked) => {
  if (checked) {
    selectedCards.value = cardList.value.map(card => card.id)
  } else {
    selectedCards.value = []
  }
  selectAll.value = checked
}

// 更新全选状态
const updateSelectAllStatus = () => {
  selectAll.value = selectedCards.value.length === cardList.value.length && cardList.value.length > 0
}

// 批量复制
const batchCopy = async () => {
  if (selectedCards.value.length === 0) {
    showToast('请先选择要复制的卡密')
    return
  }
  
  try {
    // 获取选中的卡密
    const selectedCardData = cardList.value.filter(card => selectedCards.value.includes(card.id))
    const cardIds = selectedCardData.map(card => card.cardId).join('\n')
    
    // 使用navigator.clipboard API复制
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(cardIds)
    } else {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = cardIds
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    
    showToast(`已复制 ${selectedCards.value.length} 个卡密`)
    isBatchMode.value = false
    
  } catch (error) {
    console.error('复制失败:', error)
    showToast('复制失败，请重试')
  }
}


// 单个卡密下发
const distributeCard = async (card) => {
  try {
    const result = await updateStatus({
      cardId: card.cardId,
      status: 3
    })
    
    if (result.code === 200) {
      showToast('下发成功')
      card.status = 3
      // 刷新列表
      // onRefresh()
    } else {
      showToast(result.message || '下发失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('下发失败:', error)
      showToast('下发失败，请重试')
    }
  }
}

// 快捷天数选择
const setQuickDays = (days) => {
  addForm.days = days
}

// 批量新增确认
const onAddConfirm = async () => {
  // 表单验证
  if (!addForm.num || addForm.num <= 0) {
    showToast('请输入有效的数量')
    return
  }
  
  if (!addForm.days || addForm.days <= 0) {
    showToast('请输入有效的天数')
    return
  }
  
  try {
    const params = {
      cardType: 1, // 固定为正式卡
      days: parseInt(addForm.days),
      num: parseInt(addForm.num),
      remark: addForm.remark || ''
    }
    
    const response = await batchAddCards(params)
    if (response.code === 200) {
      showToast(`成功新增 ${response.data} 张卡密`)
      showAddDialog.value = false
      resetAddForm()
      // 刷新列表
      loadCardList(true)
    } else {
      showToast(response.message || '新增失败')
    }
  } catch (error) {
    console.error('批量新增失败:', error)
    showToast('新增失败，请重试')
  }
}

// 批量新增取消
const onAddCancel = () => {
  showAddDialog.value = false
  resetAddForm()
}

// 重置新增表单
const resetAddForm = () => {
  addForm.num = ''
  addForm.days = 1
  addForm.remark = ''
}

const selectCard = (card) => {
  selectedCard.value = card
  showCardDetail.value = true
}

const showCardActions = (card) => {
  selectedCard.value = card
  showCardDetail.value = true
}

// 复制单个卡密
const copySingleCard = async (card) => {
  console.log('开始复制卡密:', card)
  
  if (!card || !card.cardId) {
    showToast('卡密信息无效')
    return
  }

  // 检查是否在移动端环境
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  console.log('是否移动端:', isMobile)

  try {
    // 优先使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      console.log('使用 Clipboard API 复制')
      await navigator.clipboard.writeText(card.cardId)
      showToast('复制成功')
      return
    }
    
    // 降级方案：使用传统的复制方法
    console.log('使用传统方法复制')
    const textArea = document.createElement('textarea')
    textArea.value = card.cardId
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.style.zIndex = '-1'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    
    // 移动端特殊处理
    if (isMobile) {
      textArea.style.position = 'absolute'
      textArea.style.left = '50%'
      textArea.style.top = '50%'
      textArea.style.transform = 'translate(-50%, -50%)'
      textArea.style.width = '1px'
      textArea.style.height = '1px'
    }
    
    // 选择文本
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, 99999) // 移动端兼容
    
    // 延迟执行复制命令，确保文本已选中
    setTimeout(() => {
      try {
        const successful = document.execCommand('copy')
        console.log('复制结果:', successful)
        
        if (successful) {
          showToast('复制成功')
        } else {
          showToast('复制失败，请手动复制')
        }
      } catch (err) {
        console.error('execCommand 复制失败:', err)
        showToast('复制失败，请手动复制')
      } finally {
        document.body.removeChild(textArea)
      }
    }, 100)
    
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败，请手动复制')
  }
}

// 简单的复制方法（备选方案）
const simpleCopy = (text) => {
  try {
    // 创建一个临时的输入框
    const input = document.createElement('input')
    input.value = text
    input.style.position = 'fixed'
    input.style.opacity = '0'
    input.style.left = '-9999px'
    document.body.appendChild(input)
    
    // 选择并复制
    input.select()
    input.setSelectionRange(0, 99999)
    
    const successful = document.execCommand('copy')
    document.body.removeChild(input)
    
    if (successful) {
      showToast('复制成功')
    } else {
      showToast('复制失败')
    }
  } catch (err) {
    console.error('简单复制失败:', err)
    showToast('复制失败')
  }
}

// 复制卡密密码
const copyCardPassword = async () => {
  if (!selectedCard.value) {
    showToast('未选择卡密')
    return
  }

  try {
    // 使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(selectedCard.value.cardId)
      showToast('复制成功')
    } else {
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea')
      textArea.value = selectedCard.value.cardId
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          showToast('复制成功')
        } else {
          showToast('复制失败，请手动复制')
        }
      } catch (err) {
        showToast('复制失败，请手动复制')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败，请手动复制')
  }
}

const onActionSelect = (action) => {
  switch (action.value) {
    case 'copy':
      copyCardPassword()
      break
    case 'detail':
      showCardDetail.value = true
      break
    case 'delete':
      showConfirmDialog({
        title: '确认删除',
        message: '确定要删除这个卡密吗？'
      }).then(() => {
        // TODO: 调用删除接口
        showToast('删除成功')
      }).catch(() => {
        // 用户取消
      })
      break
  }
  showActionSheet.value = false
}

onMounted(() => {
  loadCardList(true)
})
</script>

<style scoped>
.cards-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px; /* 为底部tabbar留出空间 */
}

.cards-content {
  padding: 60px 16px 16px;
}

.search-section {
  margin-bottom: 16px;
}

.search-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.datetime-picker-container {
  padding: 16px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.picker-title {
  font-size: 16px;
  font-weight: 500;
}

.action-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.action-section .van-button {
  flex: 1;
}

.batch-section {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.batch-header .van-checkbox {
  flex: 1;
}

.batch-header .van-button {
  flex-shrink: 0;
}

/* 批量新增表单样式 */
.add-form-container {
  padding: 16px;
}

.quick-days {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 8px 0;
}

.quick-days-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.form-info {
  margin-top: 16px;
  text-align: center;
}

.list-section {
  margin-top: 16px;
}

/* 列表项边框样式 */
.list-section :deep(.van-cell) {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-section :deep(.van-cell-group) {
  background: transparent;
}

.list-section :deep(.van-cell-group .van-cell:last-child) {
  margin-bottom: 0;
}

.card-detail {
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

/* 卡密操作按钮样式 */
.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-icon {
  color: #1989fa;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.copy-icon:hover {
  color: #0570db;
}

.distribute-btn {
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
}
</style>
