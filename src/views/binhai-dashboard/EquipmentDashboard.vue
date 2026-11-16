<script setup lang="ts">

import { computed, ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 设备可视化大屏静态数据 */

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
const iconCheck =
  'M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
const iconClock =
  'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
const iconWarn =
  'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
const iconMoney =
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
const iconGauge =
  'M12 2a10 10 0 100 20 10 10 0 000-20zm1 17.93A8.01 8.01 0 014 12c0-.62.08-1.21.21-1.79L9 15v1a2 2 0 002 2v1.93zm6.9-2.54A7.96 7.96 0 0019 12c0-.62-.08-1.21-.21-1.79L15 12h-2V9l4.9-4.9A7.96 7.96 0 0013 4.07V6h-2V4.07A7.96 7.96 0 006.1 6.21L11 11H9v2h2v2l-4.79 4.79A7.96 7.96 0 0011 19.93V18h2v1.93A7.96 7.96 0 0017.9 17.39z'

/** 顶部 12 项设备指标 */
const kpiCards: KpiCard[] = [
  { title: '设备台数', value: '85', unit: '台', iconPath: iconEquipment },
  { title: '主要设备台数', value: '42', unit: '台', iconPath: iconEquipment },
  { title: '设备原值', value: '5,178', unit: '万元', iconPath: iconMoney },
  { title: '设备净值', value: '3,896', unit: '万元', iconPath: iconMoney },
  { title: '设备可动率', value: '99', unit: '%', iconPath: iconCheck },
  { title: '主要设备完好率', value: '98', unit: '%', iconPath: iconClock },
  { title: '设备停机率', value: '2.2', unit: '%', iconPath: iconWarn },
  { title: '设备停机时间', value: '186', unit: 'h', iconPath: iconInfo },
  { title: '平均故障时间', value: '220', unit: 'Min', iconPath: iconInfo },
  { title: '平均故障修复时间', value: '4.2', unit: 'Min', iconPath: iconClock },
  { title: '设备故障次数', value: '16', unit: '次', iconPath: iconWarn },
  { title: '设备OEE', value: '86', unit: '%', iconPath: iconGauge }
]

/** 设备总览：各产线设备分布（不含制芯） */
const equipmentDistribution: PieDatum[] = [
  { value: 28, name: '熔炼', color: '#ffd52a' },
  { value: 32, name: '造型', color: '#4ee6a6' },
  { value: 10, name: '清理', color: '#3bd6c6' }
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
  backgroundColor: 'rgba(5, 24, 34, 0.96)',
  borderColor: 'rgba(0, 198, 239, 0.55)',
  textStyle: { color: '#dff8ff' }
}

const legendBase = {
  textStyle: { color: '#a9c9d4', fontSize: 11 },
  itemWidth: 12,
  itemHeight: 12
}

/** 各产线柱体配色，与原页面保持一致 */
const seriesColors: Record<string, [string, string]> = {
  造型: ['#4ee6a6', '#20b98a'],
  熔炼: ['#ffd52a', '#d69a0e'],
  制芯: ['#31d7ff', '#189fd9'],
  清理: ['#3bd6c6', '#2a8c86']
}

const fallbackColors: [string, string] = ['#31d7ff', '#189fd9']

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
        radius: ['38%', '66%'],
        center: ['41%', '50%'],
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        })),
        label: {
          color: '#dff8ff',
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
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: config.valueAxisName,
        nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: 'rgba(72, 164, 194, 0.24)'
          }
        },
        axisLabel: { color: '#a9c9d4', fontSize: 10 }
      },
      {
        type: 'value',
        name: config.rateAxisName,
        nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: '#a9c9d4',
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
    lineColor: '#f4fdff'
  })
}

/** 设备可动率 */
function createAvailabilityRateOption(data: RateChartData): EChartsOption {
  return createRateOption(data, {
    valueAxisName: '异常时间',
    rateAxisName: '可动率 %',
    barWidth: '40%',
    lineColor: '#4ee6a6'
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
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: data.unit,
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(72, 164, 194, 0.24)'
        }
      },
      axisLabel: { color: '#a9c9d4', fontSize: 10 }
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
      title="设备可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
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
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;
  /* 背景沿用生产可视化大屏 */
  color: #dff8ff !important;
  background-color: #041019 !important;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(0, 166, 216, 0.12), transparent 27%),
    radial-gradient(circle at 82% 78%, rgba(0, 119, 177, 0.1), transparent 31%),
    linear-gradient(rgba(35, 146, 177, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 146, 177, 0.055) 1px, transparent 1px) !important;
  background-size: auto, auto, 32px 32px, 32px 32px;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.46) !important;
}

/* 顶部标题栏样式 */
.title-decoration-left,
/* KPI 指标区域样式 */
.kpi-section {
  margin-bottom: 20px;
}

