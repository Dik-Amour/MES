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
          @openChange="handleOpenChange"
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

          <a-sub-menu key="cleaning-production">
            <template #icon>
              <ToolOutlined />
            </template>
            <template #title>清理生产记录</template>
            <a-menu-item key="/cleaning-production/manipulator">机械手</a-menu-item>
            <a-menu-item key="/cleaning-production/rough-cleaning">粗清</a-menu-item>
            <a-menu-item key="/cleaning-production/annealing">热处理</a-menu-item>
            <a-menu-item key="/cleaning-production/vibration-core">振芯</a-menu-item>
            <a-menu-item key="/cleaning-production/grinding">磨床</a-menu-item>
            <a-menu-item key="/cleaning-production/rough-polishing">粗抛</a-menu-item>
            <a-menu-item key="/cleaning-production/intelligent-polishing">智能磨削</a-menu-item>
            <a-menu-item key="/cleaning-production/inner-cavity">内腔抛丸</a-menu-item>
            <a-menu-item key="/cleaning-production/fine-polishing">精抛</a-menu-item>
            <a-menu-item key="/cleaning-production/blow-cleaning">吹清</a-menu-item>
            <a-menu-item key="/cleaning-production/powder-coating">喷粉</a-menu-item>
            <a-menu-item key="/cleaning-production/barcode">明码识别</a-menu-item>
            <a-menu-item key="/cleaning-production/coding">打码</a-menu-item>
            <a-menu-item key="/cleaning-production/robot-loading">机器人上下料</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="wip">
            <template #icon>
              <InboxOutlined />
            </template>
            <template #title>在制品管理</template>
            <a-menu-item key="/wip/initial-data">在制品初始数据</a-menu-item>
            <a-menu-item key="/wip/detail">在制品明细</a-menu-item>
            <a-menu-item key="/wip/summary">在制品汇总</a-menu-item>
            <a-menu-item key="/wip/monthly-report">生产月度统计</a-menu-item>
            <a-menu-item key="/wip/annual-report">生产年度统计</a-menu-item>
            <a-menu-item key="/wip/material-stat">毛坯材质生产统计</a-menu-item>
            <a-menu-item key="/wip/settlement-cycle-config">生产结算周期配置</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="visualization">
            <template #icon>
              <FundOutlined />
            </template>
            <template #title>寒亭可视化</template>
            <a-menu-item key="/dashboard/production">生产大屏</a-menu-item>
            <a-menu-item key="/dashboard/equipment">设备大屏</a-menu-item>
            <a-menu-item key="/dashboard/quality">质量大屏</a-menu-item>
            <a-menu-item key="/dashboard/personnel">人员大屏</a-menu-item>
            <a-menu-item key="/dashboard/safety">安环大屏</a-menu-item>
            <a-menu-item key="/dashboard/plant">厂区大屏</a-menu-item>
            <a-menu-item key="/dashboard/virtual-line">设备弹框</a-menu-item>
            <a-menu-item key="/dashboard/plant-virtual-line">厂区虚拟产线大屏</a-menu-item>
            <a-menu-item key="/dashboard/plant-virtual-kw">造型三线KW</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="binhai-visualization">
            <template #icon>
              <FundOutlined />
            </template>
            <template #title>滨海可视化</template>
            <a-menu-item key="/binhai-dashboard/production-ops">生产运营管理大屏</a-menu-item>
            <a-menu-item key="/binhai-dashboard/equipment">设备管理大屏</a-menu-item>
            <a-menu-item key="/binhai-dashboard/quality">质量管理大屏</a-menu-item>
            <a-menu-item key="/binhai-dashboard/personnel">人员管理大屏</a-menu-item>
            <a-menu-item key="/binhai-dashboard/cost">成本管理大屏</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="screen-data">
            <template #icon>
              <DatabaseOutlined />
            </template>
            <template #title>大屏数据管理</template>
            <a-menu-item key="/screen-data/equipment">设备数据导入</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="andon">
            <template #icon>
              <AlertOutlined />
            </template>
            <template #title>安灯异常管理</template>
            <a-menu-item key="/andon/config">安灯异常配置</a-menu-item>
            <a-menu-item key="/andon/record">安灯异常记录</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="molding">
            <template #icon>
              <BarChartOutlined />
            </template>
            <template #title>生产报表</template>
            <a-menu-item key="/molding/monthly-storage">月度生产入库</a-menu-item>
            <a-menu-item key="/molding/daily-stats">产品日生产数据</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="pda">
            <template #icon>
              <MobileOutlined />
            </template>
            <template #title>PDA操作</template>
            <a-menu-item key="/pda/sand-core-inbound">砂芯入库</a-menu-item>
            <a-menu-item key="/pda/sand-core-outbound">砂芯出库</a-menu-item>
            <a-menu-item key="/pda/exception-handle">异常处理</a-menu-item>
            <a-menu-item key="/pda/core-lowering">大机组芯下芯</a-menu-item>
            <a-menu-item key="/pda/core-marking">机体线组芯</a-menu-item>
            <a-menu-item key="/pda/manual-core-marking">人工刻号</a-menu-item>
            <a-menu-item key="/pda/core-transfer">组芯流转</a-menu-item>
            <a-menu-item key="/pda/manual-transfer">人工流转</a-menu-item>
            <a-menu-item key="/pda/exception-handling">异常上下料</a-menu-item>
            <a-menu-item key="/pda/assembly-marking">组芯刻号</a-menu-item>
            <a-menu-item key="/pda/test-virtual-storage">虚拟库测试</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="core-making">
            <template #icon>
              <ToolOutlined />
            </template>
            <template #title>制芯计划</template>
            <a-menu-item key="/core-making/binhai-scheduling">滨海制芯排产</a-menu-item>
            <a-menu-item key="/core-making/sand-core-takt">砂芯生产节拍</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="core-production">
            <template #icon>
              <InboxOutlined />
            </template>
            <template #title>制芯生产管理</template>
            <a-menu-item key="/core-production/body-line-storage">机体线砂芯库</a-menu-item>
            <a-menu-item key="/core-production/inbound-record">砂芯立库入库记录</a-menu-item>
            <a-menu-item key="/core-production/outbound-record">立库出库记录</a-menu-item>
            <a-menu-item key="/core-production/marking-record">机体线组芯刻号</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="site">
            <template #icon>
              <SafetyOutlined />
            </template>
            <template #title>现场管理</template>
            <a-menu-item key="/site/safety-inspection">安全巡检</a-menu-item>
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
  ToolOutlined,
  AlertOutlined,
  BarChartOutlined,
  MobileOutlined,
  SafetyOutlined,
  InboxOutlined,
  FundOutlined,
  DatabaseOutlined
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
// 默认所有目录收起，导航到子页面时自动展开对应目录
const openKeys = ref<string[]>([])

