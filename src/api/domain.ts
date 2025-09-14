import baseService from './axios'

// 获取域名列表
export const getDomainList = (data: any) => {
  return baseService.post(`api/bill/domain/list`, data)
}
// 删除
export const delDomain = (data: any) => {
  return baseService.post(`api/bill/domain/del`, data)
}
// 新增
export const addDomain = (data: any) => {
  return baseService.post(`api/bill/domain/add`, data)
}


// 检测
export const checkDomain = () => {
  return baseService.post(`api/bill/domain/checkdomain`,{})
}

// 检测
export const wechatBan = (data: any) => {
  return baseService.post(`api/bill/domain/wechatban`,data)
}

