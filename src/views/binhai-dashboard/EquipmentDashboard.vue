<script setup lang="ts">

import { computed, ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 设备管理大屏静态数据 */

interface KpiCard {
  title: string
  value: string
  unit?: string
  /** SVG path，图标由模板统一渲染为 24x24 */
  iconPath: string
}

interface PieDatum {
  value: number
  name: string
  color: string
}

interface DowntimeRow {
  dept: string
  device: string
  rate: string
}

interface AbnormalRow {
  line: string
  device: string
  issue: string
  handler: string
  duration: string
  time: string
}

interface BarSeries {
  name: string
  data: number[]
}

interface RateChartData {
  months: string[]
  bars: BarSeries[]
  lineName: string
  line: number[]
}

type FaultAnalysisKey = 'mtbf' | 'mttr'

interface FaultAnalysis {
  title: string
  unit: string
  xAxisData: string[]
  series: BarSeries[]
}

const iconEquipment =
  'M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z'
const iconInfo =
  'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'

const kpiCards: KpiCard[] = [
  { title: '设备总数', value: '85', unit: '台', iconPath: iconEquipment },
  {
    title: '设备可动率',
    value: '99',
    unit: '%',
    iconPath:
      'M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
  },
  {
    title: '主要设备完好率',
    value: '98',
    unit: '%',
    iconPath:
      'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
  },
  {
    title: '故障停机率',
    value: '2.2',
    unit: '%',
    iconPath:
      'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
  },
  { title: '平均间隔时间', value: '220', unit: 'Min', iconPath: iconInfo },
  { title: '平均维修时间', value: '4.2', unit: 'Min', iconPath: iconInfo },
  {
    title: '原值/净值（万元）',
    value: '5,178/3,896',
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
  },
  { title: '异常数量', value: '4', unit: '个', iconPath: iconInfo }
]

/** 设备总览：各产线设备分布 */
const equipmentDistribution: PieDatum[] = [
  { value: 28, name: '熔炼', color: '#ffc000' },
  { value: 32, name: '造型', color: '#70ad47' },
  { value: 15, name: '制芯', color: '#4472c4' },
  { value: 10, name: '清理', color: '#3ba8a0' }
]

/** 主要生产设备完好率 */
const intactRateData: RateChartData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月'],
  bars: [
    { name: '造型', data: [230, 135, 220, 130, 135, 175] },
    { name: '熔炼', data: [180, 95, 200, 135, 135, 110] },
    { name: '制芯', data: [210, 125, 195, 125, 130, 165] },
    { name: '清理', data: [195, 110, 185, 120, 125, 155] }
  ],
  lineName: '综合完好率',
  line: [320, 230, 100, 100, 100, 100]
}

/** 设备可动率 */
const availabilityRateData: RateChartData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月'],
  bars: [{ name: '设备异常时间', data: [190, 95, 195, 135, 135, 110] }],
  lineName: '设备可动率',
  line: [280, 300, 100, 100, 100, 100]
}

/** 设备故障分析（MTBF / MTTR 切换） */
const faultAnalysisData: Record<FaultAnalysisKey, FaultAnalysis> = {
  mtbf: {
    title: '平均间隔时间(MTBF)',
    unit: '小时',
    xAxisData: ['7月', '8月', '9月', '10月', '11月', '12月'],
    series: [
      { name: '造型', data: [130, 220, 150, 95, 70, 110] },
      { name: '熔炼', data: [125, 200, 145, 130, 75, 115] },
      { name: '制芯', data: [120, 210, 155, 125, 65, 105] },
      { name: '清理', data: [115, 195, 140, 120, 60, 100] }
    ]
  },
  mttr: {
    title: '平均修复时间(MTTR)',
    unit: '分钟',
    xAxisData: ['1日', '2日', '3日', '4日', '5日', '6日'],
    series: [
      { name: '造型', data: [22, 35, 12, 28, 45, 35] },
      { name: '熔炼', data: [25, 35, 25, 45, 35, 35] },
      { name: '制芯', data: [20, 32, 10, 25, 42, 32] },
      { name: '清理', data: [18, 30, 8, 22, 40, 30] }
    ]
  }
}

