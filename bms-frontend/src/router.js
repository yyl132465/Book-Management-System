import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('./pages/Login.vue') },
  { path: '/reader/login', name: 'ReaderLogin', component: () => import('./pages/ReaderLogin.vue') },
  { path: '/reader/register', name: 'ReaderRegister', component: () => import('./pages/ReaderRegister.vue') },
  {
    path: '/reader/home',
    name: 'ReaderHome',
    component: () => import('./pages/ReaderHome.vue'),
    meta: { requireReader: true }
  },
  {
    path: '/',
    component: () => import('./pages/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('./pages/Dashboard.vue') },
      { path: 'books', name: 'Books', component: () => import('./pages/Books.vue') },
      { path: 'categories', name: 'Categories', component: () => import('./pages/Categories.vue') },
      { path: 'readers', name: 'Readers', component: () => import('./pages/Readers.vue') },
      { path: 'borrows', name: 'Borrows', component: () => import('./pages/Borrows.vue') },
      { path: 'overdue', name: 'Overdue', component: () => import('./pages/Overdue.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const adminToken = localStorage.getItem('token')
  const readerToken = localStorage.getItem('reader_token')

  // 管理员路由守卫
  const adminPath = to.path === '/' || to.path.startsWith('/dashboard') || to.path.startsWith('/books')
    || to.path.startsWith('/categories') || to.path.startsWith('/readers')
    || to.path.startsWith('/borrows') || to.path.startsWith('/overdue')

  if (adminPath && !adminToken) {
    return next('/login')
  }

  // 读者路由守卫
  if (to.meta.requireReader && !readerToken) {
    return next('/reader/login')
  }

  next()
})

export default router
