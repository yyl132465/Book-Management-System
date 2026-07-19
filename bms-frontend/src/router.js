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
    meta: { requireAdmin: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('./pages/Dashboard.vue'), meta: { requireAdmin: true } },
      { path: 'books', name: 'Books', component: () => import('./pages/Books.vue'), meta: { requireAdmin: true } },
      { path: 'categories', name: 'Categories', component: () => import('./pages/Categories.vue'), meta: { requireAdmin: true } },
      { path: 'readers', name: 'Readers', component: () => import('./pages/Readers.vue'), meta: { requireAdmin: true } },
      { path: 'borrows', name: 'Borrows', component: () => import('./pages/Borrows.vue'), meta: { requireAdmin: true } },
      { path: 'overdue', name: 'Overdue', component: () => import('./pages/Overdue.vue'), meta: { requireAdmin: true } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const adminToken = sessionStorage.getItem('token')
  const readerToken = sessionStorage.getItem('reader_token')

  if (to.meta.requireAdmin && !adminToken) {
    return next('/login')
  }

  if (to.meta.requireReader && !readerToken) {
    return next('/reader/login')
  }

  next()
})

export default router
