<script setup lang="ts">

import { ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 成本管理大屏静态数据 */

interface KpiIconPath {
  d: string
  fillRule?: 'evenodd' | 'nonzero'
}

interface KpiCard {
  title: string
  value: string
  unit?: string
  paths: KpiIconPath[]
}

type Tone = 'green' | 'red'

interface AssessmentRow {
  item: string
  target: string
  actual: string
  ratio: string
  ratioTone: Tone
  yoy: string
  yoyTone: Tone
}

interface PieDatum {
  name: string
  value: number
  color: string
}

const coinPaths: KpiIconPath[] = [
  {
    d: 'M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z'
  },
  {
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z',
    fillRule: 'evenodd'
  }
]

const starPaths: KpiIconPath[] = [
  { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }
]

const calendarPaths: KpiIconPath[] = [
  {
    d: 'M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H4.5C3.11 2 2 3.11 2 4.5v15C2 20.89 3.11 22 4.5 22h15c1.39 0 2.5-1.11 2.5-2.5v-15C22 3.11 20.89 2 19.5 2z'
  }
]

const listPaths: KpiIconPath[] = [
  {
    d: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
  }
]

const checkPaths: KpiIconPath[] = [
  { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }
]

const kpiCards: KpiCard[] = [
  { title: '当期总成本', value: '3234.98', unit: '元', paths: coinPaths },
  { title: '年累计成本', value: '3234.98', unit: '元', paths: starPaths },
  { title: '吨均原材料', value: '1680', unit: '元', paths: calendarPaths },
  { title: '吨均辅助材料', value: '320', unit: '元', paths: listPaths },
  { title: '吨均燃动力费', value: '280', unit: '元', paths: checkPaths },
  { title: '吨均废品损失', value: '45', unit: '元', paths: calendarPaths },
  { title: '吨均设备维修', value: '170', unit: '元', paths: starPaths },
  { title: '吨均工具工装', value: '85', unit: '元', paths: listPaths },
  { title: '吨均机物料', value: '120', unit: '元', paths: listPaths },
  { title: '吨均低值易耗', value: '35', unit: '元', paths: listPaths }
]

/** 本月成本概况 */
const monthlyCompletionData = {
  categories: ['原材料', '辅助材料', '燃动力费', '设备维修', '其他费用'],
  items: [
    { value: 16.8, colors: ['#4472c4', '#4472c4'] },
    { value: 3.2, colors: ['#70ad47', '#3ba8a0'] },
    { value: 2.8, colors: ['#ffc000', '#D69D06'] },
    { value: 1.7, colors: ['#3ba8a0', '#7250AA'] },
    { value: 4.0, colors: ['#ffc000', '#DF7D2D'] }
  ]
}

/** 考核指标对比 */
const assessmentRows: AssessmentRow[] = [
  { item: '制造成本', target: '2450', actual: '2650', ratio: '108%', ratioTone: 'green', yoy: '-4.5%', yoyTone: 'green' },
  { item: '原材料', target: '1680', actual: '1650', ratio: '102%', ratioTone: 'green', yoy: '-2.3%', yoyTone: 'green' },
  { item: '辅助材料', target: '320', actual: '335', ratio: '105%', ratioTone: 'green', yoy: '+3.8%', yoyTone: 'red' },
  { item: '燃动力费', target: '280', actual: '315', ratio: '113%', ratioTone: 'red', yoy: '+12.1%', yoyTone: 'red' },
  { item: '设备维修', target: '170', actual: '200', ratio: '118%', ratioTone: 'red', yoy: '+18.5%', yoyTone: 'red' }
]

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/** 月成本趋势：当年与去年对比 */
const monthlyTrendData = {
  current: [100, 140, 230, 100, 0, 170, 0, 210, 190, 110, 120, 110],
  last: [150, 100, 200, 140, 0, 170, 130, 210, 190, 110, 120, 110],
  averageLine: 150,
  averageLabel: '平均: 29.89'
}

/** 年成本分析：单吨制造成本与单吨可控成本 */
const yearlyTrendData = {
  years: ['2019', '2020', '2021', '2022', '2023', '2024'],
  manufacturing: [2200, 2350, 2280, 2420, 2380, 2450],
  controllable: [1850, 1920, 1880, 1950, 1920, 1980]
}

/** 成本占比分析：科目成本 */
const subjectCostData: PieDatum[] = [
  { name: '原材料', value: 1680, color: '#4472c4' },
  { name: '辅助材料', value: 320, color: '#70ad47' },
  { name: '燃动力费', value: 280, color: '#ffc000' },
  { name: '设备维修', value: 170, color: '#3ba8a0' },
  { name: '废品损失', value: 45, color: '#ffc000' },
  { name: '工具工装', value: 85, color: '#3ba8a0' },
  { name: '低值易耗', value: 35, color: '#3ba8a0' }
]

/** 成本占比分析：工序成本 */
const processCostData: PieDatum[] = [
  { name: '熔炼', value: 45, color: '#3ba8a0' },
  { name: '造型', value: 35, color: '#FF6B6B' },
  { name: '清理', value: 15, color: '#ffc000' },
  { name: '制芯', value: 5, color: '#70ad47' }
]

/** 能耗成本与生产负荷分析散点 */
const energyLoadData: [number, number][] = [
  // 低负荷区域 (50-70%)
  [52, 240], [55, 250], [58, 260], [61, 270], [64, 275], [67, 285], [69, 295],
  [53, 245], [56, 255], [59, 265], [62, 272], [65, 280], [68, 290], [70, 300],
  [54, 248], [57, 258], [60, 268], [63, 275], [66, 282], [69, 292], [71, 302],
  // 正常负荷区域 (70-85%)
  [72, 310], [74, 320], [76, 330], [78, 340], [80, 350], [82, 360], [84, 370],
  [73, 315], [75, 325], [77, 335], [79, 345], [81, 355], [83, 365], [85, 375],
  [71, 305], [73, 318], [75, 328], [77, 338], [79, 348], [81, 358], [83, 368],
  [72, 312], [74, 322], [76, 332], [78, 342], [80, 352], [82, 362], [84, 372],
  // 高负荷区域 (85-100%)
  [86, 380], [88, 390], [90, 400], [92, 410], [94, 420], [96, 430], [98, 440],
  [87, 385], [89, 395], [91, 405], [93, 415], [95, 425], [97, 435], [99, 445],
  [85, 378], [87, 388], [89, 398], [91, 408], [93, 418], [95, 428], [97, 438],
  [86, 382], [88, 392], [90, 402], [92, 412], [94, 422], [96, 432], [98, 442],
  // 超负荷区域 (100-120%)
  [101, 450], [103, 470], [105, 490], [107, 510], [109, 530], [111, 550], [113, 570],
  [102, 460], [104, 480], [106, 500], [108, 520], [110, 540], [112, 560], [114, 580],
  [100, 455], [102, 465], [104, 485], [106, 505], [108, 525], [110, 545], [112, 565],
  [101, 458], [103, 475], [105, 495], [107, 515], [109, 535], [111, 555], [113, 575],
  [115, 590], [117, 610], [119, 630], [116, 600], [118, 620], [120, 640]
]

/* =========================
   ECharts 配置
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: 'rgba(68, 114, 196, 0.3)',
  textStyle: { color: '#333' }
}

const categoryAxis = {
  type: 'category' as const,
  axisLine: { lineStyle: { color: '#cbd5e1' } },
  axisLabel: { color: '#666', fontSize: 10 },
  axisTick: { show: false }
}

const valueAxis = {
  type: 'value' as const,
  nameTextStyle: { color: '#666', fontSize: 10 },
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: {
    lineStyle: {
      type: 'dashed' as const,
      color: 'rgba(148, 163, 184, 0.3)'
    }
  },
  axisLabel: { color: '#666', fontSize: 10 }
}

/** 本月成本概况 */
function createMonthlyCompletionOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: monthlyCompletionData.categories,
      axisLabel: { color: '#666', fontSize: 10, rotate: 15 }
    },
    yAxis: {
      ...valueAxis,
      name: '万元'
    },
    series: [
      {
        name: '成本',
        type: 'bar',
        barWidth: '50%',
        data: monthlyCompletionData.items.map((item) => ({
          value: item.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: item.colors[0] },
                { offset: 1, color: item.colors[1] }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        })),
        label: {
          show: true,
          position: 'top',
          color: '#333',
          fontSize: 10
        }
      }
    ]
  } as EChartsOption
}