/** 主要生产设备故障停机率 */
const downtimeRows: DowntimeRow[] = [
  { dept: '造型四线', device: '大件造型线', rate: '22.22%' },
  { dept: '造型四线', device: '中件造型线', rate: '22.22%' },
  { dept: '造型四线', device: '中件造型线', rate: '22.22%' },
  { dept: '造型四线', device: '中件造型线', rate: '22.22%' },
  { dept: '造型四线', device: '中件造型线', rate: '22.22%' },
  { dept: '熔炼车间', device: '熔炼炉设备', rate: '18.50%' },
  { dept: '制芯车间', device: '制芯机组', rate: '15.30%' },
  { dept: '清理车间', device: '清理设备1号', rate: '12.80%' },
  { dept: '清理车间', device: '清理设备2号', rate: '10.50%' },
  { dept: '造型三线', device: '小件造型线', rate: '8.90%' },
  { dept: '熔炼车间', device: '熔炼炉2号', rate: '7.60%' },
  { dept: '制芯车间', device: '制芯机2号', rate: '6.30%' }
]

/** 设备异常处理明细 */
const abnormalRows: AbnormalRow[] = [
  { line: '造型', device: '造型线1号', issue: '运行中断', handler: '李岩', duration: '2.5h', time: '11-17 15:26' },
  { line: '熔炼', device: '熔炼炉3号', issue: '温度异常', handler: '王力', duration: '1.8h', time: '11-17 15:29' },
  { line: '制芯', device: '制芯机2号', issue: '设备故障', handler: '张三', duration: '3.2h', time: '11-17 15:31' },
  { line: '清理', device: '清理设备', issue: '振动异常', handler: '赵强', duration: '1.5h', time: '11-17 14:15' },
  { line: '造型', device: '造型线2号', issue: '压力不足', handler: '刘芳', duration: '2.0h', time: '11-17 13:45' },
  { line: '熔炼', device: '熔炼炉1号', issue: '电气故障', handler: '陈明', duration: '4.5h', time: '11-17 12:30' },
  { line: '制芯', device: '制芯机1号', issue: '液压异常', handler: '周杰', duration: '1.2h', time: '11-16 11:20' },
  { line: '造型', device: '造型线3号', issue: '传感器故障', handler: '吴涛', duration: '0.8h', time: '11-16 10:50' }
]

/* =========================
   ECharts 配置
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: 'rgba(68, 114, 196, 0.3)',
  textStyle: { color: '#333' }
}

const legendBase = {
  textStyle: { color: '#666', fontSize: 11 },
  itemWidth: 12,
  itemHeight: 12
}

/** 各产线柱体配色，与原页面保持一致 */
const seriesColors: Record<string, [string, string]> = {
  造型: ['#70ad47', '#3ba8a0'],
  熔炼: ['#ffc000', '#D69A0E'],
  制芯: ['#4472c4', '#4472c4'],
  清理: ['#3ba8a0', '#3ba8a0']
}

const fallbackColors: [string, string] = ['#4472c4', '#4472c4']

function barGradient(name: string) {
  const [start, end] = seriesColors[name] ?? fallbackColors
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: start },
      { offset: 1, color: end }
    ]
  }
}

/** 设备总览：各产线设备分布环形图 */
function createEquipmentCountOption(data: PieDatum[]): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: '{b}: {c}台 ({d}%)'
    },
    legend: {
      ...legendBase,
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        name: '产线设备分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        })),
        label: {
          color: '#333',
          fontSize: 11
        }
      }
    ]
  } as EChartsOption
}

interface RateOptionConfig {
  valueAxisName: string
  rateAxisName: string
  barWidth: string
  lineColor: string
}

