<template>
  <div id="app">
    <router-view />
    
    <!-- 全局底部Tabbar -->
    <van-tabbar v-model="activeTab" fixed v-if="showTabbar">
      <van-tabbar-item icon="gold-coin-o" to="/cards">卡密</van-tabbar-item>
      <van-tabbar-item icon="credit-pay" to="/domains">域名</van-tabbar-item>
      <van-tabbar-item icon="records-o" to="/ban-domain">防封域名</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant';

const route = useRoute()
const activeTab = ref(0)

// 根据当前路由决定是否显示tabbar
const showTabbar = computed(() => {
  const tabbarRoutes = ['/cards', '/domains', '/ban-domain']
  return tabbarRoutes.includes(route.path)
})

// 根据当前路由设置activeTab
const updateActiveTab = () => {
  const routeMap = {
    '/cards': 0,
    '/domains': 1,
    '/ban-domain': 2,
  }
  activeTab.value = routeMap[route.path] || 0
}

// 监听路由变化
watch(route, updateActiveTab, { immediate: true })
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f7f8fa;
}

#app {
  height: 100%;
}

/* 移动端适配 */
@media screen and (max-width: 750px) {
  html {
    font-size: 14px;
  }
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 修复 Vant 4.x Toast 白色背景问题 */
.van-toast {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}

.van-toast--text {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}

.van-toast--success {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}

.van-toast--fail {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}

.van-toast--loading {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}
</style>
