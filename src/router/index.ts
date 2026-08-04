import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  // 清理计划路由
  {
    path: '/cleaning/monthly',
    name: 'MonthlyCleaningPlan',
    component: () => import('@/views/MonthlyCleaningPlan.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/feeding',
    name: 'FeedingSchedule',
    component: () => import('@/views/FeedingSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/molding',
    name: 'MoldingSchedule',
    component: () => import('@/views/MoldingSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/heat-treatment',
    name: 'HeatTreatmentSchedule',
    component: () => import('@/views/HeatTreatmentSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/fine-cleaning',
    name: 'FineCleaningSchedule',
    component: () => import('@/views/FineCleaningSchedule.vue'),
    meta: { requiresAuth: true }
  },
  // 用户管理路由
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Home.vue'), // 暂时指向Home，后续替换为用户管理页面
    meta: { requiresAuth: true }
  },
  // 系统管理路由
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Home.vue'), // 暂时指向Home，后续替换为设置页面
    meta: { requiresAuth: true }
  },
  {
    path: '/security',
    name: 'Security',
    component: () => import('@/views/Home.vue'), // 暂时指向Home，后续替换为安全页面
    meta: { requiresAuth: true }
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: () => import('@/views/Home.vue'), // 暂时指向Home，后续替换为权限页面
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory('/MES/'),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
