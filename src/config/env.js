// 环境配置
const config = {
  development: {
    API_BASE_URL: 'https://bill.asmartkf.com/api',
    APP_TITLE: '卡密管理系统 - 开发环境'
  },
  production: {
    API_BASE_URL: 'https://bill.asmartkf.com/api',
    APP_TITLE: '卡密管理系统'
  }
}

// 获取当前环境
const env = import.meta.env.MODE || 'development'

// 导出当前环境配置
export default config[env]

// 导出环境变量
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || config[env].API_BASE_URL
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || config[env].APP_TITLE
