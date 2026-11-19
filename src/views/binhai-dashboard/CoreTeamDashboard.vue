<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'

import dayjs from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import type { EChartsOption } from 'echarts'

/** 标题栏班组：左右各两个，可点击切换；各班组内容一致 */
const teamGroups = {
  left: ['一线', '二线'],
  right: ['三线', '综合']
} as const

const allTeams = [...teamGroups.left, ...teamGroups.right] as const
type TeamName = (typeof allTeams)[number]

const activeTeam = ref<TeamName>('一线')

function selectTeam(name: TeamName) {
  activeTeam.value = name
}

/** 指标栏：6 项指标（数值为 mock，各班组内容一致） */
const indicators = [
  { label: '计划数', value: '128', unit: '颗', tone: 'output' as const },
  { label: '制芯数', value: '116', unit: '颗', tone: 'inbound' as const },
  { label: '检测数', value: '112', unit: '颗', tone: 'output' as const },
  { label: '入库数', value: '108', unit: '颗', tone: 'output' as const },
  { label: '出库数', value: '104', unit: '颗', tone: 'inbound' as const },
  { label: '合格率', value: '98.6', unit: '%', tone: 'inbound' as const }
]

/** 任务列表 mock（各班组共用同一套数据） */
interface TaskCardItem {
  coreNo: string
  coreName: string
  planCount: number
  coreBoxCount: number
  machineCount: number
  line: string
  status: TaskStatus
  taskType: TaskType
}

/** 当前状态枚举 */
type TaskStatus = '未开始' | '生产中' | '完成' | '暂停' | '异常结束'

/** 任务类型枚举 */
type TaskType = '普通类' | '参数变更类' | '验证类' | '临脱+验证' | '挑选类'

const statusToneMap: Record<TaskStatus, 'wait' | 'run' | 'done' | 'pause' | 'error'> = {
  未开始: 'wait',
  生产中: 'run',
  完成: 'done',
  暂停: 'pause',
  异常结束: 'error'
}

const taskTypeToneMap: Record<TaskType, string> = {
  普通类: 'type-normal',
  参数变更类: 'type-param',
  验证类: 'type-verify',
  '临脱+验证': 'type-temp',
  挑选类: 'type-pick'
}

const taskList = ref<TaskCardItem[]>([
  { coreNo: 'SC-1002380677', coreName: '气缸盖内腔砂芯', planCount: 48, coreBoxCount: 4, machineCount: 2, line: '制芯一线', status: '未开始', taskType: '普通类' },
  { coreNo: 'SC-1000000244', coreName: '主轴承盖砂芯', planCount: 96, coreBoxCount: 6, machineCount: 3, line: '制芯一线', status: '未开始', taskType: '参数变更类' },
  { coreNo: 'SC-1002381102', coreName: '气缸体水套砂芯', planCount: 72, coreBoxCount: 5, machineCount: 2, line: '制芯二线', status: '生产中', taskType: '普通类' },
  { coreNo: 'SC-1001560088', coreName: '曲轴箱盖砂芯', planCount: 60, coreBoxCount: 4, machineCount: 2, line: '制芯三线', status: '生产中', taskType: '验证类' },
  { coreNo: 'SC-1004420015', coreName: '新产品壳体砂芯', planCount: 36, coreBoxCount: 3, machineCount: 1, line: '制芯二线', status: '暂停', taskType: '临脱+验证' },
  { coreNo: 'SC-1002380901', coreName: '气缸盖水道砂芯', planCount: 54, coreBoxCount: 4, machineCount: 2, line: '制芯一线', status: '完成', taskType: '普通类' },
  { coreNo: 'SC-1000000311', coreName: '主轴承盖砂芯B', planCount: 88, coreBoxCount: 6, machineCount: 3, line: '制芯三线', status: '未开始', taskType: '挑选类' },
  { coreNo: 'SC-1001560120', coreName: '连杆盖砂芯', planCount: 64, coreBoxCount: 5, machineCount: 2, line: '制芯二线', status: '生产中', taskType: '普通类' },
  { coreNo: 'SC-1004420040', coreName: '支架砂芯', planCount: 40, coreBoxCount: 3, machineCount: 1, line: '综合班', status: '异常结束', taskType: '参数变更类' },
  { coreNo: 'SC-1002381205', coreName: '气缸体油道砂芯', planCount: 76, coreBoxCount: 5, machineCount: 2, line: '制芯一线', status: '未开始', taskType: '验证类' },
  { coreNo: 'SC-1000000455', coreName: '轴承座砂芯', planCount: 58, coreBoxCount: 4, machineCount: 2, line: '制芯二线', status: '完成', taskType: '普通类' },
  { coreNo: 'SC-1001560177', coreName: '飞轮壳砂芯', planCount: 32, coreBoxCount: 3, machineCount: 1, line: '制芯三线', status: '暂停', taskType: '临脱+验证' },
  { coreNo: 'SC-1004420062', coreName: '端盖砂芯', planCount: 50, coreBoxCount: 4, machineCount: 2, line: '综合班', status: '生产中', taskType: '挑选类' },
  { coreNo: 'SC-1002381310', coreName: '气缸盖气道砂芯', planCount: 84, coreBoxCount: 6, machineCount: 3, line: '制芯一线', status: '异常结束', taskType: '普通类' }
])

