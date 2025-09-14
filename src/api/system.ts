import baseService from './axios'

// 系统配置
export const getSysConfig = (data: any) => {
  return baseService.get(`api/bill/setting/get`, { params: data })
}

export const setSysConfig = (data: any) => {
  return baseService.post(`api/bill/setting/update`, data)
}


export const getAddressList = () => {
  return baseService.get(`api/bill/setting/address/list`)
}

export const upsertAddress = (data: any) => {
  return baseService.post(`api/bill/setting/address/upsert`,data)
}

export const deleteAddress = (data: any) => {
  return baseService.post(`api/bill/setting/address/del`,data)
}

export const getTron = () => {
  return baseService.get(`api/bill/setting/tron/get`)
}

export const updateTron = (data: any) => {
  return baseService.post(`api/bill/setting/tron/update`,data)
}