/** 双 Y 轴：柱状数量 + 折线比率 */
function createRateOption(data: RateChartData, config: RateOptionConfig): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      ...legendBase,
      data: [...data.bars.map((bar) => bar.name), data.lineName],
      top: 5
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.months,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#666', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: config.valueAxisName,
        nameTextStyle: { color: '#666', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: 'rgba(148, 163, 184, 0.3)'
          }
        },
        axisLabel: { color: '#666', fontSize: 10 }
      },
      {
        type: 'value',
        name: config.rateAxisName,
        nameTextStyle: { color: '#666', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: '#666',
          fontSize: 10,
          formatter: '{value}%'
        },
        min: 0,
        max: 350
      }
    ],
    series: [
      ...data.bars.map((bar) => ({
        name: bar.name,
        type: 'bar',
        barWidth: config.barWidth,
        data: bar.data,
        itemStyle: {
          color: barGradient(bar.name),
          borderRadius: [4, 4, 0, 0]
        }
      })),
      {
        name: data.lineName,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.line,
        lineStyle: {
          width: 3,
          color: config.lineColor
        },
        itemStyle: {
          color: config.lineColor,
          borderWidth: 2
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  } as EChartsOption
}

/** 主要生产设备完好率 */
function createIntactRateOption(data: RateChartData): EChartsOption {
  return createRateOption(data, {
    valueAxisName: '设备数量',
    rateAxisName: '完好率 %',
    barWidth: '15%',
    lineColor: '#FFFFFF'
  })
}

/** 设备可动率 */
function createAvailabilityRateOption(data: RateChartData): EChartsOption {
  return createRateOption(data, {
    valueAxisName: '异常时间',
    rateAxisName: '可动率 %',
    barWidth: '40%',
    lineColor: '#70ad47'
  })
}

/** 设备故障分析：MTBF / MTTR */
function createFaultAnalysisOption(key: FaultAnalysisKey): EChartsOption {
  const data = faultAnalysisData[key]
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      ...legendBase,
      data: data.series.map((item) => item.name),
      top: 5
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.xAxisData,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#666', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: data.unit,
      nameTextStyle: { color: '#666', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(148, 163, 184, 0.3)'
        }
      },
      axisLabel: { color: '#666', fontSize: 10 }
    },
    series: data.series.map((item) => ({
      name: item.name,
      type: 'bar',
      barWidth: '15%',
      data: item.data,
      itemStyle: {
        color: barGradient(item.name),
        borderRadius: [4, 4, 0, 0]
      }
    }))
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */

const faultTabs: { key: FaultAnalysisKey; label: string }[] = [
  { key: 'mtbf', label: '平均间隔时间' },
  { key: 'mttr', label: '平均修复时间' }
]

const faultKey = ref<FaultAnalysisKey>('mtbf')

