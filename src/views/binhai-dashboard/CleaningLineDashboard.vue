<script setup lang="ts">
import { computed, ref } from 'vue'

import dayjs from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import type { EChartsOption } from 'echarts'

/** 指标行：12 项，grid 六列自动排成两行（数值为 mock，待业务方确认） */
const indicators = [
  { label: '打箱计划完成率', value: '96.2', unit: '%', tone: 'output' },
  { label: '打箱实际完成率', value: '94.8', unit: '%', tone: 'inbound' },
  { label: '热处理计划完成率', value: '97.1', unit: '%', tone: 'output' },
  { label: '热处理实际完成率', value: '95.6', unit: '%', tone: 'inbound' },
  { label: '当月入库', value: '2,705', unit: '吨', tone: 'output' },
  { label: '年度入库', value: '31,880', unit: '吨', tone: 'inbound' },
  { label: '设备可动率', value: '93.8', unit: '%', tone: 'output' },
  { label: 'MTBF', value: '46.2', unit: '小时', tone: 'inbound' },
  { label: 'MTTR', value: '2.1', unit: '小时', tone: 'output' },
  { label: '主要设备故障停机率', value: '2.8', unit: '%', tone: 'inbound' },
  { label: '综合废品率', value: '1.1', unit: '%', tone: 'output' },
  { label: '吨均制造成本', value: '186', unit: '元/吨', tone: 'inbound' }
]

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

const COLOR_PLAN = 'rgba(32, 207, 255, 0.48)'
const COLOR_ACTUAL = '#4ee6a6'
const COLOR_RATE = '#ffd52a'
const COLOR_INBOUND = '#20cfff'
const COLOR_OUTBOUND = '#9b8cff'

const monthlyCategories = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)
const todayStart = dayjs().startOf('day')
const dailyCategories = Array.from({ length: 7 }, (_, index) =>
  todayStart.subtract(6 - index, 'day').format('MM-DD')
)

/* =========================
   1. 打箱分析：近一周计划 / 实际箱数（分组柱，横轴日期，纵轴箱数）
   ========================= */
/** 按日期确定性生成近一周计划 / 实际箱数，刷新不跳变 */
function mockBoxingWeek(): { plan: number[]; actual: number[] } {
  const base = 140
  const plan: number[] = []
  const actual: number[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const seed = date.year() + date.month() * 31 + date.date()
    const planValue = base + ((seed * 13) % 25) - 12
    const rate = 0.9 + ((seed * 7) % 15) / 100
    plan.push(planValue)
    actual.push(Math.round(planValue * rate))
  }
  return { plan, actual }
}