const taskListEl = ref<HTMLElement | null>(null)
let autoScrollTimer: ReturnType<typeof setInterval> | null = null
let hoverPaused = false

/** 数据过多时自动上下滚动；悬停暂停 */
function startAutoScroll() {
  stopAutoScroll()
  autoScrollTimer = setInterval(() => {
    const el = taskListEl.value
    if (!el || hoverPaused) return
    // 滚到底后回到顶部，形成循环
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      el.scrollTop = 0
    } else {
      el.scrollTop += 1
    }
  }, 40)
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = null
  }
}

function onListMouseEnter() {
  hoverPaused = true
}

function onListMouseLeave() {
  hoverPaused = false
}

onMounted(() => {
  startAutoScroll()
})

onBeforeUnmount(() => {
  stopAutoScroll()
})

/** 占位面板 option：显示建设中提示 */
const placeholderOption: EChartsOption = {
  title: {
    text: '页面建设中',
    left: 'center',
    top: 'middle',
    textStyle: {
      color: 'rgba(169, 201, 212, 0.72)',
      fontSize: 14,
      fontWeight: 400
    }
  },
  xAxis: { show: false, type: 'category', data: [] },
  yAxis: { show: false, type: 'value' },
  series: []
}

/* =========================
   通用图表样式（与生产运营大屏一致）
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(5, 24, 34, 0.96)',
  borderColor: 'rgba(0, 198, 239, 0.55)',
  textStyle: { color: '#dff8ff' }
}

const axisLine = { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } }
const splitLine = { lineStyle: { type: 'dashed' as const, color: 'rgba(72, 164, 194, 0.24)' } }
const axisLabel = { color: '#a9c9d4', fontSize: 10 }
const axisNameStyle = { color: '#a9c9d4', fontSize: 10 }

/** 近 7 日横轴（MM-DD） */
const todayStart = dayjs().startOf('day')
const coreDates = Array.from({ length: 7 }, (_, index) =>
  todayStart.subtract(6 - index, 'day').format('MM-DD')
)

/** 按日期确定性生成近一周制芯数量，刷新不跳变 */
function mockCoreCounts(): number[] {
  return coreDates.map((_, index) => {
    const date = todayStart.subtract(6 - index, 'day')
    const seed = date.year() + date.month() * 31 + date.date() + 17
    return 96 + ((seed * 11) % 45)
  })
}

