<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'

import dayjs from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import type { EChartsOption } from 'echarts'

/** 标题栏班组：左右各两个，可点击切换；各班组内容一致 */
const teamGroups = {
  left: ['大机', '曲轴'],
  right: ['新产品', '机体']
} as const

const allTeams = [...teamGroups.left, ...teamGroups.right] as const
type TeamName = (typeof allTeams)[number]

const activeTeam = ref<TeamName>('大机')

function selectTeam(name: TeamName) {
  activeTeam.value = name
}

/** 指标栏：6 项指标（数值为 mock，各班组内容一致） */
const indicators = [
  { label: '计划数', value: '128', unit: '箱', tone: 'output' as const },
  { label: '造型数', value: '116', unit: '箱', tone: 'inbound' as const },
  { label: '浇筑数', value: '108', unit: '箱', tone: 'output' as const },
  { label: '转运数', value: '104', unit: '箱', tone: 'output' as const },
  { label: '出产吨位', value: '98.6', unit: '吨', tone: 'inbound' as const },
  { label: '下芯数', value: '86', unit: '件', tone: 'inbound' as const }
]

/** 任务列表 mock（各班组共用同一套数据） */
interface TaskCardItem {
  blankNo: string
  blankName: string
  planBoxes: number
  fixtureCount: number
  flaskCount: number
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
  { blankNo: '1002380677R', blankName: '气缸盖毛坯', planBoxes: 6, fixtureCount: 2, flaskCount: 6, line: '机体线', status: '未开始', taskType: '普通类' },
  { blankNo: '1000000244R', blankName: '主轴承盖', planBoxes: 24, fixtureCount: 4, flaskCount: 24, line: '机体线', status: '未开始', taskType: '参数变更类' },
  { blankNo: '1002381102R', blankName: '气缸体毛坯', planBoxes: 12, fixtureCount: 3, flaskCount: 12, line: '大机线', status: '生产中', taskType: '普通类' },
  { blankNo: '1001560088R', blankName: '曲轴箱盖', planBoxes: 18, fixtureCount: 3, flaskCount: 18, line: '曲轴线', status: '生产中', taskType: '验证类' },
  { blankNo: '1004420015R', blankName: '新产品壳体', planBoxes: 9, fixtureCount: 2, flaskCount: 9, line: '新产品线', status: '暂停', taskType: '临脱+验证' },
  { blankNo: '1002380901R', blankName: '气缸盖毛坯', planBoxes: 15, fixtureCount: 3, flaskCount: 15, line: '机体线', status: '完成', taskType: '普通类' },
  { blankNo: '1000000311R', blankName: '主轴承盖', planBoxes: 30, fixtureCount: 5, flaskCount: 30, line: '机体线', status: '未开始', taskType: '挑选类' },
  { blankNo: '1001560120R', blankName: '连杆盖', planBoxes: 22, fixtureCount: 4, flaskCount: 22, line: '曲轴线', status: '生产中', taskType: '普通类' },
  { blankNo: '1004420040R', blankName: '支架毛坯', planBoxes: 11, fixtureCount: 2, flaskCount: 11, line: '新产品线', status: '异常结束', taskType: '参数变更类' },
  { blankNo: '1002381205R', blankName: '气缸体毛坯', planBoxes: 20, fixtureCount: 4, flaskCount: 20, line: '大机线', status: '未开始', taskType: '验证类' },
  { blankNo: '1000000455R', blankName: '轴承座', planBoxes: 16, fixtureCount: 3, flaskCount: 16, line: '机体线', status: '完成', taskType: '普通类' },
  { blankNo: '1001560177R', blankName: '飞轮壳', planBoxes: 8, fixtureCount: 2, flaskCount: 8, line: '曲轴线', status: '暂停', taskType: '临脱+验证' },
  { blankNo: '1004420062R', blankName: '端盖毛坯', planBoxes: 14, fixtureCount: 3, flaskCount: 14, line: '新产品线', status: '生产中', taskType: '挑选类' },
  { blankNo: '1002381310R', blankName: '气缸盖毛坯', planBoxes: 26, fixtureCount: 5, flaskCount: 26, line: '机体线', status: '异常结束', taskType: '普通类' }
])

/** 造型追溯卡片（各班组共用 mock；时间未到的工序显示 —） */
interface TraceCardItem {
  blankNo: string
  blankName: string
  productSeries: string
  startTime: string
  drawTime: string
  coreSetTime: string
  closeTime: string
  pourTime: string
}

