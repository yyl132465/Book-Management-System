import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import router from './router'

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

function createApiInstance(tokenKey, loginPath) {
  const instance = axios.create({ baseURL: '/api' })

  instance.interceptors.request.use(config => {
    const token = sessionStorage.getItem(tokenKey)
    if (token) config.headers.Authorization = `Bearer ${token}`
    if (config.showLoading !== false) {
      showLoading()
      config._showLoading = true
    }
    return config
  })

  instance.interceptors.response.use(
    res => {
      if (res.config._showLoading) hideLoading()
      return res.data
    },
    err => {
      if (err.config?._showLoading) hideLoading()
      const status = err.response?.status
      const msg = err.response?.data?.message || '请求失败'

      if (status === 401) {
        sessionStorage.removeItem(tokenKey)
        ElMessage.error('登录已过期，请重新登录')
        router.push(loginPath)
      } else {
        ElMessage.error(msg)
      }
      return Promise.reject(err)
    }
  )

  return instance
}

const adminApi = createApiInstance('token', '/login')
const readerApi = createApiInstance('reader_token', '/reader/login')

export const notifySuccess = (message) => {
  ElNotification({
    title: '操作成功',
    message,
    type: 'success',
    duration: 2000,
    position: 'top-right'
  })
}

export { adminApi, readerApi }
export default adminApi