const boxingOption: EChartsOption = (() => {
  const { plan, actual } = mockBoxingWeek()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const body = list
          .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value} 箱`)
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: ['计划箱数', '实际箱数'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5,
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyCategories,
      axisLabel: { ...axisLabel, interval: 0 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '箱数',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '计划箱数',
        type: 'bar',
        data: plan,
        barWidth: '28%',
        itemStyle: { color: COLOR_PLAN, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#a9c9d4', fontSize: 9 }
      },
      {
        name: '实际箱数',
        type: 'bar',
        data: actual,
        barWidth: '28%',
        itemStyle: { color: COLOR_ACTUAL, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#dff8ff', fontSize: 9 }
      }
    ]
  }
})()

/* =========================
   2. 热处理分析：双 tab（设备监控 / 生产统计）
   ========================= */
type HeatTabKey = 'monitor' | 'stats'
const heatTabs: { key: HeatTabKey; label: string }[] = [
  { key: 'monitor', label: '设备监控' },
  { key: 'stats', label: '生产统计' }
]
const activeHeatTab = ref<HeatTabKey>('monitor')

/** 设备状态：待机黄 / 任务中绿 / 故障红 */
type HeatDeviceStatus = 'idle' | 'running' | 'fault'
const heatStatusMeta: Record<
  HeatDeviceStatus,
  { label: string; color: string; glow: string }
> = {
  idle: { label: '待机', color: '#ffd52a', glow: 'rgba(255, 213, 42, 0.45)' },
  running: { label: '任务中', color: '#4ee6a6', glow: 'rgba(78, 230, 166, 0.45)' },
  fault: { label: '故障', color: '#ff4f8b', glow: 'rgba(255, 79, 139, 0.45)' }
}

interface HeatDevice {
  id: string
  name: string
  status: HeatDeviceStatus
  /** 进行中任务；待机/故障可为空 */
  task: string | null
  progress?: number
  operator?: string
  startedAt?: string
}

/** 6 台热处理设备 mock（状态与任务待业务接入后替换） */
const heatDevices: HeatDevice[] = [
  {
    id: 'ht-1',
    name: '1# 退火炉',
    status: 'running',
    task: '机体毛坯退火 · 批次 B260915-A12',
    progress: 68,
    operator: '王强',
    startedAt: '08:30'
  },
  {
    id: 'ht-2',
    name: '2# 退火炉',
    status: 'running',
    task: '曲轴毛坯去应力 · 批次 B260915-C07',
    progress: 42,
    operator: '李敏',
    startedAt: '10:05'
  },
  {
    id: 'ht-3',
    name: '3# 正火炉',
    status: 'idle',
    task: null
  },
  {
    id: 'ht-4',
    name: '4# 正火炉',
    status: 'fault',
    task: '温控模块异常 · 等待维修确认',
    progress: 0,
    operator: '—',
    startedAt: '11:42'
  },
  {
    id: 'ht-5',
    name: '5# 回火炉',
    status: 'running',
    task: '大机缸体回火 · 批次 B260914-H03',
    progress: 85,
    operator: '赵磊',
    startedAt: '06:50'
  },
  {
    id: 'ht-6',
    name: '6# 回火炉',
    status: 'idle',
    task: null
  }
]

const heatDeviceLegend = [
  { status: 'idle' as HeatDeviceStatus },
  { status: 'running' as HeatDeviceStatus },
  { status: 'fault' as HeatDeviceStatus }
]

const activeHeatDevice = ref<HeatDevice | null>(null)
const heatTaskModalOpen = computed({
  get: () => activeHeatDevice.value !== null,
  set: (open: boolean) => {
    if (!open) activeHeatDevice.value = null
  }
})

function openHeatTask(device: HeatDevice) {
  activeHeatDevice.value = device
}

/** 生产统计：近 7 天计划 / 实际（横轴日期，纵轴数量，图例计划数/实际数） */
function mockHeatWeek(): { plan: number[]; actual: number[] } {
  const base = 130
  const plan: number[] = []
  const actual: number[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const seed = date.year() + date.month() * 31 + date.date()
    const planValue = base + ((seed * 11) % 23) - 11
    const rate = 0.91 + ((seed * 5) % 14) / 100
    plan.push(planValue)
    actual.push(Math.round(planValue * rate))
  }
  return { plan, actual }
}

const heatStatsOption: EChartsOption = (() => {
  const { plan, actual } = mockHeatWeek()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const body = list
          .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value}`)
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: ['计划数', '实际数'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5,
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyCategories,
      axisLabel: { ...axisLabel, interval: 0 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '计划数',
        type: 'bar',
        data: plan,
        barWidth: '28%',
        itemStyle: { color: COLOR_PLAN, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#a9c9d4', fontSize: 9 }
      },
      {
        name: '实际数',
        type: 'bar',
        data: actual,
        barWidth: '28%',
        itemStyle: { color: COLOR_ACTUAL, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#dff8ff', fontSize: 9 }
      }
    ]
  }
})()

/* =========================
   3. 出入库分析：近 7 天双轴折线（左入库 / 右出库），点击日期节点看当日明细
   ========================= */
const COLOR_IO_IN = '#20cfff'
const COLOR_IO_OUT = '#ff9f43'

interface IoDailyRow {
  product: string
  inbound: number
  outbound: number
}

interface IoDayDetail {
  label: string
  fullDate: string
  inbound: number
  outbound: number
  rows: IoDailyRow[]
}

/** 产品系列拆分权重（和为 1），用于生成明细行 */
const ioProductShares: { name: string; share: number }[] = [
  { name: '中速机', share: 0.32 },
  { name: '博杜安', share: 0.26 },
  { name: '重潍柴', share: 0.22 },
  { name: '大机', share: 0.2 }
]

/** 按日期确定性生成近 7 天入库 / 出库，刷新不跳变 */
function mockIoWeek(): { labels: string[]; inbound: number[]; outbound: number[]; days: IoDayDetail[] } {
  const labels: string[] = []
  const inbound: number[] = []
  const outbound: number[] = []
  const days: IoDayDetail[] = []

  for (let offset = 6; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const label = date.format('MM-DD')
    const seed = date.year() + date.month() * 31 + date.date()

    const inBase = 58 + ((seed * 37) % 32)
    const outBase = 52 + ((seed * 41) % 30)
    const weekend = date.day() === 0 || date.day() === 6
    const inValue = weekend ? Math.max(28, inBase - 16) : inBase
    const outValue = weekend ? Math.max(24, outBase - 14) : outBase

    const rows = splitIoByProduct(inValue, outValue, seed)

    labels.push(label)
    inbound.push(inValue)
    outbound.push(outValue)
    days.push({
      label,
      fullDate: date.format('YYYY-MM-DD'),
      inbound: inValue,
      outbound: outValue,
      rows
    })
  }

  return { labels, inbound, outbound, days }
}

