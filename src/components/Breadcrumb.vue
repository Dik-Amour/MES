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
  CalendarOutlined
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
    '/cleaning/fine-cleaning': { title: '细清排产', path: '/cleaning/fine-cleaning', icon: CalendarOutlined }
  }

  const matched = route.matched.filter(item => item.path !== '/')
  const items: BreadcrumbItem[] = []

  // 添加首页
  items.push(pathMap['/'])

  // 添加清理计划父级菜单
  if (route.path.startsWith('/cleaning')) {
    items.push(pathMap['/cleaning'])
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
