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
    { value: 60, name: '线上', itemStyle: { color: '#4472c4' } },
    { value: 40, name: '线下', itemStyle: { color: '#70ad47' } }
  ],
  ironTypes: [
    { value: 45, name: '灰铁', itemStyle: { color: '#4472c4' } },
    { value: 30, name: '球铁', itemStyle: { color: '#70ad47' } },
    { value: 25, name: '蠕铁', itemStyle: { color: '#ffc000' } }
  ],
  productSeries: [
    { value: 35, name: '中速机', itemStyle: { color: '#4472c4' } },
    { value: 28, name: '博杜安', itemStyle: { color: '#70ad47' } },
    { value: 22, name: '重潍柴', itemStyle: { color: '#ffc000' } },
    { value: 15, name: '大机', itemStyle: { color: '#3ba8a0' } }
  ]
}

const inboundAnalysisData: Record<AnalysisKey, PieDatum[]> = {
  onlineOffline: [
    { value: 55, name: '线上', itemStyle: { color: '#4472c4' } },
    { value: 45, name: '线下', itemStyle: { color: '#70ad47' } }
  ],
  ironTypes: [
    { value: 42, name: '灰铁', itemStyle: { color: '#4472c4' } },
    { value: 32, name: '球铁', itemStyle: { color: '#70ad47' } },
    { value: 26, name: '蠕铁', itemStyle: { color: '#ffc000' } }
  ],
  productSeries: [
    { value: 33, name: '中速机', itemStyle: { color: '#4472c4' } },
    { value: 27, name: '博杜安', itemStyle: { color: '#70ad47' } },
    { value: 24, name: '重潍柴', itemStyle: { color: '#ffc000' } },
    { value: 16, name: '大机', itemStyle: { color: '#3ba8a0' } }
  ]
}

const yearlyAnalysis = {
  categories: ['2019年', '2020年', '2021年', '2022年', '2023年', '2024年', '2025年'],
  output: [2800, 3100, 3350, 3200, 3500, 3650, 3400],
  inbound: [2750, 3050, 3300, 3150, 3450, 3600, 3350]
}

const annualIndicators = [
  { label: '出产完成率', value: '64%', colorClass: 'indicator-green' },
  { label: '入库完成率', value: '64%', colorClass: 'indicator-blue' },
  { label: '入均出产比', value: '64吨', colorClass: 'indicator-yellow' }
]

const productionSummary = {
  output: { cumulative: '3,400', monthly: '285', mom: '+8.5%', yoy: '+12.3%' },
  inbound: { cumulative: '3,350', monthly: '280', mom: '+7.8%', yoy: '+11.5%' }
}

const productSeriesList: ProductSeries[] = [
  {
    key: 'mediumSpeed',
    name: '中速机',
    color: '#70ad47',
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
    color: '#4472c4',
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
    color: '#ffc000',
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
    color: '#3ba8a0',
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
    color: '#FF6B9D',
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
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: 'rgba(68, 114, 196, 0.3)',
  textStyle: { color: '#333' }
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
      textStyle: { color: '#666', fontSize: 12 },
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
      textStyle: { color: '#666', fontSize: 11 },
      top: 5
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: yearlyAnalysis.categories,
      axisLabel: { color: '#666', fontSize: 10 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#666', fontSize: 10 },
      axisLabel: { color: '#666', fontSize: 10, formatter: '{value}' },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(148, 163, 184, 0.3)' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '出产量',
        type: 'line',
        data: yearlyAnalysis.output,
        lineStyle: { color: '#70ad47', width: 3 },
        itemStyle: { color: '#70ad47', borderWidth: 2, borderColor: '#fff' },
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
              { offset: 0, color: 'rgba(112, 173, 71, 0.3)' },
              { offset: 1, color: 'rgba(112, 173, 71, 0.05)' }
            ]
          }
        }
      },
      {
        name: '入库量',
        type: 'line',
        data: yearlyAnalysis.inbound,
        lineStyle: { color: '#4472c4', width: 3 },
        itemStyle: { color: '#4472c4', borderWidth: 2, borderColor: '#fff' },
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
              { offset: 0, color: 'rgba(91, 143, 249, 0.3)' },
              { offset: 1, color: 'rgba(91, 143, 249, 0.05)' }
            ]
          }
        }
      }
    ]
  } as EChartsOption
}