/** 按产品占比拆分当日入库 / 出库，末项吸收舍入差 */
function splitIoByProduct(inbound: number, outbound: number, seed: number): IoDailyRow[] {
  const shares = ioProductShares.map((item, index) => {
    // 轻微扰动占比，避免每日结构完全相同
    const jitter = ((seed * (index + 3)) % 7) / 100 - 0.03
    return Math.max(0.05, item.share + jitter)
  })
  const shareSum = shares.reduce((sum, value) => sum + value, 0)
  const normalized = shares.map((value) => value / shareSum)

  const inParts = splitByShare(inbound, normalized)
  const outParts = splitByShare(outbound, normalized)

  return ioProductShares.map((item, index) => ({
    product: item.name,
    inbound: inParts[index],
    outbound: outParts[index]
  }))
}

/** 把总量按占比拆成数组，最后一项吸收舍入差 */
function splitByShare(total: number, shares: number[]): number[] {
  const head = shares.slice(0, -1).map((share) => Math.round(total * share))
  const last = total - head.reduce((sum, value) => sum + value, 0)
  return [...head, last]
}

const ioWeek = mockIoWeek()

const ioOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const body = list
        .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value}`)
        .join('<br/>')
      return `${list[0]?.axisValue ?? ''}<br/>${body}<br/><span style="opacity:.75">点击节点查看当日明细</span>`
    }
  },
  legend: {
    data: ['入库数量', '出库数量'],
    textStyle: { color: '#a9c9d4', fontSize: 11 },
    top: 5,
    itemWidth: 14,
    itemHeight: 8
  },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ioWeek.labels,
    boundaryGap: false,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: [
    {
      type: 'value',
      name: '入库',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    {
      type: 'value',
      name: '出库',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false }
    }
  ],
  series: [
    {
      name: '入库数量',
      type: 'line',
      yAxisIndex: 0,
      data: ioWeek.inbound,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: COLOR_IO_IN, width: 3 },
      itemStyle: {
        color: COLOR_IO_IN,
        borderColor: '#061821',
        borderWidth: 2
      },
      label: { show: true, position: 'top', color: '#dff8ff', fontSize: 9 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${COLOR_IO_IN}40` },
            { offset: 1, color: `${COLOR_IO_IN}05` }
          ]
        }
      }
    },
    {
      name: '出库数量',
      type: 'line',
      yAxisIndex: 1,
      data: ioWeek.outbound,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: COLOR_IO_OUT, width: 3 },
      itemStyle: {
        color: COLOR_IO_OUT,
        borderColor: '#061821',
        borderWidth: 2
      },
      label: { show: true, position: 'bottom', color: '#ffd91a', fontSize: 9 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${COLOR_IO_OUT}33` },
            { offset: 1, color: `${COLOR_IO_OUT}05` }
          ]
        }
      }
    }
  ]
}

/** 当日出入库明细弹窗 */
const ioDetail = ref<IoDayDetail | null>(null)
const ioDetailOpen = computed({
  get: () => ioDetail.value !== null,
  set: (open: boolean) => {
    if (!open) ioDetail.value = null
  }
})

/** EChart 点击：出入库分析按日期节点打开明细 */
function handleChartClick(payload: { title: string; params: unknown }) {
  if (payload.title !== '出入库分析') return

  const params = payload.params as { dataIndex?: number; axisValue?: string } | null
  if (!params) return

  const index =
    typeof params.dataIndex === 'number'
      ? params.dataIndex
      : ioWeek.labels.findIndex((label) => label === params.axisValue)

  if (index >= 0 && index < ioWeek.days.length) {
    ioDetail.value = ioWeek.days[index]
  }
}

/* =========================
   4. 质量分析：月度质量率（折线，废品率 / 焊补率 / 过程检验分析 切换）
   ========================= */
const qualityTabs = [
  { key: 'scrap', label: '废品率' },
  { key: 'weld', label: '焊补率' },
  { key: 'process', label: '过程检验分析' }
]
const activeQualityKey = ref<'scrap' | 'weld' | 'process'>('scrap')

const qualityMetrics: Record<
  'scrap' | 'weld' | 'process',
  { label: string; unit: '%'; color: string; data: number[] }
> = {
  scrap: {
    label: '废品率',
    unit: '%',
    color: '#ff4f8b',
    data: [1.4, 1.3, 1.2, 1.3, 1.1, 1.0, 1.1, 0.9, 1.0, 0.8, 0.9, 0.8]
  },
  weld: {
    label: '焊补率',
    unit: '%',
    color: '#ffd52a',
    data: [4.2, 4.0, 3.8, 3.9, 3.6, 3.4, 3.5, 3.2, 3.3, 3.0, 3.1, 2.9]
  },
  process: {
    label: '过程检验分析',
    unit: '%',
    color: '#4ee6a6',
    data: [96.2, 96.5, 96.8, 96.6, 97.1, 97.3, 97.2, 97.5, 97.4, 97.7, 97.8, 98.0]
  }
}

function createQualityOption(metricKey: 'scrap' | 'weld' | 'process'): EChartsOption {
  const metric = qualityMetrics[metricKey]
  const isPercentHigh = metricKey === 'process'

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.name}<br/>${metric.label}: ${item.value}%`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyCategories,
      boundaryGap: false,
      axisLabel: { ...axisLabel, interval: 1 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '%',
      nameTextStyle: axisNameStyle,
      axisLabel: { ...axisLabel, formatter: '{value}%' },
      ...(isPercentHigh ? { min: 94, max: 100 } : {}),
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: metric.label,
        type: 'line',
        data: metric.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: metric.color, width: 3 },
        itemStyle: { color: metric.color, borderColor: '#061821', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${metric.color}59` },
              { offset: 1, color: `${metric.color}05` }
            ]
          }
        },
        label: { show: true, position: 'top', color: '#dff8ff', fontSize: 9, formatter: '{c}%' }
      }
    ]
  }
}

const qualityOption = computed(() => createQualityOption(activeQualityKey.value))

/* =========================
   5. 成本分析：趋势（成本项下拉 + 柱状，元/吨）/ 占比（环形，总成本）
      与造型产线可视化成本模块一致
   ========================= */
const costTabs = [
  { key: 'trend', label: '趋势' },
  { key: 'share', label: '占比' }
]
const activeCostKey = ref<'trend' | 'share'>('trend')

/** 7 个成本项（元/吨），量级差距大，趋势视图一次看一项 */
const costItems = [
  { key: 'raw', label: '原材料', color: '#20cfff', base: 1980, spread: 110, seed: 11 },
  { key: 'aux', label: '辅助材料', color: '#4ee6a6', base: 156, spread: 22, seed: 22 },
  { key: 'energy', label: '燃动力费', color: '#ffd52a', base: 238, spread: 34, seed: 33 },
  { key: 'maint', label: '设备维修', color: '#9b8cff', base: 86, spread: 28, seed: 44 },
  { key: 'scrap', label: '废品损失', color: '#ff4f8b', base: 64, spread: 24, seed: 55 },
  { key: 'tool', label: '工具工装', color: '#ff9f43', base: 45, spread: 15, seed: 66 },
  { key: 'consum', label: '低值易耗', color: '#62e8ff', base: 22, spread: 8, seed: 77 }
]

const costItemTabs = costItems.map((item) => ({ key: item.key, label: item.label }))
const activeCostItemKey = ref('raw')

/** 各成本项 12 个月数据（元/吨），按 base ± spread 确定性生成 */
const costMonthlyData: Record<string, number[]> = Object.fromEntries(
  costItems.map((item) => [
    item.key,
    Array.from({ length: 12 }, (_, month) => {
      const seed = item.seed * 97 + (month + 1) * 31
      return item.base + ((seed * 13) % (item.spread * 2 + 1)) - item.spread
    })
  ])
)

/** 趋势：选中成本项的月度柱状图 */
function createCostTrendOption(itemKey: string): EChartsOption {
  const item = costItems.find((cost) => cost.key === itemKey) ?? costItems[0]
  const data = costMonthlyData[item.key]

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const point = list[0]
        if (!point) return ''
        return `${point.name}<br/>${item.label}: ${point.value} 元/吨`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyCategories,
      axisLabel: { ...axisLabel, interval: 1 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '元/吨',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: item.label,
        type: 'bar',
        data,
        barWidth: '48%',
        itemStyle: { color: item.color, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#a9c9d4', fontSize: 9 }
      }
    ]
  }
}

/** 占比：全年各成本项占比环形图，中心为月均总成本 */
function createCostShareOption(): EChartsOption {
  const totals = costItems.map((item) =>
    costMonthlyData[item.key].reduce((sum, value) => sum + value, 0)
  )
  const grandTotal = totals.reduce((sum, value) => sum + value, 0)
  const monthlyAvg = Math.round(grandTotal / 12)
  const format = (value: number) => value.toLocaleString('zh-CN')

  return {
    tooltip: {
      trigger: 'item',
      ...tooltipBase,
      formatter: (params: any) =>
        `${params.marker} ${params.name}<br/>全年累计: ${params.value} 元/吨 (${params.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 6,
      top: 'center',
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 9
    },
    series: [
      {
        type: 'pie',
        radius: ['46%', '68%'],
        center: ['34%', '52%'],
        data: costItems.map((item, index) => ({
          name: item.label,
          value: totals[index],
          itemStyle: { color: item.color }
        })),
        label: {
          show: true,
          position: 'center',
          formatter: `{total|${format(monthlyAvg)}}\n{sub|总成本 元/吨}`,
          rich: {
            total: { color: '#dff8ff', fontSize: 20, fontWeight: 'bold', lineHeight: 26 },
            sub: { color: '#a9c9d4', fontSize: 11, lineHeight: 16 }
          }
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#061821', borderWidth: 2 },
        emphasis: {
          label: { show: true, fontSize: 13 },
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(32, 207, 255, 0.55)' }
        }
      }
    ]
  }
}

const costOption = computed(() =>
  activeCostKey.value === 'trend'
    ? createCostTrendOption(activeCostItemKey.value)
    : createCostShareOption()
)

/** 成本分析面板：趋势带成本项次级下拉，占比仅主 tab */
const costPanel = computed(() => ({
  title: '成本分析',
  option: costOption.value,
  tabs: costTabs,
  activeKey: activeCostKey.value,
  ...(activeCostKey.value === 'trend'
    ? { subTabs: costItemTabs, subActiveKey: activeCostItemKey.value }
    : {})
}))

/* =========================
   6. 设备分析：月度设备指标（折线，MTTR / MTBF / 可动率 / 故障停机率 下拉切换）
      与造型产线可视化设备模块一致
   ========================= */
const equipmentTabs = [
  { key: 'mttr', label: 'MTTR' },
  { key: 'mtbf', label: 'MTBF' },
  { key: 'availability', label: '可动率' },
  { key: 'downtime', label: '主要生产设备故障停机率' }
]
const activeEquipmentKey = ref<'mttr' | 'mtbf' | 'availability' | 'downtime'>('mttr')

/**
 * 设备指标月度 mock：
 * MTTR / MTBF 为时间量（小时），可动率 / 故障停机率为百分比
 */
const equipmentMetrics: Record<
  'mttr' | 'mtbf' | 'availability' | 'downtime',
  { label: string; unit: '小时' | '%'; color: string; data: number[] }
> = {
  mttr: {
    label: 'MTTR',
    unit: '小时',
    color: '#ffd52a',
    data: [2.4, 2.3, 2.2, 2.1, 2.0, 2.1, 1.9, 1.8, 1.9, 1.7, 1.8, 1.6]
  },
  mtbf: {
    label: 'MTBF',
    unit: '小时',
    color: '#20cfff',
    data: [40, 42, 43, 45, 44, 47, 48, 50, 49, 52, 53, 55]
  },
  availability: {
    label: '可动率',
    unit: '%',
    color: '#4ee6a6',
    data: [92.1, 92.5, 93.0, 93.4, 93.2, 94.0, 94.3, 94.8, 94.5, 95.1, 95.4, 95.6]
  },
  downtime: {
    label: '主要生产设备故障停机率',
    unit: '%',
    color: '#ff4f8b',
    data: [3.4, 3.2, 3.0, 2.8, 2.9, 2.6, 2.5, 2.3, 2.4, 2.1, 2.0, 1.9]
  }
}

function createEquipmentOption(metricKey: 'mttr' | 'mtbf' | 'availability' | 'downtime'): EChartsOption {
  const metric = equipmentMetrics[metricKey]
  const isPercent = metric.unit === '%'

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.name}<br/>${metric.label}: ${item.value} ${metric.unit}`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyCategories,
      boundaryGap: false,
      axisLabel: { ...axisLabel, interval: 1 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: metric.unit,
      nameTextStyle: axisNameStyle,
      axisLabel: {
        ...axisLabel,
        ...(isPercent ? { formatter: '{value}%' } : {})
      },
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: metric.label,
        type: 'line',
        data: metric.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: metric.color, width: 3 },
        itemStyle: { color: metric.color, borderColor: '#061821', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${metric.color}59` },
              { offset: 1, color: `${metric.color}05` }
            ]
          }
        },
        label: {
          show: true,
          position: 'top',
          color: '#dff8ff',
          fontSize: 9,
          formatter: isPercent ? '{c}%' : '{c}'
        }
      }
    ]
  }
}