/** 月成本趋势：当年 / 去年双柱 */
function createMonthlyTrendOption(): EChartsOption {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis'
    },
    legend: {
      data: [`${currentYear}年`, `${lastYear}年`],
      textStyle: { color: '#666', fontSize: 12 },
      top: 5,
      itemWidth: 14,
      itemHeight: 14
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months
    },
    yAxis: valueAxis,
    series: [
      {
        name: `${currentYear}年`,
        type: 'bar',
        barWidth: '35%',
        data: monthlyTrendData.current,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#4472c4' },
              { offset: 1, color: '#0284c7' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#ffc000',
            width: 2,
            type: 'solid'
          },
          label: {
            show: true,
            position: 'end',
            formatter: `${currentYear}${monthlyTrendData.averageLabel}`,
            color: '#ffc000',
            fontSize: 11,
            backgroundColor: 'rgba(246, 189, 22, 0.2)',
            padding: [4, 8],
            borderRadius: 4
          },
          data: [{ yAxis: monthlyTrendData.averageLine }]
        }
      },
      {
        name: `${lastYear}年`,
        type: 'bar',
        barWidth: '35%',
        data: monthlyTrendData.last,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#70ad47' },
              { offset: 1, color: '#3ba8a0' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  } as EChartsOption
}

/** 年成本分析：柱 + 折线双 Y 轴 */
function createYearlyTrendOption(): EChartsOption {
  const dualAxis = {
    ...valueAxis,
    name: '元/吨',
    nameTextStyle: { color: '#666', fontSize: 11 }
  }
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis'
    },
    legend: {
      data: ['单吨制造成本', '单吨可控成本'],
      textStyle: { color: '#666', fontSize: 11 },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: yearlyTrendData.years,
      axisLabel: { color: '#666', fontSize: 11 }
    },
    yAxis: [
      {
        ...dualAxis,
        position: 'left'
      },
      {
        ...dualAxis,
        position: 'right',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '单吨制造成本',
        type: 'bar',
        yAxisIndex: 0,
        barWidth: '35%',
        data: yearlyTrendData.manufacturing,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#4472c4' },
              { offset: 1, color: '#4472c4' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '单吨可控成本',
        type: 'line',
        yAxisIndex: 1,
        data: yearlyTrendData.controllable,
        lineStyle: {
          width: 3,
          color: '#70ad47'
        },
        itemStyle: {
          color: '#70ad47',
          borderWidth: 2,
          borderColor: '#fff'
        },
        smooth: true
      }
    ]
  } as EChartsOption
}

