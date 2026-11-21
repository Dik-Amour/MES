<script setup lang="ts">
import { computed } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/** 顶部指标卡（一行 6 张） */
interface ShellIndicator {
  label: string
  value: string
  unit: string
  tone?: 'output' | 'inbound'
}

/** 六宫格面板 tab 项 */
interface ShellPanelTab {
  key: string
  label: string
}

/** 六宫格面板 */
interface ShellPanel {
  title: string
  /** 图表接入前的占位文案，默认"图表待接入" */
  hint?: string
  /** 传入 ECharts 配置则渲染图表；缺省时显示占位提示 */
  option?: EChartsOption
  /**
   * 自定义内容槽名（需在页面侧提供 <template #[panel.contentKey]>）。
   * 有值时优先渲染自定义内容，可与 option 并存（如设备监控不依赖 option）
   */
  contentKey?: string
  /** 面板头部 tab 组（可选） */
  tabs?: ShellPanelTab[]
  /** 当前激活的 tab key */
  activeKey?: string
  /** 选择器形态：tabs（默认横排按钮）或 select（选项多/文案长时用下拉） */
  mode?: 'tabs' | 'select'
  /** 次级选择器（如趋势视图下的成本项下拉），与主 tab / 下拉并存时使用 */
  subTabs?: ShellPanelTab[]
  /** 次级选择器当前值 */
  subActiveKey?: string
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

const emit = defineEmits<{
  /** 面板 tab 被点击时抛出，由页面自行切换数据 */
  tabChange: [payload: { title: string; key: string }]
  /** 次级下拉（如成本项）切换时抛出 */
  subChange: [payload: { title: string; key: string }]
  /** 面板内 ECharts 点击（如日期节点）透传给页面 */
  chartClick: [payload: { title: string; params: unknown }]
}>()

defineSlots<{
  /** 标题左右两侧班组名（各两个时用 left/right 分槽，标题更稳居中） */
  headerTeamsLeft?: () => unknown
  headerTeamsRight?: () => unknown
  /** 或整块班组区（内部自排左右） */
  headerTeams?: () => unknown
}>()

/** 6 个面板按 3 列 × 2 行排布，与生产运营大屏一致 */
const columns = computed(() => {
  const list = props.panels.slice(0, 6)
  return [list.slice(0, 2), list.slice(2, 4), list.slice(4, 6)]
})
</script>

<template>
  <div class="dashboard-container">
    <!-- 仅在页面侧传入班组槽时才透传，避免空插槽被 header 误判为有内容 -->
    <DashboardHeader
      v-if="$slots.headerTeamsLeft || $slots.headerTeamsRight || $slots.headerTeams"
      :title="title"
      :weather="weather"
      variant="fui"
    >
      <template v-if="$slots.headerTeamsLeft" #headerTeamsLeft>
        <slot name="headerTeamsLeft" />
      </template>
      <template v-if="$slots.headerTeamsRight" #headerTeamsRight>
        <slot name="headerTeamsRight" />
      </template>
      <template v-if="$slots.headerTeams" #headerTeams>
        <slot name="headerTeams" />
      </template>
    </DashboardHeader>
    <DashboardHeader v-else :title="title" :weather="weather" variant="fui" />

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
            <div v-if="panel.mode !== 'select' && panel.tabs?.length" class="tab-buttons">
              <button
                v-for="tab in panel.tabs"
                :key="tab.key"
                type="button"
                class="tab-button"
                :class="{ active: panel.activeKey === tab.key }"
                @click="emit('tabChange', { title: panel.title, key: tab.key })"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- 内容区工具条：下拉放这里，不与 tab 争头部一行 -->
          <div
            v-if="(panel.mode === 'select' && panel.tabs?.length) || panel.subTabs?.length"
            class="panel-toolbar"
          >
            <a-select
              v-if="panel.mode === 'select' && panel.tabs?.length"
              class="panel-select"
              :value="panel.activeKey"
              size="small"
              :dropdown-match-select-width="false"
              @update:value="(value: string) => emit('tabChange', { title: panel.title, key: value })"
            >
              <a-select-option v-for="tab in panel.tabs" :key="tab.key" :value="tab.key">
                {{ tab.label }}
              </a-select-option>
            </a-select>
            <a-select
              v-if="panel.subTabs?.length"
              class="panel-select"
              :value="panel.subActiveKey"
              size="small"
              :dropdown-match-select-width="false"
              @update:value="(value: string) => emit('subChange', { title: panel.title, key: value })"
            >
              <a-select-option v-for="tab in panel.subTabs" :key="tab.key" :value="tab.key">
                {{ tab.label }}
              </a-select-option>
            </a-select>
          </div>

          <!-- 优先自定义内容槽；其次 ECharts；否则占位 -->
          <div
            class="chart-container"
            :class="{
              'shell-placeholder': !panel.contentKey && !panel.option,
              'shell-custom': !!panel.contentKey
            }"
          >
            <slot
              v-if="panel.contentKey"
              :name="panel.contentKey"
              :panel="panel"
            />
            <EChart
              v-else-if="panel.option"
              :key="`${panel.title}-${panel.activeKey ?? 'default'}`"
              :option="panel.option"
              height="100%"
              @click="(params: unknown) => emit('chartClick', { title: panel.title, params })"
            />
            <span v-else>{{ panel.hint ?? '图表待接入' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./dashboard-common.css"></style>
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

/* 自定义内容区：填满 chart-container */
.shell-custom {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 内容区工具条：下拉右对齐贴在图表上方 */
.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding-top: 8px;
}

/* 面板内下拉：贴合大屏暗色 */
.panel-select {
  width: 178px;
}

.panel-select :deep(.ant-select-selector) {
  background: rgba(6, 31, 42, 0.92) !important;
  border-color: rgba(0, 190, 235, 0.5) !important;
  color: #dff8ff !important;
}

.panel-select :deep(.ant-select-selection-item) {
  color: #dff8ff !important;
  line-height: 22px !important;
}

.panel-select :deep(.ant-select-arrow) {
  color: #62e8ff !important;
}
</style>