const equipmentOption = computed(() => createEquipmentOption(activeEquipmentKey.value))

/* =========================
   六宫格装配
   ========================= */
const panels = computed(() => {
  const heatPanel = {
    title: '热处理分析',
    tabs: heatTabs,
    activeKey: activeHeatTab.value
  }

  if (activeHeatTab.value === 'stats') {
    return [
      { title: '打箱分析', option: boxingOption },
      { ...heatPanel, option: heatStatsOption },
      { title: '出入库分析', option: ioOption },
      {
        title: '质量分析',
        option: qualityOption.value,
        tabs: qualityTabs,
        activeKey: activeQualityKey.value
      },
      costPanel.value,
      {
        title: '设备分析',
        option: equipmentOption.value,
        tabs: equipmentTabs,
        activeKey: activeEquipmentKey.value,
        mode: 'select' as const
      }
    ]
  }

  return [
    { title: '打箱分析', option: boxingOption },
    { ...heatPanel, contentKey: 'heatMonitor' },
    { title: '出入库分析', option: ioOption },
    {
      title: '质量分析',
      option: qualityOption.value,
      tabs: qualityTabs,
      activeKey: activeQualityKey.value
    },
    costPanel.value,
    {
      title: '设备分析',
      option: equipmentOption.value,
      tabs: equipmentTabs,
      activeKey: activeEquipmentKey.value,
      mode: 'select' as const
    }
  ]
})

