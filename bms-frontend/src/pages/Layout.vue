<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo-area">
        <span class="logo-icon">📚</span>
        <span v-show="!isCollapse" class="logo-text">图书管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="var(--sidebar-bg)"
        text-color="var(--sidebar-text)"
        active-text-color="#5B8DEF"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <span class="menu-icon">📊</span>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/books">
          <span class="menu-icon">📚</span>
          <template #title>图书管理</template>
        </el-menu-item>
        <el-menu-item index="/categories">
          <span class="menu-icon">🏷️</span>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/readers">
          <span class="menu-icon">👥</span>
          <template #title>读者管理</template>
        </el-menu-item>
        <el-menu-item index="/borrows">
          <span class="menu-icon">📋</span>
          <template #title>借阅管理</template>
        </el-menu-item>
        <el-menu-item index="/overdue">
          <span class="menu-icon">⏰</span>
          <template #title>逾期查询</template>
        </el-menu-item>
      </el-menu>
      <div class="collapse-btn" @click="isCollapse = !isCollapse">
        <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
      </div>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPageTitle">{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-center">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索图书..."
            :prefix-icon="Search"
            class="global-search"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="topbar-right">
          <el-tooltip content="逾期图书提醒" placement="bottom">
            <el-badge :value="overdueCount" :hidden="overdueCount === 0" :max="99" class="notice-badge">
              <el-button circle :icon="Bell" @click="goOverdue" />
            </el-badge>
          </el-tooltip>
          <el-button text :icon="Lock" @click="showPwdDialog = true">改密码</el-button>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <span class="avatar-wrap">
              <el-avatar :size="34" class="user-avatar">{{ adminName.charAt(0) }}</el-avatar>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content" :data-page="activeMenu.replace('/','')">
        <div class="page-header">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>

  <!-- 修改密码弹窗 -->
  <el-dialog title="修改密码" v-model="showPwdDialog" width="420px">
    <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="80px">
      <el-form-item label="旧密码" prop="oldPwd">
        <el-input v-model="pwdForm.oldPwd" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPwd">
        <el-input v-model="pwdForm.newPwd" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPwd">
        <el-input v-model="pwdForm.confirmPwd" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showPwdDialog = false">取消</el-button>
      <el-button type="primary" @click="handleChangePwd">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Bell, Lock, Fold, Expand, User, SwitchButton } from '@element-plus/icons-vue'
import api from '../api'

const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)
const searchKeyword = ref('')
const overdueCount = ref(0)
const showPwdDialog = ref(false)
const pwdFormRef = ref(null)
const pwdForm = ref({ oldPwd: '', newPwd: '', confirmPwd: '' })

const adminName = sessionStorage.getItem('admin_name') || '管理员'

const activeMenu = computed(() => '/' + route.path.split('/')[1])

const pageTitles = {
  '/dashboard': '仪表盘',
  '/books': '图书管理',
  '/categories': '分类管理',
  '/readers': '读者管理',
  '/borrows': '借阅管理',
  '/overdue': '逾期查询'
}
const currentPageTitle = computed(() => pageTitles[activeMenu.value] || '')

const pwdRules = {
  oldPwd: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPwd: [{ required: true, min: 6, message: '新密码至少6位', trigger: 'blur' }],
  confirmPwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value, cb) => value === pwdForm.value.newPwd ? cb() : cb(new Error('两次密码不一致')), trigger: 'blur' }
  ]
}

const fetchOverdueCount = async () => {
  try {
    const res = await api.get('/borrows/overdue', { showLoading: false })
    overdueCount.value = (res.data || []).length
  } catch (e) { /* ignore */ }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/books', query: { keyword: searchKeyword.value.trim() } })
  }
}

const goOverdue = () => router.push('/overdue')

const handleUserCommand = (cmd) => {
  if (cmd === 'profile') {
    ElMessage.info('个人信息页面开发中')
  } else if (cmd === 'logout') {
    handleLogout()
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('admin_name')
    router.push('/login')
  } catch (e) { /* cancelled */ }
}

const handleChangePwd = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await api.put('/admin/change-pwd', {
      old_pwd: pwdForm.value.oldPwd,
      new_pwd: pwdForm.value.newPwd
    })
    ElMessage.success('密码修改成功')
    showPwdDialog.value = false
    pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  } catch (e) { /* handled */ }
}

// 响应式：小屏自动折叠
const checkScreen = () => {
  isCollapse.value = window.innerWidth < 768
}
onMounted(() => {
  fetchOverdueCount()
  checkScreen()
  window.addEventListener('resize', checkScreen)
})
</script>

<style scoped>
.layout-container { height: 100%; }

/* 侧边栏 */
.sidebar {
  background: #151a26;
  min-height: 100vh;
  transition: width 0.25s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid rgba(255,255,255,0.06);
}
.logo-area {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.logo-icon { font-size: 22px; }
.logo-text { color: #fff; font-size: 16px; font-weight: 600; white-space: nowrap; }
.sidebar-menu {
  border-right: none;
  flex: 1;
}
.sidebar-menu .el-menu-item {
  transition: all 0.25s ease;
  padding: 12px 16px;
  margin: 0;
  border-radius: 0;
  min-width: 0;
  height: auto;
  line-height: normal;
}
.sidebar-menu .el-menu-item:hover {
  background-color: rgba(255,255,255,0.06) !important;
}
.sidebar-menu .el-menu-item.is-active {
  background: rgba(91,141,239,0.08) !important;
  border-left: 3px solid #5B8DEF;
  color: #5B8DEF !important;
}
.menu-icon { margin-right: 8px; font-size: 16px; }
.el-menu--collapse .menu-icon { margin-right: 0; }

.collapse-btn {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sidebar-text);
  border-top: 1px solid rgba(255,255,255,0.08);
  transition: all 0.25s;
  font-size: 18px;
}
.collapse-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }

/* 顶栏 */
.topbar {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  gap: 20px;
}
.topbar-left { flex-shrink: 0; }
.topbar-left :deep(.el-breadcrumb__inner) { font-size: 12px; color: #b0b3bb; }
.topbar-left :deep(.el-breadcrumb__inner.is-link) { color: #b0b3bb; }
.topbar-left :deep(.el-breadcrumb__inner.is-link:hover) { color: var(--primary); }
.topbar-center { flex: 1; display: flex; justify-content: center; }
.global-search { width: 380px; }
.global-search :deep(.el-input__wrapper) { border-radius: 8px; background: #f5f7fa; }
.topbar-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}
.notice-badge { margin-right: 4px; }
.avatar-wrap { cursor: pointer; }
.user-avatar { background: linear-gradient(135deg, var(--primary), #4A7BE0); color: #fff; font-weight: 600; }

.main-content {
  background: var(--page-bg);
  padding: 24px;
  min-height: calc(100vh - var(--header-height));
}
.page-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
</style>