const siderTheme = computed(() => 'light')

// 路由路径对应的父级菜单 key（用于自动展开目录）
const parentKeyMap: Array<[string, string]> = [
  ['/cleaning', 'cleaning'],
  ['/cleaning-production', 'cleaning-production'],
  ['/wip', 'wip'],
  ['/dashboard', 'visualization'],
  ['/binhai-dashboard', 'binhai-visualization'],
  ['/screen-data', 'screen-data'],
  ['/andon', 'andon'],
  ['/molding', 'molding'],
  ['/pda', 'pda'],
  ['/core-making', 'core-making'],
  ['/core-production', 'core-production'],
  ['/site', 'site'],
  ['/users', 'user'],
  ['/settings', 'system'],
  ['/security', 'system'],
  ['/permissions', 'system']
]

// 所有子菜单 key 列表
// 根据路径查找所属的父级目录 key（路径段边界匹配，避免 '/cleaning-production' 被误匹配到 '/cleaning'）
const findParent = (path: string): string | undefined => {
  const found = parentKeyMap.find(
    ([prefix]) => path === prefix || path.startsWith(prefix + '/')
  )
  return found?.[1]
}

// 监听路由变化，更新选中的菜单项，并自动展开当前页面所属的目录
watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath]
    const parentKey = findParent(newPath)
    if (parentKey) {
      openKeys.value = [parentKey]
    }
  },
  { immediate: true }
)

// 手风琴：展开一个子目录时，自动折叠其他已展开的子目录（同一时刻只保留一个目录展开）
const handleOpenChange = (keys: string[]) => {
  // 用户点开某目录标题（keys 增）时，只保留最近展开的那个；全部收起（keys 为空）时则全收
  openKeys.value = keys.length ? [keys[keys.length - 1]] : []
}

// 菜单项点击处理 - 点击叶子菜单项时只保留所属目录展开，并跳转路由
const handleMenuClick = ({ key }: { key: string }) => {
  // 点击的是菜单项（叶子项），找到所属的父级 sub-menu key
  const clickedParent = findParent(key)
  if (clickedParent) {
    // 只保留当前所属目录展开，自动折叠其他目录
    openKeys.value = [clickedParent]
  } else {
    // 点击的是首页等无父级的菜单，收起所有目录
    openKeys.value = []
  }
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

.app-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-sider :deep(.ant-menu) {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
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


