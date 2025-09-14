import baseService from './axios'

// 获取卡密list
export const getCardList = (data: any) => {
  return baseService.post(`api/bill/card/list`, data)
}
// 更新状态
export const updateStatus = (data: any) => {
  return baseService.post(`api/bill/card/updateStatus`, data)
}
export const updateCardExpire = (data: any) => {
  return baseService.post(`api/bill/card/updateCardExpire`, data)
}
// 批量新增卡密
export const batchAddCards = (data: any) => {
  return baseService.post(`api/bill/card/batch-add`, data)
}

export const assignDomain = (data: any) => {
  return baseService.post(`api/bill/card/assignDomain`, data)
}

export const clearPassword = (data: any) => {
  return baseService.post(`api/bill/card/clearPassword`, data)
}