<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">PDA操作菜单</div>
      <div class="pda-header-right">admin</div>
    </div>

    <div class="pda-content menu-content">
      <section v-for="group in groups" :key="group.title" class="menu-section">
        <div class="menu-section-title">
          <span class="menu-section-bar"></span>
          {{ group.title }}
        </div>
        <div class="menu-grid">
          <button
            v-for="item in group.items"
            :key="item.path"
            class="menu-tile"
            @click="router.push(item.path)"
          >
            <span class="menu-icon">
              <component :is="item.icon" />
            </span>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  BarcodeOutlined,
  DatabaseOutlined,
  EditOutlined,
  AlertOutlined,
  FileTextOutlined,
  SwapOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const groups = [
  {
    title: '制芯',
    items: [
      { label: '制芯任务', path: '/pda/core-making-task', icon: FileTextOutlined },
      { label: '人工刻号', path: '/pda/manual-core-marking', icon: EditOutlined },
      { label: '组芯流转', path: '/pda/core-transfer', icon: SwapOutlined },
      { label: '人工流转', path: '/pda/manual-transfer', icon: SwapOutlined },
      { label: '异常上下料', path: '/pda/exception-handling', icon: AlertOutlined }
    ]
  },
  {
    title: '组芯',
    items: [
      { label: '组芯刻号', path: '/pda/assembly-marking', icon: BarcodeOutlined }
    ]
  },
  {
    title: '测试与工具',
    items: [
      { label: '虚拟库测试', path: '/pda/test-virtual-storage', icon: DatabaseOutlined }
    ]
  }
]

const goBack = () => router.back()
</script>

<style scoped>
.menu-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu-section {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.menu-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.menu-section-bar {
  width: 4px;
  height: 17px;
  border-radius: 4px;
  background: #1890ff;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.menu-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 86px;
  padding: 10px 4px;
  border: 1px solid #e8f0fe;
  border-radius: 10px;
  background: #f8fbff;
  color: #333;
  font-size: 13px;
  cursor: pointer;
}

.menu-tile:active {
  background: #e6f7ff;
  transform: scale(0.98);
}

.menu-icon {
  color: #1890ff;
  font-size: 24px;
}
</style>
