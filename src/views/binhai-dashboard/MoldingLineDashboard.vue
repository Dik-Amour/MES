<script setup lang="ts">
import { computed, ref } from 'vue'

import dayjs from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import type { EChartsOption } from 'echarts'

/** 指标行：12 项指标，grid 六列自动排成两行（数值为 mock，待业务方确认） */
const indicators = [
  { label: '造型计划完工率', value: '96.5', unit: '%', tone: 'output' },
  { label: '制芯计划完成率', value: '95.8', unit: '%', tone: 'inbound' },
  { label: '造型生产效率', value: '92.3', unit: '%', tone: 'output' },
  { label: '制芯生产效率', value: '91.6', unit: '%', tone: 'inbound' },
  { label: '出产吨位', value: '1286', unit: '吨', tone: 'output' },
  { label: '设备可动率', value: '94.2', unit: '%', tone: 'inbound' },
  { label: 'MTBF', value: '48.6', unit: '小时', tone: 'output' },
  { label: 'MTTR', value: '1.8', unit: '小时', tone: 'inbound' },
  { label: '主要生产设备故障停机率', value: '2.4', unit: '%', tone: 'output' },
  { label: '综合废品率', value: '1.2', unit: '%', tone: 'inbound' },
  { label: '吨均废品损失', value: '38.5', unit: '元/吨', tone: 'output' },
  { label: '铸件焊补率', value: '3.6', unit: '%', tone: 'inbound' }
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

const COLOR_INBOUND = '#4ee6a6'

/* =========================
   1. 产线产出分析：近一周计划 / 浇注数（分组柱）+ 造型计划完成率（右轴折线），按产品 tab 切换
   ========================= */
const seriesTabs = [
  { key: 'newProduct', label: '新产品' },
  { key: 'largeMachine', label: '大机' },
  { key: 'crankshaft', label: '曲轴' },
  { key: 'engineBlock', label: '机体' }
]
const activeSeriesKey = ref('newProduct')

/** 各产品分组的日计划箱数基数 */
const seriesPlanBase: Record<string, number> = {
  newProduct: 96,
  largeMachine: 118,
  crankshaft: 84,
  engineBlock: 132
}

const todayStart = dayjs().startOf('day')
const dailyCategories = Array.from({ length: 7 }, (_, index) =>
  todayStart.subtract(6 - index, 'day').format('MM-DD')
)

/** 按产品 + 日期确定性生成近一周计划 / 浇注箱数及造型计划完成率，刷新不跳变 */
function mockSeriesWeek(
  seriesKey: string
): { plan: number[]; cast: number[]; completion: number[] } {
  const base = seriesPlanBase[seriesKey] ?? 100
  const plan: number[] = []
  const cast: number[] = []
  const completion: number[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const date = todayStart.subtract(offset, 'day')
    const seed = date.year() + date.month() * 31 + date.date() + seriesKey.length * 17
    const planValue = base + ((seed * 13) % 21) - 10
    const rate = 0.88 + ((seed * 7) % 19) / 100
    const castValue = Math.round(planValue * rate)
    plan.push(planValue)
    cast.push(castValue)
    completion.push(Math.round((castValue / planValue) * 1000) / 10)
  }
  return { plan, cast, completion }
}

function createProductionAnalysisOption(seriesKey: string): EChartsOption {
  const { plan, cast, completion } = mockSeriesWeek(seriesKey)

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
            const unit = item.seriesName === '造型计划完成率' ? '%' : '箱'
            return `${item.marker} ${item.seriesName}: ${item.value} ${unit}`
          })
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}`
      }
    },
    legend: {
      data: ['计划数', '浇注数', '造型计划完成率'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5,
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: '3%', right: '5%', bottom: '3%', top: '18%', containLabel: true },
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
        name: '箱',
        nameTextStyle: axisNameStyle,
        axisLabel,
        splitLine,
        axisLine: { show: false },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '%',
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabel, formatter: '{value}%' },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        min: 0,
        max: 100
      }
    ],
    series: [
      {
        name: '计划数',
        type: 'bar',
        data: plan,
        barWidth: '28%',
        itemStyle: { color: 'rgba(32, 207, 255, 0.48)', borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#a9c9d4', fontSize: 9 }
      },
      {
        name: '浇注数',
        type: 'bar',
        data: cast,
        barWidth: '28%',
        itemStyle: { color: COLOR_INBOUND, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#dff8ff', fontSize: 9 }
      },
      {
        name: '造型计划完成率',
        type: 'line',
        yAxisIndex: 1,
        data: completion,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#ffd52a', width: 2 },
        itemStyle: { color: '#ffd52a', borderColor: '#061821', borderWidth: 2 },
        label: {
          show: true,
          position: 'top',
          color: '#ffd52a',
          fontSize: 9,
          formatter: '{c}%'
        }
      }
    ]
  }
}

const productionAnalysisOption = computed(() => createProductionAnalysisOption(activeSeriesKey.value))

/* =========================
   2. 生产统计：近 12 个月四产品产量（堆叠柱，吨位 / 台数 tab 切换）
   ========================= */
const monthlyCategories = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)

const statsTabs = [
  { key: 'tons', label: '吨位' },
  { key: 'units', label: '台数' }
]
const activeStatsKey = ref<'tons' | 'units'>('tons')

/** 四个产品系列（顺序与图例一致） */
const statsSeries = [
  { name: '大机', color: '#20cfff' },
  { name: '新产品', color: '#4ee6a6' },
  { name: '曲轴', color: '#ffd52a' },
  { name: '机体', color: '#9b8cff' }
]

/** 月度总量：吨位（吨）与台数（台） */
const monthlyTotals: Record<'tons' | 'units', number[]> = {
  tons: [2880, 2640, 3010, 3120, 3240, 3350, 3180, 3420, 3480, 3390, 3540, 3460],
  units: [316, 289, 334, 345, 358, 371, 350, 379, 386, 374, 395, 384]
}

/** 四系列占比：大机 / 新产品 / 曲轴 / 机体 */
const statsShares = [0.35, 0.28, 0.22, 0.15]

/** 按占比把月度总量拆成四个系列（最后一列吸收舍入差，保证合计相等） */
function splitMonthlyTotals(totals: number[]): number[][] {
  const parts: number[][] = statsSeries.map(() => [])
  totals.forEach((total) => {
    const head = statsShares.slice(0, -1).map((share) => Math.round(total * share))
    const last = total - head.reduce((sum, value) => sum + value, 0)
    ;[...head, last].forEach((value, index) => parts[index].push(value))
  })
  return parts
}

function createProductionStatsOption(unitKey: 'tons' | 'units'): EChartsOption {
  const unit = unitKey === 'tons' ? '吨' : '台'
  const perSeries = splitMonthlyTotals(monthlyTotals[unitKey])

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        let total = 0
        const body = list
          .map((item: any) => {
            total += Number(item.value)
            return `${item.marker} ${item.seriesName}: ${item.value} ${unit}`
          })
          .join('<br/>')
        return `${list[0]?.axisValue ?? ''}<br/>${body}<br/><b>合计: ${total} ${unit}</b>`
      }
    },
    legend: {
      data: statsSeries.map((series) => series.name),
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5,
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyCategories,
      axisLabel: { ...axisLabel, interval: 1 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: statsSeries.map((series, index) => ({
      name: series.name,
      type: 'bar',
      stack: 'stats',
      data: perSeries[index],
      barWidth: '50%',
      itemStyle: {
        color: series.color,
        ...(index === statsSeries.length - 1 ? { borderRadius: [3, 3, 0, 0] } : {})
      }
    }))
  }
}

const productionStatsOption = computed(() => createProductionStatsOption(activeStatsKey.value))

/* =========================
   3. 质量分析：月度质量率（折线，废品率 / 返修率 / 返工率 tab 切换）
   ========================= */
const qualityTabs = [
  { key: 'scrap', label: '废品率' },
  { key: 'repair', label: '返修率' },
  { key: 'rework', label: '返工率' }
]
const activeQualityKey = ref<'scrap' | 'repair' | 'rework'>('scrap')

/** 各质量指标的月度数据（%），12 个月 */
const qualityRates: Record<'rework' | 'repair' | 'scrap', { color: string; data: number[] }> = {
  rework: {
    color: '#20cfff',
    data: [3.8, 4.1, 3.5, 3.2, 3.6, 3.1, 2.9, 3.3, 2.8, 2.6, 2.9, 2.7]
  },
  repair: {
    color: '#ffd52a',
    data: [2.4, 2.6, 2.3, 2.1, 2.2, 1.9, 1.8, 2.0, 1.7, 1.6, 1.8, 1.7]
  },
  scrap: {
    color: '#ff4f8b',
    data: [1.2, 1.3, 1.1, 1.0, 1.1, 0.9, 0.8, 0.9, 0.8, 0.7, 0.8, 0.7]
  }
}

function createQualityOption(metricKey: 'rework' | 'repair' | 'scrap'): EChartsOption {
  const metric = qualityRates[metricKey]
  const label = qualityTabs.find((tab) => tab.key === metricKey)?.label ?? ''

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.name}<br/>${label}: ${item.value}%`
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
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: label,
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
   4. 人员分析：班组分组条形图（总人数 / 排班人数 + 利用率圆点）
   ========================= */
