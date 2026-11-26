<script setup lang="ts">
import { computed, ref } from 'vue'

import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import type { EChartsOption } from 'echarts'

/** 指标行：12 项，grid 六列自动排成两行（数值为 mock，待业务方确认） */
const indicators = [
  { label: '打箱完成率', value: '96.2', unit: '%', tone: 'output' },
  { label: '热处理完成率', value: '97.1', unit: '%', tone: 'inbound' },
  { label: '细清完成率', value: '95.4', unit: '%', tone: 'output' },
  { label: '内部废品率', value: '1.1', unit: '%', tone: 'inbound' },
  { label: '焊补率', value: '3.2', unit: '%', tone: 'output' },
  { label: '成品检验一次合格率', value: '97.8', unit: '%', tone: 'inbound' },
  { label: '设备可动率', value: '94.5', unit: '%', tone: 'output' },
  { label: '主要生产设备故障停机率', value: '2.4', unit: '%', tone: 'inbound' },
  { label: '人员排班率', value: '96.0', unit: '%', tone: 'output' },
  { label: '吨均制造成本', value: '186', unit: '元/吨', tone: 'inbound' },
  { label: '吨均用电量', value: '128', unit: 'kWh/吨', tone: 'output' },
  { label: '吨均粗清天然气用量', value: '12.6', unit: 'm³/吨', tone: 'inbound' }
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
   1. 打箱分析：近一周计划 / 实际箱数 + 完成率
      左轴箱数（柱），右轴完成率（折线），双纵轴
   ========================= */
/** 按日期确定性生成近一周计划 / 实际箱数与完成率，刷新不跳变 */
function mockBoxingWeek(): {
  plan: number[]
  actual: number[]
  rate: number[]
} {
  const base = 140
  const plan: number[] = []
  const actual: number[] = []
  const rate: number[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const seed = date.year() + date.month() * 31 + date.date()
    const planValue = base + ((seed * 13) % 25) - 12
    const factor = 0.9 + ((seed * 7) % 15) / 100
    const actualValue = Math.round(planValue * factor)
    plan.push(planValue)
    actual.push(actualValue)
    rate.push(Number(((actualValue / planValue) * 100).toFixed(1)))
  }
  return { plan, actual, rate }
}

const boxingOption: EChartsOption = (() => {
  const { plan, actual, rate } = mockBoxingWeek()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const body = list
          .map((item: any) => {
            const unit = item.seriesName === '完成率' ? '%' : ' 箱'
            return `${item.marker} ${item.seriesName}: ${item.value}${unit}`
          })
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: ['计划箱数', '实际箱数', '完成率'],
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
    yAxis: [
      {
        type: 'value',
        name: '箱数',
        nameTextStyle: axisNameStyle,
        axisLabel,
        splitLine,
        axisLine: { show: false },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '完成率',
        min: 80,
        max: 110,
        interval: 10,
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabel, formatter: '{value}%' },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false }
      }
    ],
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
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: rate,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: COLOR_RATE, width: 3 },
        itemStyle: { color: COLOR_RATE, borderColor: '#061821', borderWidth: 2 },
        label: {
          show: true,
          position: 'top',
          color: '#ffd91a',
          fontSize: 9,
          formatter: '{c}%'
        }
      }
    ]
  }
})()

/* =========================
   2. 热处理分析：双 tab（任务监控 / 生产统计）
   ========================= */
type HeatTabKey = 'monitor' | 'stats'
const heatTabs: { key: HeatTabKey; label: string }[] = [
  { key: 'monitor', label: '任务监控' },
  { key: 'stats', label: '生产统计' }
]
const activeHeatTab = ref<HeatTabKey>('monitor')

/** 任务状态：任务中绿 / 空闲黄 */
type HeatDeviceStatus = 'idle' | 'running'
const heatStatusMeta: Record<
  HeatDeviceStatus,
  { label: string; color: string; glow: string }
> = {
  idle: { label: '空闲', color: '#ffd52a', glow: 'rgba(255, 213, 42, 0.45)' },
  running: { label: '任务中', color: '#4ee6a6', glow: 'rgba(78, 230, 166, 0.45)' }
}