/** 成本占比环形图：mode = subject（科目，单位元）| process（工序，单位万元） */
function createCostPieOption(data: PieDatum[], mode: 'subject' | 'process'): EChartsOption {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: mode === 'subject' ? '{b}: {c}元 ({d}%)' : '{b}: {c}万元 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#666', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 8,
      formatter: (name: string) => {
        const item = data.find((entry) => entry.name === name)
        if (!item) return name
        const percent = ((item.value / total) * 100).toFixed(1)
        const amount =
          mode === 'subject' ? `${(item.value / 10000).toFixed(1)}万元` : `${item.value}万元`
        return `${name} ${amount}（${percent}%）`
      }
    },
    series: [
      {
        name: mode === 'subject' ? '成本构成' : '工序成本',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['30%', '50%'],
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        })),
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  } as EChartsOption
}

/** 能耗成本与生产负荷分析散点图 */
function createEnergyLoadOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (params: any) =>
        `生产负荷: ${params.value[0]}%<br/>能耗成本: ${params.value[1]}元`
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '生产负荷（%）',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { color: '#666', fontSize: 12 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: {
        color: '#666',
        fontSize: 10,
        formatter: '{value}%'
      },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(148, 163, 184, 0.3)'
        }
      },
      min: 0,
      max: 120
    },
    yAxis: {
      type: 'value',
      name: '能耗成本（元）',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: '#666', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#666', fontSize: 10 },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(148, 163, 184, 0.3)'
        }
      }
    },
    series: [
      {
        name: '能耗成本与生产负荷',
        type: 'scatter',
        symbolSize: 6,
        data: energyLoadData,
        itemStyle: {
          color: (params: any) => {
            const load = params.value[0] as number
            if (load >= 100) return '#FF6B6B'
            if (load >= 85) return '#ffc000'
            if (load >= 70) return '#70ad47'
            return '#4472c4'
          },
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 0.5,
          opacity: 0.8
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            opacity: 1
          }
        }
      }
    ]
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */

type CompositionTab = 'subject' | 'process'

const compositionTab = ref<CompositionTab>('subject')

