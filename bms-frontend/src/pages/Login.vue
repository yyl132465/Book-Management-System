<template>
  <div class="login-wrapper" @mousemove="handleMouseMove">
    <div class="login-bg" :style="bgStyle"></div>
    <div class="login-overlay"></div>
    <el-card class="login-card" :style="cardStyle">
      <h2 class="login-title">图书借阅管理系统</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="admin_name">
          <el-input v-model="form.admin_name" placeholder="管理员账号" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="pwd">
          <el-input v-model="form.pwd" type="password" placeholder="密码" prefix-icon="Lock" show-password size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" size="large" class="login-btn">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="footer-link">
        <router-link to="/reader/login">读者入口</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ admin_name: '', pwd: '' })
const rules = {
  admin_name: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  pwd: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const offsetX = ref(0)
const offsetY = ref(0)

const bgStyle = ref({
  transform: 'scale(1.05) translate(0px, 0px)',
  transition: 'transform 0.1s ease-out'
})
const cardStyle = ref({
  transform: 'translate(0px, 0px)',
  transition: 'transform 0.1s ease-out'
})

const handleMouseMove = (e) => {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const dx = (e.clientX - cx) / 30
  const dy = (e.clientY - cy) / 30
  bgStyle.value = { transform: `scale(1.05) translate(${-dx}px, ${-dy}px)`, transition: 'transform 0.1s ease-out' }
  cardStyle.value = { transform: `translate(${dx / 2}px, ${dy / 2}px)`, transition: 'transform 0.1s ease-out' }
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await api.post('/login', form)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('admin_name', res.data.admin_name)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) { /* handled by interceptor */ }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background-color: #f7f6f3;
}
.login-bg {
  position: absolute;
  top: -40px;
  left: -40px;
  right: -40px;
  bottom: -40px;
  background: url('@/assets/login-bg.webp') 35% center / cover no-repeat;
  filter: blur(6px);
  z-index: 0;
  will-change: transform;
}

.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.65);
  z-index: 1;
}
.login-card {
  width: 400px;
  padding: 36px 32px 28px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px !important;
  border: 1px solid rgba(255,255,255,0.5) !important;
  box-shadow: 0 12px 48px rgba(0,0,0,0.15) !important;
  will-change: transform;
}
.login-title {
  text-align: center;
  margin-bottom: 24px;
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}
.login-btn {
  width: 100%;
  background: linear-gradient(180deg, #6B9FF0, #4A7BE0) !important;
  border: none !important;
  border-bottom: 3px solid #3A6BD0 !important;
  font-size: 16px;
  letter-spacing: 4px;
  height: 44px;
  box-shadow: 0 4px 12px rgba(74,123,224,0.35);
  transition: all 0.2s ease;
}
.login-btn:hover {
  background: linear-gradient(180deg, #5B8DEF, #3A6BD0) !important;
  border-bottom-color: #2A5BC0 !important;
  box-shadow: 0 6px 18px rgba(58,107,208,0.5);
  transform: translateY(-1px);
}
.login-btn:active {
  transform: translateY(1px);
  border-bottom-width: 1px !important;
}
.footer-link {
  text-align: center;
  margin-top: 12px;
}
.footer-link a {
  color: var(--primary);
  font-size: 13px;
  text-decoration: none;
  transition: all 0.2s ease;
}
.footer-link a:hover {
  color: #3A6BD0;
  text-decoration: underline;
}

/* 统一表单间距 */
.login-card :deep(.el-form-item) {
  margin-bottom: 20px;
}
.login-card :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* 增大输入框内边距 */
.login-card :deep(.el-input__wrapper) {
  padding: 4px 12px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
  transition: box-shadow 0.2s ease;
}
.login-card :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c5cde0 inset;
}

/* 校验错误柔和配色 */
.login-card :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f5a0a0 inset !important;
}
.login-card :deep(.el-form-item__error) {
  color: #e08888;
}
</style>
