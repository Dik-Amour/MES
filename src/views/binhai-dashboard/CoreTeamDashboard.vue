<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'

import dayjs from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import EChart from '@/components/EChart.vue'
import type { EChartsOption } from 'echarts'

/** 指标栏：6 项指标（数值为 mock，各班组内容一致） */
const indicators = [
  { label: '制芯设备', value: '12', unit: '台', tone: 'output' as const },
  { label: '今日制芯计划颗数', value: '128', unit: '颗', tone: 'inbound' as const },
  { label: '实际生产颗数', value: '116', unit: '颗', tone: 'output' as const },
  { label: '计划利用率', value: '92.4', unit: '%', tone: 'output' as const },
  { label: '实际利用率', value: '89.7', unit: '%', tone: 'inbound' as const },
  { label: '砂芯合格率', value: '98.6', unit: '%', tone: 'inbound' as const }
]

/** 任务列表 mock（各班组共用同一套数据） */
interface TaskCardItem {
  deviceName: string
  partNo: string
  coreName: string
  coreNo: string
  coreBox: string
  planCount: number
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
  { deviceName: '1号射芯机', partNo: '1002380677R', coreName: '气缸盖内腔砂芯', coreNo: 'SC-1002380677', coreBox: '芯盒-A01', planCount: 48, status: '未开始', taskType: '普通类' },
  { deviceName: '2号射芯机', partNo: '1000000244R', coreName: '主轴承盖砂芯', coreNo: 'SC-1000000244', coreBox: '芯盒-A02', planCount: 96, status: '未开始', taskType: '参数变更类' },
  { deviceName: '3号射芯机', partNo: '1002381102R', coreName: '气缸体水套砂芯', coreNo: 'SC-1002381102', coreBox: '芯盒-B01', planCount: 72, status: '生产中', taskType: '普通类' },
  { deviceName: '1号制芯机', partNo: '1001560088R', coreName: '曲轴箱盖砂芯', coreNo: 'SC-1001560088', coreBox: '芯盒-C01', planCount: 60, status: '生产中', taskType: '验证类' },
  { deviceName: '2号制芯机', partNo: '1004420015R', coreName: '新产品壳体砂芯', coreNo: 'SC-1004420015', coreBox: '芯盒-D01', planCount: 36, status: '暂停', taskType: '临脱+验证' },
  { deviceName: '3号制芯机', partNo: '1002380901R', coreName: '气缸盖水道砂芯', coreNo: 'SC-1002380901', coreBox: '芯盒-A03', planCount: 54, status: '完成', taskType: '普通类' },
  { deviceName: '1号射芯机', partNo: '1000000311R', coreName: '主轴承盖砂芯B', coreNo: 'SC-1000000311', coreBox: '芯盒-A04', planCount: 88, status: '未开始', taskType: '挑选类' },
  { deviceName: '2号射芯机', partNo: '1001560120R', coreName: '连杆盖砂芯', coreNo: 'SC-1001560120', coreBox: '芯盒-C02', planCount: 64, status: '生产中', taskType: '普通类' },
  { deviceName: '3号射芯机', partNo: '1004420040R', coreName: '支架砂芯', coreNo: 'SC-1004420040', coreBox: '芯盒-D02', planCount: 40, status: '异常结束', taskType: '参数变更类' },
  { deviceName: '1号制芯机', partNo: '1002381205R', coreName: '气缸体油道砂芯', coreNo: 'SC-1002381205', coreBox: '芯盒-B02', planCount: 76, status: '未开始', taskType: '验证类' },
  { deviceName: '2号制芯机', partNo: '1000000455R', coreName: '轴承座砂芯', coreNo: 'SC-1000000455', coreBox: '芯盒-A05', planCount: 58, status: '完成', taskType: '普通类' },
  { deviceName: '3号制芯机', partNo: '1001560177R', coreName: '飞轮壳砂芯', coreNo: 'SC-1001560177', coreBox: '芯盒-C03', planCount: 32, status: '暂停', taskType: '临脱+验证' },
  { deviceName: '1号射芯机', partNo: '1004420062R', coreName: '端盖砂芯', coreNo: 'SC-1004420062', coreBox: '芯盒-D03', planCount: 50, status: '生产中', taskType: '挑选类' },
  { deviceName: '2号制芯机', partNo: '1002381310R', coreName: '气缸盖气道砂芯', coreNo: 'SC-1002381310', coreBox: '芯盒-A06', planCount: 84, status: '异常结束', taskType: '普通类' }
])

