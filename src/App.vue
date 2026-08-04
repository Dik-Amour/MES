<template>
  <a-config-provider :locale="locale">
    <a-layout class="app-layout">
      <!-- 登录页面不需要主布局 -->
      <template v-if="route.path === '/login'">
        <router-view />
      </template>

      <!-- 主应用布局 -->
      <template v-else>
      <!-- 左侧可折叠导航栏 -->
      <a-layout-sider
        v-model:collapsed="collapsed"
        :trigger="null"
        collapsible
        class="app-sider"
        :width="200"
      >
        <div class="logo">
          <div class="logo-icon">
            <DashboardOutlined />
          </div>
          <div v-if="!collapsed" class="logo-text">MES系统</div>
        </div>

        <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          mode="inline"
          :theme="siderTheme"
          @click="handleMenuClick"
        >
          <a-menu-item key="/">
            <HomeOutlined />
            <span>首页</span>
          </a-menu-item>

          <a-sub-menu key="cleaning">
            <template #icon>
              <CalendarOutlined />
            </template>
            <template #title>清理计划</template>
            <a-menu-item key="/cleaning/monthly">月度清理计划</a-menu-item>
            <a-menu-item key="/cleaning/feeding">投料排产</a-menu-item>
            <a-menu-item key="/cleaning/molding">打箱排产</a-menu-item>
            <a-menu-item key="/cleaning/heat-treatment">热处理排产</a-menu-item>
            <a-menu-item key="/cleaning/fine-cleaning">细清排产</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="user">
            <template #icon>
              <UserOutlined />
            </template>
            <template #title>用户管理</template>
            <a-menu-item key="/users">用户列表</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="system">
            <template #icon>
              <SettingOutlined />
            </template>
            <template #title>系统管理</template>
            <a-menu-item key="/settings">系统设置</a-menu-item>
            <a-menu-item key="/security">安全管理</a-menu-item>
            <a-menu-item key="/permissions">权限管理</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <a-layout>
        <!-- 顶部标题栏 -->
        <a-layout-header class="app-header">
          <div class="header-left">
            <a-button
              type="text"
              @click="collapsed = !collapsed"
              class="trigger-button"
            >
              <MenuUnfoldOutlined v-if="collapsed" />
              <MenuFoldOutlined v-else />
            </a-button>
          </div>

          <div class="header-right">
            <a-space :size="16">
              <!-- 主题切换 -->
              <a-button
                type="text"
                @click="toggleTheme"
                class="theme-button"
              >
                <BulbOutlined v-if="theme === 'light'" />
                <BulbFilled v-else />
              </a-button>

              <!-- 用户菜单 -->
              <a-dropdown>
                <a-space class="user-info">
                  <a-avatar :size="32" :style="{ backgroundColor: '#1890ff' }">
                    <template #icon>
                      <UserOutlined />
                    </template>
                  </a-avatar>
                  <span class="username">{{ userStore.username }}</span>
                </a-space>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="profile">
                      <UserOutlined />
                      个人中心
                    </a-menu-item>
                    <a-menu-item key="settings">
                      <SettingOutlined />
                      账号设置
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="logout" @click="handleLogout">
                      <LogoutOutlined />
                      退出登录
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </div>
        </a-layout-header>

        <!-- 主内容区域 -->
        <a-layout-content class="app-content">
          <!-- 面包屑导航 -->
          <Breadcrumb />

          <!-- 路由页面 -->
          <router-view />
        </a-layout-content>
      </a-layout>
    </template>
  </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  BulbFilled,
  LogoutOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InboxOutlined,
  FireOutlined,
  ToolOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import Breadcrumb from '@/components/Breadcrumb.vue'

// 设置Ant Design Vue中文本地化
const locale = zhCN

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { theme, toggleTheme } = useTheme()

const collapsed = ref(false)
const selectedKeys = ref<string[]>(['/'])
const openKeys = ref<string[]>(['user', 'system', 'cleaning'])

const siderTheme = computed(() => 'light')

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath]
  },
  { immediate: true }
)

// 菜单点击处理
const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  message.success('退出登录成功')
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-sider {
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  transition: all 0.2s;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
  background: #ffffff;
}

.logo-icon {
  font-size: 24px;
  color: #1890ff;
  margin-right: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
}

.app-header {
  background: #ffffff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  left: 200px;
  right: 0;
  top: 0;
  z-index: 9;
  transition: left 0.2s;
}

.app-header.collapsed {
  left: 80px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.trigger-button {
  font-size: 18px;
  color: #1f2937;
}

.theme-button {
  font-size: 18px;
  color: #1f2937;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.username {
  color: #1f2937;
  font-weight: 500;
}

.app-content {
  margin: 16px;
  margin-left: 216px;
  margin-top: 80px;
  background: transparent;
  min-height: calc(100vh - 96px);
  transition: margin-left 0.2s;
}

.app-content.collapsed {
  margin-left: 96px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-sider {
    position: fixed;
    left: -200px;
    z-index: 100;
  }

  .app-sider.mobile-open {
    left: 0;
  }

  .app-header {
    left: 0;
  }

  .app-content {
    margin-left: 16px;
  }
}
</style>
