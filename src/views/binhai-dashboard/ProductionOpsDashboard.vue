<script setup lang="ts">

import { computed, ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 生产运营大屏静态数据（迁移自 production-ops-dashboard.html 内联脚本） */

type IronType = 'gray' | 'ball' | 'vermicular'
type AnalysisKey = 'onlineOffline' | 'ironTypes' | 'productSeries'

interface OverviewItem {
  monthly: number
  yearly: number
  sameperiod: number
  ratio: number
}

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

const outputOverviewData: Record<IronType, OverviewItem> = {
  gray: { monthly: 60, yearly: 600, sameperiod: 100, ratio: 60 },
  ball: { monthly: 45, yearly: 480, sameperiod: 85, ratio: 53 },
  vermicular: { monthly: 35, yearly: 380, sameperiod: 70, ratio: 50 }
}

const inboundOverviewData: Record<IronType, OverviewItem> = {
  gray: { monthly: 58, yearly: 580, sameperiod: 98, ratio: 59 },
  ball: { monthly: 43, yearly: 460, sameperiod: 82, ratio: 52 },
  vermicular: { monthly: 33, yearly: 360, sameperiod: 68, ratio: 49 }
}

const outputAnalysisData: Record<AnalysisKey, PieDatum[]> = {
  onlineOffline: [
    { value: 60, name: '线上', itemStyle: { color: '#20cfff' } },
    { value: 40, name: '线下', itemStyle: { color: '#4ee6a6' } }
  ],
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

const inboundAnalysisData: Record<AnalysisKey, PieDatum[]> = {
  onlineOffline: [
    { value: 55, name: '线上', itemStyle: { color: '#20cfff' } },
    { value: 45, name: '线下', itemStyle: { color: '#4ee6a6' } }
  ],
  ironTypes: [
    { value: 42, name: '灰铁', itemStyle: { color: '#20cfff' } },
    { value: 32, name: '球铁', itemStyle: { color: '#4ee6a6' } },
    { value: 26, name: '蠕铁', itemStyle: { color: '#ffd52a' } }
  ],
  productSeries: [
    { value: 33, name: '中速机', itemStyle: { color: '#20cfff' } },
    { value: 27, name: '博杜安', itemStyle: { color: '#4ee6a6' } },
    { value: 24, name: '重潍柴', itemStyle: { color: '#ffd52a' } },
    { value: 16, name: '大机', itemStyle: { color: '#9b8cff' } }
  ]
}

const yearlyAnalysis = {
  categories: ['2019年', '2020年', '2021年', '2022年', '2023年', '2024年', '2025年'],
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

/** 出产 / 入库分析环形图 */
function createPieOption(data: PieDatum[]): EChartsOption {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return {
    tooltip: {
      trigger: 'item',
      ...tooltipBase,
      formatter: '{b}: {c}吨 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#a9c9d4', fontSize: 12 },
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 10,
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name)
        if (!item) return name
        const percent = ((item.value / total) * 100).toFixed(1)
        return `${name} ${item.value}吨 (${percent}%)`
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data,
        label: { show: false }
      }
    ]
  } as EChartsOption
}

