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
  }
}

interface PlanDailyPoint {
  label: string
  /** 当天计划浇筑箱数 */
  plan: number
  /** 实际浇筑箱数 */
  actual: number
  /** 计划完成率（%） */
  rate: number
  isToday: boolean
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
      outputUnits: [82, 91, 100, 110, 118],
      inboundUnits: [124, 136, 150, 165, 176]
    }
  },
  {
    key: 'baudouin',
    name: '博杜安',
    color: '#20cfff',
    data: {
      outputUnits: [68, 76, 85, 95, 103],
      inboundUnits: [101, 112, 125, 138, 149]
    }
  },
  {
    key: 'heavyWeichai',
    name: '重潍柴',
    color: '#ffd52a',
    data: {
      outputUnits: [60, 67, 75, 85, 92],
      inboundUnits: [90, 100, 110, 122, 131]
    }
  },
  {
    key: 'largeMachine',
    name: '大机',
    color: '#9b8cff',
    data: {
      outputUnits: [52, 58, 65, 75, 81],
      inboundUnits: [77, 85, 95, 108, 116]
    }
  },
  {
    key: 'm55',
    name: 'M55',
    color: '#ff4f8b',
    data: {
      outputUnits: [44, 49, 55, 65, 70],
      inboundUnits: [64, 72, 82, 95, 102]
    }
  }
]

/** 生产详情：近 5 年，末位为当前年份 */
const PRODUCT_YEAR_RANGE = 5
const productYearCategories = Array.from(
  { length: PRODUCT_YEAR_RANGE },
  (_, index) => `${dayjs().year() - PRODUCT_YEAR_RANGE + 1 + index}`
)

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
  /** 完整日期 YYYY-MM-DD，用于弹窗标题与明细 */
  fullDate: string
  value: number
  isToday: boolean
}

/** 入库详情行 */
interface InboundDetailRow {
  date: string
  orderNo: string
  blankCode: string
  blankName: string
  series: string
  warehouse: string
  qty: number
  customer: string
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
        },
        cursor: 'pointer'
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

/**
 * 计划分析：近 7 天实际浇筑箱数、计划箱数与完成率
 * 横轴为日期（MM-DD），左轴为箱数（柱），右轴为计划完成率（%）
 */
function createPlanOption(points: PlanDailyPoint[]): EChartsOption {
  const labelStyle = { show: true, position: 'top' as const, fontSize: 9, distance: 2 }

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
            const unit = item.seriesName === '计划完成率' ? '%' : ' 箱'
            return `${item.marker} ${item.seriesName}: ${item.value}${unit}`
          })
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: ['实际浇筑箱数', '当天计划箱数', '计划完成率'],
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 2,
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 8
    },
    grid: { left: '4%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.label),
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 9,
        interval: 0,
        formatter: (value: string) =>
          points.find((point) => point.label === value && point.isToday) ? `{today|${value}}` : value,
        rich: { today: { color: '#ffd52a', fontSize: 9, fontWeight: 'bold' } }
      },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '箱数',
        nameTextStyle: { color: '#a9c9d4', fontSize: 9 },
        axisLabel: { color: '#a9c9d4', fontSize: 9 },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.22)' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '%',
        min: 80,
        max: 110,
        interval: 10,
        nameTextStyle: { color: '#a9c9d4', fontSize: 9 },
        axisLabel: { color: '#a9c9d4', fontSize: 9, formatter: '{value}%' },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false }
      }
    ],
    series: [
      {
        name: '实际浇筑箱数',
        type: 'bar',
        data: points.map((point) => point.actual),
        barWidth: '28%',
        itemStyle: { color: '#4ee6a6', borderRadius: [3, 3, 0, 0] },
        label: { ...labelStyle, color: '#dff8ff' }
      },
      {
        name: '当天计划箱数',
        type: 'bar',
        data: points.map((point) => point.plan),
        barWidth: '28%',
        itemStyle: { color: 'rgba(32, 207, 255, 0.48)', borderRadius: [3, 3, 0, 0] },
        label: { ...labelStyle, color: '#a9c9d4' }
      },
      {
        name: '计划完成率',
        type: 'line',
        yAxisIndex: 1,
        data: points.map((point) => point.rate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#ffd52a', width: 3 },
        itemStyle: { color: '#ffd52a', borderColor: '#061821', borderWidth: 2 }
      }
    ]
  } as EChartsOption
}

