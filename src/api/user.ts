import baseService from './axios'

// 用户登录接口
export const userLogin = (data: { username: string; password: string }) => {
  return baseService.post(`/api/bill/login`, data)
}

// 修改密码 
export const updatePassword = (data: any) => {
  return baseService.post(`/api/bill/setting/change-password`, data)
}

// 用户信息接口
export const getUserInfo = () => {
  return baseService.get(`/api/bill/user/info`)
}