/** 面板 tab 切换：热处理双视图，质量 / 设备 / 成本 */
function handleTabChange(payload: { title: string; key: string }) {
  if (payload.title === '热处理分析') {
    activeHeatTab.value = payload.key as HeatTabKey
  } else if (payload.title === '质量分析') {
    activeQualityKey.value = payload.key as 'scrap' | 'weld' | 'process'
  } else if (payload.title === '设备分析') {
    activeEquipmentKey.value = payload.key as 'mttr' | 'mtbf' | 'availability' | 'downtime'
  } else if (payload.title === '成本分析') {
    activeCostKey.value = payload.key as 'trend' | 'share'
  }
}

/** 次级下拉：成本分析趋势视图下的成本项 */
function handleSubChange(payload: { title: string; key: string }) {
  if (payload.title === '成本分析') {
    activeCostItemKey.value = payload.key
  }
}
</script>

<template>
  <LineDashboardShell
    title="清理产线可视化"
    :indicators="indicators"
    :panels="panels"
    @tab-change="handleTabChange"
    @sub-change="handleSubChange"
    @chart-click="handleChartClick"
  >
    <!-- 热处理分析：设备监控（生产统计走 ECharts option） -->
    <template #heatMonitor>
      <div class="heat-monitor">
        <div class="heat-legend">
          <span
            v-for="item in heatDeviceLegend"
            :key="item.status"
            class="heat-legend-item"
          >
            <i class="heat-dot" :style="{ background: heatStatusMeta[item.status].color }" />
            {{ heatStatusMeta[item.status].label }}
          </span>
        </div>

        <div class="heat-device-grid">
          <button
            v-for="device in heatDevices"
            :key="device.id"
            type="button"
            class="heat-device"
            :class="`status-${device.status}`"
            :title="`${device.name} · ${heatStatusMeta[device.status].label}`"
            @click="openHeatTask(device)"
          >
            <span class="heat-device-icon" aria-hidden="true">
              <!-- 热处理炉简化图标 -->
              <svg viewBox="0 0 48 48" width="36" height="36" fill="currentColor">
                <path
                  d="M10 14h28a2 2 0 012 2v20a4 4 0 01-4 4H12a4 4 0 01-4-4V16a2 2 0 012-2zm4 6v16h20V20H14zm6 4h8v3h-8v-3zm0 6h8v3h-8v-3z"
                />
                <path d="M18 8h12v4H18V8z" opacity=".85" />
                <path
                  d="M22 4c1.2 1.4 1.2 2.6 0 4-1.2-1.4-1.2-2.6 0-4z"
                  opacity=".7"
                />
              </svg>
            </span>
            <span class="heat-device-name">{{ device.name }}</span>
            <span
              class="heat-device-status"
              :style="{ color: heatStatusMeta[device.status].color }"
            >
              {{ heatStatusMeta[device.status].label }}
            </span>
          </button>
        </div>

        <p class="heat-hint">点击设备查看当前进行中的任务</p>
      </div>

      <a-modal
        v-model:open="heatTaskModalOpen"
        :title="activeHeatDevice?.name ?? '设备任务'"
        width="520px"
        :footer="null"
        centered
      >
        <div v-if="activeHeatDevice" class="heat-task-body">
          <div class="heat-task-status-row">
            <span
              class="heat-task-badge"
              :style="{
                color: heatStatusMeta[activeHeatDevice.status].color,
                borderColor: heatStatusMeta[activeHeatDevice.status].color,
                background: `${heatStatusMeta[activeHeatDevice.status].color}1a`
              }"
            >
              {{ heatStatusMeta[activeHeatDevice.status].label }}
            </span>
            <span class="heat-task-id">{{ activeHeatDevice.id.toUpperCase() }}</span>
          </div>

          <div class="heat-task-grid">
            <div class="heat-task-cell">
              <span class="heat-task-label">设备名称</span>
              <span class="heat-task-value">{{ activeHeatDevice.name }}</span>
            </div>
            <div class="heat-task-cell">
              <span class="heat-task-label">状态</span>
              <span class="heat-task-value">{{
                heatStatusMeta[activeHeatDevice.status].label
              }}</span>
            </div>
            <div class="heat-task-cell wide">
              <span class="heat-task-label">进行中任务</span>
              <span class="heat-task-value">
                {{ activeHeatDevice.task ?? '当前无进行中任务' }}
              </span>
            </div>
            <div v-if="activeHeatDevice.task" class="heat-task-cell wide">
              <span class="heat-task-label">任务进度</span>
              <div class="heat-task-progress">
                <div class="heat-task-progress-track">
                  <div
                    class="heat-task-progress-fill"
                    :style="{
                      width: `${activeHeatDevice.progress ?? 0}%`,
                      background: heatStatusMeta[activeHeatDevice.status].color
                    }"
                  />
                </div>
                <span class="heat-task-progress-text">
                  {{ activeHeatDevice.progress ?? 0 }}%
                </span>
              </div>
            </div>
            <div class="heat-task-cell">
              <span class="heat-task-label">操作人</span>
              <span class="heat-task-value">{{ activeHeatDevice.operator ?? '—' }}</span>
            </div>
            <div class="heat-task-cell">
              <span class="heat-task-label">开始时间</span>
              <span class="heat-task-value">{{ activeHeatDevice.startedAt ?? '—' }}</span>
            </div>
          </div>
        </div>
      </a-modal>
    </template>
  </LineDashboardShell>

  <!-- 出入库分析：点击日期节点 → 当日明细 -->
  <a-modal
    v-model:open="ioDetailOpen"
    :title="ioDetail ? `${ioDetail.label} 出入库明细` : '出入库明细'"
    width="640px"
    :footer="null"
    centered
  >
    <div v-if="ioDetail" class="io-detail-body">
      <div class="io-detail-summary">
        <div class="io-detail-stat inbound">
          <span class="io-detail-label">入库数量</span>
          <span class="io-detail-value">{{ ioDetail.inbound }}</span>
        </div>
        <div class="io-detail-stat outbound">
          <span class="io-detail-label">出库数量</span>
          <span class="io-detail-value">{{ ioDetail.outbound }}</span>
        </div>
        <div class="io-detail-stat balance">
          <span class="io-detail-label">净入库</span>
          <span class="io-detail-value">
            {{ ioDetail.inbound - ioDetail.outbound >= 0 ? '+' : '' }}
            {{ ioDetail.inbound - ioDetail.outbound }}
          </span>
        </div>
      </div>

      <div class="io-detail-meta">
        <span>日期：{{ ioDetail.fullDate }}</span>
        <span>口径：当日完工入库 / 出库台账</span>
      </div>

      <table class="io-detail-table">
        <thead>
          <tr>
            <th>产品系列</th>
            <th>入库数量</th>
            <th>出库数量</th>
            <th>净入库</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in ioDetail.rows" :key="row.product">
            <td>{{ row.product }}</td>
            <td class="num in">{{ row.inbound }}</td>
            <td class="num out">{{ row.outbound }}</td>
            <td class="num">
              {{ row.inbound - row.outbound >= 0 ? '+' : '' }}
              {{ row.inbound - row.outbound }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>合计</td>
            <td class="num in">{{ ioDetail.inbound }}</td>
            <td class="num out">{{ ioDetail.outbound }}</td>
            <td class="num">
              {{ ioDetail.inbound - ioDetail.outbound >= 0 ? '+' : '' }}
              {{ ioDetail.inbound - ioDetail.outbound }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </a-modal>
</template>

<style scoped>
/* 出入库明细弹窗 */
.io-detail-body {
  color: #dff8ff;
}

.io-detail-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.io-detail-stat {
  padding: 12px;
  text-align: center;
  background: rgba(6, 31, 42, 0.9);
  border: 1px solid rgba(0, 190, 235, 0.28);
  border-radius: 4px;
}

.io-detail-stat.inbound {
  border-color: rgba(32, 207, 255, 0.45);
}
.io-detail-stat.outbound {
  border-color: rgba(255, 159, 67, 0.45);
}

.io-detail-label {
  display: block;
  color: #a9c9d4;
  font-size: 12px;
  margin-bottom: 6px;
}

.io-detail-value {
  display: block;
  color: #ffd91a;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.io-detail-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #a9c9d4;
  font-size: 12px;
}

.io-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.io-detail-table th,
.io-detail-table td {
  padding: 9px 10px;
  border: 1px solid rgba(0, 190, 235, 0.22);
  text-align: left;
}

.io-detail-table th {
  background: rgba(0, 143, 184, 0.25);
  color: #dff8ff;
  font-weight: 600;
}

.io-detail-table td {
  background: rgba(6, 31, 42, 0.55);
  color: #dff8ff;
}

.io-detail-table tfoot td {
  background: rgba(0, 143, 184, 0.18);
  font-weight: 600;
}

.io-detail-table .num {
  font-variant-numeric: tabular-nums;
}

.io-detail-table .in {
  color: #20cfff;
}

.io-detail-table .out {
  color: #ff9f43;
}

/* 热处理设备监控 */
.heat-monitor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
}

.heat-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-shrink: 0;
}

