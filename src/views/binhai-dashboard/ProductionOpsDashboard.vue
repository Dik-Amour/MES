<script setup lang="ts">

import { computed, ref } from 'vue'

import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 生产运营大屏静态数据（迁移自 production-ops-dashboard.html 内联脚本） */

type AnalysisKey = 'ironTypes' | 'productSeries'

interface PieDatum {
  value: number
  name: string
  itemStyle: { color: string }
}

interface ProductSeries {
  key: string
  name: string
  color: string
  data: {
    outputUnits: number[]
    inboundUnits: number[]
    outputTons: number[]
    inboundTons: number[]
  }
}

interface AssessmentRow {
  project: string
  plan: string
  actual: string
  rate: string
  /** 完成率是否达标，决定数字颜色 */
  passed: boolean
  reason: string
}

const outputAnalysisData: Record<AnalysisKey, PieDatum[]> = {
  ironTypes: [
    { value: 45, name: '灰铁', itemStyle: { color: '#20cfff' } },
    { value: 30, name: '球铁', itemStyle: { color: '#4ee6a6' } },
    { value: 25, name: '蠕铁', itemStyle: { color: '#ffd52a' } }
  ],
  productSeries: [
    { value: 35, name: '中速机', itemStyle: { color: '#20cfff' } },
    { value: 28, name: '博杜安', itemStyle: { color: '#4ee6a6' } },
    { value: 22, name: '重潍柴', itemStyle: { color: '#ffd52a' } },
    { value: 15, name: '大机', itemStyle: { color: '#9b8cff' } }
  ]
}

/**
 * 入库概况指标：指标项 = 当前 tab 下的分项本身
 * 毛坯材质 tab → 灰铁 / 球铁 / 蠕铁；产品系列 tab → 中速机 / 博杜安 / 重潍柴 / 大机
 * 数值为各分项入库量（吨），与出产分析的分项口径保持一致
 */
const inboundIndicators: Record<AnalysisKey, { label: string; value: string; unit: string }[]> = {
  ironTypes: [
    { label: '灰铁', value: '42', unit: '吨' },
    { label: '球铁', value: '32', unit: '吨' },
    { label: '蠕铁', value: '26', unit: '吨' }
  ],
  productSeries: [
    { label: '中速机', value: '33', unit: '吨' },
    { label: '博杜安', value: '27', unit: '吨' },
    { label: '重潍柴', value: '24', unit: '吨' },
    { label: '大机', value: '16', unit: '吨' }
  ]
}

/** 近 7 年：横轴年份随当年滚动，末位为当前年份（末值与顶部"年度出产 3,400 / 年度入库 3,350"对应） */
const YEAR_RANGE = 7
const yearlyAnalysis = {
  categories: Array.from(
    { length: YEAR_RANGE },
    (_, index) => `${dayjs().year() - YEAR_RANGE + 1 + index}年`
  ),
  output: [2800, 3100, 3350, 3200, 3500, 3650, 3400],
  inbound: [2750, 3050, 3300, 3150, 3450, 3600, 3350]
}

const monthlyAnalysis = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  output: [218, 205, 236, 244, 252, 267, 249, 276, 281, 274, 289, 285],
  inbound: [210, 198, 228, 239, 247, 259, 243, 268, 275, 269, 282, 280]
}

const productionIndicators = [
  { label: '当日出产', value: '80', unit: '吨', tone: 'output' },
  { label: '当日入库', value: '80', unit: '吨', tone: 'inbound' },
  { label: '当月出产', value: '285', unit: '吨', tone: 'output' },
  { label: '当月入库', value: '280', unit: '吨', tone: 'inbound' },
  { label: '年度出产', value: '3,400', unit: '吨', tone: 'output' },
  { label: '年度入库', value: '3,350', unit: '吨', tone: 'inbound' }
]

const productionSummary = {
  output: { cumulative: '3,400', monthly: '285', mom: '+8.5%', yoy: '+12.3%' },
  inbound: { cumulative: '3,350', monthly: '280', mom: '+7.8%', yoy: '+11.5%' }
}