/**
 * 生产详情：近 5 年出产 / 入库台数对比（分组柱状图）
 * X 轴为年份（随当年滚动，末位为当前年份），Y 轴为台数
 */
function createProductOption(series: ProductSeries): EChartsOption {
  const labelStyle = { show: true, position: 'top' as const, color: '#dff8ff', fontSize: 10 }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      textStyle: { color: '#dff8ff', fontSize: 11 },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const body = list
          .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value} 台`)
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}年<br/>${body}`
      }
    },
    legend: {
      data: ['出产台数', '入库台数'],
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 5,
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 10
    },
    grid: { left: '4%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: productYearCategories,
      axisLabel: { color: '#a9c9d4', fontSize: 11, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '台数',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.24)' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '出产台数',
        type: 'bar',
        data: series.data.outputUnits,
        itemStyle: { color: '#20cfff', borderRadius: [4, 4, 0, 0] },
        barWidth: '26%',
        label: labelStyle
      },
      {
        name: '入库台数',
        type: 'bar',
        data: series.data.inboundUnits,
        itemStyle: { color: '#4ee6a6', borderRadius: [4, 4, 0, 0] },
        barWidth: '26%',
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
      fullDate: date.format('YYYY-MM-DD'),
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

/* =========================
   入库详情弹窗（点击柱状图）
   ========================= */
const blankNames = [
  '缸体毛坯',
  '缸盖毛坯',
  '曲轴毛坯',
  '飞轮毛坯',
  '油底壳毛坯',
  '进气歧管毛坯'
]
const seriesNames = ['中速机', '博杜安', '重潍柴', '大机', 'M55']
const warehouses = ['毛坯一库', '毛坯二库', '成品库', '中转库']
const customers = ['潍柴动力', '玉柴机器', '玉柴机器', '全柴动力', '常柴股份']

/** 按日期确定性生成当日入库明细 mock */
function mockInboundDetails(dateStr: string): InboundDetailRow[] {
  const [year, month, day] = dateStr.split('-').map(Number)
  const seed = year * 10000 + month * 100 + day
  const count = 8 + ((seed * 17) % 7)
  const rows: InboundDetailRow[] = []
  for (let i = 0; i < count; i++) {
    const n = seed + i * 13
    rows.push({
      date: dateStr,
      orderNo: `RK${dateStr.replace(/-/g, '')}${String(i + 1).padStart(3, '0')}`,
      blankCode: `MP-${String(20240 + (n % 900)).padStart(5, '0')}`,
      blankName: blankNames[n % blankNames.length],
      series: seriesNames[n % seriesNames.length],
      warehouse: warehouses[n % warehouses.length],
      qty: 12 + ((n * 7) % 48),
      customer: customers[n % customers.length]
    })
  }
  return rows
}

const inboundDetailOpen = ref(false)
const inboundDetailDate = ref('')
const inboundDetailLabel = ref('')
const inboundDetailRows = computed<InboundDetailRow[]>(() =>
  inboundDetailDate.value ? mockInboundDetails(inboundDetailDate.value) : []
)
const inboundDetailTitle = computed(() =>
  inboundDetailLabel.value ? `${inboundDetailLabel.value} 入库详情` : '入库详情'
)

function openInboundDetail(point: InboundDailyPoint) {
  inboundDetailDate.value = point.fullDate
  inboundDetailLabel.value = point.label
  inboundDetailOpen.value = true
}

function closeInboundDetail() {
  inboundDetailOpen.value = false
}

/** 入库概况柱状图点击 → 打开当日入库详情 */
function handleInboundChartClick(payload: unknown) {
  const params = payload as { dataIndex?: number } | null
  if (!params || typeof params.dataIndex !== 'number') return
  const point = inboundDailyPoints.value[params.dataIndex]
  if (point) openInboundDetail(point)
}

/* 计划分析：近 7 天实际 / 计划浇筑箱数，按日期确定性生成，避免刷新跳变 */
const PLAN_RANGE_DAYS = 7

function mockDailyPlan(date: Dayjs): { plan: number; actual: number } {
  const seed = date.year() * 101 + date.month() * 31 + date.date()
  const plan = 118 + ((seed * 53 + 7) % 34)
  const factor = 0.9 + ((seed * 29) % 16) / 100
  return { plan, actual: Math.round(plan * factor) }
}

const planDailyPoints = computed<PlanDailyPoint[]>(() => {
  const points: PlanDailyPoint[] = []
  for (let offset = PLAN_RANGE_DAYS - 1; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const { plan, actual } = mockDailyPlan(date)
    points.push({
      label: date.format('MM-DD'),
      plan,
      actual,
      rate: Number(((actual / plan) * 100).toFixed(1)),
      isToday: date.isSame(todayStart, 'day')
    })
  }
  return points
})

/* 月度 / 年度分析：分项堆叠数据随各自 tab 切换，占比与出产分析同源 */
const monthlySplits = computed(() => splitTotalsByAnalysis(monthlyAnalysisKey.value, monthlyAnalysis.output))
const monthlyOption = computed(() => createMonthlyOption(monthlySplits.value, monthlyAnalysis.inbound))

const yearlySplits = computed(() => splitTotalsByAnalysis(yearlyAnalysisKey.value, yearlyAnalysis.output))
const yearlyOption = computed(() => createYearlyOption(yearlySplits.value, yearlyAnalysis.inbound))
const planOption = computed(() => createPlanOption(planDailyPoints.value))

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
      title="生产可视化大屏"
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
                <EChart
                  :option="inboundDailyOption"
                  height="100%"
                  @click="handleInboundChartClick"
                />
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

    <!-- 入库详情大弹窗：点击入库概况柱状图打开 -->
    <Teleport to="body">
      <div
        v-if="inboundDetailOpen"
        class="inbound-modal-mask"
        @click.self="closeInboundDetail"
      >
        <div class="inbound-modal" role="dialog" aria-modal="true" :aria-label="inboundDetailTitle">
          <div class="inbound-modal-corner tl"></div>
          <div class="inbound-modal-corner tr"></div>
          <div class="inbound-modal-corner bl"></div>
          <div class="inbound-modal-corner br"></div>

          <button type="button" class="inbound-modal-close" aria-label="关闭" @click="closeInboundDetail">
            ×
          </button>

          <div class="inbound-modal-header">
            <h3 class="inbound-modal-title">{{ inboundDetailTitle }}</h3>
          </div>

          <div class="inbound-modal-body">
            <div class="inbound-modal-meta">
              <span>日期：{{ inboundDetailDate }}</span>
              <span>共 {{ inboundDetailRows.length }} 条入库记录</span>
            </div>

            <div class="inbound-modal-table-wrap">
              <table class="inbound-modal-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>日期</th>
                    <th>单号</th>
                    <th>毛坯件号</th>
                    <th>毛坯名称</th>
                    <th>产品系列</th>
                    <th>仓库</th>
                    <th>数量</th>
                    <th>客户名称</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in inboundDetailRows" :key="`${row.orderNo}-${index}`">
                    <td>{{ index + 1 }}</td>
                    <td>{{ row.date }}</td>
                    <td>{{ row.orderNo }}</td>
                    <td>{{ row.blankCode }}</td>
                    <td>{{ row.blankName }}</td>
                    <td>{{ row.series }}</td>
                    <td>{{ row.warehouse }}</td>
                    <td class="num">{{ row.qty }}</td>
                    <td>{{ row.customer }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped src="./dashboard-theme.css"></style>

<style>
/* 入库详情 FUI 大弹窗（Teleport 到 body，需全局样式） */
.inbound-modal-mask {
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

.inbound-modal {
  position: relative;
  width: min(1200px, 96vw);
  max-height: min(86vh, 820px);
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

.inbound-modal::before,
.inbound-modal::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 2px;
  pointer-events: none;
}

.inbound-modal::before {
  top: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  box-shadow: 0 0 10px rgba(24, 210, 255, 0.85);
}

.inbound-modal::after {
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(24, 210, 255, 0.55), transparent);
}

.inbound-modal-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  z-index: 2;
  pointer-events: none;
}

.inbound-modal-corner.tl {
  top: -1px;
  left: -1px;
  border-top: 3px solid #1bd5ff;
  border-left: 3px solid #1bd5ff;
  box-shadow: -2px -2px 8px rgba(27, 213, 255, 0.55);
}

.inbound-modal-corner.tr {
  top: -1px;
  right: -1px;
  border-top: 3px solid #1bd5ff;
  border-right: 3px solid #1bd5ff;
  box-shadow: 2px -2px 8px rgba(27, 213, 255, 0.55);
}

.inbound-modal-corner.bl {
  bottom: -1px;
  left: -1px;
  border-bottom: 3px solid #1bd5ff;
  border-left: 3px solid #1bd5ff;
  box-shadow: -2px 2px 8px rgba(27, 213, 255, 0.55);
}

.inbound-modal-corner.br {
  bottom: -1px;
  right: -1px;
  border-bottom: 3px solid #1bd5ff;
  border-right: 3px solid #1bd5ff;
  box-shadow: 2px 2px 8px rgba(27, 213, 255, 0.55);
}

.inbound-modal-close {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 3;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #9fd9ea;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, text-shadow 0.15s ease;
}

.inbound-modal-close:hover {
  color: #fff;
  text-shadow: 0 0 8px rgba(24, 210, 255, 0.9);
}

.inbound-modal-header {
  flex-shrink: 0;
  padding: 22px 48px 12px;
  text-align: center;
}

.inbound-modal-title {
  margin: 0;
  display: inline-block;
  padding-bottom: 10px;
  color: #f4fdff;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 4px;
  text-shadow: 0 0 14px rgba(31, 204, 255, 0.35);
}

.inbound-modal-title::after {
  content: '';
  display: block;
  width: 72px;
  height: 3px;
  margin: 10px auto 0;
  background: #ffd91a;
  box-shadow: 0 0 10px rgba(255, 217, 26, 0.75);
}

.inbound-modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 28px 28px;
}