interface HeatDevice {
  id: string
  name: string
  status: HeatDeviceStatus
  /** 进行中任务；空闲可为空 */
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
    status: 'idle',
    task: null
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
  { status: 'running' as HeatDeviceStatus },
  { status: 'idle' as HeatDeviceStatus }
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

/** 热处理进窑明细 mock 行（按设备点击时过滤） */
interface HeatTaskRow {
  deviceId: string
  batch: string
  furnace: string
  partNo: string
  qty: number
  dateNo: string
  serialNo: string
  station: string
  enterTime: string
  operator: string
}

const heatTaskRows: HeatTaskRow[] = [
  {
    deviceId: 'ht-1',
    batch: 'B260915-A12',
    furnace: '1# 退火炉',
    partNo: '612600013542R',
    qty: 48,
    dateNo: '260915',
    serialNo: 'XS2609150012',
    station: 'A01',
    enterTime: '08:30',
    operator: '王强'
  },
  {
    deviceId: 'ht-1',
    batch: 'B260915-A13',
    furnace: '1# 退火炉',
    partNo: '612600013601R',
    qty: 36,
    dateNo: '260915',
    serialNo: 'XS2609150018',
    station: 'A02',
    enterTime: '10:15',
    operator: '王强'
  },
  {
    deviceId: 'ht-2',
    batch: 'B260915-C07',
    furnace: '2# 退火炉',
    partNo: '612600014018R',
    qty: 52,
    dateNo: '260915',
    serialNo: 'XS2609150021',
    station: 'B01',
    enterTime: '10:05',
    operator: '李敏'
  },
  {
    deviceId: 'ht-2',
    batch: 'B260915-C08',
    furnace: '2# 退火炉',
    partNo: '612600014122R',
    qty: 28,
    dateNo: '260915',
    serialNo: 'XS2609150027',
    station: 'B02',
    enterTime: '13:40',
    operator: '李敏'
  },
  {
    deviceId: 'ht-3',
    batch: 'B260914-D02',
    furnace: '3# 正火炉',
    partNo: '612600015203R',
    qty: 40,
    dateNo: '260914',
    serialNo: 'XS2609140009',
    station: 'C01',
    enterTime: '09:20',
    operator: '陈晨'
  },
  {
    deviceId: 'ht-4',
    batch: 'B260914-E05',
    furnace: '4# 正火炉',
    partNo: '612600015330R',
    qty: 32,
    dateNo: '260914',
    serialNo: 'XS2609140014',
    station: 'C02',
    enterTime: '11:05',
    operator: '刘洋'
  },
  {
    deviceId: 'ht-5',
    batch: 'B260914-H03',
    furnace: '5# 回火炉',
    partNo: '612600016044R',
    qty: 60,
    dateNo: '260914',
    serialNo: 'XS2609140022',
    station: 'D01',
    enterTime: '06:50',
    operator: '赵磊'
  },
  {
    deviceId: 'ht-5',
    batch: 'B260915-H04',
    furnace: '5# 回火炉',
    partNo: '612600016109R',
    qty: 44,
    dateNo: '260915',
    serialNo: 'XS2609150033',
    station: 'D02',
    enterTime: '14:10',
    operator: '赵磊'
  },
  {
    deviceId: 'ht-6',
    batch: 'B260913-J01',
    furnace: '6# 回火炉',
    partNo: '612600017088R',
    qty: 30,
    dateNo: '260913',
    serialNo: 'XS2609130016',
    station: 'E01',
    enterTime: '15:30',
    operator: '孙凯'
  }
]

/** 当前设备的进窑明细行 */
const heatTaskDetailRows = computed(() => {
  if (!activeHeatDevice.value) return []
  return heatTaskRows.filter((row) => row.deviceId === activeHeatDevice.value!.id)
})

function closeHeatTask() {
  activeHeatDevice.value = null
}

/** 生产统计：近 7 天计划 / 实际数 + 完成率（左轴数量柱，右轴完成率折线） */
function mockHeatWeek(): {
  plan: number[]
  actual: number[]
  rate: number[]
} {
  const base = 130
  const plan: number[] = []
  const actual: number[] = []
  const rate: number[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const seed = date.year() + date.month() * 31 + date.date()
    const planValue = base + ((seed * 11) % 23) - 11
    const factor = 0.91 + ((seed * 5) % 14) / 100
    const actualValue = Math.round(planValue * factor)
    plan.push(planValue)
    actual.push(actualValue)
    rate.push(Number(((actualValue / planValue) * 100).toFixed(1)))
  }
  return { plan, actual, rate }
}

const heatStatsOption: EChartsOption = (() => {
  const { plan, actual, rate } = mockHeatWeek()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const body = list
          .map((item: any) => {
            const unit = item.seriesName === '完成率' ? '%' : ''
            return `${item.marker} ${item.seriesName}: ${item.value}${unit}`
          })
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: ['计划数', '实际数', '完成率'],
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
    yAxis: [
      {
        type: 'value',
        name: '数量',
        nameTextStyle: axisNameStyle,
        axisLabel,
        splitLine,
        axisLine: { show: false },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '完成率',
        min: 80,
        max: 110,
        interval: 10,
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabel, formatter: '{value}%' },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false }
      }
    ],
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
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: rate,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: COLOR_RATE, width: 3 },
        itemStyle: { color: COLOR_RATE, borderColor: '#061821', borderWidth: 2 },
        label: {
          show: true,
          position: 'top',
          color: '#ffd91a',
          fontSize: 9,
          formatter: '{c}%'
        }
      }
    ]
  }
})()