.heat-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #a9c9d4;
  font-size: 12px;
}

.heat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}

.heat-device-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.heat-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  background: linear-gradient(180deg, rgba(0, 143, 184, 0.18), rgba(0, 80, 110, 0.12));
  border: 1px solid rgba(0, 191, 235, 0.28);
  color: #dff8ff;
}

.heat-device:hover {
  transform: translateY(-2px);
}

.heat-device.status-idle {
  border-color: rgba(255, 213, 42, 0.55);
  box-shadow: inset 0 0 18px rgba(255, 213, 42, 0.12);
}

.heat-device.status-idle:hover {
  box-shadow:
    inset 0 0 18px rgba(255, 213, 42, 0.16),
    0 0 10px rgba(255, 213, 42, 0.35);
}

.heat-device.status-running {
  border-color: rgba(78, 230, 166, 0.55);
  box-shadow: inset 0 0 18px rgba(78, 230, 166, 0.12);
}

.heat-device.status-running:hover {
  box-shadow:
    inset 0 0 18px rgba(78, 230, 166, 0.16),
    0 0 10px rgba(78, 230, 166, 0.35);
}

.heat-device.status-fault {
  border-color: rgba(255, 79, 139, 0.55);
  box-shadow: inset 0 0 18px rgba(255, 79, 139, 0.12);
}