const COLOR_TOTAL = '#20cfff'
const COLOR_SCHEDULED = '#ff9f43'
const COLOR_RATE = '#4ee6a6'

/** 5 个班组：总人数 / 排班人数，利用率 = 排班人数 ÷ 总人数 */
const crewGroups = [
  { name: '大机', total: 32, scheduled: 28 },
  { name: '新产品', total: 28, scheduled: 25 },
  { name: '机体', total: 35, scheduled: 30 },
  { name: '曲轴', total: 26, scheduled: 23 },
  { name: '制芯', total: 24, scheduled: 20 }
]

const crewRate = crewGroups.map((group) =>
  Number(((group.scheduled / group.total) * 100).toFixed(1))
)
/** 利用率圆点在人数轴上的固定位置（横轴 max 留出标注区） */
const RATE_DOT_X = 41
const CREW_AXIS_MAX = 50

const personnelOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const group = crewGroups[list[0].dataIndex]
      if (!group) return ''
      const rate = ((group.scheduled / group.total) * 100).toFixed(1)
      return (
        `${group.name}<br/>` +
        `${list[0].marker} 班组总人数: ${group.total} 人<br/>` +
        `${list[1]?.marker ?? ''} 排班人数: ${group.scheduled} 人<br/>` +
        `人员利用率: ${rate}%`
      )
    }
  },
  legend: {
    data: ['班组总人数', '排班人数', '人员利用率'],
    textStyle: { color: '#a9c9d4', fontSize: 11 },
    top: 5,
    itemWidth: 14,
    itemHeight: 8
  },
  grid: { left: '2%', right: '6%', bottom: '3%', top: '16%', containLabel: true },
  xAxis: {
    type: 'value',
    name: '人',
    max: CREW_AXIS_MAX,
    nameTextStyle: axisNameStyle,
    axisLabel,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine
  },
  yAxis: {
    type: 'category',
    data: crewGroups.map((group) => group.name),
    inverse: true,
    axisLabel: { color: '#dff8ff', fontSize: 12 },
    axisLine,
    axisTick: { show: false }
  },
  series: [
    {
      name: '班组总人数',
      type: 'bar',
      data: crewGroups.map((group) => group.total),
      barWidth: '32%',
      barGap: '30%',
      itemStyle: { color: COLOR_TOTAL, borderRadius: [0, 3, 3, 0] },
      label: { show: true, position: 'right', color: '#dff8ff', fontSize: 10, formatter: '{c} 人' }
    },
    {
      name: '排班人数',
      type: 'bar',
      data: crewGroups.map((group) => group.scheduled),
      barWidth: '32%',
      itemStyle: { color: COLOR_SCHEDULED, borderRadius: [0, 3, 3, 0] },
      label: { show: true, position: 'right', color: '#dff8ff', fontSize: 10, formatter: '{c} 人' }
    },
    {
      name: '人员利用率',
      type: 'scatter',
      data: crewRate.map((rate, index) => ({
        value: [RATE_DOT_X, index],
        rate
      })),
      symbol: 'circle',
      symbolSize: 9,
      itemStyle: { color: COLOR_RATE, borderColor: '#061821', borderWidth: 1 },
      label: {
        show: true,
        position: 'right',
        color: COLOR_RATE,
        fontSize: 10,
        formatter: (params: any) => `利用率 ${params.data.rate}%`
      },
      tooltip: { show: false }
    }
  ]
}