const traceList = ref<TraceCardItem[]>([
  { blankNo: '1002380677R', blankName: '气缸盖毛坯', productSeries: '机体系列', startTime: '2025-11-18 08:12:30', drawTime: '2025-11-18 09:05:16', coreSetTime: '2025-11-18 09:48:02', closeTime: '2025-11-18 10:36:44', pourTime: '2025-11-18 11:20:08' },
  { blankNo: '1000000244R', blankName: '主轴承盖', productSeries: '机体系列', startTime: '2025-11-18 08:30:11', drawTime: '2025-11-18 09:22:40', coreSetTime: '2025-11-18 10:05:27', closeTime: '2025-11-18 10:58:19', pourTime: '2025-11-18 11:45:03' },
  { blankNo: '1002381102R', blankName: '气缸体毛坯', productSeries: '大机系列', startTime: '2025-11-18 08:05:52', drawTime: '2025-11-18 09:18:07', coreSetTime: '2025-11-18 10:02:55', closeTime: '2025-11-18 10:51:33', pourTime: '' },
  { blankNo: '1001560088R', blankName: '曲轴箱盖', productSeries: '曲轴系列', startTime: '2025-11-18 08:41:25', drawTime: '2025-11-18 09:36:48', coreSetTime: '2025-11-18 10:14:12', closeTime: '', pourTime: '' },
  { blankNo: '1004420015R', blankName: '新产品壳体', productSeries: '新产品系列', startTime: '2025-11-18 09:02:06', drawTime: '2025-11-18 09:55:31', coreSetTime: '', closeTime: '', pourTime: '' },
  { blankNo: '1002380901R', blankName: '气缸盖毛坯', productSeries: '机体系列', startTime: '2025-11-17 14:20:18', drawTime: '2025-11-17 15:11:09', coreSetTime: '2025-11-17 15:54:47', closeTime: '2025-11-17 16:40:22', pourTime: '2025-11-17 17:18:56' },
  { blankNo: '1000000311R', blankName: '主轴承盖', productSeries: '机体系列', startTime: '2025-11-17 15:05:44', drawTime: '2025-11-17 15:58:20', coreSetTime: '2025-11-17 16:39:15', closeTime: '', pourTime: '' },
  { blankNo: '1001560120R', blankName: '连杆盖', productSeries: '曲轴系列', startTime: '2025-11-17 16:10:03', drawTime: '2025-11-17 17:01:38', coreSetTime: '2025-11-17 17:42:51', closeTime: '2025-11-17 18:25:09', pourTime: '2025-11-17 19:03:44' },
  { blankNo: '1004420040R', blankName: '支架毛坯', productSeries: '新产品系列', startTime: '2025-11-17 16:48:27', drawTime: '', coreSetTime: '', closeTime: '', pourTime: '' },
  { blankNo: '1002381205R', blankName: '气缸体毛坯', productSeries: '大机系列', startTime: '2025-11-16 08:15:40', drawTime: '2025-11-16 09:09:12', coreSetTime: '2025-11-16 09:51:36', closeTime: '2025-11-16 10:38:55', pourTime: '2025-11-16 11:22:17' },
  { blankNo: '1000000455R', blankName: '轴承座', productSeries: '机体系列', startTime: '2025-11-16 09:22:58', drawTime: '2025-11-16 10:14:05', coreSetTime: '2025-11-16 10:56:49', closeTime: '2025-11-16 11:41:23', pourTime: '2025-11-16 12:20:08' },
  { blankNo: '1001560177R', blankName: '飞轮壳', productSeries: '曲轴系列', startTime: '2025-11-16 10:08:33', drawTime: '2025-11-16 10:59:47', coreSetTime: '2025-11-16 11:40:21', closeTime: '', pourTime: '' },
  { blankNo: '1004420062R', blankName: '端盖毛坯', productSeries: '新产品系列', startTime: '2025-11-16 13:35:16', drawTime: '2025-11-16 14:26:52', coreSetTime: '2025-11-16 15:08:30', closeTime: '2025-11-16 15:49:11', pourTime: '2025-11-16 16:31:04' },
  { blankNo: '1002381310R', blankName: '气缸盖毛坯', productSeries: '机体系列', startTime: '2025-11-15 08:02:49', drawTime: '2025-11-15 08:54:13', coreSetTime: '2025-11-15 09:37:28', closeTime: '2025-11-15 10:22:40', pourTime: '2025-11-15 11:05:19' }
])

const taskListEl = ref<HTMLElement | null>(null)
const traceListEl = ref<HTMLElement | null>(null)
let taskScrollTimer: ReturnType<typeof setInterval> | null = null
let traceScrollTimer: ReturnType<typeof setInterval> | null = null
let taskHoverPaused = false
let traceHoverPaused = false

/** 数据过多时自动上下滚动；悬停暂停 */
function startScroll(elRef: typeof taskListEl, paused: () => boolean): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const el = elRef.value
    if (!el || paused()) return
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
function onTraceEnter() { traceHoverPaused = true }
function onTraceLeave() { traceHoverPaused = false }