/* =========================
   3. 出入库分析：近 7 天双轴折线（左入库 / 右出库），点击日期节点看当日明细
   ========================= */
const COLOR_IO_IN = '#20cfff'
const COLOR_IO_OUT = '#ff9f43'

/** 出入库单据明细行 */
interface IoDocRow {
  orderNo: string
  type: '入库' | '出库'
  partNo: string
  partName: string
  dateNo: string
  serialNo: string
  createTime: string
}

interface IoDayDetail {
  label: string
  fullDate: string
  inbound: number
  outbound: number
  rows: IoDocRow[]
}

/** 毛坯件号/名称 mock 池 */
const ioBlankPool = [
  { partNo: '612600013542R', partName: '缸体毛坯' },
  { partNo: '612600014018R', partName: '曲轴毛坯' },
  { partNo: '612600015203R', partName: '缸盖毛坯' },
  { partNo: '612600016044R', partName: '机体毛坯' },
  { partNo: '612600017088R', partName: '飞轮壳毛坯' },
  { partNo: '612600018120R', partName: '油底壳毛坯' }
]

/** 按日期确定性生成近 7 天入库 / 出库与单据明细，刷新不跳变 */
function mockIoWeek(): {
  labels: string[]
  inbound: number[]
  outbound: number[]
  days: IoDayDetail[]
} {
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

    const rows = buildIoDocRows(date, inValue, outValue, seed)

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

/** 生成当日出入库单据明细（入库 + 出库，按毛坯池轮转） */
function buildIoDocRows(
  date: Dayjs,
  inboundQty: number,
  outboundQty: number,
  seed: number
): IoDocRow[] {
  const dateNo = date.format('YYMMDD')
  const rows: IoDocRow[] = []
  const types: Array<'入库' | '出库'> = ['入库', '出库']
  const totalDocs = 6 + ((seed * 13) % 4) // 6~9 条

  for (let i = 0; i < totalDocs; i++) {
    const type = types[i % 2]
    const blank = ioBlankPool[(seed + i * 3) % ioBlankPool.length]
    const serial = `XS${dateNo}${String(((seed * 7 + i * 11) % 9000) + 1000)}`
    const hour = String(8 + (i % 10)).padStart(2, '0')
    const minute = String((seed * 5 + i * 17) % 60).padStart(2, '0')
    const orderPrefix = type === '入库' ? 'IN' : 'OUT'
    const orderNo = `${orderPrefix}${dateNo}${String(((seed + i * 5) % 900) + 100)}`

    rows.push({
      orderNo,
      type,
      partNo: blank.partNo,
      partName: blank.partName,
      dateNo,
      serialNo: serial,
      createTime: `${date.format('YYYY-MM-DD')} ${hour}:${minute}`
    })
  }

  // 保证当日有入库、出库单；数量字段仅用于图例汇总，不进表
  void inboundQty
  void outboundQty
  return rows
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

function closeIoDetail() {
  ioDetail.value = null
}

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
   4. 质量分析：月度质量率（折线，废品率 / 焊补率 / 成品检验一次合格率 切换）
   ========================= */
const qualityTabs = [
  { key: 'scrap', label: '废品率' },
  { key: 'weld', label: '焊补率' },
  { key: 'process', label: '成品检验一次合格率' }
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
    label: '成品检验一次合格率',
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
    <!-- 热处理分析：任务监控（生产统计走 ECharts option） -->
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

        <p class="heat-hint">点击设备查看当前任务详情</p>
      </div>
    </template>
  </LineDashboardShell>

  <!-- 热处理详情弹框：与造型班组「计划详情」FUI 风格一致 -->
  <Teleport to="body">
    <div
      v-if="heatTaskModalOpen && activeHeatDevice"
      class="heat-detail-mask"
      @click.self="closeHeatTask"
    >
      <div
        class="heat-detail"
        role="dialog"
        aria-modal="true"
        :aria-label="`${activeHeatDevice.name}热处理详情`"
      >
        <div class="heat-detail-corner tl"></div>
        <div class="heat-detail-corner tr"></div>
        <div class="heat-detail-corner bl"></div>
        <div class="heat-detail-corner br"></div>

        <button
          type="button"
          class="heat-detail-close"
          aria-label="关闭"
          @click="closeHeatTask"
        >
          ×
        </button>

        <div class="heat-detail-header">
          <h3 class="heat-detail-title">{{ activeHeatDevice.name }}热处理详情</h3>
        </div>

        <div class="heat-detail-body">
          <div class="heat-detail-meta">
            <span
              class="heat-detail-badge"
              :style="{
                color: heatStatusMeta[activeHeatDevice.status].color,
                borderColor: heatStatusMeta[activeHeatDevice.status].color,
                background: `${heatStatusMeta[activeHeatDevice.status].color}1a`
              }"
            >
              {{ heatStatusMeta[activeHeatDevice.status].label }}
            </span>
            <span>设备编号：{{ activeHeatDevice.id.toUpperCase() }}</span>
            <span>共 {{ heatTaskDetailRows.length }} 条进窑记录</span>
          </div>

          <div class="heat-detail-table-wrap">
            <table class="inbound-modal-table">
              <thead>
                <tr>
                  <th>批次</th>
                  <th>窑炉名称</th>
                  <th>毛坯件号</th>
                  <th>毛坯数量</th>
                  <th>日期号</th>
                  <th>流水号</th>
                  <th>工位</th>
                  <th>进窑时间</th>
                  <th>进窑操作人</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in heatTaskDetailRows"
                  :key="`${row.batch}-${row.serialNo}`"
                >
                  <td>{{ row.batch }}</td>
                  <td>{{ row.furnace }}</td>
                  <td>{{ row.partNo }}</td>
                  <td class="num">{{ row.qty }}</td>
                  <td>{{ row.dateNo }}</td>
                  <td>{{ row.serialNo }}</td>
                  <td>{{ row.station }}</td>
                  <td>{{ row.enterTime }}</td>
                  <td>{{ row.operator }}</td>
                </tr>
              </tbody>
              <tfoot v-if="heatTaskDetailRows.length">
                <tr>
                  <td colspan="3">合计</td>
                  <td class="num">
                    {{
                      heatTaskDetailRows.reduce((sum, row) => sum + row.qty, 0)
                    }}
                  </td>
                  <td colspan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p v-if="!heatTaskDetailRows.length" class="heat-detail-empty">
            当前无进窑任务记录
          </p>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 出入库明细弹框：与热处理详情 / 计划详情 FUI 风格一致 -->
  <Teleport to="body">
    <div
      v-if="ioDetailOpen && ioDetail"
      class="io-detail-mask"
      @click.self="closeIoDetail"
    >
      <div
        class="io-detail"
        role="dialog"
        aria-modal="true"
        aria-label="出入库明细"
      >
        <div class="io-detail-corner tl"></div>
        <div class="io-detail-corner tr"></div>
        <div class="io-detail-corner bl"></div>
        <div class="io-detail-corner br"></div>

        <button
          type="button"
          class="io-detail-close"
          aria-label="关闭"
          @click="closeIoDetail"
        >
          ×
        </button>

        <div class="io-detail-header">
          <h3 class="io-detail-title">出入库明细</h3>
        </div>

        <div class="io-detail-body">
          <div class="io-detail-meta">
            <span>日期：{{ ioDetail.fullDate }}</span>
            <span>共 {{ ioDetail.rows.length }} 条单据</span>
          </div>

          <div class="io-detail-table-wrap">
            <table class="inbound-modal-table">
              <thead>
                <tr>
                  <th>出入库单号</th>
                  <th>出入库类型</th>
                  <th>毛坯件号</th>
                  <th>毛坯名称</th>
                  <th>日期号</th>
                  <th>流水号</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ioDetail.rows" :key="row.orderNo">
                  <td>{{ row.orderNo }}</td>
                  <td>
                    <span
                      class="io-type-tag"
                      :class="row.type === '入库' ? 'in' : 'out'"
                    >
                      {{ row.type }}
                    </span>
                  </td>
                  <td>{{ row.partNo }}</td>
                  <td>{{ row.partName }}</td>
                  <td>{{ row.dateNo }}</td>
                  <td>{{ row.serialNo }}</td>
                  <td>{{ row.createTime }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!ioDetail.rows.length" class="io-detail-empty">
            当前无出入库单据记录
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style src="./dashboard-common.css"></style>
<style scoped>
/* 热处理任务监控 */
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

/* 热处理详情弹框 meta（Teleport 前内容仍在组件内渲染时用；实际弹框在全局 style） */
.heat-detail-meta-scope {
  display: flex;
  gap: 12px;
}
</style>

<!-- 热处理详情弹框：Teleport 到 body，FUI 风格与造型班组计划详情一致 -->
<style>
.heat-detail-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(2, 12, 18, 0.72);
  backdrop-filter: blur(2px);
}

.heat-detail {
  position: relative;
  width: min(1040px, 94vw);
  max-height: min(86vh, 780px);
  display: flex;
  flex-direction: column;
  color: #dff8ff;
  background:
    linear-gradient(180deg, rgba(8, 48, 72, 0.96), rgba(4, 24, 36, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(0, 180, 230, 0.18), transparent 55%);
  border: 1px solid rgba(0, 210, 255, 0.75);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(0, 120, 180, 0.25),
    0 0 28px rgba(0, 190, 255, 0.28),
    inset 0 0 40px rgba(0, 100, 150, 0.12);
}

.heat-detail::before,
.heat-detail::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 2px;
  pointer-events: none;
}

.heat-detail::before {
  top: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  box-shadow: 0 0 10px rgba(24, 210, 255, 0.85);
}

.heat-detail::after {
  bottom: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  opacity: 0.55;
}

.heat-detail-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  border-color: #43e5ff;
  border-style: solid;
  z-index: 1;
}

.heat-detail-corner.tl {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.heat-detail-corner.tr {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.heat-detail-corner.bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}

.heat-detail-corner.br {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

.heat-detail-close {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(0, 200, 240, 0.45);
  border-radius: 2px;
  background: rgba(0, 80, 120, 0.35);
  color: #dff8ff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.heat-detail-close:hover {
  background: rgba(0, 160, 210, 0.4);
  border-color: #43e5ff;
}

.heat-detail-header {
  flex: 0 0 auto;
  padding: 16px 48px 12px 20px;
  border-bottom: 1px solid rgba(0, 190, 235, 0.28);
}

.heat-detail-title {
  margin: 0;
  color: #f4fdff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
}

.heat-detail-title::after {
  content: '';
  display: block;
  width: 48px;
  height: 2px;
  margin-top: 8px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.55);
}

.heat-detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 18px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.heat-detail-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.heat-detail-body::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.heat-detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #a9c9d4;
  font-size: 12px;
}

.heat-detail-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  margin-right: auto;
}