/* =========================
   5. 设备分析：月度设备指标（折线，MTTR / MTBF / 可动率 / 故障停机率 下拉切换）
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
   6. 成本分析：趋势（成本项下拉 + 柱状，元/吨）/ 占比（环形，总成本）
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

/** 六宫格：3 列 × 2 行，与生产运营大屏布局一致；首格按产品 tab 切换数据 */
const panels = computed(() => [
  {
    title: '产线产出分析',
    option: productionAnalysisOption.value,
    tabs: seriesTabs,
    activeKey: activeSeriesKey.value
  },
  { title: '生产统计', option: productionStatsOption.value, tabs: statsTabs, activeKey: activeStatsKey.value },
  { title: '质量分析', option: qualityOption.value, tabs: qualityTabs, activeKey: activeQualityKey.value },
  { title: '人员分析', option: personnelOption },
  {
    title: '设备分析',
    option: equipmentOption.value,
    tabs: equipmentTabs,
    activeKey: activeEquipmentKey.value,
    mode: 'select'
  },
  {
    title: '成本分析',
    option: costOption.value,
    tabs: costTabs,
    activeKey: activeCostKey.value,
    ...(activeCostKey.value === 'trend'
      ? { subTabs: costItemTabs, subActiveKey: activeCostItemKey.value }
      : {})
  }
])

/** 面板 tab 切换：产线产出按产品、生产统计按口径、质量分析按指标、设备分析按指标、成本分析按视图 */
function handleTabChange(payload: { title: string; key: string }) {
  if (payload.title === '产线产出分析') {
    activeSeriesKey.value = payload.key
  } else if (payload.title === '生产统计') {
    activeStatsKey.value = payload.key as 'tons' | 'units'
  } else if (payload.title === '质量分析') {
    activeQualityKey.value = payload.key as 'scrap' | 'repair' | 'rework'
  } else if (payload.title === '设备分析') {
    activeEquipmentKey.value = payload.key as 'mttr' | 'mtbf' | 'availability' | 'downtime'
  } else if (payload.title === '成本分析') {
    activeCostKey.value = payload.key as 'trend' | 'share'
  }
}

/** 次级下拉切换：成本分析趋势视图下的成本项 */
function handleSubChange(payload: { title: string; key: string }) {
  if (payload.title === '成本分析') {
    activeCostItemKey.value = payload.key
  }
}
</script>

<template>
  <LineDashboardShell
    title="造型产线可视化"
    :indicators="indicators"
    :panels="panels"
    @tab-change="handleTabChange"
    @sub-change="handleSubChange"
  />
</template>