const equipmentCountOption = createEquipmentCountOption(equipmentDistribution)
const intactOption = createIntactRateOption(intactRateData)
const availabilityOption = createAvailabilityRateOption(availabilityRateData)
const faultOption = computed(() => createFaultAnalysisOption(faultKey.value))
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="设备管理大屏"
      weather="潍坊 18℃ 晴"
    />

    <!-- 设备总览 KPI 区 -->
    <div class="kpi-section">
      <div class="kpi-grid-container">
        <div v-for="item in kpiCards" :key="item.title" class="kpi-card">
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="item.iconPath" />
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-title">{{ item.title }}</div>
            <div class="kpi-value">
              {{ item.value }}<span v-if="item.unit" class="kpi-unit">{{ item.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧列 -->
      <div class="column">
        <!-- 设备总览 -->
        <div class="data-panel">
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
            <h3 class="panel-title">设备总览</h3>
          </div>
          <div class="chart-container">
            <EChart :option="equipmentCountOption" />
          </div>
        </div>

        <!-- 设备故障分析 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">设备故障分析</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in faultTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: faultKey === tab.key }"
                @click="faultKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="faultOption" />
          </div>
        </div>
      </div>

      <!-- 中间列 -->
      <div class="column">
        <!-- 主要生产设备完好率 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">主要生产设备完好率</h3>
          </div>
          <div class="chart-container">
            <EChart :option="intactOption" />
          </div>
        </div>

        <!-- 设备可动率 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">设备可动率</h3>
          </div>
          <div class="chart-container">
            <EChart :option="availabilityOption" />
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="column">
        <!-- 主要生产设备故障停机率 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">主要生产设备故障停机率</h3>
          </div>
          <div class="equipment-table">
            <table>
              <thead>
                <tr>
                  <th>所属部门</th>
                  <th>故障设备</th>
                  <th>本月停机率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in downtimeRows" :key="`${row.dept}-${row.device}-${index}`">
                  <td>{{ row.dept }}</td>
                  <td>{{ row.device }}</td>
                  <td><span class="abnormal-rate">{{ row.rate }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 设备异常处理明细 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">设备异常处理明细</h3>
          </div>
          <div class="equipment-table">
            <table>
              <thead>
                <tr>
                  <th>产线</th>
                  <th>设备名称</th>
                  <th>异常类型</th>
                  <th>处理人</th>
                  <th>异常时长</th>
                  <th>修复时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in abnormalRows" :key="`${row.device}-${index}`">
                  <td>{{ row.line }}</td>
                  <td>{{ row.device }}</td>
                  <td><span class="abnormal-issue">{{ row.issue }}</span></td>
                  <td>{{ row.handler }}</td>
                  <td>{{ row.duration }}</td>
                  <td>{{ row.time }}</td>
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
.dashboard-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  position: relative;
  overflow-y: auto;
}

/* 顶部标题栏样式 */
.title-decoration-left,
/* KPI 指标区域样式 */
.kpi-section {
  margin-bottom: 20px;
}

.kpi-grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
}

.kpi-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.85) 100%);
  border: 1px solid rgba(68, 114, 196, 0.4);
  border-radius: 8px;
  padding: 16px;
  height: 100px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(68, 114, 196, 0.2) 0%, rgba(68, 114, 196, 0.2) 100%);
  border: 2px solid rgba(68, 114, 196, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4472c4;
  flex-shrink: 0;
}

.kpi-icon svg {
  width: 24px;
  height: 24px;
}

.kpi-content {
  flex: 1;
}

.kpi-title {
  color: #666;
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.2;
}

.kpi-value {
  color: #4472c4;
  font-size: 24px;
  font-weight: bold;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  text-shadow: 0 0 10px rgba(68, 114, 196, 0.5);
  line-height: 1.2;
}

.kpi-unit {
  font-size: 14px;
  margin-left: 2px;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 300px);
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
  height: 360px;
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

/* 图表容器 */
.chart-container {
  flex: 1;
  min-height: 200px;
  position: relative;
}

/* 表格样式 */
.equipment-table {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(68, 114, 196, 0.3) transparent;
  min-height: 0;
}

.equipment-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.equipment-table table thead th {
  background: rgba(242, 242, 242, 0.8);
  color: #475569;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(68, 114, 196, 0.3);
  font-weight: 500;
  text-align: center;
}

.equipment-table table tbody td {
  background: rgba(255, 255, 255, 0.6);
  color: #333;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(68, 114, 196, 0.1);
  text-align: center;
}

.equipment-table table tbody tr:hover td {
  background: rgba(242, 242, 242, 0.7);
}

.abnormal-rate {
  color: #ff4d4f;
  font-weight: bold;
}

.abnormal-issue {
  color: #ff4d4f;
  font-weight: 500;
}

.equipment-table::-webkit-scrollbar {
  width: 4px;
}

.equipment-table::-webkit-scrollbar-track {
  background: transparent;
}

.equipment-table::-webkit-scrollbar-thumb {
  background: rgba(68, 114, 196, 0.3);
  border-radius: 2px;
}

.equipment-table::-webkit-scrollbar-thumb:hover {
  background: rgba(68, 114, 196, 0.5);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .kpi-grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .kpi-grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