/** 砂芯库存 mock（各班组共用） */
interface StockItem {
  coreName: string
  count: number
  rackCount: number
}

const stockList = ref<StockItem[]>([
  { coreName: '气缸盖内腔砂芯', count: 126, rackCount: 7 },
  { coreName: '主轴承盖砂芯', count: 208, rackCount: 11 },
  { coreName: '气缸体水套砂芯', count: 154, rackCount: 9 },
  { coreName: '曲轴箱盖砂芯', count: 92, rackCount: 5 },
  { coreName: '新产品壳体砂芯', count: 64, rackCount: 4 },
  { coreName: '气缸盖水道砂芯', count: 118, rackCount: 6 },
  { coreName: '主轴承盖砂芯B', count: 176, rackCount: 10 },
  { coreName: '连杆盖砂芯', count: 132, rackCount: 8 },
  { coreName: '支架砂芯', count: 78, rackCount: 4 },
  { coreName: '气缸体油道砂芯', count: 145, rackCount: 8 },
  { coreName: '轴承座砂芯', count: 96, rackCount: 5 },
  { coreName: '飞轮壳砂芯', count: 58, rackCount: 3 },
  { coreName: '端盖砂芯', count: 88, rackCount: 5 },
  { coreName: '气缸盖气道砂芯', count: 162, rackCount: 9 }
])

const taskListEl = ref<HTMLElement | null>(null)
const stockListEl = ref<HTMLElement | null>(null)
let taskScrollTimer: ReturnType<typeof setInterval> | null = null
let stockScrollTimer: ReturnType<typeof setInterval> | null = null
let taskHoverPaused = false
let stockHoverPaused = false

/** 数据过多时自动上下滚动；悬停暂停（任务列表 / 砂芯库存共用） */
function startScroll(elRef: typeof taskListEl, paused: () => boolean): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const el = elRef.value
    if (!el || paused()) return
    // 滚到底后回到顶部，形成循环
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      el.scrollTop = 0
    } else {
      el.scrollTop += 1
    }
  }, 40)
}

function stopScroll(timer: ReturnType<typeof setInterval> | null) {
  if (timer) clearInterval(timer)
}

function onTaskEnter() { taskHoverPaused = true }
function onTaskLeave() { taskHoverPaused = false }
function onStockEnter() { stockHoverPaused = true }
function onStockLeave() { stockHoverPaused = false }

onMounted(() => {
  taskScrollTimer = startScroll(taskListEl, () => taskHoverPaused)
  stockScrollTimer = startScroll(stockListEl, () => stockHoverPaused)
})

onBeforeUnmount(() => {
  stopScroll(taskScrollTimer)
  stopScroll(stockScrollTimer)
})

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

/** 制芯统计：横轴日期；左纵轴实际生产颗数（柱状），右纵轴计划生产颗数（折线） */
const coreAnalysisOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross', label: { backgroundColor: '#0a3040' } },
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
  legend: {
    data: ['实际生产颗数', '计划生产颗数'],
    textStyle: { color: '#a9c9d4' },
    top: 4
  },
  grid: { left: '4%', right: '5%', bottom: '4%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    data: coreDates,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: [
    {
      type: 'value',
      name: '实际生产颗数',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    {
      type: 'value',
      name: '计划生产颗数',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false }
    }
  ],
  series: [
    {
      name: '实际生产颗数',
      type: 'bar',
      yAxisIndex: 0,
      data: mockCoreCounts(),
      barWidth: '36%',
      itemStyle: {
        color: '#20cfff',
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: '#dff8ff', fontSize: 9 }
    },
    {
      name: '计划生产颗数',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: [140, 145, 138, 150, 146, 152, 142],
      lineStyle: { width: 2, color: '#ffd52a' },
      itemStyle: { color: '#ffd52a', borderColor: '#061821', borderWidth: 2 },
      symbol: 'circle',
      symbolSize: 6
    }
  ]
}

/** 按日期确定性生成近一周下芯颗数，刷新不跳变 */
function mockCoreSetCounts(): number[] {
  return coreDates.map((_, index) => {
    const date = todayStart.subtract(6 - index, 'day')
    const seed = date.year() + date.month() * 31 + date.date() + 41
    return 72 + ((seed * 13) % 48)
  })
}

/** 砂芯下芯统计：横轴日期，纵轴颗数，柱状图 */
const coreSetOption: EChartsOption = {
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
      name: '下芯颗数',
      type: 'bar',
      data: mockCoreSetCounts(),
      barWidth: '36%',
      itemStyle: {
        color: '#4ee6a6',
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: '#dff8ff', fontSize: 10 }
    }
  ]
}

