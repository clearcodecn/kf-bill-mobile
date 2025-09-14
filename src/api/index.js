import axios from 'axios'
import { showToast, showConfirmDialog } from 'vant'
import router from '@/router'

const ContentType = {
  json: 'application/json',
  formData: 'multipart/form-data'
}

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://bill.asmartkf.com/api',
  timeout: 60000,
  responseType: 'json',
  withCredentials: false,
  // headers: {
  //   'X-Requested-With': 'XMLHttpRequest'
  // }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = token // 让每个请求携带自定义 token 请根据实际情况自行修改
    }
    config.headers['Content-Type'] = ContentType[config.data instanceof FormData ? 'formData' : 'json']
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (res) => {
    if (res.status === 200) {
      const { code } = res.data
      if (code === 200) {
        return res.data
      } else if (code === 401 || code === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        showToast({
          message: '登录过期或权限不足, 请重新登陆!',
          type: 'fail'
        })
        router.push('/login')
      } else if (code === 406) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        showToast({
          message: '登陆超时请重新登录!',
          type: 'fail'
        })
        router.push('/login')
      }
      return res.data
    }
    return res
  },
  (error) => {
    console.log(error)
    const msg = error.message
    const result = error.response
    if (result) {
      const { data, status } = result
      if (data.message) {
        showToast({
          message: data.message,
          type: 'fail'
        })
      } else if (status === 401 || status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        showToast({
          message: '登录过期或权限不足, 请重新登陆!',
          type: 'fail'
        })
        router.push('/login')
      } else if (status === 500) {
        showToast({
          message: '请求数据失败, 请重试!',
          type: 'fail'
        })
      } else if (status === 406) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        showToast({
          message: '登陆超时请重新登录!',
          type: 'fail'
        })
        router.push('/login')
        // emitter.emit('axios_goto_login')
      }
    } else if (msg) {
      if (msg === 'Network Error') {
        showToast({
          message: '网络错误,请检查网络!',
          type: 'fail'
        })
      } else {
        showToast({
          message: msg,
          type: 'fail'
        })
      }
    } else if (error.__CANCEL__) {
      // ignore message error
    } else {
      showToast({
        message: '未知错误,请重试!',
        type: 'fail'
      })
    }
    return false
  }
)

// 重新导出axios实例
export { default } from './axios'

// 重新导出所有API模块
export * from './index.ts'