const monthlyCompletionOption = createMonthlyCompletionOption()
const monthlyTrendOption = createMonthlyTrendOption()
const yearlyTrendOption = createYearlyTrendOption()
const energyLoadOption = createEnergyLoadOption()
const subjectOption = createCostPieOption(subjectCostData, 'subject')
const processOption = createCostPieOption(processCostData, 'process')
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="成本管理大屏"
      weather="潍坊 18℃ 晴"
    />

    <!-- 主要指标展示 -->
    <div class="kpi-section">
      <div class="kpi-grid-container">
        <div v-for="item in kpiCards" :key="item.title" class="kpi-card">
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                v-for="(iconPath, index) in item.paths"
                :key="index"
                :d="iconPath.d"
                :fill-rule="iconPath.fillRule"
                :clip-rule="iconPath.fillRule"
              />
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

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧列 -->
      <div class="column">
        <!-- 本月成本概况 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"
                />
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">本月成本概况</h3>
          </div>
          <div class="panel-content">
            <div style="margin-bottom: 8px">
              <span style="color: #666; font-size: 12px">单位：万元</span>
            </div>
            <div class="chart-container">
              <EChart :option="monthlyCompletionOption" />
            </div>
          </div>
        </div>

        <!-- 考核指标对比 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">考核指标对比</h3>
          </div>
          <div class="equipment-table">
            <table>
              <thead>
                <tr>
                  <th>考核项目</th>
                  <th>目标</th>
                  <th>实际</th>
                  <th>占比</th>
                  <th>同比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in assessmentRows" :key="row.item">
                  <td>{{ row.item }}</td>
                  <td>{{ row.target }}</td>
                  <td>{{ row.actual }}</td>
                  <td :class="row.ratioTone === 'green' ? 'text-green' : 'text-red'">{{ row.ratio }}</td>
                  <td :class="row.yoyTone === 'green' ? 'text-green' : 'text-red'">{{ row.yoy }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 中间列 -->
      <div class="column">
        <!-- 月成本趋势 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">月成本趋势</h3>
          </div>
          <div class="panel-content">
            <div style="margin-bottom: 8px">
              <span style="color: #666; font-size: 12px">单位：元</span>
            </div>
            <div class="chart-container">
              <EChart :option="monthlyTrendOption" />
            </div>
          </div>
        </div>

        <!-- 年成本分析 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">年成本分析</h3>
          </div>
          <div class="panel-content">
            <div class="chart-container">
              <EChart :option="yearlyTrendOption" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="column">
        <!-- 成本占比分析 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 class="panel-title">成本占比分析</h3>
            <div class="tab-buttons">
              <button
                class="tab-button"
                :class="{ active: compositionTab === 'subject' }"
                @click="compositionTab = 'subject'"
              >
                科目成本
              </button>
              <button
                class="tab-button"
                :class="{ active: compositionTab === 'process' }"
                @click="compositionTab = 'process'"
              >
                工序成本
              </button>
            </div>
          </div>
          <div class="panel-content">
            <div class="chart-container">
              <EChart v-if="compositionTab === 'subject'" :option="subjectOption" />
              <EChart v-else :option="processOption" />
            </div>
          </div>
        </div>

        <!-- 能耗成本与生产负荷分析 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">能耗成本与生产负荷分析</h3>
          </div>
          <div class="panel-content">
            <div class="chart-container">
              <EChart :option="energyLoadOption" />
            </div>
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
  grid-template-columns: repeat(5, 1fr);
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

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid #4472c4;
  border-left: 2px solid #4472c4;
  z-index: 10;
}

.kpi-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid #4472c4;
  border-right: 2px solid #4472c4;
  z-index: 10;
}

.corner-bl {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid #4472c4;
  border-left: 2px solid #4472c4;
  z-index: 10;
}

.corner-br {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid #4472c4;
  border-right: 2px solid #4472c4;
  z-index: 10;
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

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
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
  height: 360px;
}

.data-panel .corner-tl {
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid #4472c4;
  border-left: 2px solid #4472c4;
  z-index: 10;
}

.data-panel .corner-tr {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid #4472c4;
  border-right: 2px solid #4472c4;
  z-index: 10;
}

.data-panel .corner-bl {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid #4472c4;
  border-left: 2px solid #4472c4;
  z-index: 10;
}

.data-panel .corner-br {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid #4472c4;
  border-right: 2px solid #4472c4;
  z-index: 10;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(68, 114, 196, 0.2);
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

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-container {
  flex: 1;
  min-height: 0;
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
}

.equipment-table table thead tr {
  background: transparent;
  border-bottom: 1px dashed rgba(153, 153, 153, 0.3);
}

.equipment-table table thead th {
  color: #666;
  font-weight: 600;
  font-size: 13px;
  padding: 12px 8px;
  text-align: center;
}

.equipment-table table tbody tr {
  border-bottom: 1px dashed rgba(153, 153, 153, 0.2);
}

.equipment-table table tbody tr:hover {
  background: rgba(68, 114, 196, 0.05) !important;
}

.equipment-table table tbody td {
  color: #333;
  font-size: 12px;
  padding: 12px 8px;
  text-align: center;
}

.text-green {
  color: #70ad47;
}

.text-red {
  color: #ff4d4f;
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  margin-left: auto;
}

.tab-button {
  background: rgba(242, 242, 242, 0.5);
  border: 1px solid rgba(68, 114, 196, 0.3);
  color: #666;
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.3s;
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

@media (max-width: 1400px) {
  .kpi-grid-container {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(4, 1fr);
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
