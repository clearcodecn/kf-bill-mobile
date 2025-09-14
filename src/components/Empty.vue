<template>
  <div class="empty-container">
    <van-empty
      :image="image"
      :description="description"
    >
      <van-button
        v-if="showButton"
        round
        type="primary"
        class="bottom-button"
        @click="$emit('click')"
      >
        {{ buttonText }}
      </van-button>
    </van-empty>
  </div>
</template>

<script setup>
defineProps({
  image: {
    type: String,
    default: 'default'
  },
  description: {
    type: String,
    default: '暂无数据'
  },
  showButton: {
    type: Boolean,
    default: false
  },
  buttonText: {
    type: String,
    default: '立即添加'
  }
})

defineEmits(['click'])
</script>

<style scoped>
.empty-container {
  padding: 40px 20px;
  text-align: center;
}

.bottom-button {
  margin-top: 16px;
}
</style>
