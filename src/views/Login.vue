<template>
  <div class="login-container">
    <div class="login-header">
      <h1 class="login-title">卡密管理后台</h1>
    </div>
    
    <div class="login-form">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            placeholder="用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            placeholder="密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div style="margin: 16px;">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            :loading="loading"
            loading-text="登录中..."
          >
            提交
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'
import { userLogin } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const onSubmit = async (values) => {
  loading.value = true
  
  try {
    const response = await userLogin(values)
    
    console.log(response)
    if (response.code === 200) {
      const { token, role, username } = response.data
      
      // 保存登录信息
      userStore.login(token, { 
        username, 
        role,
        token 
      })
      
      showToast('登录成功')
      router.push('/')
    } else {
      showToast(response.message || '登录失败')
    }
    
  } catch (error) {
    console.error('登录错误:', error)
    showToast('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-header {
  text-align: center;
  color: white;
  position: relative;
  top: -50px;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
}

.login-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.login-form {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

</style>