.inbound-modal-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #a9c9d4;
  font-size: 13px;
}

.inbound-modal-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(0, 190, 235, 0.28);
  border-radius: 2px;
}

.inbound-modal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.inbound-modal-table th,
.inbound-modal-table td {
  padding: 12px 10px;
  text-align: center;
  white-space: nowrap;
}

.inbound-modal-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(0, 160, 210, 0.45), rgba(0, 100, 150, 0.35));
  color: #f4fdff;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 200, 240, 0.45);
}

.inbound-modal-table tbody td {
  background: rgba(6, 40, 58, 0.72);
  color: #dff8ff;
  border-bottom: 1px solid rgba(0, 150, 190, 0.18);
}

.inbound-modal-table tbody tr:nth-child(odd) td {
  background: rgba(10, 52, 74, 0.78);
}

.inbound-modal-table tbody tr:hover td {
  background: rgba(0, 169, 215, 0.18);
}

.inbound-modal-table .num {
  color: #ffd91a;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.inbound-modal-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.inbound-modal-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.55);
  border-radius: 3px;
}

.inbound-modal-table-wrap::-webkit-scrollbar-track {
  background: rgba(0, 40, 60, 0.4);
}

@media (max-width: 900px) {
  .inbound-modal-title {
    font-size: 18px;
    letter-spacing: 2px;
  }

  .inbound-modal-table {
    font-size: 12px;
  }

  .inbound-modal-table th,
  .inbound-modal-table td {
    padding: 8px 6px;
  }
}
</style>
