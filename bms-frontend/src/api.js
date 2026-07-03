import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'

const api = axios.create({ baseURL: '/api' })

let loadingCount = 0

const showLoading = () => {
  if (loadingCount === 0) {
    const mask = document.createElement('div')
    mask.className = 'global-loading-mask'
    mask.id = 'global-loading'
    const spinner = document.createElement('div')
    spinner.className = 'el-loading-spinner'
    spinner.innerHTML = '<svg class="circular" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none"></circle></svg>'
    mask.appendChild(spinner)
    document.body.appendChild(mask)
  }
  loadingCount++
}

const hideLoading = () => {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    const mask = document.getElementById('global-loading')
    if (mask) mask.remove()
  }
}

api.interceptors.request.use(config => {
  const adminToken = localStorage.getItem('token')
  const readerToken = localStorage.getItem('reader_token')
  if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`
  if (readerToken) config.headers.Authorization = `Bearer ${readerToken}`
  if (config.showLoading !== false) {
    showLoading()
    config._showLoading = true
  }
  return config
})

api.interceptors.response.use(
  res => {
    if (res.config._showLoading) hideLoading()
    return res.data
  },
  err => {
    if (err.config?._showLoading) hideLoading()
    const msg = err.response?.data?.message || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export const notifySuccess = (message) => {
  ElNotification({
    title: '操作成功',
    message,
    type: 'success',
    duration: 2000,
    position: 'top-right'
  })
}

export default api