/* =========================
   砂芯立库分析：左侧指标 + 右侧件号占比环形图
   ========================= */
const warehouseMetrics = [
  { label: '今日消耗数', value: '186', unit: '颗' },
  { label: '今日入库数', value: '204', unit: '颗' },
  { label: '立库库存数', value: '1638', unit: '颗' }
]

/** 环形图配色（与参考图一致的多色区分） */
const warehouseColors = ['#6393e8', '#6fc9c4', '#7cb342', '#f5a623', '#e57373', '#9b8cff']

/** 立库各产品件号库存占比 mock */
const warehouseDonutOption: EChartsOption = {
  tooltip: {
    trigger: 'item',
    ...tooltipBase,
    formatter: (params: any) => {
      return `${params.marker} ${params.name}<br/>数量: ${params.value} 颗（${params.percent}%）`
    }
  },
  legend: {
    type: 'scroll',
    orient: 'horizontal',
    bottom: 0,
    left: 'center',
    textStyle: { color: '#a9c9d4', fontSize: 10 },
    itemWidth: 12,
    itemHeight: 10,
    itemGap: 10,
    data: ['1001705973R', '1001041415R', '61500010366R', '1001218737R', '61560010095BR', '1002380677R']
  },
  series: [
    {
      name: '立库库存',
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: '#082532',
        borderWidth: 2
      },
      label: {
        show: true,
        color: '#dff8ff',
        fontSize: 10,
        formatter: '{b}\n{c}'
      },
      labelLine: {
        lineStyle: { color: 'rgba(169, 201, 212, 0.55)' }
      },
      data: [
        { name: '1001705973R', value: 190 },
        { name: '1001041415R', value: 74 },
        { name: '61500010366R', value: 46 },
        { name: '1001218737R', value: 2 },
        { name: '61560010095BR', value: 1 },
        { name: '1002380677R', value: 128 }
      ].map((item, index) => ({
        ...item,
        itemStyle: { color: warehouseColors[index % warehouseColors.length] }
      }))
    }
  ]
}

/** 过程检验分析：最近 6 个月，横轴月份、纵轴合格率 */
const processMonths = Array.from({ length: 6 }, (_, index) =>
  todayStart.subtract(5 - index, 'month').format('YYYY-MM')
)

function mockProcessPassRates(): number[] {
  return processMonths.map((_, index) => {
    const base = todayStart.subtract(5 - index, 'month')
    const seed = base.year() * 100 + base.month() + 17
    // 94.0 ~ 98.9，保留 1 位小数
    return Math.round((94 + ((seed * 11) % 50) / 10) * 10) / 10
  })
}

const processInspectOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const body = list
        .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value}%`)
        .join('<br/>')
      return `${list[0]?.axisValue ?? ''}<br/>${body}`
    }
  },
  grid: { left: '4%', right: '6%', bottom: '4%', top: '14%', containLabel: true },
  xAxis: {
    type: 'category',
    data: processMonths,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '合格率',
    nameTextStyle: axisNameStyle,
    min: 90,
    max: 100,
    axisLabel: {
      ...axisLabel,
      formatter: '{value}%'
    },
    splitLine,
    axisLine: { show: false },
    axisTick: { show: false }
  },
  series: [
    {
      name: '过程检验合格率',
      type: 'line',
      smooth: true,
      data: mockProcessPassRates(),
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 2.5, color: '#4ee6a6' },
      itemStyle: { color: '#4ee6a6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(78, 230, 166, 0.35)' },
            { offset: 1, color: 'rgba(78, 230, 166, 0.02)' }
          ]
        }
      },
      label: {
        show: true,
        position: 'top',
        color: '#dff8ff',
        fontSize: 10,
        formatter: (params: any) => `${params.value}%`
      }
    }
  ]
}

const panels = computed(() => [
  { title: '任务列表', contentKey: 'taskList' },
  { title: '砂芯下芯统计', option: coreSetOption },
  { title: '制芯统计', option: coreAnalysisOption },
  { title: '砂芯立库分析', contentKey: 'warehouseAnalysis' },
  { title: '芯架砂芯库存', contentKey: 'stockList' },
  { title: '过程检验分析', option: processInspectOption }
])
</script>

<template>
  <!-- 制芯班组可视化：6 指标 + 任务列表卡片 -->
  <LineDashboardShell title="制芯班组可视化" :indicators="indicators" :panels="panels">
    <template #taskList>
      <div
        ref="taskListEl"
        class="task-list-scroll"
        @mouseenter="onTaskEnter"
        @mouseleave="onTaskLeave"
      >
        <div
          v-for="task in taskList"
          :key="task.coreNo"
          class="task-card"
        >
          <div class="task-card-grid">
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">设备名称:</span>
                <span class="task-value">{{ task.deviceName }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">产品件号:</span>
                <span class="task-value">{{ task.partNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">砂芯名称:</span>
                <span class="task-value">{{ task.coreName }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">砂芯编号:</span>
                <span class="task-value">{{ task.coreNo }}</span>
              </div>
            </div>
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">工装芯盒:</span>
                <span class="task-value">{{ task.coreBox }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">排产颗数:</span>
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
          </div>
        </div>
      </div>
    </template>

    <template #warehouseAnalysis>
      <div class="wh-layout">
        <div class="wh-metrics">
          <div
            v-for="metric in warehouseMetrics"
            :key="metric.label"
            class="wh-metric"
          >
            <div class="wh-icon" aria-hidden="true">
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8 7 5 10.5 5 14a7 7 0 0014 0c0-3.5-3-7-7-12zm0 18a5 5 0 01-5-5c0-2.2 1.8-4.6 5-8.2 3.2 3.6 5 6 5 8.2a5 5 0 01-5 5z" />
              </svg>
            </div>
            <div class="wh-metric-body">
              <div class="wh-metric-label">{{ metric.label }}</div>
              <div class="wh-metric-value">
                {{ metric.value }}<span class="wh-metric-unit">{{ metric.unit }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="wh-chart">
          <EChart :option="warehouseDonutOption" height="100%" />
        </div>
      </div>
    </template>

    <template #stockList>
      <div
        ref="stockListEl"
        class="stock-scroll"
        @mouseenter="onStockEnter"
        @mouseleave="onStockLeave"
      >
        <table class="stock-table">
          <thead class="stock-thead">
            <tr>
              <th>砂芯名称</th>
              <th>数量（颗）</th>
              <th>芯架数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in stockList" :key="`${item.coreName}-${index}`">
              <td>{{ item.coreName }}</td>
              <td class="stock-count">{{ item.count }}</td>
              <td class="stock-rack">{{ item.rackCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </LineDashboardShell>
</template>

<style src="./dashboard-common.css"></style>
<style scoped src="./dashboard-theme.css"></style>

<style scoped>
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

/* 砂芯库存：表格自动滚动，表头吸顶 */
.stock-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.stock-scroll::-webkit-scrollbar {
  width: 6px;
}

.stock-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.stock-scroll::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.stock-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(26, 202, 242, 0.7);
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.stock-thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  text-align: left;
  color: #dff8ff;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(180deg, rgba(10, 48, 64, 0.98), rgba(8, 37, 50, 0.96));
  border-bottom: 1px solid rgba(0, 190, 235, 0.45);
}

.stock-table tbody td {
  padding: 10px 12px;
  color: #c5e4ee;
  border-bottom: 1px solid rgba(0, 166, 216, 0.16);
}

.stock-table tbody tr:nth-child(even) td {
  background: rgba(0, 166, 216, 0.05);
}

.stock-table tbody tr:hover td {
  background: rgba(0, 190, 236, 0.12);
}

.stock-count {
  color: #f0fbff;
  font-weight: 700;
}

.stock-rack {
  color: #20cfff;
  font-weight: 600;
}

/* 砂芯立库分析：左指标 + 右环形图 */
.wh-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: 8px;
}

.wh-metrics {
  flex: 0 0 38%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  min-width: 0;
  padding: 4px 0;
}

.wh-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.wh-icon {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #20cfff;
  background: radial-gradient(circle, rgba(0, 190, 236, 0.22), rgba(0, 166, 216, 0.06) 70%);
  border: 1px solid rgba(0, 190, 236, 0.45);
  border-radius: 50%;
  box-shadow:
    inset 0 0 12px rgba(0, 190, 236, 0.2),
    0 0 10px rgba(0, 190, 236, 0.15);
}

.wh-metric-body {
  min-width: 0;
  border-left: 2px solid rgba(0, 190, 236, 0.45);
  padding-left: 12px;
}

.wh-metric-label {
  color: #c5e4ee;
  font-size: 14px;
  line-height: 1.3;
  white-space: nowrap;
}

.wh-metric-value {
  margin-top: 4px;
  color: #f0fbff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.wh-metric-unit {
  margin-left: 4px;
  color: #a9c9d4;
  font-size: 13px;
  font-weight: 400;
}

.wh-chart {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