onMounted(() => {
  taskScrollTimer = startScroll(taskListEl, () => taskHoverPaused)
  traceScrollTimer = startScroll(traceListEl, () => traceHoverPaused)
})

onBeforeUnmount(() => {
  stopScroll(taskScrollTimer)
  stopScroll(traceScrollTimer)
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
const pourDates = Array.from({ length: 7 }, (_, index) =>
  todayStart.subtract(6 - index, 'day').format('MM-DD')
)

/** 按日期确定性生成近一周浇筑吨位，刷新不跳变 */
function mockPourTons(): number[] {
  return pourDates.map((_, index) => {
    const date = todayStart.subtract(6 - index, 'day')
    const seed = date.year() + date.month() * 31 + date.date() + 23
    return 86 + ((seed * 13) % 41)
  })
}

/** 浇筑吨位统计：横轴日期，纵轴吨位，柱状图 */
const pourTonsOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const body = list
        .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value} 吨`)
        .join('<br/>')
      return `${list[0]?.axisValue ?? ''}<br/>${body}`
    }
  },
  grid: { left: '4%', right: '5%', bottom: '4%', top: '14%', containLabel: true },
  xAxis: {
    type: 'category',
    data: pourDates,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '吨',
    nameTextStyle: axisNameStyle,
    axisLabel,
    splitLine,
    axisLine: { show: false },
    axisTick: { show: false }
  },
  series: [
    {
      name: '浇筑吨位',
      type: 'bar',
      data: mockPourTons(),
      barWidth: '36%',
      itemStyle: {
        color: '#20cfff',
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: '#dff8ff', fontSize: 10 }
    }
  ]
}

/** 六宫格：首格为任务列表，浇筑吨位为柱状图，其余占位 */
const productionTrendOption: EChartsOption = {
  tooltip: { trigger: 'axis', ...tooltipBase },
  legend: { data: ['计划数', '造型数', '合箱数', '浇筑数', '转运数'], textStyle: { color: '#a9c9d4' }, top: 4 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    data: pourDates,
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
  series: ['计划数', '造型数', '合箱数', '浇筑数', '转运数'].map((name, index) => ({
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

/* =========================
   不合格品分析：返工 / 返修 / 报废 / 回用，横向条形图
   ========================= */
type NgTabKey = 'rework' | 'repair' | 'scrap' | 'reuse'

const ngTabs = [
  { key: 'rework', label: '返工' },
  { key: 'repair', label: '返修' },
  { key: 'scrap', label: '报废' },
  { key: 'reuse', label: '回用' }
] as const

const activeNgKey = ref<NgTabKey>('rework')

/** 各类型下按毛坯件号的数量 mock（降序排列，便于横向条形阅读） */
const ngMetrics: Record<
  NgTabKey,
  { color: string; items: { blankNo: string; count: number }[] }
> = {
  rework: {
    color: '#20cfff',
    items: [
      { blankNo: '1002380677R', count: 42 },
      { blankNo: '1000000244R', count: 36 },
      { blankNo: '1002381102R', count: 31 },
      { blankNo: '1001560088R', count: 27 },
      { blankNo: '1004420015R', count: 22 },
      { blankNo: '1002380901R', count: 18 },
      { blankNo: '1000000311R', count: 14 },
      { blankNo: '1001560120R', count: 9 }
    ]
  },
  repair: {
    color: '#ffd52a',
    items: [
      { blankNo: '1002381102R', count: 33 },
      { blankNo: '1002380677R', count: 28 },
      { blankNo: '1004420040R', count: 24 },
      { blankNo: '1001560088R', count: 19 },
      { blankNo: '1000000244R', count: 16 },
      { blankNo: '1002381310R', count: 12 },
      { blankNo: '1001560177R', count: 8 },
      { blankNo: '1000000455R', count: 5 }
    ]
  },
  scrap: {
    color: '#ff4f8b',
    items: [
      { blankNo: '1004420015R', count: 18 },
      { blankNo: '1002381102R', count: 14 },
      { blankNo: '1001560120R', count: 11 },
      { blankNo: '1002380677R', count: 9 },
      { blankNo: '1004420062R', count: 7 },
      { blankNo: '1000000311R', count: 5 },
      { blankNo: '1002380901R', count: 4 },
      { blankNo: '1001560088R', count: 2 }
    ]
  },
  reuse: {
    color: '#4ee6a6',
    items: [
      { blankNo: '1000000244R', count: 39 },
      { blankNo: '1002381310R', count: 34 },
      { blankNo: '1001560088R', count: 29 },
      { blankNo: '1002380901R', count: 25 },
      { blankNo: '1004420040R', count: 21 },
      { blankNo: '1000000455R', count: 17 },
      { blankNo: '1002381102R', count: 13 },
      { blankNo: '1001560177R', count: 10 }
    ]
  }
}

/** 不合格品分析：纵轴毛坯件号、横轴数量的横向条形图 */
function createNgOption(key: NgTabKey): EChartsOption {
  const metric = ngMetrics[key]
  const label = ngTabs.find((tab) => tab.key === key)?.label ?? ''
  // ECharts 横向条形：yAxis 为类目（自上而下对应 items 顺序）
  const blankNos = metric.items.map((item) => item.blankNo)
  const counts = metric.items.map((item) => item.count)
  const maxCount = Math.max(...counts, 1)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `毛坯件号: ${item.name}<br/>${label}: ${item.value}`
      }
    },
    grid: { left: '4%', right: '10%', bottom: '4%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false },
      max: Math.ceil(maxCount * 1.15)
    },
    yAxis: {
      type: 'category',
      data: blankNos,
      axisLabel: { ...axisLabel, interval: 0 },
      axisLine,
      axisTick: { show: false },
      splitLine: { show: false }
    },
    series: [
      {
        name: label,
        type: 'bar',
        data: counts,
        barWidth: '55%',
        itemStyle: {
          color: metric.color,
          borderRadius: [0, 3, 3, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#dff8ff',
          fontSize: 10
        }
      }
    ]
  }
}

const ngOption = computed(() => createNgOption(activeNgKey.value))

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

/** 面板 tab 切换：不合格品分析按类型（返工/返修/报废/回用） */
function handleTabChange(payload: { title: string; key: string }) {
  if (payload.title === '不合格品分析') {
    activeNgKey.value = payload.key as NgTabKey
  }
}

const panels = computed(() => [
  { title: '任务列表', contentKey: 'taskList' },
  { title: '造型追溯', contentKey: 'traceList' },
  { title: '生产趋势', option: productionTrendOption },
  {
    title: '不合格品分析',
    option: ngOption.value,
    tabs: ngTabs.map((tab) => ({ key: tab.key as string, label: tab.label })),
    activeKey: activeNgKey.value
  },
  { title: '浇筑吨位统计', option: pourTonsOption },
  { title: '过程检验分析', option: processInspectOption }
])
</script>

<template>
  <!-- 造型班组可视化：可切换班组 + 6 指标 + 任务列表卡片 -->
  <LineDashboardShell
    title="造型班组可视化"
    :indicators="indicators"
    :panels="panels"
    @tab-change="handleTabChange"
  >
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
        @mouseenter="onTaskEnter"
        @mouseleave="onTaskLeave"
      >
        <div
          v-for="task in taskList"
          :key="task.blankNo"
          class="task-card"
        >
          <div class="task-card-grid">
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">毛坯件号:</span>
                <span class="task-value">{{ task.blankNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">毛坯名称:</span>
                <span class="task-value">{{ task.blankName }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">计划箱数:</span>
                <span class="task-value">{{ task.planBoxes }}</span>
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
                <span class="task-label">工装数:</span>
                <span class="task-value">{{ task.fixtureCount }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">砂箱数:</span>
                <span class="task-value">{{ task.flaskCount }}</span>
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

    <template #traceList>
      <div
        ref="traceListEl"
        class="task-list-scroll"
        @mouseenter="onTraceEnter"
        @mouseleave="onTraceLeave"
      >
        <div
          v-for="trace in traceList"
          :key="trace.blankNo"
          class="task-card trace-card"
        >
          <div class="task-card-grid trace-grid">
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">毛坯件号:</span>
                <span class="task-value">{{ trace.blankNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">毛坯名称:</span>
                <span class="task-value">{{ trace.blankName }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">产品系列:</span>
                <span class="task-value">{{ trace.productSeries }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">任务开始时间:</span>
                <span class="task-value">{{ trace.startTime || '—' }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">起模时间:</span>
                <span class="task-value">{{ trace.drawTime || '—' }}</span>
              </div>
            </div>
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">下芯时间:</span>
                <span class="task-value">{{ trace.coreSetTime || '—' }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">合箱时间:</span>
                <span class="task-value">{{ trace.closeTime || '—' }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">浇筑时间:</span>
                <span class="task-value trace-pour">{{ trace.pourTime || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </LineDashboardShell>
</template>

<style src="./dashboard-common.css"></style>
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

/* 造型追溯卡片：双列时间字段略紧凑 */
.trace-card .task-field {
  font-size: 13px;
}

.trace-card .task-label {
  min-width: 7.5em;
}

.trace-grid {
  grid-template-columns: 1.2fr 1fr;
}

.trace-pour {
  color: #20cfff;
}
</style>