/** 产品系列双轴柱状图 */
function createProductOption(series: ProductSeries): EChartsOption {
  const labelStyle = { show: true, position: 'top' as const, color: '#333', fontSize: 10 }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      textStyle: { color: '#333', fontSize: 11 }
    },
    legend: {
      data: ['出产台数', '入库台数', '出产吨位', '入库吨位'],
      textStyle: { color: '#666', fontSize: 9 },
      top: 5,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 6
    },
    grid: { left: '12%', right: '12%', bottom: '10%', top: '18%', containLabel: false },
    xAxis: {
      type: 'category',
      data: ['2024', '2025'],
      axisLabel: { color: '#666', fontSize: 12, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '台数',
        nameTextStyle: { color: '#666', fontSize: 10 },
        position: 'left',
        axisLabel: { color: '#666', fontSize: 10 },
        axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      {
        type: 'value',
        name: '吨数',
        nameTextStyle: { color: '#666', fontSize: 10 },
        position: 'right',
        axisLabel: { color: '#666', fontSize: 10 },
        axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(148, 163, 184, 0.3)' } }
      }
    ],
    series: [
      {
        name: '出产台数',
        type: 'bar',
        yAxisIndex: 0,
        data: series.data.outputUnits,
        itemStyle: { color: '#4472c4', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      },
      {
        name: '入库台数',
        type: 'bar',
        yAxisIndex: 0,
        data: series.data.inboundUnits,
        itemStyle: { color: '#3ba8a0', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      },
      {
        name: '出产吨位',
        type: 'bar',
        yAxisIndex: 1,
        data: series.data.outputTons,
        itemStyle: { color: '#70ad47', borderRadius: [4, 4, 0, 0] },
        barWidth: 15,
        label: labelStyle
      },
      {
        name: '入库吨位',
        type: 'bar',
        yAxisIndex: 1,
        data: series.data.inboundTons,
        itemStyle: { color: '#ffc000', borderRadius: [4, 4, 0, 0] },
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
const yearlyOption = createYearlyOption()

const productCharts = productSeriesList.map((series) => ({
  series,
  option: createProductOption(series)
}))
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="生产运营管理大屏"
      weather="潍坊 18℃ 晴"
    />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧列 -->
      <div class="column">
        <!-- 出产概况 -->
        <div class="data-panel" style="height: 200px">
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
            <h3 class="panel-title">出产概况</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in outputTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: outputTab === tab.key }"
                @click="outputTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="data-cards">
            <div class="data-card">
              <div class="data-card-label">当月产量</div>
              <div class="data-card-value">
                {{ outputOverview.monthly }}<span class="data-card-unit">吨</span>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-label">年度产量</div>
              <div class="data-card-value">
                {{ outputOverview.yearly }}<span class="data-card-unit">吨</span>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-label">同期产量</div>
              <div class="data-card-value">
                {{ outputOverview.sameperiod }}<span class="data-card-unit">吨</span>
              </div>
            </div>
          </div>

          <div class="progress-container">
            <div class="progress-header">
              <span>占去年同期比例</span>
              <span>{{ outputOverview.ratio }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${outputOverview.ratio}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 出产分析 -->
        <div class="data-panel" style="height: 280px">
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
            <EChart :option="outputPieOption" height="200px" />
          </div>
        </div>

        <!-- 入库概况 -->
        <div class="data-panel" style="height: 200px">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <h3 class="panel-title">入库概况</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in inboundTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: inboundTab === tab.key }"
                @click="inboundTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="data-cards">
            <div class="data-card">
              <div class="data-card-label">当月入库</div>
              <div class="data-card-value">
                {{ inboundOverview.monthly }}<span class="data-card-unit">吨</span>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-label">年度入库</div>
              <div class="data-card-value">
                {{ inboundOverview.yearly }}<span class="data-card-unit">吨</span>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-label">同期入库</div>
              <div class="data-card-value">
                {{ inboundOverview.sameperiod }}<span class="data-card-unit">吨</span>
              </div>
            </div>
          </div>

          <div class="progress-container">
            <div class="progress-header">
              <span>占去年同期比例</span>
              <span>{{ inboundOverview.ratio }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${inboundOverview.ratio}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 入库分析 -->
        <div class="data-panel" style="height: 280px">
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
            <EChart :option="inboundPieOption" height="200px" />
          </div>
        </div>
      </div>

      <!-- 中间列 -->
      <div class="column">
        <!-- 年度指标 -->
        <div class="data-panel" style="height: 200px">
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
            <h3 class="panel-title">年度指标</h3>
          </div>

          <div class="annual-indicators">
            <div v-for="item in annualIndicators" :key="item.label" class="indicator-card">
              <div class="indicator-label">{{ item.label }}</div>
              <div class="indicator-value" :class="item.colorClass">{{ item.value }}</div>
            </div>
          </div>
        </div>

        <!-- 年度产量 -->
        <div class="data-panel" style="height: 380px">
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
            <h3 class="panel-title">年度产量</h3>
          </div>

          <div class="annual-production">
            <div class="daily-card">
              <div class="daily-label">当日出产</div>
              <div class="daily-value indicator-green">80吨</div>
            </div>
            <div class="daily-card">
              <div class="daily-label">当日入库</div>
              <div class="daily-value indicator-blue">80吨</div>
            </div>
          </div>

          <div class="production-summary">
            <div class="summary-card">
              <div class="summary-title indicator-green">年度出产总量</div>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-item-label">累计</div>
                  <div class="summary-item-value">{{ productionSummary.output.cumulative }}</div>
                  <div class="summary-item-unit">吨</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-label">当月</div>
                  <div class="summary-item-value">{{ productionSummary.output.monthly }}</div>
                  <div class="summary-item-unit">吨</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-label">环比</div>
                  <div class="summary-item-percent">{{ productionSummary.output.mom }}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-label">同比</div>
                  <div class="summary-item-percent">{{ productionSummary.output.yoy }}</div>
                </div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-title indicator-blue">年度入库总量</div>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-item-label">累计</div>
                  <div class="summary-item-value">{{ productionSummary.inbound.cumulative }}</div>
                  <div class="summary-item-unit">吨</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-label">当月</div>
                  <div class="summary-item-value">{{ productionSummary.inbound.monthly }}</div>
                  <div class="summary-item-unit">吨</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-label">环比</div>
                  <div class="summary-item-percent">{{ productionSummary.inbound.mom }}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-item-label">同比</div>
                  <div class="summary-item-percent">{{ productionSummary.inbound.yoy }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年度分析 -->
        <div class="data-panel" style="height: 396px">
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
        <div class="data-panel" style="height: 712px; overflow: hidden">
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
          </div>

          <div class="production-details-scroll" style="flex: 1; overflow-y: auto; padding-right: 8px">
            <div v-for="item in productCharts" :key="item.series.key" style="margin-bottom: 20px">
              <div
                :style="{
                  color: item.series.color,
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '12px'
                }"
              >
                {{ item.series.name }}系列
              </div>
              <EChart :option="item.option" height="280px" />
            </div>
          </div>
        </div>

        <!-- 考核计划完工情况 -->
        <div class="data-panel" style="height: 280px">
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
            <h3 class="panel-title">考核计划完工情况</h3>
          </div>

          <div class="assessment-scroll" style="flex: 1; overflow-y: auto">
            <table class="assessment-table">
              <thead>
                <tr>
                  <th>计划项目</th>
                  <th>计划量</th>
                  <th>实际完工</th>
                  <th>完成率</th>
                  <th>未完成原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in assessmentRows" :key="row.project">
                  <td>{{ row.project }}</td>
                  <td>{{ row.plan }}</td>
                  <td>{{ row.actual }}</td>
                  <td>
                    <span :class="row.passed ? 'completion-success' : 'completion-warning'">
                      {{ row.rate }}
                    </span>
                  </td>
                  <td>
                    <span v-if="row.reason !== '-'" class="abnormal-issue">{{ row.reason }}</span>
                    <template v-else>-</template>
                  </td>
                </tr>
              </tbody>
            </table>
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
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 16px;
  height: calc(100vh - 200px);
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

/* 年度指标样式 */
.annual-indicators {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  flex: 1;
  align-items: center;
}

.indicator-card {
  text-align: center;
  padding: 20px;
  background: rgba(242, 242, 242, 0.3);
  border-radius: 6px;
}

.indicator-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.indicator-value {
  font-size: 36px;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
