import baseService from './axios'

// 创建云存储域名（需要 replaceDomain 字段）
export const createCloudDomain = (data: { replaceDomain: string }) => {
  return baseService.post(`api/bill/cloud-domain/create`, data)
}

// 更新云存储域名静态文件（传 id）
export const updateCloudDomain = (data: { id: number }) => {
  return baseService.post(`api/bill/cloud-domain/update`, data)
}

// 获取云存储域名列表（支持域名搜索）
export const getCloudDomainList = (data: any) => {
  return baseService.post(`api/bill/cloud-domain/list`, data)
}

// 删除云存储域名（同时删除bucket）
export const deleteCloudDomain = (data: any) => {
  return baseService.post(`api/bill/cloud-domain/delete`, data)
} 