<template>
  <a-breadcrumb class="breadcrumb">
    <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index">
      <router-link v-if="item.path" :to="item.path">
        <component :is="item.icon" class="breadcrumb-icon" />
        {{ item.title }}
      </router-link>
      <span v-else>
        <component :is="item.icon" class="breadcrumb-icon" />
        {{ item.title }}
      </span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyOutlined,
  KeyOutlined,
  CalendarOutlined,
  InboxOutlined,
  FundOutlined
} from '@ant-design/icons-vue'

interface BreadcrumbItem {
  title: string
  path?: string
  icon: any
}

const route = useRoute()

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const pathMap: Record<string, BreadcrumbItem> = {
    '/': { title: '首页', path: '/', icon: HomeOutlined },
    '/home': { title: '首页', path: '/', icon: HomeOutlined },
    '/login': { title: '登录', icon: UserOutlined },
    '/users': { title: '用户管理', path: '/users', icon: UserOutlined },
    '/settings': { title: '系统设置', path: '/settings', icon: SettingOutlined },
    '/security': { title: '安全管理', path: '/security', icon: SafetyOutlined },
    '/permissions': { title: '权限管理', path: '/permissions', icon: KeyOutlined },
    // 清理计划路径
    '/cleaning': { title: '清理计划', path: '/cleaning/monthly', icon: CalendarOutlined },
    '/cleaning/monthly': { title: '月度清理计划', path: '/cleaning/monthly', icon: CalendarOutlined },
    '/cleaning/feeding': { title: '投料排产', path: '/cleaning/feeding', icon: CalendarOutlined },
    '/cleaning/molding': { title: '打箱排产', path: '/cleaning/molding', icon: CalendarOutlined },
    '/cleaning/heat-treatment': { title: '热处理排产', path: '/cleaning/heat-treatment', icon: CalendarOutlined },
    '/cleaning/fine-cleaning': { title: '细清排产', path: '/cleaning/fine-cleaning', icon: CalendarOutlined },
    // 在制品管理路径
    '/wip': { title: '在制品管理', path: '/wip/initial-data', icon: InboxOutlined },
    '/wip/initial-data': { title: '在制品初始数据', path: '/wip/initial-data', icon: InboxOutlined },
    '/wip/detail': { title: '在制品明细', path: '/wip/detail', icon: InboxOutlined },
    '/wip/summary': { title: '在制品汇总', path: '/wip/summary', icon: InboxOutlined },
    '/wip/monthly-report': { title: '生产月度统计', path: '/wip/monthly-report', icon: InboxOutlined },
    '/wip/annual-report': { title: '生产年度统计', path: '/wip/annual-report', icon: InboxOutlined },
    '/wip/material-stat': { title: '毛坯材质生产统计', path: '/wip/material-stat', icon: InboxOutlined },
    '/wip/settlement-cycle-config': { title: '生产结算周期配置', path: '/wip/settlement-cycle-config', icon: InboxOutlined },
    // 清理生产记录路径
    '/cleaning-production': { title: '清理生产记录', path: '/cleaning-production/manipulator', icon: CalendarOutlined },
    '/cleaning-production/manipulator': { title: '机械手', path: '/cleaning-production/manipulator', icon: CalendarOutlined },
    '/cleaning-production/rough-cleaning': { title: '粗清', path: '/cleaning-production/rough-cleaning', icon: CalendarOutlined },
    '/cleaning-production/annealing': { title: '热处理', path: '/cleaning-production/annealing', icon: CalendarOutlined },
    '/cleaning-production/vibration-core': { title: '振芯', path: '/cleaning-production/vibration-core', icon: CalendarOutlined },
    '/cleaning-production/grinding': { title: '磨床', path: '/cleaning-production/grinding', icon: CalendarOutlined },
    '/cleaning-production/rough-polishing': { title: '粗抛', path: '/cleaning-production/rough-polishing', icon: CalendarOutlined },
    '/cleaning-production/intelligent-polishing': { title: '智能磨削', path: '/cleaning-production/intelligent-polishing', icon: CalendarOutlined },
    '/cleaning-production/inner-cavity': { title: '内腔抛丸', path: '/cleaning-production/inner-cavity', icon: CalendarOutlined },
    '/cleaning-production/fine-polishing': { title: '精抛', path: '/cleaning-production/fine-polishing', icon: CalendarOutlined },
    '/cleaning-production/blow-cleaning': { title: '吹清', path: '/cleaning-production/blow-cleaning', icon: CalendarOutlined },
    '/cleaning-production/powder-coating': { title: '喷粉', path: '/cleaning-production/powder-coating', icon: CalendarOutlined },
    '/cleaning-production/barcode': { title: '明码识别', path: '/cleaning-production/barcode', icon: CalendarOutlined },
    '/cleaning-production/coding': { title: '打码', path: '/cleaning-production/coding', icon: CalendarOutlined },
    '/cleaning-production/robot-loading': { title: '机器人上下料', path: '/cleaning-production/robot-loading', icon: CalendarOutlined },
    // 安灯异常管理路径
    '/andon': { title: '安灯异常管理', path: '/andon/config', icon: CalendarOutlined },
    '/andon/config': { title: '安灯异常配置', path: '/andon/config', icon: CalendarOutlined },
    '/andon/record': { title: '安灯异常记录', path: '/andon/record', icon: CalendarOutlined },
    // 生产报表路径
    '/molding': { title: '生产报表', path: '/molding/monthly-storage', icon: CalendarOutlined },
    '/molding/monthly-storage': { title: '月度生产入库', path: '/molding/monthly-storage', icon: CalendarOutlined },
    '/molding/daily-stats': { title: '产品日生产数据', path: '/molding/daily-stats', icon: CalendarOutlined },
    // PDA操作路径
    '/pda': { title: 'PDA操作', path: '/pda/sand-core-inbound', icon: CalendarOutlined },
    '/pda/sand-core-inbound': { title: '砂芯入库', path: '/pda/sand-core-inbound', icon: CalendarOutlined },
    '/pda/sand-core-outbound': { title: '砂芯出库', path: '/pda/sand-core-outbound', icon: CalendarOutlined },
    '/pda/exception-handle': { title: '异常处理', path: '/pda/exception-handle', icon: CalendarOutlined },
    '/pda/core-lowering': { title: '大机组芯下芯', path: '/pda/core-lowering', icon: CalendarOutlined },
    '/pda/core-marking': { title: '制芯缸盖刻号', path: '/pda/core-marking', icon: CalendarOutlined },
    '/pda/menu': { title: 'PDA功能菜单', path: '/pda/menu', icon: CalendarOutlined },
    '/pda/core-making-task': { title: '制芯任务', path: '/pda/core-making-task', icon: CalendarOutlined },
    '/pda/manual-core-marking': { title: '人工刻号', path: '/pda/manual-core-marking', icon: CalendarOutlined },
    '/pda/core-transfer': { title: '组芯流转', path: '/pda/core-transfer', icon: CalendarOutlined },
    '/pda/manual-transfer': { title: '人工流转', path: '/pda/manual-transfer', icon: CalendarOutlined },
    '/pda/exception-handling': { title: '异常上下料', path: '/pda/exception-handling', icon: CalendarOutlined },
    '/pda/assembly-marking': { title: '组芯刻号', path: '/pda/assembly-marking', icon: CalendarOutlined },
    '/pda/test-virtual-storage': { title: '虚拟库测试', path: '/pda/test-virtual-storage', icon: CalendarOutlined },
    // 制芯生产管理路径
    '/core-production': { title: '制芯生产管理', path: '/core-production/binhai-storage', icon: InboxOutlined },
    '/core-production/binhai-storage': { title: '滨海砂芯立库', path: '/core-production/binhai-storage', icon: InboxOutlined },
    '/core-production/inout-record': { title: '立库出入库记录', path: '/core-production/inout-record', icon: InboxOutlined },
    // 可视化路径
    '/dashboard': { title: '寒亭可视化', path: '/dashboard/production', icon: InboxOutlined },
    '/dashboard/production': { title: '生产大屏', path: '/dashboard/production', icon: InboxOutlined },
    '/dashboard/equipment': { title: '设备大屏', path: '/dashboard/equipment', icon: InboxOutlined },
    '/dashboard/quality': { title: '质量大屏', path: '/dashboard/quality', icon: InboxOutlined },
    '/dashboard/personnel': { title: '人员大屏', path: '/dashboard/personnel', icon: InboxOutlined },
    '/dashboard/safety': { title: '安环大屏', path: '/dashboard/safety', icon: InboxOutlined },
    '/dashboard/plant': { title: '厂区大屏', path: '/dashboard/plant', icon: InboxOutlined },
    '/dashboard/virtual-line': { title: '设备弹框', path: '/dashboard/virtual-line', icon: InboxOutlined },
    '/dashboard/plant-virtual-line': { title: '厂区虚拟产线大屏', path: '/dashboard/plant-virtual-line', icon: InboxOutlined },
    '/dashboard/plant-virtual-kw': { title: '造型三线KW', path: '/dashboard/plant-virtual-kw', icon: InboxOutlined },
    // 滨海可视化路径
    '/binhai-dashboard': { title: '滨海可视化', path: '/binhai-dashboard/production-ops', icon: FundOutlined },
    '/binhai-dashboard/production-ops': { title: '生产运营管理大屏', path: '/binhai-dashboard/production-ops', icon: FundOutlined },
    '/binhai-dashboard/equipment': { title: '设备管理大屏', path: '/binhai-dashboard/equipment', icon: FundOutlined },
    '/binhai-dashboard/quality': { title: '质量管理大屏', path: '/binhai-dashboard/quality', icon: FundOutlined },
    '/binhai-dashboard/personnel': { title: '人员管理大屏', path: '/binhai-dashboard/personnel', icon: FundOutlined },
    '/binhai-dashboard/cost': { title: '成本管理大屏', path: '/binhai-dashboard/cost', icon: FundOutlined },
    // 现场管理路径
    '/site': { title: '现场管理', path: '/site/safety-inspection', icon: CalendarOutlined },
    '/site/safety-inspection': { title: '安全巡检', path: '/site/safety-inspection', icon: CalendarOutlined },
    // 大屏数据管理路径
    '/screen-data': { title: '大屏数据管理', path: '/screen-data/equipment', icon: InboxOutlined },
    '/screen-data/equipment': { title: '设备数据导入', path: '/screen-data/equipment', icon: InboxOutlined },
  }

  const matched = route.matched.filter(item => item.path !== '/')
  const items: BreadcrumbItem[] = []

  // 添加首页
  items.push(pathMap['/'])

  // 添加清理计划父级菜单
  if (route.path.startsWith('/cleaning')) {
    items.push(pathMap['/cleaning'])
  }

  // 添加在制品管理父级菜单
  if (route.path.startsWith('/wip')) {
    items.push(pathMap['/wip'])
  }
  // 添加清理生产记录父级菜单
  if (route.path.startsWith('/cleaning-production')) {
    items.push(pathMap['/cleaning-production'])
  }

  // 添加安灯异常管理父级菜单
  if (route.path.startsWith('/andon')) {
    items.push(pathMap['/andon'])
  }

  // 添加生产报表父级菜单
  if (route.path.startsWith('/molding')) {
    items.push(pathMap['/molding'])
  }

  // 添加PDA操作父级菜单
  if (route.path.startsWith('/pda')) {
    items.push(pathMap['/pda'])
  }

  // 添加制芯生产管理父级菜单
  if (route.path.startsWith('/core-production')) {
    items.push(pathMap['/core-production'])
  }

  // 添加现场管理父级菜单
  if (route.path.startsWith('/site')) {
    items.push(pathMap['/site'])
  }

  // 添加滨海可视化父级菜单
  if (route.path.startsWith('/binhai-dashboard')) {
    items.push(pathMap['/binhai-dashboard'])
  }
  // 添加大屏数据管理父级菜单
  if (route.path.startsWith('/screen-data')) {
    items.push(pathMap['/screen-data'])
  }

  // 添加匹配的路由
  matched.forEach(match => {
    const item = pathMap[match.path]
    if (item) {
      items.push(item)
    }
  })

  return items
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb-icon {
  margin-right: 4px;
}
</style>

