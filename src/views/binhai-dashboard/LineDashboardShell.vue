<script setup lang="ts">
import { computed } from 'vue'

import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'

/** 顶部指标卡（一行 6 张） */
interface ShellIndicator {
  label: string
  value: string
  unit: string
  tone?: 'output' | 'inbound'
}

/** 六宫格面板 */
interface ShellPanel {
  title: string
  /** 图表接入前的占位文案，默认"图表待接入" */
  hint?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    weather?: string
    indicators: ShellIndicator[]
    panels: ShellPanel[]
  }>(),
  {
    weather: '潍坊 18℃ 晴'
  }
)

/** 6 个面板按 3 列 × 2 行排布，与生产运营大屏一致 */
const columns = computed(() => {
  const list = props.panels.slice(0, 6)
  return [list.slice(0, 2), list.slice(2, 4), list.slice(4, 6)]
})
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader :title="title" :weather="weather" variant="fui" />

    <!-- 指标行 -->
    <div class="top-indicators">
      <div
        v-for="item in indicators"
        :key="item.label"
        class="top-indicator-card"
        :class="`tone-${item.tone ?? 'output'}`"
      >
        <div class="top-indicator-content">
          <div class="top-indicator-label">{{ item.label }}</div>
          <div class="top-indicator-value">
            {{ item.value }}<span class="top-indicator-unit">{{ item.unit }}</span>
          </div>
        </div>
        <div class="top-indicator-icon" aria-hidden="true">
          <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4a1 1 0 000-1.414l-4-4a1 1 0 00-1.414 0z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- 六宫格：3 列 × 2 行 -->
    <div class="main-content">
      <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="column">
        <div v-for="panel in column" :key="panel.title" class="data-panel" style="height: 386px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H8a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 class="panel-title">{{ panel.title }}</h3>
          </div>

          <!-- 图表占位：接入 EChart 后替换 -->
          <div class="chart-container shell-placeholder">
            <span>{{ panel.hint ?? '图表待接入' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./dashboard-theme.css"></style>

<style scoped>
/* 骨架占位：图表接入前的提示 */
.shell-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  color: rgba(169, 201, 212, 0.72);
  font-size: 14px;
  letter-spacing: 3px;
}

.shell-placeholder::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px dashed rgba(0, 191, 235, 0.35);
  border-radius: 4px;
  pointer-events: none;
}
</style>
