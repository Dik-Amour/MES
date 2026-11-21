<script setup lang="ts">

import { ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 成本可视化大屏静态数据 */

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
    { value: 16.8, colors: ['#20cfff', '#20cfff'] },
    { value: 3.2, colors: ['#4ee6a6', '#3ba8a0'] },
    { value: 2.8, colors: ['#ffd52a', '#D69D06'] },
    { value: 1.7, colors: ['#9b8cff', '#7250AA'] },
    { value: 4.0, colors: ['#ffd52a', '#DF7D2D'] }
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
  { name: '原材料', value: 1680, color: '#20cfff' },
  { name: '辅助材料', value: 320, color: '#4ee6a6' },
  { name: '燃动力费', value: 280, color: '#ffd52a' },
  { name: '设备维修', value: 170, color: '#9b8cff' },
  { name: '废品损失', value: 45, color: '#ff4f8b' },
  { name: '工具工装', value: 85, color: '#35e4ff' },
  { name: '低值易耗', value: 35, color: '#4ee6a6' }
]

/** 成本占比分析：工序成本 */
const processCostData: PieDatum[] = [
  { name: '熔炼', value: 45, color: '#20cfff' },
  { name: '造型', value: 35, color: '#4ee6a6' },
  { name: '清理', value: 15, color: '#ffd52a' },
  { name: '制芯', value: 5, color: '#9b8cff' }
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
   ECharts 配置（深色底，对齐生产可视化大屏）
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(6, 24, 33, 0.94)',
  borderColor: 'rgba(0, 191, 235, 0.48)',
  textStyle: { color: '#dff8ff' }
}

const categoryAxis = {
  type: 'category' as const,
  axisLine: { lineStyle: { color: 'rgba(0, 191, 235, 0.35)' } },
  axisLabel: { color: '#a9c9d4', fontSize: 10 },
  axisTick: { show: false }
}

const valueAxis = {
  type: 'value' as const,
  nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: {
    lineStyle: {
      type: 'dashed' as const,
      color: 'rgba(0, 154, 197, 0.28)'
    }
  },
  axisLabel: { color: '#a9c9d4', fontSize: 10 }
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
      axisLabel: { color: '#a9c9d4', fontSize: 10, rotate: 15 }
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
          color: '#dff8ff',
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
      textStyle: { color: '#a9c9d4', fontSize: 12 },
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
              { offset: 0, color: '#20cfff' },
              { offset: 1, color: '#0284c7' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#ffd52a',
            width: 2,
            type: 'solid'
          },
          label: {
            show: true,
            position: 'end',
            formatter: `${currentYear}${monthlyTrendData.averageLabel}`,
            color: '#ffd52a',
            fontSize: 11,
            backgroundColor: 'rgba(255, 213, 42, 0.16)',
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
              { offset: 0, color: '#4ee6a6' },
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
    nameTextStyle: { color: '#a9c9d4', fontSize: 11 }
  }
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis'
    },
    legend: {
      data: ['单吨制造成本', '单吨可控成本'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
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
      axisLabel: { color: '#a9c9d4', fontSize: 11 }
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
              { offset: 0, color: '#20cfff' },
              { offset: 1, color: '#20cfff' }
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
          color: '#4ee6a6'
        },
        itemStyle: {
          color: '#4ee6a6',
          borderWidth: 2,
          borderColor: '#061821'
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
      textStyle: { color: '#a9c9d4', fontSize: 11 },
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
      nameTextStyle: { color: '#a9c9d4', fontSize: 12 },
      axisLine: { lineStyle: { color: 'rgba(0, 191, 235, 0.35)' } },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(0, 154, 197, 0.28)'
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
      nameTextStyle: { color: '#a9c9d4', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(0, 154, 197, 0.28)'
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
            if (load >= 100) return '#ff5f87'
            if (load >= 85) return '#ffd52a'
            if (load >= 70) return '#4ee6a6'
            return '#20cfff'
          },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 0.5,
          opacity: 0.85
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
      title="成本可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

    <!-- 主要指标展示：与人员大屏 top-indicators 统一 -->
    <div class="top-indicators">
      <div
        v-for="(item, index) in kpiCards"
        :key="item.title"
        class="top-indicator-card"
        :class="index % 2 === 1 ? 'tone-inbound' : 'tone-output'"
      >
        <div class="top-indicator-content">
          <div class="top-indicator-label">{{ item.title }}</div>
          <div class="top-indicator-value">
            {{ item.value }}<span v-if="item.unit" class="top-indicator-unit">{{ item.unit }}</span>
          </div>
        </div>
        <div class="top-indicator-icon" aria-hidden="true">
          <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
            <path
              v-for="(iconPath, pIndex) in item.paths"
              :key="pIndex"
              :d="iconPath.d"
              :fill-rule="iconPath.fillRule"
              :clip-rule="iconPath.fillRule"
            />
          </svg>
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
            <div class="unit-hint">单位：万元</div>
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
            <div class="unit-hint">单位：元</div>
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

<style src="./dashboard-common.css"></style>
<style scoped>
/* 表格视觉：dashboard-common.css；此处仅布局 */
.equipment-table {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}




.dashboard-container {
  width: 100%;
  min-height: calc(100vh - 132px);
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;
  color: #dff8ff;
  background-color: #041019;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(0, 166, 216, 0.12), transparent 27%),
    radial-gradient(circle at 82% 78%, rgba(0, 119, 177, 0.1), transparent 31%),
    linear-gradient(rgba(35, 146, 177, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 146, 177, 0.055) 1px, transparent 1px);
  background-size: auto, auto, 32px 32px, 32px 32px;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.46);
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
}

/* KPI 指标区域样式 */
.kpi-section {
  margin-bottom: 16px;
}

.kpi-grid-container {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* KPI 卡片：沿用生产可视化大屏指标卡 */
.kpi-card {
  position: relative;
  min-height: 100px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
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
  box-sizing: border-box;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 58%;
  height: 2px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.82);
}

.kpi-card::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 34%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(38, 217, 255, 0.86));
}

