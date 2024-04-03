import axios from 'axios'
import Cookies from 'js-cookie'
import { serverApiPreix } from '@/config'

const token = Cookies.get('tee-token')
const axiosInstance = axios.create({
  baseURL: serverApiPreix ?? '',
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

export const getDatasetsIdRequest = () => {
  return axiosInstance.request({
    url: '/dify/datasets',
    method: 'get',
  })
}

export function createUploadFileIdRequest(datasetsId: string, formData: any) {
  return axiosInstance.request({
    url: `/dify/datasets/${datasetsId}/document/create_by_file`,
    method: 'post',
    data: formData,
  })
}

export function getFileStatusRequest(datasetsId: string, batch: any) {
  return axiosInstance.request({
    url: `/dify/datasets/${datasetsId}/documents/${batch}/indexing-status`,
    method: 'get',
  })
}