/** 制芯数量统计：横轴日期，纵轴颗数，柱状图 */
const coreCountOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const body = list
        .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value} 颗`)
        .join('<br/>')
      return `${list[0]?.axisValue ?? ''}<br/>${body}`
    }
  },
  grid: { left: '4%', right: '5%', bottom: '4%', top: '14%', containLabel: true },
  xAxis: {
    type: 'category',
    data: coreDates,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '颗',
    nameTextStyle: axisNameStyle,
    axisLabel,
    splitLine,
    axisLine: { show: false },
    axisTick: { show: false }
  },
  series: [
    {
      name: '制芯数量',
      type: 'bar',
      data: mockCoreCounts(),
      barWidth: '36%',
      itemStyle: {
        color: '#20cfff',
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: '#dff8ff', fontSize: 10 }
    }
  ]
}

/** 生产趋势：近一周计划/制芯/检测/入库/出库折线 */
const productionTrendOption: EChartsOption = {
  tooltip: { trigger: 'axis', ...tooltipBase },
  legend: { data: ['计划数', '制芯数', '检测数', '入库数', '出库数'], textStyle: { color: '#a9c9d4' }, top: 4 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    data: coreDates,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '颗数',
    nameTextStyle: axisNameStyle,
    axisLabel,
    splitLine,
    axisLine: { show: false },
    axisTick: { show: false }
  },
  series: ['计划数', '制芯数', '检测数', '入库数', '出库数'].map((name, index) => ({
    name,
    type: 'line',
    smooth: true,
    data: [
      [128, 132, 126, 140, 136, 142, 128],
      [116, 121, 118, 129, 124, 133, 116],
      [112, 118, 114, 124, 120, 128, 113],
      [108, 114, 110, 120, 116, 124, 108],
      [104, 110, 106, 116, 112, 120, 104]
    ][index],
    lineStyle: { width: 2 },
    symbol: 'circle',
    symbolSize: 5
  }))
}

const panels = computed(() => [
  { title: '任务列表', contentKey: 'taskList' },
  { title: '制芯进度分析', option: placeholderOption },
  { title: '生产趋势', option: productionTrendOption },
  { title: '设备可动分析', option: placeholderOption },
  { title: '制芯数量统计', option: coreCountOption },
  { title: '班组对比分析', option: placeholderOption }
])
</script>

<template>
  <!-- 制芯班组可视化：可切换班组 + 6 指标 + 任务列表卡片 -->
  <LineDashboardShell title="制芯班组可视化" :indicators="indicators" :panels="panels">
    <template #headerTeamsLeft>
      <button
        v-for="name in teamGroups.left"
        :key="name"
        type="button"
        class="team-tag"
        :class="{ active: activeTeam === name }"
        @click="selectTeam(name)"
      >
        {{ name }}
      </button>
    </template>
    <template #headerTeamsRight>
      <button
        v-for="name in teamGroups.right"
        :key="name"
        type="button"
        class="team-tag"
        :class="{ active: activeTeam === name }"
        @click="selectTeam(name)"
      >
        {{ name }}
      </button>
    </template>

    <template #taskList>
      <div
        ref="taskListEl"
        class="task-list-scroll"
        @mouseenter="onListMouseEnter"
        @mouseleave="onListMouseLeave"
      >
        <div
          v-for="task in taskList"
          :key="task.coreNo"
          class="task-card"
        >
          <div class="task-card-grid">
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">砂芯编号:</span>
                <span class="task-value">{{ task.coreNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">砂芯名称:</span>
                <span class="task-value">{{ task.coreName }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">计划数量:</span>
                <span class="task-value">{{ task.planCount }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">任务类型:</span>
                <span
                  class="task-type"
                  :class="taskTypeToneMap[task.taskType]"
                >{{ task.taskType }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">当前状态:</span>
                <span
                  class="task-status"
                  :class="`status-${statusToneMap[task.status]}`"
                >{{ task.status }}</span>
              </div>
            </div>
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">芯盒数:</span>
                <span class="task-value">{{ task.coreBoxCount }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">制芯机数:</span>
                <span class="task-value">{{ task.machineCount }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">产线:</span>
                <span class="task-value">{{ task.line }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </LineDashboardShell>
</template>

<style scoped src="./dashboard-theme.css"></style>

<style scoped>
/* 班组标签：可点击切换，激活高亮 */
.team-tag {
  appearance: none;
  cursor: pointer;
  border: 1px solid rgba(0, 190, 236, 0.65);
  border-radius: 2px;
  padding: 4px 14px;
  color: #dff8ff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  white-space: nowrap;
  background: rgba(0, 166, 216, 0.16);
  box-shadow:
    inset 0 0 10px rgba(0, 166, 216, 0.12),
    0 0 8px rgba(0, 166, 216, 0.12);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
  line-height: 1.2;
}

.team-tag::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  vertical-align: middle;
  background: #20cfff;
  box-shadow: 0 0 6px rgba(32, 207, 255, 0.9);
}

.team-tag:hover {
  background: rgba(0, 190, 236, 0.28);
  border-color: rgba(67, 229, 255, 0.9);
}

.team-tag.active {
  color: #04202b;
  font-weight: 700;
  background: linear-gradient(180deg, #43e5ff, #20cfff);
  border-color: #7ef0ff;
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.25),
    0 0 12px rgba(32, 207, 255, 0.55);
}

.team-tag.active::before {
  background: #04202b;
  box-shadow: none;
}

/* 任务列表：卡片式，超出自动上下滚动 */
.task-list-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 2px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.task-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.task-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.task-list-scroll::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.task-list-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(26, 202, 242, 0.7);
}

.task-card {
  position: relative;
  margin-bottom: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 190, 235, 0.28);
  border-radius: 4px;
  background:
    linear-gradient(135deg, rgba(10, 48, 64, 0.95), rgba(6, 28, 40, 0.98)),
    #082532;
  box-shadow: inset 0 0 16px rgba(0, 154, 201, 0.08);
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 36%;
  height: 2px;
  background: linear-gradient(90deg, #26d9ff, transparent);
}

.task-card:last-child {
  margin-bottom: 0;
}

.task-card-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 8px 18px;
}

.task-card-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.task-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  line-height: 1.35;
}

.task-label {
  flex: 0 0 auto;
  color: #c5e4ee;
  white-space: nowrap;
}

.task-value {
  color: #f0fbff;
  font-weight: 600;
  word-break: break-all;
}

.task-status {
  font-weight: 700;
}

.task-status.status-wait {
  color: #ffd52a;
}

.task-status.status-run {
  color: #20cfff;
}

.task-status.status-done {
  color: #4ee6a6;
}

.task-status.status-pause {
  color: #9b8cff;
}

.task-status.status-error {
  color: #ff4f8b;
}

.task-type {
  display: inline-block;
  padding: 0 8px;
  border-radius: 2px;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  border: 1px solid transparent;
}

.task-type.type-normal {
  color: #20cfff;
  background: rgba(32, 207, 255, 0.12);
  border-color: rgba(32, 207, 255, 0.45);
}

.task-type.type-param {
  color: #ffd52a;
  background: rgba(255, 213, 42, 0.12);
  border-color: rgba(255, 213, 42, 0.45);
}

.task-type.type-verify {
  color: #4ee6a6;
  background: rgba(78, 230, 166, 0.12);
  border-color: rgba(78, 230, 166, 0.45);
}

.task-type.type-temp {
  color: #9b8cff;
  background: rgba(155, 140, 255, 0.14);
  border-color: rgba(155, 140, 255, 0.5);
}

.task-type.type-pick {
  color: #ff8fb5;
  background: rgba(255, 79, 139, 0.12);
  border-color: rgba(255, 79, 139, 0.45);
}
</style>
