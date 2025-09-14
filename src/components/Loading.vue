<template>
  <div v-if="show" class="loading-overlay">
    <div class="loading-content">
      <van-loading type="spinner" size="24px" color="#1989fa" />
      <p class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
</style>