const productSeriesList: ProductSeries[] = [
  {
    key: 'mediumSpeed',
    name: '中速机',
    color: '#4ee6a6',
    data: {
      outputUnits: [100, 110],
      inboundUnits: [150, 165],
      outputTons: [103, 115],
      inboundTons: [131, 145]
    }
  },
  {
    key: 'baudouin',
    name: '博杜安',
    color: '#20cfff',
    data: {
      outputUnits: [85, 95],
      inboundUnits: [125, 138],
      outputTons: [88, 98],
      inboundTons: [115, 128]
    }
  },
  {
    key: 'heavyWeichai',
    name: '重潍柴',
    color: '#ffd52a',
    data: {
      outputUnits: [75, 85],
      inboundUnits: [110, 122],
      outputTons: [78, 88],
      inboundTons: [102, 115]
    }
  },
  {
    key: 'largeMachine',
    name: '大机',
    color: '#9b8cff',
    data: {
      outputUnits: [65, 75],
      inboundUnits: [95, 108],
      outputTons: [68, 78],
      inboundTons: [90, 103]
    }
  },
  {
    key: 'm55',
    name: 'M55',
    color: '#ff4f8b',
    data: {
      outputUnits: [55, 65],
      inboundUnits: [82, 95],
      outputTons: [58, 68],
      inboundTons: [78, 90]
    }
  }
]

const assessmentRows: AssessmentRow[] = [
  { project: '蠕铁产量', plan: '850', actual: '820', rate: '96.5%', passed: false, reason: '设备故障' },
  { project: '灰铁产量', plan: '1200', actual: '1180', rate: '98.3%', passed: false, reason: '-' },
  { project: '球铁产量', plan: '800', actual: '765', rate: '95.6%', passed: false, reason: '原料短缺' },
  { project: '合格率', plan: '98', actual: '98.2', rate: '100.2%', passed: true, reason: '-' },
  { project: '能耗指标', plan: '470', actual: '485', rate: '96.9%', passed: false, reason: '设备老化' }
]

/* =========================
   ECharts 配置
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(5, 24, 34, 0.96)',
  borderColor: 'rgba(0, 198, 239, 0.55)',
  textStyle: { color: '#dff8ff' }
}

/**
 * 出产分析横向柱状图
 * X 轴为吨位，Y 轴为毛坯材质 / 产品系列（随 analysisTabs 切换）
 */
function createOutputBarOption(data: PieDatum[]): EChartsOption {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        const value = Number(item.value)
        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
        return `${item.name}<br/>出产量: ${value} 吨 (${percent}%)`
      }
    },
    grid: { left: '2%', right: '10%', bottom: '2%', top: '2%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.24)' } }
    },
    yAxis: {
      type: 'category',
      data: data.map((item) => item.name),
      inverse: true,
      axisLabel: { color: '#dff8ff', fontSize: 13 },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        barWidth: '55%',
        data: data.map((item) => ({
          value: item.value,
          itemStyle: { color: item.itemStyle.color }
        })),
        itemStyle: { borderRadius: [0, 3, 3, 0] },
        label: {
          show: true,
          position: 'right',
          formatter: '{c} 吨',
          color: '#ffd91a',
          fontSize: 13
        },
        emphasis: {
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(32, 207, 255, 0.55)' }
        }
      }
    ]
  } as EChartsOption
}

interface InboundDailyPoint {
  label: string
  value: number
  isToday: boolean
}

/**
 * 入库概况：近 N 天入库量柱状图
 * X 轴为日期（MM-DD），当天柱子用高亮黄区分
 */
