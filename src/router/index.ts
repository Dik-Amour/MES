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
    component: () => import('@/views/cleaning/MonthlyCleaningPlan.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/feeding',
    name: 'FeedingSchedule',
    component: () => import('@/views/cleaning/FeedingSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/molding',
    name: 'MoldingSchedule',
    component: () => import('@/views/cleaning/MoldingSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/heat-treatment',
    name: 'HeatTreatmentSchedule',
    component: () => import('@/views/cleaning/HeatTreatmentSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning/fine-cleaning',
    name: 'FineCleaningSchedule',
    component: () => import('@/views/cleaning/FineCleaningSchedule.vue'),
    meta: { requiresAuth: true }
  },
  // 清理生产记录路由
  {
    path: '/cleaning-production/manipulator',
    name: 'ManipulatorRecord',
    component: () => import('@/views/cleaning-production/ManipulatorRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/rough-cleaning',
    name: 'RoughCleaningRecord',
    component: () => import('@/views/cleaning-production/RoughCleaningRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/annealing',
    name: 'AnnealingRecord',
    component: () => import('@/views/cleaning-production/AnnealingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/barcode',
    name: 'BarcodeRecognitionRecord',
    component: () => import('@/views/cleaning-production/BarcodeRecognitionRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/coding',
    name: 'CodingRecord',
    component: () => import('@/views/cleaning-production/CodingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/fine-polishing',
    name: 'FinePolishingRecord',
    component: () => import('@/views/cleaning-production/FinePolishingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/blow-cleaning',
    name: 'BlowCleaningRecord',
    component: () => import('@/views/cleaning-production/BlowCleaningRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/grinding',
    name: 'GrindingRecord',
    component: () => import('@/views/cleaning-production/GrindingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/inner-cavity',
    name: 'InnerCavityShotBlastingRecord',
    component: () => import('@/views/cleaning-production/InnerCavityShotBlastingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/intelligent-polishing',
    name: 'IntelligentPolishingRecord',
    component: () => import('@/views/cleaning-production/IntelligentPolishingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/powder-coating',
    name: 'PowderCoatingRecord',
    component: () => import('@/views/cleaning-production/PowderCoatingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/robot-loading',
    name: 'RobotLoadingRecord',
    component: () => import('@/views/cleaning-production/RobotLoadingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/rough-polishing',
    name: 'RoughPolishingRecord',
    component: () => import('@/views/cleaning-production/RoughPolishingRecord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cleaning-production/vibration-core',
    name: 'VibrationCoreRecord',
    component: () => import('@/views/cleaning-production/VibrationCoreRecord.vue'),
    meta: { requiresAuth: true }
  },
  // 在制品管理路由
  {
    path: '/wip/initial-data',
    name: 'WipInitialData',
    component: () => import('@/views/wip/WipInitialData.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wip/detail',
    name: 'WipDetail',
    component: () => import('@/views/wip/WipDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wip/summary',
    name: 'WipSummary',
    component: () => import('@/views/wip/WipSummary.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wip/monthly-report',
    name: 'WipMonthlyReport',
    component: () => import('@/views/wip/WipMonthlyReport.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wip/annual-report',
    name: 'WipAnnualReport',
    component: () => import('@/views/wip/WipAnnualReport.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wip/material-stat',
    name: 'WipMaterialStat',
    component: () => import('@/views/wip/WipMaterialStat.vue'),
    meta: { requiresAuth: true }
  },
  // 安灯异常管理路由
  {
    path: '/andon/config',
    name: 'AndonExceptionConfig',
    component: () => import('@/views/andon/AndonExceptionConfig.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/andon/record',
    name: 'AndonExceptionRecord',
    component: () => import('@/views/andon/AndonExceptionRecord.vue'),
    meta: { requiresAuth: true }
  },
  // 生产报表路由
  {
    path: '/molding/monthly-storage',
    name: 'MonthlyProductionStorage',
    component: () => import('@/views/molding/MonthlyProductionStorage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/molding/daily-stats',
    name: 'ProductDailyStats',
    component: () => import('@/views/molding/ProductDailyStats.vue'),
    meta: { requiresAuth: true }
  },
  // 可视化路由
  {
    path: '/dashboard/production',
    name: 'ProductionDashboard',
    component: () => import('@/views/dashboard/ProductionDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/equipment',
    name: 'EquipmentDashboard',
    component: () => import('@/views/dashboard/EquipmentDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/quality',
    name: 'QualityDashboard',
    component: () => import('@/views/dashboard/QualityDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/personnel',
    name: 'PersonnelDashboard',
    component: () => import('@/views/dashboard/PersonnelDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/safety',
    name: 'SafetyDashboard',
    component: () => import('@/views/dashboard/SafetyDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/plant',
    name: 'PlantDashboard',
    component: () => import('@/views/dashboard/PlantDashboard.vue'),
    meta: { requiresAuth: true }
  },
  // PDA操作路由
  {
    path: '/pda/sand-core-inbound',
    name: 'SandCoreInbound',
    component: () => import('@/views/pda/SandCoreInbound.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pda/sand-core-outbound',
    name: 'SandCoreOutbound',
    component: () => import('@/views/pda/SandCoreOutbound.vue'),
    meta: { requiresAuth: true }
  },
  // 现场管理路由
  {
    path: '/site/safety-inspection',
    name: 'SafetyInspection',
    component: () => import('@/views/site/SafetyInspection.vue'),
    meta: { requiresAuth: true }
  },
  // 用户管理路由
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  // 系统管理路由
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/security',
    name: 'Security',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: () => import('@/views/Home.vue'),
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