.corner-bl {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 14px;
  height: 14px;
  z-index: 10;
  border-bottom: 2px solid #1bd5ff;
  border-left: 2px solid #1bd5ff;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
}

.corner-br {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  z-index: 10;
  border-bottom: 2px solid #1bd5ff;
  border-right: 2px solid #1bd5ff;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
}

.kpi-icon {
  position: relative;
  z-index: 1;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #40e3ff;
  background: rgba(0, 176, 220, 0.14);
  border: 1px solid rgba(35, 211, 255, 0.48);
  box-shadow: inset 0 0 16px rgba(35, 211, 255, 0.16);
}

.kpi-icon svg {
  width: 22px;
  height: 22px;
}

.kpi-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.kpi-title {
  color: #a9c9d4;
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.2;
  letter-spacing: 1px;
}

.kpi-value {
  color: #ffd91a;
  font-size: 22px;
  font-weight: 800;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  text-shadow: 0 0 12px rgba(255, 217, 26, 0.36);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.kpi-unit {
  color: #a7cad5;
  font-size: 13px;
  margin-left: 2px;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  min-height: calc(100vh - 320px);
}

.column {
  display: grid;
  /* 与人员大屏一致：上下两行各 360px */
  grid-template-rows: 360px 360px;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.column > .data-panel {
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
}

/* 数据面板样式：沿用生产可视化大屏 */
.data-panel {
  color: #dff8ff;
  background-color: #061821;
  background-image:
    linear-gradient(180deg, rgba(8, 35, 47, 0.96), rgba(5, 23, 32, 0.97)),
    linear-gradient(90deg, rgba(0, 184, 226, 0.035), transparent 32%);
  border: 1px solid rgba(0, 191, 235, 0.48);
  border-radius: 2px;
  padding: 12px 14px;
  box-shadow:
    inset 0 0 24px rgba(0, 157, 205, 0.055),
    0 0 12px rgba(0, 0, 0, 0.24);
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  height: 360px;
}

.data-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  width: 74px;
  height: 2px;
  background: #18d2ff;
  box-shadow: 0 0 8px rgba(24, 210, 255, 0.9);
}

.data-panel::after {
  content: '';
  position: absolute;
  right: -1px;
  bottom: 14px;
  width: 3px;
  height: 42px;
  background: linear-gradient(180deg, transparent, #18d2ff, transparent);
  opacity: 0.75;
}

.data-panel .corner-tl,
.data-panel .corner-tr,
.data-panel .corner-bl,
.data-panel .corner-br {
  position: absolute;
  width: 14px;
  height: 14px;
  z-index: 10;
  border-color: #1bd5ff;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
}

.data-panel .corner-tl {
  top: 0;
  left: 0;
  border-top: 2px solid #1bd5ff;
  border-left: 2px solid #1bd5ff;
}

.data-panel .corner-tr {
  top: 0;
  right: 0;
  border-top: 2px solid #1bd5ff;
  border-right: 2px solid #1bd5ff;
}

.data-panel .corner-bl {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid #1bd5ff;
  border-left: 2px solid #1bd5ff;
}

.data-panel .corner-br {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid #1bd5ff;
  border-right: 2px solid #1bd5ff;
}

.panel-header {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  flex-shrink: 0;
  min-height: 34px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0, 185, 226, 0.34);
}

.panel-icon {
  display: flex;
  width: 28px;
  height: 28px;
  margin-right: 9px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #40e3ff;
  background: rgba(0, 176, 220, 0.14);
  border: 1px solid rgba(35, 211, 255, 0.48);
  border-radius: 2px;
  box-shadow: inset 0 0 10px rgba(35, 211, 255, 0.12);
}

.panel-icon svg {
  width: 16px;
  height: 16px;
}

.panel-title {
  display: inline-block;
  margin: 0;
  padding: 0;
  color: #f4fdff;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(31, 204, 255, 0.25);
  white-space: nowrap;
  flex-shrink: 0;
}

.panel-title::after {
  content: '';
  display: inline-block;
  width: 28px;
  height: 1px;
  margin-left: 10px;
  vertical-align: middle;
  background: linear-gradient(90deg, #17cfff, transparent);
}

.panel-header:has(.tab-buttons) .panel-title::after {
  display: none;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-content .unit-hint {
  margin-bottom: 8px;
  color: #a9c9d4;
  font-size: 12px;
}

.chart-container {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* 表格样式 */








.text-green {
  color: #4ee6a6;
  font-weight: 600;
}

.text-red {
  color: #ff5f87;
  font-weight: 600;
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  margin-left: auto;
  flex-shrink: 0;
}

.tab-button {
  background: rgba(4, 24, 33, 0.88);
  border: 1px solid rgba(0, 184, 225, 0.4);
  color: #9cc8d5;
  font-size: 12px;
  padding: 6px 12px;
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
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34));
  border-color: #26d5ff;
  color: #effcff;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
}

.tab-button:hover {
  color: #effcff;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34));
  border-color: #26d5ff;
}




@media (max-width: 1400px) {
  .kpi-grid-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
  }

  .main-content {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
}

/* =========================================================
   强制覆盖全局 style.css 浅色 !important（对齐生产可视化深色）
   ========================================================= */
.dashboard-container {
  width: 100% !important;
  height: auto !important;
  min-height: calc(100vh - 132px) !important;
  padding: 10px !important;
  box-sizing: border-box !important;
  position: relative !important;
  overflow-y: auto !important;
  color: #dff8ff !important;
  background: #041019 !important;
  background-color: #041019 !important;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(0, 166, 216, 0.12), transparent 27%),
    radial-gradient(circle at 82% 78%, rgba(0, 119, 177, 0.1), transparent 31%),
    linear-gradient(rgba(35, 146, 177, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 146, 177, 0.055) 1px, transparent 1px) !important;
  background-size: auto, auto, 32px 32px, 32px 32px !important;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.46) !important;
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif !important;
}

.dashboard-container .data-panel {
  height: 360px !important;
  min-height: 360px !important;
  max-height: 360px !important;
  box-sizing: border-box !important;
  color: #dff8ff !important;
  background: #061821 !important;
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
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 14px !important;
  width: 74px !important;
  height: 2px !important;
  background: #18d2ff !important;
  box-shadow: 0 0 8px rgba(24, 210, 255, 0.9) !important;
  z-index: 2 !important;
}

.dashboard-container .data-panel::after {
  content: '' !important;
  position: absolute !important;
  right: -1px !important;
  bottom: 14px !important;
  width: 3px !important;
  height: 42px !important;
  background: linear-gradient(180deg, transparent, #18d2ff, transparent) !important;
  opacity: 0.75 !important;
  z-index: 2 !important;
}

.dashboard-container .data-panel > .panel-header {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
  min-height: 34px !important;
  margin-bottom: 10px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px dashed rgba(0, 185, 226, 0.34) !important;
}

.dashboard-container .data-panel .panel-icon,
.dashboard-container .kpi-card .kpi-icon {
  display: flex !important;
  width: 28px !important;
  height: 28px !important;
  margin-right: 9px !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  color: #40e3ff !important;
  background: rgba(0, 176, 220, 0.14) !important;
  border: 1px solid rgba(35, 211, 255, 0.48) !important;
  border-radius: 2px !important;
  box-shadow: inset 0 0 10px rgba(35, 211, 255, 0.12) !important;
}

.dashboard-container .data-panel .panel-title {
  display: inline-block !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: #f4fdff !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  text-shadow: 0 0 8px rgba(31, 204, 255, 0.25) !important;
  white-space: nowrap !important;
}

.dashboard-container .data-panel .panel-title::after {
  content: '' !important;
  display: inline-block !important;
  width: 28px !important;
  height: 1px !important;
  margin-left: 10px !important;
  vertical-align: middle !important;
  background: linear-gradient(90deg, #17cfff, transparent) !important;
}

.dashboard-container .data-panel .panel-header:has(.tab-buttons) .panel-title::after {
  display: none !important;
}

.dashboard-container .data-panel .corner-tl,
.dashboard-container .data-panel .corner-tr,
.dashboard-container .data-panel .corner-bl,
.dashboard-container .data-panel .corner-br,
.dashboard-container .kpi-card .corner-bl,
.dashboard-container .kpi-card .corner-br {
  display: block !important;
  width: 14px !important;
  height: 14px !important;
  z-index: 10 !important;
  border-color: #1bd5ff !important;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75)) !important;
}

.dashboard-container .data-panel .corner-tl,
.dashboard-container .kpi-card .corner-tl {
  top: 0 !important;
  left: 0 !important;
  border-top: 2px solid #1bd5ff !important;
  border-left: 2px solid #1bd5ff !important;
}

.dashboard-container .data-panel .corner-tr,
.dashboard-container .kpi-card .corner-tr {
  top: 0 !important;
  right: 0 !important;
  border-top: 2px solid #1bd5ff !important;
  border-right: 2px solid #1bd5ff !important;
}

.dashboard-container .data-panel .corner-bl,
.dashboard-container .kpi-card .corner-bl {
  bottom: 0 !important;
  left: 0 !important;
  border-bottom: 2px solid #1bd5ff !important;
  border-left: 2px solid #1bd5ff !important;
}

.dashboard-container .data-panel .corner-br,
.dashboard-container .kpi-card .corner-br {
  bottom: 0 !important;
  right: 0 !important;
  border-bottom: 2px solid #1bd5ff !important;
  border-right: 2px solid #1bd5ff !important;
}

.dashboard-container .tab-buttons {
  display: flex !important;
  margin-left: auto !important;
  flex-shrink: 0 !important;
}

.dashboard-container .tab-button {
  background: rgba(4, 24, 33, 0.88) !important;
  border: 1px solid rgba(0, 184, 225, 0.4) !important;
  color: #9cc8d5 !important;
  font-size: 11px !important;
  padding: 4px 8px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
}

.dashboard-container .tab-button:first-child {
  border-radius: 4px 0 0 4px !important;
}

.dashboard-container .tab-button:last-child {
  border-radius: 0 4px 4px 0 !important;
}

.dashboard-container .tab-button.active,
.dashboard-container .tab-button:hover {
  color: #effcff !important;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34)) !important;
  border-color: #26d5ff !important;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18) !important;
}

.dashboard-container .kpi-value,
.dashboard-container .panel-title {
  color: #ffd91a !important;
}

.dashboard-container .data-panel .panel-title {
  color: #f4fdff !important;
}

.dashboard-container .kpi-title,
.dashboard-container .panel-note,
.dashboard-container .unit-label {
  color: #a9c9d4 !important;
}

.dashboard-container .data-panel table th,
.dashboard-container .data-panel table td {
  border-color: rgba(0, 154, 197, 0.16) !important;
}

.dashboard-container .data-panel table thead th {
  background: rgba(0, 143, 184, 0.17) !important;
  color: #75dff7 !important;
  border-bottom: 1px solid rgba(0, 192, 235, 0.44) !important;
}

.dashboard-container .data-panel table tbody tr:nth-child(odd) {
  background: rgba(7, 36, 48, 0.78) !important;
}

.dashboard-container .data-panel table tbody tr:hover {
  background: rgba(0, 169, 215, 0.13) !important;
}

.dashboard-container .data-panel table tbody td {
  color: #cde7ee !important;
  background: rgba(5, 27, 37, 0.72) !important;
}

.dashboard-container .data-panel table tbody tr:nth-child(odd) td {
  background: rgba(7, 36, 48, 0.78) !important;
}

.dashboard-container .success-text,
.dashboard-container .rate-value.success,
.dashboard-container .text-green {
  color: #4ee6a6 !important;
}

.dashboard-container .error-text,
.dashboard-container .rate-value.error,
.dashboard-container .text-red {
  color: #ff5f87 !important;
}

.dashboard-container .dashboard-row,
.dashboard-container .main-content,
.dashboard-container .kpi-grid-container,
.dashboard-container .column,
.dashboard-container .column-wrapper {
  gap: 16px !important;
}

.dashboard-container .kpi-card {
  position: relative !important;
  min-height: 100px !important;
  padding: 12px 14px !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  overflow: hidden !important;
  color: #dff8ff !important;
  background: #082532 !important;
  background-color: #082532 !important;
  background-image:
    linear-gradient(135deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    linear-gradient(90deg, rgba(0, 196, 240, 0.1), transparent 58%) !important;
  border: 1px solid rgba(0, 190, 235, 0.56) !important;
  border-left: 1px solid rgba(0, 190, 235, 0.56) !important;
  border-radius: 3px !important;
  box-shadow:
    inset 0 0 22px rgba(0, 154, 201, 0.09),
    0 0 10px rgba(0, 0, 0, 0.24) !important;
}

.dashboard-container .kpi-card::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 58% !important;
  height: 2px !important;
  background: linear-gradient(90deg, #26d9ff, transparent) !important;
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.82) !important;
  z-index: 2 !important;
}

.dashboard-container .kpi-card::after {
  content: '' !important;
  position: absolute !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 34% !important;
  height: 1px !important;
  background: linear-gradient(90deg, transparent, rgba(38, 217, 255, 0.86)) !important;
  z-index: 2 !important;
}

.dashboard-container .kpi-icon {
  position: relative !important;
  z-index: 1 !important;
  width: 44px !important;
  height: 44px !important;
  flex: 0 0 44px !important;
  border-radius: 50% !important;
  color: #40e3ff !important;
  background: rgba(0, 176, 220, 0.14) !important;
  border: 1px solid rgba(35, 211, 255, 0.48) !important;
  box-shadow: inset 0 0 16px rgba(35, 211, 255, 0.16) !important;
}

.dashboard-container .kpi-content {
  position: relative !important;
  z-index: 1 !important;
  flex: 1 !important;
  min-width: 0 !important;
}

.dashboard-container .kpi-title {
  color: #a9c9d4 !important;
  font-size: 12px !important;
  margin-bottom: 6px !important;
  letter-spacing: 1px !important;
}

.dashboard-container .kpi-value {
  color: #ffd91a !important;
  font-size: 22px !important;
  font-weight: 800 !important;
  text-shadow: 0 0 12px rgba(255, 217, 26, 0.36) !important;
}

.dashboard-container .kpi-unit {
  color: #a7cad5 !important;
}

.dashboard-container .unit-hint {
  color: #a9c9d4 !important;
}






.dashboard-container .main-content {
  gap: 16px !important;
}

</style>