.heat-detail-table-wrap {
  overflow: auto;
  border: 1px solid rgba(0, 190, 235, 0.22);
  border-radius: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.heat-detail-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.heat-detail-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.heat-detail .inbound-modal-table tfoot td {
  background: rgba(0, 143, 184, 0.22) !important;
  color: #f4fdff !important;
  font-weight: 700 !important;
  border-top: 1px solid rgba(0, 200, 240, 0.35) !important;
}

.heat-detail-empty {
  margin: 16px 0 0;
  text-align: center;
  color: rgba(169, 201, 212, 0.72);
  font-size: 13px;
}

/* 出入库明细弹框：与热处理详情同源 FUI 风格 */
.io-detail-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(2, 12, 18, 0.72);
  backdrop-filter: blur(2px);
}

.io-detail {
  position: relative;
  width: min(980px, 94vw);
  max-height: min(86vh, 780px);
  display: flex;
  flex-direction: column;
  color: #dff8ff;
  background:
    linear-gradient(180deg, rgba(8, 48, 72, 0.96), rgba(4, 24, 36, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(0, 180, 230, 0.18), transparent 55%);
  border: 1px solid rgba(0, 210, 255, 0.75);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(0, 120, 180, 0.25),
    0 0 28px rgba(0, 190, 255, 0.28),
    inset 0 0 40px rgba(0, 100, 150, 0.12);
}

.io-detail::before,
.io-detail::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 2px;
  pointer-events: none;
}