.heat-device.status-fault:hover {
  box-shadow:
    inset 0 0 18px rgba(255, 79, 139, 0.16),
    0 0 10px rgba(255, 79, 139, 0.35);
}

.heat-device-icon {
  display: flex;
  color: inherit;
  opacity: 0.92;
}

.heat-device.status-idle .heat-device-icon {
  color: #ffd52a;
}
.heat-device.status-running .heat-device-icon {
  color: #4ee6a6;
}
.heat-device.status-fault .heat-device-icon {
  color: #ff4f8b;
}

.heat-device-name {
  font-size: 12px;
  letter-spacing: 0.5px;
  color: #dff8ff;
}

.heat-device-status {
  font-size: 11px;
  font-weight: 600;
}

.heat-hint {
  margin: 0;
  text-align: center;
  color: rgba(169, 201, 212, 0.65);
  font-size: 11px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

/* 任务弹窗 */
.heat-task-body {
  color: #dff8ff;
}

.heat-task-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.heat-task-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.heat-task-id {
  color: #a9c9d4;
  font-size: 12px;
  letter-spacing: 1px;
}

.heat-task-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.heat-task-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(6, 31, 42, 0.9);
  border: 1px solid rgba(0, 190, 235, 0.28);
  border-radius: 4px;
}

.heat-task-cell.wide {
  grid-column: 1 / -1;
}

.heat-task-label {
  color: #a9c9d4;
  font-size: 12px;
}

.heat-task-value {
  color: #dff8ff;
  font-size: 14px;
  word-break: break-all;
}

.heat-task-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.heat-task-progress-track {
  flex: 1;
  height: 8px;
  background: rgba(72, 164, 194, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.heat-task-progress-fill {
  height: 100%;
  border-radius: 4px;
}

.heat-task-progress-text {
  min-width: 36px;
  text-align: right;
  color: #ffd91a;
  font-size: 13px;
  font-weight: 600;
}
</style>