function createInboundDailyOption(points: InboundDailyPoint[]): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.name}<br/>入库量: ${item.value} 吨`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '2%', top: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.label),
      axisLabel: { color: '#a9c9d4', fontSize: 11, interval: 0, margin: 8 },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.24)' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        barWidth: '55%',
        data: points.map((point) => ({
          value: point.value,
          itemStyle: {
            color: point.isToday ? '#ffd91a' : '#20cfff',
            borderRadius: [3, 3, 0, 0]
          }
        })),
        label: {
          show: true,
          position: 'top',
          color: '#a9c9d4',
          fontSize: 10,
          formatter: '{c}'
        }
      }
    ]
  } as EChartsOption
}

interface OutputSplit {
  name: string
  color: string
  data: number[]
}

/**
 * 通用配置：柱 = 出产（按毛坯材质 / 产品系列堆叠），折线 = 入库合计
 * 月度分析与年度分析共用，保证两者图例、配色、tooltip 完全一致
 */
function createStackedOutputOption(params: {
  categories: string[]
  splits: OutputSplit[]
  inbound: number[]
}): EChartsOption {
  const { categories, splits, inbound } = params

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        let outputTotal = 0
        let body = ''
        list.forEach((item: any) => {
          if (item.seriesType === 'line') return
          outputTotal += Number(item.value)
          body += `${item.marker} ${item.seriesName}: ${item.value} 吨<br/>`
        })
        body += `<b>出产量合计: ${outputTotal} 吨</b>`
        list
          .filter((item: any) => item.seriesType === 'line')
          .forEach((item: any) => {
            body += `<br/>${item.marker} ${item.seriesName}: ${item.value} 吨`
          })
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: [...splits.map((split) => split.name), '入库量'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5,
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: '3%', right: '3%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.24)' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      ...splits.map((split, index) => ({
        name: split.name,
        type: 'bar' as const,
        stack: 'output',
        data: split.data,
        barWidth: '50%',
        itemStyle: {
          color: split.color,
          ...(index === splits.length - 1 ? { borderRadius: [3, 3, 0, 0] } : {})
        }
      })),
      {
        name: '入库量',
        type: 'line' as const,
        data: inbound,
        z: 5,
        lineStyle: { color: '#f4fdff', width: 2, type: 'dashed' as const },
        itemStyle: { color: '#f4fdff', borderWidth: 2, borderColor: '#061821' },
        symbol: 'circle',
        symbolSize: 7,
        smooth: true
      }
    ]
  } as EChartsOption
}

/** 年度分析：近 7 年，横轴为年份 */
function createYearlyOption(splits: OutputSplit[], inbound: number[]): EChartsOption {
  return createStackedOutputOption({
    categories: yearlyAnalysis.categories,
    splits,
    inbound
  })
}

/**
 * 按分项占比拆分单个总量，最后一项吸收舍入差，保证各段之和 = 原总量
 */
function splitByShare(total: number, shares: number[]): number[] {
  const parts = shares.slice(0, -1).map((share) => Math.round(total * share))
  const last = total - parts.reduce((sum, part) => sum + part, 0)
  return [...parts, last]
}

/**
 * 按当前 tab 的分项占比拆分一组总量（月度 / 年度共用）
 * 占比取自出产分析的分项数值，保证跨面板口径一致
 */
function splitTotalsByAnalysis(key: AnalysisKey, totals: number[]): OutputSplit[] {
  const items = outputAnalysisData[key]
  const shareSum = items.reduce((sum, item) => sum + item.value, 0)
  const shares = items.map((item) => item.value / shareSum)
  const perTotal = totals.map((total) => splitByShare(total, shares))
  return items.map((item, index) => ({
    name: item.name,
    color: item.itemStyle.color,
    data: perTotal.map((values) => values[index])
  }))
}

/** 月度分析：横轴为月份 */
function createMonthlyOption(splits: OutputSplit[], inbound: number[]): EChartsOption {
  return createStackedOutputOption({
    categories: monthlyAnalysis.categories,
    splits,
    inbound
  })
}

/** 计划量、实际完工与完成率组合图 */
function createPlanOption(): EChartsOption {
  const categories = ['蠕铁产量', '灰铁产量', '球铁产量', '合格率', '能耗指标']
  const plan = assessmentRows.map((row) => Number(row.plan))
  const actual = assessmentRows.map((row) => Number(row.actual))
  const rate = assessmentRows.map((row) => Number(row.rate.replace('%', '')))

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipBase
    },
    legend: {
      data: ['计划量', '实际完工', '完成率'],
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 2
    },
    grid: { left: '4%', right: '5%', bottom: '4%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#a9c9d4', fontSize: 9, interval: 0, rotate: 18 },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        nameTextStyle: { color: '#a9c9d4', fontSize: 9 },
        axisLabel: { color: '#a9c9d4', fontSize: 9 },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.22)' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '%',
        min: 90,
        max: 105,
        nameTextStyle: { color: '#a9c9d4', fontSize: 9 },
        axisLabel: { color: '#a9c9d4', fontSize: 9 },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false }
      }
    ],
    series: [
      {
        name: '计划量',
        type: 'bar',
        data: plan,
        barWidth: '24%',
        itemStyle: { color: 'rgba(32, 207, 255, 0.48)', borderRadius: [3, 3, 0, 0] }
      },
      {
        name: '实际完工',
        type: 'bar',
        data: actual,
        barWidth: '24%',
        itemStyle: { color: '#4ee6a6', borderRadius: [3, 3, 0, 0] }
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: rate,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#ffd52a', width: 3 },
        itemStyle: { color: '#ffd52a', borderColor: '#061821', borderWidth: 2 }
      }
    ]
  } as EChartsOption
}

/** 产品系列双轴柱状图 */
function createProductOption(series: ProductSeries): EChartsOption {
  const labelStyle = { show: true, position: 'top' as const, color: '#dff8ff', fontSize: 10 }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      textStyle: { color: '#dff8ff', fontSize: 11 }
    },
    legend: {
      data: ['出产台数', '入库台数', '出产吨位', '入库吨位'],
      textStyle: { color: '#a9c9d4', fontSize: 9 },
      top: 5,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 6
    },
    grid: { left: '12%', right: '12%', bottom: '10%', top: '18%', containLabel: false },
    xAxis: {
      type: 'category',
      data: ['2024', '2025'],
      axisLabel: { color: '#a9c9d4', fontSize: 12, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '台数',
        nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
        position: 'left',
        axisLabel: { color: '#a9c9d4', fontSize: 10 },
        axisLine: { show: true, lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      {
        type: 'value',
        name: '吨数',
        nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
        position: 'right',
        axisLabel: { color: '#a9c9d4', fontSize: 10 },
        axisLine: { show: true, lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.24)' } }
      }
    ],
    series: [
      {
        name: '出产台数',
        type: 'bar',
        yAxisIndex: 0,
        data: series.data.outputUnits,
        itemStyle: { color: '#20cfff', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      },
      {
        name: '入库台数',
        type: 'bar',
        yAxisIndex: 0,
        data: series.data.inboundUnits,
        itemStyle: { color: '#4ee6a6', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      },
      {
        name: '出产吨位',
        type: 'bar',
        yAxisIndex: 1,
        data: series.data.outputTons,
        itemStyle: { color: '#ffd52a', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      },
      {
        name: '入库吨位',
        type: 'bar',
        yAxisIndex: 1,
        data: series.data.inboundTons,
        itemStyle: { color: '#ff4f8b', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      }
    ]
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */

const analysisTabs: { key: AnalysisKey; label: string }[] = [
  { key: 'ironTypes', label: '毛坯材质' },
  { key: 'productSeries', label: '产品系列' }
]

const outputAnalysisKey = ref<AnalysisKey>('ironTypes')
const inboundAnalysisKey = ref<AnalysisKey>('ironTypes')
const monthlyAnalysisKey = ref<AnalysisKey>('ironTypes')
const yearlyAnalysisKey = ref<AnalysisKey>('ironTypes')

const outputBarOption = computed(() => createOutputBarOption(outputAnalysisData[outputAnalysisKey.value]))
/** 入库概况当前 tab 对应的指标项 */
const currentInboundIndicators = computed(() => inboundIndicators[inboundAnalysisKey.value])

/* 入库概况：近 7 天入库量柱状图，可按 7 天为步长前后切换 */
const INBOUND_RANGE_DAYS = 7
const todayStart = dayjs().startOf('day')
const inboundRangeEnd = ref<Dayjs>(todayStart)

/** 按日期确定性生成 mock 入库量，保证来回切换窗口时数值稳定不跳变 */
function mockDailyInbound(date: Dayjs): number {
  const seed = date.year() + date.month() * 31 + date.date()
  const base = 62 + ((seed * 37) % 39)
  const weekend = date.day() === 0 || date.day() === 6
  return weekend ? Math.max(30, base - 18) : base
}

const inboundDailyPoints = computed<InboundDailyPoint[]>(() => {
  const points: InboundDailyPoint[] = []
  for (let offset = INBOUND_RANGE_DAYS - 1; offset >= 0; offset--) {
    const date = inboundRangeEnd.value.subtract(offset, 'day')
    points.push({
      label: date.format('MM-DD'),
      value: mockDailyInbound(date),
      isToday: date.isSame(todayStart, 'day')
    })
  }
  return points
})

const inboundDailyOption = computed(() => createInboundDailyOption(inboundDailyPoints.value))

const inboundRangeLabel = computed(() => {
  const points = inboundDailyPoints.value
  return `${points[0].label} ~ ${points[points.length - 1].label}`
})

/** 最多向后翻到今天 */
const canShiftInboundRangeNext = computed(() => inboundRangeEnd.value.isBefore(todayStart, 'day'))

const shiftInboundRange = (delta: number) => {
  const next = inboundRangeEnd.value.add(delta * INBOUND_RANGE_DAYS, 'day')
  inboundRangeEnd.value = next.isAfter(todayStart, 'day') ? todayStart : next
}

/* 月度 / 年度分析：分项堆叠数据随各自 tab 切换，占比与出产分析同源 */
const monthlySplits = computed(() => splitTotalsByAnalysis(monthlyAnalysisKey.value, monthlyAnalysis.output))
const monthlyOption = computed(() => createMonthlyOption(monthlySplits.value, monthlyAnalysis.inbound))

const yearlySplits = computed(() => splitTotalsByAnalysis(yearlyAnalysisKey.value, yearlyAnalysis.output))
const yearlyOption = computed(() => createYearlyOption(yearlySplits.value, yearlyAnalysis.inbound))
const planOption = createPlanOption()

const productCharts = productSeriesList.map((series) => ({
  series,
  option: createProductOption(series)
}))

const activeProductKey = ref(productSeriesList[0].key)
const activeProductChart = computed(
  () => productCharts.find((item) => item.series.key === activeProductKey.value) ?? productCharts[0]
)
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="生产运营管理大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

    <!-- 核心生产指标独立置顶 -->
    <div class="top-indicators">
      <div
        v-for="item in productionIndicators"
        :key="item.label"
        class="top-indicator-card"
        :class="`tone-${item.tone}`"
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
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧列 -->
      <div class="column">
        <!-- 出产分析 -->
        <div class="data-panel" style="height: 386px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 class="panel-title">出产分析</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in analysisTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: outputAnalysisKey === tab.key }"
                @click="outputAnalysisKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="outputBarOption" height="100%" />
          </div>
        </div>

        <!-- 入库概况 -->
        <div class="data-panel" style="height: 386px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 class="panel-title">入库概况</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in analysisTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: inboundAnalysisKey === tab.key }"
                @click="inboundAnalysisKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="inbound-overview">
            <!-- 指标：项目 = 当前 tab 下的分项，随 tab 切换 -->
            <div
              class="inbound-kpi-row"
              :style="{ gridTemplateColumns: `repeat(${currentInboundIndicators.length}, minmax(0, 1fr))` }"
            >
              <div v-for="item in currentInboundIndicators" :key="item.label" class="inbound-kpi">
                <div class="inbound-kpi-label">{{ item.label }}</div>
                <div class="inbound-kpi-value">
                  {{ item.value }}<span class="inbound-kpi-unit">{{ item.unit }}</span>
                </div>
              </div>
            </div>

            <!-- 近 7 天入库量：X 轴为日期，可按 7 天为步长前后切换 -->
            <div class="inbound-range">
              <div class="inbound-range-head">
                <button
                  type="button"
                  class="inbound-range-nav"
                  aria-label="前 7 天"
                  @click="shiftInboundRange(-1)"
                >
                  ‹
                </button>
                <span class="inbound-range-title">
                  {{ canShiftInboundRangeNext ? inboundRangeLabel : `近 7 天 · ${inboundRangeLabel}` }}
                </span>
                <button
                  type="button"
                  class="inbound-range-nav"
                  :disabled="!canShiftInboundRangeNext"
                  aria-label="后 7 天"
                  @click="shiftInboundRange(1)"
                >
                  ›
                </button>
              </div>

              <div class="inbound-range-chart">
                <EChart :option="inboundDailyOption" height="100%" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间列 -->
      <div class="column">
        <!-- 月度分析 -->
        <div class="data-panel" style="height: 386px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="panel-title">月度分析</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in analysisTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: monthlyAnalysisKey === tab.key }"
                @click="monthlyAnalysisKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="monthlyOption" height="100%" />
          </div>
        </div>

        <!-- 年度分析 -->
        <div class="data-panel" style="height: 386px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                />
              </svg>
            </div>
            <h3 class="panel-title">年度分析</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in analysisTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: yearlyAnalysisKey === tab.key }"
                @click="yearlyAnalysisKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="yearlyOption" height="100%" />
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="column">
        <!-- 生产详情 -->
        <div class="data-panel" style="height: 386px; overflow: hidden">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
                />
              </svg>
            </div>
            <h3 class="panel-title">生产详情</h3>
            <div class="tab-buttons product-tabs">
              <button
                v-for="item in productCharts"
                :key="item.series.key"
                type="button"
                class="tab-button"
                :class="{ active: activeProductKey === item.series.key }"
                @click="activeProductKey = item.series.key"
              >
                {{ item.series.name }}
              </button>
            </div>
          </div>

          <div class="product-detail-chart">
            <EChart
              v-if="activeProductChart"
              :key="activeProductChart.series.key"
              :option="activeProductChart.option"
              height="100%"
            />
          </div>
        </div>

        <!-- 计划分析 -->
        <div class="data-panel" style="height: 386px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="panel-title">计划分析</h3>
          </div>

          <div class="chart-container">
            <EChart :option="planOption" height="100%" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./dashboard-theme.css"></style>
