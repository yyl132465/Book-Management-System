<template>
  <div class="login-wrapper" @mousemove="handleMouseMove">
    <div class="login-bg" :style="bgStyle"></div>
    <el-card class="login-card" :style="cardStyle">
      <h2 class="login-title">读者登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="reader_id">
          <el-input v-model="form.reader_id" placeholder="学号" prefix-icon="User" size="large" />
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
        <router-link to="/reader/register">还没有账号？去注册</router-link>
      </div>
      <div class="footer-link">
        <router-link to="/login">管理员入口</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { readerApi } from '../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ reader_id: '', pwd: '' })
const rules = {
  reader_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  pwd: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const bgStyle = ref({ transform: 'translate(0px, 0px)', transition: 'transform 0.1s ease-out' })
const cardStyle = ref({ transform: 'translate(0px, 0px)', transition: 'transform 0.1s ease-out' })

const handleMouseMove = (e) => {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const dx = (e.clientX - cx) / 30
  const dy = (e.clientY - cy) / 30
  bgStyle.value = { transform: `translate(${-dx}px, ${-dy}px)`, transition: 'transform 0.1s ease-out' }
  cardStyle.value = { transform: `translate(${dx / 2}px, ${dy / 2}px)`, transition: 'transform 0.1s ease-out' }
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await readerApi.post('/reader/login', form)
    sessionStorage.setItem('reader_token', res.data.token)
    sessionStorage.setItem('reader_name', res.data.r_name)
    sessionStorage.setItem('reader_id', res.data.reader_id)
    ElMessage.success('登录成功')
    router.push('/reader/home')
  } catch (e) { /* handled */ }
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
}
.login-bg {
  position: absolute;
  top: -40px; left: -40px; right: -40px; bottom: -40px;
  background: url('@/assets/login-bg.png') center/cover no-repeat;
  z-index: 0;
  will-change: transform;
}
.login-card {
  width: 400px;
  padding: 40px 32px;
  z-index: 1;
  background: rgba(255,255,255,0.85) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px !important;
  border: 1px solid rgba(255,255,255,0.5) !important;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12) !important;
  will-change: transform;
}
.login-title {
  text-align: center;
  margin-bottom: 32px;
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
}
.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #5B8DEF, #4A7BE0) !important;
  border: none !important;
  font-size: 16px;
  letter-spacing: 4px;
  height: 44px;
}
.footer-link {
  text-align: center;
  margin-top: 10px;
}
.footer-link a {
  color: var(--primary);
  font-size: 13px;
  text-decoration: none;
}
.footer-link a:hover { text-decoration: underline; }
</style>