.io-detail::before {
  top: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  box-shadow: 0 0 10px rgba(24, 210, 255, 0.85);
}

.io-detail::after {
  bottom: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  opacity: 0.55;
}

.io-detail-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  border-color: #43e5ff;
  border-style: solid;
  z-index: 1;
}

.io-detail-corner.tl {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.io-detail-corner.tr {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.io-detail-corner.bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}

.io-detail-corner.br {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

.io-detail-close {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(0, 200, 240, 0.45);
  border-radius: 2px;
  background: rgba(0, 80, 120, 0.35);
  color: #dff8ff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.io-detail-close:hover {
  background: rgba(0, 160, 210, 0.4);
  border-color: #43e5ff;
}

.io-detail-header {
  flex: 0 0 auto;
  padding: 16px 48px 12px 20px;
  border-bottom: 1px solid rgba(0, 190, 235, 0.28);
}

.io-detail-title {
  margin: 0;
  color: #f4fdff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
}

.io-detail-title::after {
  content: '';
  display: block;
  width: 48px;
  height: 2px;
  margin-top: 8px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.55);
}

.io-detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 18px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.io-detail-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.io-detail-body::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.io-detail-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #a9c9d4;
  font-size: 12px;
}

.io-detail-table-wrap {
  overflow: auto;
  border: 1px solid rgba(0, 190, 235, 0.22);
  border-radius: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.io-detail-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.io-detail-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.io-type-tag {
  display: inline-block;
  min-width: 42px;
  padding: 1px 8px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.io-type-tag.in {
  color: #20cfff;
  border-color: rgba(32, 207, 255, 0.55);
  background: rgba(32, 207, 255, 0.12);
}

.io-type-tag.out {
  color: #ff9f43;
  border-color: rgba(255, 159, 67, 0.55);
  background: rgba(255, 159, 67, 0.12);
}

.io-detail-empty {
  margin: 16px 0 0;
  text-align: center;
  color: rgba(169, 201, 212, 0.72);
  font-size: 13px;
}
</style>