.kpi-grid-container {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-container .kpi-card {
  position: relative;
  height: 100px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  color: #dff8ff;
  background-color: #082532 !important;
  background-image:
    linear-gradient(135deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    linear-gradient(90deg, rgba(0, 196, 240, 0.1), transparent 58%) !important;
  border: 1px solid rgba(0, 190, 235, 0.56) !important;
  border-radius: 3px !important;
  box-shadow:
    inset 0 0 22px rgba(0, 154, 201, 0.09),
    0 0 10px rgba(0, 0, 0, 0.24) !important;
}

.dashboard-container .kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 58%;
  height: 2px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.82);
}

.dashboard-container .kpi-card::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 34%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(38, 217, 255, 0.86));
}

.dashboard-container .kpi-icon {
  display: flex !important;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #40e3ff;
  background: rgba(0, 176, 220, 0.14);
  border: 1px solid rgba(35, 211, 255, 0.48);
  box-shadow: inset 0 0 10px rgba(35, 211, 255, 0.12);
}

.dashboard-container .kpi-icon svg {
  width: 22px;
  height: 22px;
}

.dashboard-container .kpi-content {
  flex: 1;
  min-width: 0;
}

.dashboard-container .kpi-title {
  color: #9fc3cf !important;
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-container .kpi-value {
  color: #ffd91a !important;
  font-size: 22px;
  font-weight: 800;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  text-shadow: 0 0 12px rgba(255, 217, 26, 0.36);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-container .kpi-unit {
  color: #a7cad5 !important;
  font-size: 14px;
  margin-left: 2px;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  height: auto;
  min-height: calc(100vh - 310px);
}

.column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 数据面板样式：沿用生产可视化大屏 */
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
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  height: 360px;
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
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  flex-shrink: 0;
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
  align-items: center;
  justify-content: center;
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

.dashboard-container .data-panel .corner-tl,
.dashboard-container .data-panel .corner-tr,
.dashboard-container .data-panel .corner-bl,
.dashboard-container .data-panel .corner-br,
.dashboard-container .kpi-card .corner-bl,
.dashboard-container .kpi-card .corner-br {
  display: block !important;
  width: 14px;
  height: 14px;
  border-color: #1bd5ff !important;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
}

.corner-tl {
  top: 0;
  left: 0;
  border-top: 2px solid #1bd5ff;
  border-left: 2px solid #1bd5ff;
}

.corner-tr {
  top: 0;
  right: 0;
  border-top: 2px solid #1bd5ff;
  border-right: 2px solid #1bd5ff;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid #1bd5ff;
  border-left: 2px solid #1bd5ff;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid #1bd5ff;
  border-right: 2px solid #1bd5ff;
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  margin-left: auto;
  flex-shrink: 0;
}

.dashboard-container .tab-button {
  color: #9cc8d5 !important;
  background: rgba(4, 24, 33, 0.88) !important;
  border: 1px solid rgba(0, 184, 225, 0.4) !important;
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

.dashboard-container .tab-button.active,
.dashboard-container .tab-button:hover {
  color: #effcff !important;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34)) !important;
  border-color: #26d5ff !important;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
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
  scrollbar-color: rgba(26, 202, 242, 0.5) transparent;
  min-height: 0;
}

.equipment-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.dashboard-container .equipment-table table thead th {
  background: rgba(0, 143, 184, 0.17) !important;
  color: #75dff7 !important;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(0, 192, 235, 0.44) !important;
  font-weight: 500;
  text-align: center;
}

.dashboard-container .equipment-table table tbody td {
  background: rgba(5, 27, 37, 0.72) !important;
  color: #cde7ee !important;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(0, 154, 197, 0.16) !important;
  text-align: center;
}

.dashboard-container .equipment-table table tbody tr:nth-child(odd) td {
  background: rgba(7, 36, 48, 0.78) !important;
}

.dashboard-container .equipment-table table tbody tr:hover td {
  background: rgba(0, 169, 215, 0.13) !important;
}

.abnormal-rate {
  color: #ff5f87;
  font-weight: bold;
}

.abnormal-issue {
  color: #ff5f87;
  font-weight: 500;
}

.equipment-table::-webkit-scrollbar {
  width: 4px;
}

.equipment-table::-webkit-scrollbar-track {
  background: transparent;
}

.equipment-table::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.5);
  border-radius: 2px;
}

.equipment-table::-webkit-scrollbar-thumb:hover {
  background: rgba(38, 213, 255, 0.72);
}

/* 响应式设计 */
@media (max-width: 1500px) {
  .kpi-grid-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
}

@media (max-width: 1200px) {
  .kpi-grid-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .main-content {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .kpi-grid-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .kpi-grid-container {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