/** 年度出产 / 入库趋势图 */
function createYearlyOption(): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        let result = `${list[0]?.axisValue ?? ''}<br/>`
        list.forEach((item: any) => {
          result += `${item.marker} ${item.seriesName}: ${item.value} 吨<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['出产量', '入库量'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: yearlyAnalysis.categories,
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLabel: { color: '#a9c9d4', fontSize: 10, formatter: '{value}' },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(72, 164, 194, 0.24)' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '出产量',
        type: 'line',
        data: yearlyAnalysis.output,
        lineStyle: { color: '#20cfff', width: 3 },
        itemStyle: { color: '#20cfff', borderWidth: 2, borderColor: '#061821' },
        symbol: 'circle',
        symbolSize: 8,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(32, 207, 255, 0.36)' },
              { offset: 1, color: 'rgba(32, 207, 255, 0.02)' }
            ]
          }
        }
      },
      {
        name: '入库量',
        type: 'line',
        data: yearlyAnalysis.inbound,
        lineStyle: { color: '#ffd52a', width: 3 },
        itemStyle: { color: '#ffd52a', borderWidth: 2, borderColor: '#061821' },
        symbol: 'circle',
        symbolSize: 8,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 213, 42, 0.3)' },
              { offset: 1, color: 'rgba(255, 213, 42, 0.02)' }
            ]
          }
        }
      }
    ]
  } as EChartsOption
}

/** 月度出产 / 入库柱状图 */
function createMonthlyOption(): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipBase
    },
    legend: {
      data: ['出产量', '入库量'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 5
    },
    grid: { left: '3%', right: '3%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyAnalysis.categories,
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
      {
        name: '出产量',
        type: 'bar',
        data: monthlyAnalysis.output,
        barWidth: '34%',
        itemStyle: {
          color: '#20cfff',
          borderRadius: [3, 3, 0, 0],
          shadowColor: 'rgba(32, 207, 255, 0.35)',
          shadowBlur: 8
        }
      },
      {
        name: '入库量',
        type: 'bar',
        data: monthlyAnalysis.inbound,
        barWidth: '34%',
        itemStyle: {
          color: '#ffd52a',
          borderRadius: [3, 3, 0, 0],
          shadowColor: 'rgba(255, 213, 42, 0.28)',
          shadowBlur: 8
        }
      }
    ]
  } as EChartsOption
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

const outputTabs: { key: IronType; label: string }[] = [
  { key: 'gray', label: '灰铁产量' },
  { key: 'ball', label: '球铁产量' },
  { key: 'vermicular', label: '蠕铁产量' }
]

const inboundTabs: { key: IronType; label: string }[] = [
  { key: 'gray', label: '灰铁入库' },
  { key: 'ball', label: '球铁入库' },
  { key: 'vermicular', label: '蠕铁入库' }
]

const analysisTabs: { key: AnalysisKey; label: string }[] = [
  { key: 'onlineOffline', label: '线上线下' },
  { key: 'ironTypes', label: '灰铁球铁蠕铁' },
  { key: 'productSeries', label: '产品系列' }
]

const outputTab = ref<IronType>('gray')
const inboundTab = ref<IronType>('gray')
const outputAnalysisKey = ref<AnalysisKey>('onlineOffline')
const inboundAnalysisKey = ref<AnalysisKey>('onlineOffline')

const outputOverview = computed(() => outputOverviewData[outputTab.value])
const inboundOverview = computed(() => inboundOverviewData[inboundTab.value])

const outputPieOption = computed(() => createPieOption(outputAnalysisData[outputAnalysisKey.value]))
const inboundPieOption = computed(() => createPieOption(inboundAnalysisData[inboundAnalysisKey.value]))
const monthlyOption = createMonthlyOption()
const yearlyOption = createYearlyOption()
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
            <EChart :option="outputPieOption" height="100%" />
          </div>
        </div>

        <!-- 入库分析 -->
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
            <h3 class="panel-title">入库分析</h3>
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
          <div class="chart-container">
            <EChart :option="inboundPieOption" height="100%" />
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

<style scoped>
/* 生产运营管理大屏样式（迁移自 production-ops-dashboard.html） */

.dashboard-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;
}

/* 顶部标题栏样式 */
.title-decoration-left,
/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: repeat(3, 608px);
  gap: 24px;
  height: auto;
  min-height: calc(100vh - 310px);
}

.top-indicators {
  display: grid;
  grid-template-columns: repeat(6, 292px);
  gap: 24px;
  margin-bottom: 12px;
}

.top-indicator-card {
  position: relative;
  width: 292px;
  height: 125px;
  min-height: 125px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  color: #dff8ff;
  background-color: #082532;
  background-image:
    linear-gradient(135deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    linear-gradient(90deg, rgba(0, 196, 240, 0.1), transparent 58%);
  border: 1px solid rgba(0, 190, 235, 0.56);
  border-radius: 3px;
  box-shadow:
    inset 0 0 22px rgba(0, 154, 201, 0.09),
    0 0 10px rgba(0, 0, 0, 0.24);
}

.top-indicator-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 58%;
  height: 2px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.82);
}

.top-indicator-card::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 34%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(38, 217, 255, 0.86));
}

.top-indicator-content {
  position: relative;
  z-index: 1;
}

.top-indicator-label {
  margin-bottom: 8px;
  color: #a9c9d4;
  font-size: 14px;
  letter-spacing: 1px;
}

.top-indicator-value {
  color: #ffd91a;
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 14px rgba(255, 217, 26, 0.36);
}

.top-indicator-unit {
  margin-left: 7px;
  color: #b8d6df;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
}

.top-indicator-icon {
  position: relative;
  z-index: 1;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #62e8ff;
  background: rgba(0, 174, 220, 0.15);
  border: 1px solid rgba(55, 220, 255, 0.68);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  box-shadow: inset 0 0 16px rgba(55, 220, 255, 0.16);
}

.top-indicator-card.tone-inbound .top-indicator-icon {
  color: #8fffd0;
  background: rgba(43, 214, 157, 0.12);
  border-color: rgba(83, 255, 197, 0.58);
}

.column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 数据面板样式 */
.data-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 1px solid rgba(68, 114, 196, 0.4);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(68, 114, 196, 0.2);
  width: 100%;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(68, 114, 196, 0.2);
  border-radius: 6px;
  margin-right: 12px;
  color: #4472c4;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* 角装饰 */
.corner-tl,
.corner-tr,
.corner-bl,
.corner-br {
  position: absolute;
  width: 12px;
  height: 12px;
  z-index: 10;
}

.corner-tl {
  top: 0;
  left: 0;
  border-top: 2px solid #4472c4;
  border-left: 2px solid #4472c4;
}

.corner-tr {
  top: 0;
  right: 0;
  border-top: 2px solid #4472c4;
  border-right: 2px solid #4472c4;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid #4472c4;
  border-left: 2px solid #4472c4;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid #4472c4;
  border-right: 2px solid #4472c4;
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  margin-left: auto;
  flex-shrink: 0;
}

.tab-button {
  background: rgba(242, 242, 242, 0.5);
  border: 1px solid rgba(68, 114, 196, 0.3);
  color: #666;
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-button:first-child {
  border-radius: 4px 0 0 4px;
}

.tab-button:last-child {
  border-radius: 0 4px 4px 0;
}

.tab-button.active {
  background: rgba(112, 173, 71, 0.2);
  border-color: #70ad47;
  color: #70ad47;
}

.tab-button:hover {
  color: #70ad47;
}

.product-tabs {
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.product-tabs .tab-button {
  padding: 4px 6px;
  font-size: 10px;
}

.product-detail-chart {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 数据卡片样式 */
.data-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}

.data-card {
  text-align: center;
  padding: 12px;
  background: rgba(242, 242, 242, 0.3);
  border-radius: 6px;
}

.data-card-label {
  color: #666;
  font-size: 12px;
  margin-bottom: 8px;
}

.data-card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.data-card-unit {
  font-size: 14px;
  margin-left: 4px;
}

/* 进度条样式 */
.progress-container {
  margin-top: 0;
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666 !important;
  margin-bottom: 8px;
  width: 100%;
}

.progress-header span {
  color: #666 !important;
  display: inline-block;
  line-height: 1.2;
}

.progress-header span:first-child {
  flex: 0 0 auto;
  white-space: nowrap;
}

.progress-header span:last-child {
  flex: 0 0 auto;
  margin-left: 8px;
  font-weight: bold;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(242, 242, 242, 0.6);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #70ad47;
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

/* 图表容器 */
.chart-container {
  flex: 1;
  min-height: 200px;
  position: relative;
}

/* 生产指标样式 */
.production-indicators {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  flex: 1;
  align-items: center;
}

.indicator-card {
  text-align: center;
  padding: 10px;
  background: rgba(242, 242, 242, 0.3);
  border-radius: 6px;
}

.indicator-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 6px;
}

.indicator-value {
  font-size: 26px;
  font-weight: bold;
}

.indicator-green {
  color: #70ad47;
}

.indicator-blue {
  color: #4472c4;
}

.indicator-yellow {
  color: #ffc000;
}

/* 年度产量样式 */
.annual-production {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.daily-card {
  text-align: center;
  padding: 16px;
  background: rgba(242, 242, 242, 0.3);
  border-radius: 6px;
}

.daily-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.daily-value {
  font-size: 28px;
  font-weight: bold;
}

.production-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-card {
  padding: 16px;
  background: rgba(242, 242, 242, 0.3);
  border-radius: 6px;
}

.summary-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.summary-item {
  text-align: center;
}

.summary-item-label {
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-item-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.summary-item-unit {
  color: #666;
  font-size: 12px;
}

.summary-item-percent {
  font-size: 16px;
  font-weight: bold;
  color: #70ad47;
}

/* 表格样式 */
.assessment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.assessment-table th {
  background: rgba(242, 242, 242, 0.8);
  color: #475569;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(68, 114, 196, 0.3);
  font-weight: 500;
  text-align: center;
}

.assessment-table td {
  background: rgba(255, 255, 255, 0.6);
  color: #333;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(68, 114, 196, 0.1);
  text-align: center;
}

.assessment-table tr:hover td {
  background: rgba(242, 242, 242, 0.7);
}

.completion-success {
  color: #70ad47;
  font-weight: 500;
}

.completion-warning {
  color: #ff4d4f;
  font-weight: 500;
}

.abnormal-issue {
  color: #ff4d4f;
  font-weight: 500;
}

/* 滚动条样式 */
.production-details-scroll::-webkit-scrollbar {
  width: 4px;
}

.production-details-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.production-details-scroll::-webkit-scrollbar-thumb {
  background: rgba(68, 114, 196, 0.3);
  border-radius: 2px;
}

.production-details-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(68, 114, 196, 0.5);
}

.assessment-scroll::-webkit-scrollbar {
  width: 4px;
}

.assessment-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.assessment-scroll::-webkit-scrollbar-thumb {
  background: rgba(68, 114, 196, 0.3);
  border-radius: 2px;
}

.assessment-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(68, 114, 196, 0.5);
}

/* =========================
   FUI 数据大屏视觉风格
   旧选择器保留用于对照，实际生效规则见下方修正区块
.dashboard-container {
  width: 100%;
  min-height: calc(100vh - 132px) !important;
  padding: 10px !important;
  color: #dff8ff !important;
  background-color: #041019 !important;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(0, 166, 216, 0.12), transparent 27%),
    radial-gradient(circle at 82% 78%, rgba(0, 119, 177, 0.1), transparent 31%),
    linear-gradient(rgba(35, 146, 177, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 146, 177, 0.055) 1px, transparent 1px);
  background-size: auto, auto, 32px 32px, 32px 32px;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.46);
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
}

.dashboard-container .dash-header[data-v] {
  margin-bottom: 10px !important;
}

.dashboard-container .main-content[data-v] {
  gap: 12px !important;
}

.dashboard-container .column[data-v] {
  gap: 12px !important;
}

.dashboard-container .data-panel[data-v] {
  color: #dff8ff !important;
  background-color: #061821 !important;
  background-image:
    linear-gradient(180deg, rgba(8, 35, 47, 0.96), rgba(5, 23, 32, 0.97)),
    linear-gradient(90deg, rgba(0, 184, 226, 0.035), transparent 32%) !important;
  border: 1px solid rgba(0, 191, 235, 0.48) !important;
  border-radius: 2px !important;
  padding: 12px 14px !important;
  box-shadow:
    inset 0 0 24px rgba(0, 157, 205, 0.055),
    0 0 12px rgba(0, 0, 0, 0.24) !important;
}

.dashboard-container .data-panel[data-v]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  width: 74px;
  height: 2px;
  background: #18d2ff;
  box-shadow: 0 0 8px rgba(24, 210, 255, 0.9);
}

.dashboard-container .data-panel[data-v]::after {
  content: '';
  position: absolute;
  right: -1px;
  bottom: 14px;
  width: 3px;
  height: 42px;
  background: linear-gradient(180deg, transparent, #18d2ff, transparent);
  opacity: 0.75;
}

.dashboard-container .data-panel > .panel-header[data-v] {
  min-height: 34px;
  margin-bottom: 10px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px dashed rgba(0, 185, 226, 0.34) !important;
}

.dashboard-container .data-panel .panel-icon[data-v] {
  display: flex !important;
  width: 28px;
  height: 28px;
  margin-right: 9px;
  color: #40e3ff;
  background: rgba(0, 176, 220, 0.14);
  border: 1px solid rgba(35, 211, 255, 0.48);
  border-radius: 2px;
  box-shadow: inset 0 0 10px rgba(35, 211, 255, 0.12);
}

.dashboard-container .data-panel .panel-title[data-v] {
  display: inline-block;
  margin: 0;
  padding: 0;
  color: #f4fdff !important;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(31, 204, 255, 0.25);
}

.dashboard-container .data-panel .panel-title[data-v]::after {
  content: '';
  display: inline-block;
  width: 28px;
  height: 1px;
  margin-left: 10px;
  vertical-align: middle;
  background: linear-gradient(90deg, #17cfff, transparent);
}

.dashboard-container .corner-tl[data-v],
.dashboard-container .corner-tr[data-v],
.dashboard-container .corner-bl[data-v],
.dashboard-container .corner-br[data-v] {
  display: block !important;
  width: 14px;
  height: 14px;
  border-color: #1bd5ff !important;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
}

.dashboard-container .tab-button[data-v] {
  color: #9cc8d5 !important;
  background: rgba(4, 24, 33, 0.88) !important;
  border-color: rgba(0, 184, 225, 0.4) !important;
}

.dashboard-container .tab-button.active[data-v],
.dashboard-container .tab-button:hover[data-v] {
  color: #effcff !important;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34)) !important;
  border-color: #26d5ff !important;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
}

.dashboard-container .data-card[data-v],
.dashboard-container .indicator-card[data-v],
.dashboard-container .daily-card[data-v],
.dashboard-container .summary-card[data-v] {
  color: #dff8ff;
  position: relative;
  overflow: hidden;
  background-color: #071e29 !important;
  background-image:
    linear-gradient(180deg, rgba(11, 55, 72, 0.96), rgba(5, 27, 37, 0.98)),
    linear-gradient(135deg, rgba(0, 196, 240, 0.14), transparent 44%) !important;
  border: 1px solid rgba(0, 190, 235, 0.52) !important;
  border-radius: 3px;
  box-shadow:
    inset 0 0 18px rgba(0, 154, 201, 0.1),
    0 0 8px rgba(0, 0, 0, 0.26) !important;
}

.dashboard-container .data-card[data-v]::before,
.dashboard-container .indicator-card[data-v]::before,
.dashboard-container .daily-card[data-v]::before,
.dashboard-container .summary-card[data-v]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 46%;
  height: 2px;
  background: linear-gradient(90deg, #24d8ff, transparent);
  box-shadow: 0 0 7px rgba(36, 216, 255, 0.78);
}

.dashboard-container .data-card[data-v]::after,
.dashboard-container .indicator-card[data-v]::after,
.dashboard-container .daily-card[data-v]::after,
.dashboard-container .summary-card[data-v]::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(36, 216, 255, 0.8));
}

.dashboard-container .data-card[data-v] {
  background-color: #082532 !important;
  background-image:
    linear-gradient(180deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    repeating-linear-gradient(90deg, transparent 0 10px, rgba(38, 211, 255, 0.035) 10px 11px) !important;
}

.dashboard-container .indicator-card[data-v] {
  background-color: #071f2b !important;
}

.dashboard-container .daily-card[data-v] {
  background-color: #082532 !important;
  background-image:
    linear-gradient(180deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    linear-gradient(90deg, rgba(0, 196, 240, 0.08), transparent) !important;
}

.dashboard-container .summary-card[data-v] {
  background-color: #061c27 !important;
  background-image:
    linear-gradient(180deg, rgba(8, 43, 57, 0.96), rgba(5, 24, 33, 0.98)),
    repeating-linear-gradient(0deg, transparent 0 15px, rgba(38, 211, 255, 0.025) 15px 16px) !important;
}

.dashboard-container .data-card-label[data-v],
.dashboard-container .indicator-label[data-v],
.dashboard-container .daily-label[data-v],
.dashboard-container .summary-item-label[data-v] {
  color: #9fc3cf !important;
}

.dashboard-container .data-card-value[data-v],
.dashboard-container .daily-value[data-v] {
  color: #ffd91a;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 0 12px rgba(255, 217, 26, 0.36);
  font-variant-numeric: tabular-nums;
}

.dashboard-container .data-card-unit[data-v],
.dashboard-container .summary-item-unit[data-v] {
  color: #a7cad5 !important;
  font-size: 11px;
}

.dashboard-container .progress-header[data-v],
.dashboard-container .progress-header span[data-v] {
  color: #a8cbd6 !important;
}

.dashboard-container .progress-header span:last-child[data-v] {
  color: #ffd91a !important;
}

.dashboard-container .progress-bar[data-v] {
  height: 7px;
  background: rgba(0, 126, 165, 0.2);
  border: 1px solid rgba(0, 181, 224, 0.26);
  border-radius: 1px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.45);
}

.dashboard-container .progress-fill[data-v] {
  background: linear-gradient(90deg, #0aaad9, #35e4ff 72%, #ffd91a);
  border-radius: 1px;
  box-shadow: 0 0 9px rgba(53, 228, 255, 0.72);
}

.dashboard-container .indicator-green[data-v],
.dashboard-container .summary-title.indicator-green[data-v],
.dashboard-container .summary-item-percent[data-v] {
  color: #4ee6a6 !important;
  text-shadow: 0 0 10px rgba(78, 230, 166, 0.25);
}

.dashboard-container .indicator-blue[data-v],
.dashboard-container .summary-title.indicator-blue[data-v] {
  color: #31d7ff !important;
  text-shadow: 0 0 10px rgba(49, 215, 255, 0.28);
}

.dashboard-container .indicator-yellow[data-v] {
  color: #ffd91a !important;
  text-shadow: 0 0 10px rgba(255, 217, 26, 0.28);
}

.dashboard-container .indicator-value[data-v] {
  font-size: 28px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.dashboard-container .summary-title[data-v] {
  padding: 6px 8px;
  background: rgba(0, 156, 201, 0.09);
  border-bottom: 1px solid rgba(0, 184, 225, 0.24);
}

.dashboard-container .summary-item-value[data-v] {
  color: #f4fdff;
  font-variant-numeric: tabular-nums;
}

.dashboard-container .assessment-table[data-v] {
  color: #cde7ee;
}

.dashboard-container .assessment-table th[data-v] {
  color: #75dff7 !important;
  background: rgba(0, 143, 184, 0.17) !important;
  border-bottom: 1px solid rgba(0, 192, 235, 0.44) !important;
}

.dashboard-container .assessment-table td[data-v] {
  color: #cde7ee !important;
  background: rgba(5, 27, 37, 0.72) !important;
  border-bottom: 1px solid rgba(0, 154, 197, 0.16) !important;
}

.dashboard-container .assessment-table tbody tr:nth-child(odd) td[data-v] {
  background: rgba(7, 36, 48, 0.78) !important;
}

.dashboard-container .assessment-table tbody tr:hover td[data-v] {
  background: rgba(0, 169, 215, 0.13) !important;
}

.dashboard-container .completion-success[data-v] {
  color: #4ee6a6 !important;
}

.dashboard-container .completion-warning[data-v],
.dashboard-container .abnormal-issue[data-v] {
  color: #ff5f87 !important;
}

.dashboard-container .production-details-scroll[data-v]::-webkit-scrollbar-thumb,
.dashboard-container .assessment-scroll[data-v]::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.5) !important;
}

.dashboard-container .production-details-scroll[data-v]::-webkit-scrollbar-track,
.dashboard-container .assessment-scroll[data-v]::-webkit-scrollbar-track {
  background: rgba(0, 108, 145, 0.1) !important;
}

*/

/* 修正 Vue scoped 编译后的选择器，确保卡片背景实际生效 */
.dashboard-container {
  width: 100%;
  min-height: calc(100vh - 132px) !important;
  padding: 10px !important;
  color: #dff8ff !important;
  background-color: #041019 !important;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(0, 166, 216, 0.12), transparent 27%),
    radial-gradient(circle at 82% 78%, rgba(0, 119, 177, 0.1), transparent 31%),
    linear-gradient(rgba(35, 146, 177, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 146, 177, 0.055) 1px, transparent 1px);
  background-size: auto, auto, 32px 32px, 32px 32px;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.46);
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
}

.dashboard-container .dash-header {
  margin-bottom: 10px !important;
}

.dashboard-container .main-content,
.dashboard-container .column {
  gap: 24px !important;
}

.dashboard-container .data-panel {
  color: #dff8ff !important;
  background-color: #061821 !important;
  background-image:
    linear-gradient(180deg, rgba(8, 35, 47, 0.96), rgba(5, 23, 32, 0.97)),
    linear-gradient(90deg, rgba(0, 184, 226, 0.035), transparent 32%) !important;
  border: 1px solid rgba(0, 191, 235, 0.48) !important;
  border-radius: 2px !important;
  padding: 12px 14px !important;
  box-shadow:
    inset 0 0 24px rgba(0, 157, 205, 0.055),
    0 0 12px rgba(0, 0, 0, 0.24) !important;
}

.dashboard-container .data-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  width: 74px;
  height: 2px;
  background: #18d2ff;
  box-shadow: 0 0 8px rgba(24, 210, 255, 0.9);
}

.dashboard-container .data-panel::after {
  content: '';
  position: absolute;
  right: -1px;
  bottom: 14px;
  width: 3px;
  height: 42px;
  background: linear-gradient(180deg, transparent, #18d2ff, transparent);
  opacity: 0.75;
}

.dashboard-container .data-panel > .panel-header {
  min-height: 34px;
  margin-bottom: 10px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px dashed rgba(0, 185, 226, 0.34) !important;
}

.dashboard-container .data-panel .panel-icon {
  display: flex !important;
  width: 28px;
  height: 28px;
  margin-right: 9px;
  color: #40e3ff;
  background: rgba(0, 176, 220, 0.14);
  border: 1px solid rgba(35, 211, 255, 0.48);
  border-radius: 2px;
  box-shadow: inset 0 0 10px rgba(35, 211, 255, 0.12);
}

.dashboard-container .data-panel .panel-title {
  display: inline-block;
  margin: 0;
  padding: 0;
  color: #f4fdff !important;
  background: transparent !important;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(31, 204, 255, 0.25);
}

.dashboard-container .data-panel .panel-title::after {
  content: '';
  display: inline-block;
  width: 28px;
  height: 1px;
  margin-left: 10px;
  vertical-align: middle;
  background: linear-gradient(90deg, #17cfff, transparent);
}

.dashboard-container .corner-tl,
.dashboard-container .corner-tr,
.dashboard-container .corner-bl,
.dashboard-container .corner-br {
  display: block !important;
  width: 14px;
  height: 14px;
  border-color: #1bd5ff !important;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
}

.dashboard-container .tab-button {
  color: #9cc8d5 !important;
  background: rgba(4, 24, 33, 0.88) !important;
  border-color: rgba(0, 184, 225, 0.4) !important;
}

.dashboard-container .tab-button.active,
.dashboard-container .tab-button:hover {
  color: #effcff !important;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34)) !important;
  border-color: #26d5ff !important;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
}

.dashboard-container .data-card,
.dashboard-container .indicator-card,
.dashboard-container .daily-card,
.dashboard-container .summary-card {
  position: relative;
  overflow: hidden;
  color: #dff8ff;
  background-color: #071e29 !important;
  background-image:
    linear-gradient(180deg, rgba(11, 55, 72, 0.96), rgba(5, 27, 37, 0.98)),
    linear-gradient(135deg, rgba(0, 196, 240, 0.14), transparent 44%) !important;
  border: 1px solid rgba(0, 190, 235, 0.52) !important;
  border-radius: 3px !important;
  box-shadow:
    inset 0 0 18px rgba(0, 154, 201, 0.1),
    0 0 8px rgba(0, 0, 0, 0.26) !important;
}

.dashboard-container .data-card::before,
.dashboard-container .indicator-card::before,
.dashboard-container .daily-card::before,
.dashboard-container .summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 46%;
  height: 2px;
  background: linear-gradient(90deg, #24d8ff, transparent);
  box-shadow: 0 0 7px rgba(36, 216, 255, 0.78);
}

.dashboard-container .data-card::after,
.dashboard-container .indicator-card::after,
.dashboard-container .daily-card::after,
.dashboard-container .summary-card::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(36, 216, 255, 0.8));
}

.dashboard-container .data-card,
.dashboard-container .daily-card {
  background-color: #082532 !important;
  background-image:
    linear-gradient(180deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    repeating-linear-gradient(90deg, transparent 0 10px, rgba(38, 211, 255, 0.035) 10px 11px) !important;
}

.dashboard-container .indicator-card {
  background-color: #071f2b !important;
}

.dashboard-container .summary-card {
  background-color: #061c27 !important;
  background-image:
    linear-gradient(180deg, rgba(8, 43, 57, 0.96), rgba(5, 24, 33, 0.98)),
    repeating-linear-gradient(0deg, transparent 0 15px, rgba(38, 211, 255, 0.025) 15px 16px) !important;
}

.dashboard-container .data-card-label,
.dashboard-container .indicator-label,
.dashboard-container .daily-label,
.dashboard-container .summary-item-label {
  color: #9fc3cf !important;
}

.dashboard-container .data-card-value,
.dashboard-container .daily-value {
  color: #ffd91a !important;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 0 12px rgba(255, 217, 26, 0.36);
  font-variant-numeric: tabular-nums;
}

.dashboard-container .data-card-unit,
.dashboard-container .summary-item-unit {
  color: #a7cad5 !important;
  font-size: 11px;
}

.dashboard-container .progress-header,
.dashboard-container .progress-header span {
  color: #a8cbd6 !important;
}

.dashboard-container .progress-header span:last-child {
  color: #ffd91a !important;
}

.dashboard-container .progress-bar {
  height: 7px;
  background: rgba(0, 126, 165, 0.2) !important;
  border: 1px solid rgba(0, 181, 224, 0.26);
  border-radius: 1px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.45);
}

.dashboard-container .progress-fill {
  background: linear-gradient(90deg, #0aaad9, #35e4ff 72%, #ffd91a) !important;
  border-radius: 1px;
  box-shadow: 0 0 9px rgba(53, 228, 255, 0.72);
}

.dashboard-container .indicator-green,
.dashboard-container .summary-title.indicator-green,
.dashboard-container .summary-item-percent {
  color: #4ee6a6 !important;
  text-shadow: 0 0 10px rgba(78, 230, 166, 0.25);
}

.dashboard-container .indicator-blue,
.dashboard-container .summary-title.indicator-blue {
  color: #31d7ff !important;
  text-shadow: 0 0 10px rgba(49, 215, 255, 0.28);
}

.dashboard-container .indicator-yellow {
  color: #ffd91a !important;
  text-shadow: 0 0 10px rgba(255, 217, 26, 0.28);
}

.dashboard-container .indicator-value {
  font-size: 28px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.dashboard-container .summary-title {
  padding: 6px 8px;
  background: rgba(0, 156, 201, 0.09) !important;
  border-bottom: 1px solid rgba(0, 184, 225, 0.24);
}

.dashboard-container .summary-item-value {
  color: #f4fdff;
  font-variant-numeric: tabular-nums;
}

.dashboard-container .assessment-table {
  color: #cde7ee;
}

.dashboard-container .assessment-table th {
  color: #75dff7 !important;
  background: rgba(0, 143, 184, 0.17) !important;
  border-bottom: 1px solid rgba(0, 192, 235, 0.44) !important;
}

.dashboard-container .assessment-table td {
  color: #cde7ee !important;
  background: rgba(5, 27, 37, 0.72) !important;
  border-bottom: 1px solid rgba(0, 154, 197, 0.16) !important;
}

.dashboard-container .assessment-table tbody tr:nth-child(odd) td {
  background: rgba(7, 36, 48, 0.78) !important;
}

.dashboard-container .assessment-table tbody tr:hover td {
  background: rgba(0, 169, 215, 0.13) !important;
}

.dashboard-container .completion-success {
  color: #4ee6a6 !important;
}

.dashboard-container .completion-warning,
.dashboard-container .abnormal-issue {
  color: #ff5f87 !important;
}

.dashboard-container .production-details-scroll::-webkit-scrollbar-thumb,
.dashboard-container .assessment-scroll::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.5) !important;
}

.dashboard-container .production-details-scroll::-webkit-scrollbar-track,
.dashboard-container .assessment-scroll::-webkit-scrollbar-track {
  background: rgba(0, 108, 145, 0.1) !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .top-indicators {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
