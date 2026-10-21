<script setup lang="ts">

import binhaiLogo from '@/assets/binhai-logo.png'
import { ref } from 'vue'

import EChart from '@/components/EChart.vue'
import { useClock } from '@/composables/useClock'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 人员管理大屏静态数据 */

interface HrDatum {
  category: string
  value: number
}

const hrDistributionData: HrDatum[] = [
  { category: '管理', value: 25 },
  { category: '工艺质量', value: 48 },
  { category: '装备技术', value: 36 },
  { category: '技术支持', value: 52 },
  { category: '实习大学生', value: 18 },
  { category: '借点入人员', value: 12 },
  { category: '工序外包人员', value: 65 }
]

interface AppointmentDatum {
  name: string
  value: number
  /** 环形扇区渐变色 [起点, 终点] */
  colors: [string, string]
}

const appointmentData: AppointmentDatum[] = [
  { name: '助理技师', value: 45, colors: ['#2563eb', '#3A6FD9'] },
  { name: '技师', value: 68, colors: ['#16a34a', '#3AB886'] },
  { name: '高级技师', value: 32, colors: ['#d97706', '#D69D06'] }
]

interface DynamicsRow {
  time: string
  name: string
  action: string
}

const dynamicsRows: DynamicsRow[] = [
  { time: '10:23', name: '张三', action: '员工上机' },
  { time: '10:25', name: '李四', action: '上岗打卡' },
  { time: '10:28', name: '王五', action: '生产报工' },
  { time: '10:32', name: '赵六', action: '离岗登记' },
  { time: '10:35', name: '孙七', action: '设备巡检' },
  { time: '10:38', name: '周八', action: '质量检验' }
]

interface ScheduleRow {
  index: number
  person: string
  time: string
  position: string
  status: string
  /** 原页面仅「在岗 / 休息」两态着色 */
  statusColor?: string
  duration: string
}

const scheduleRows: ScheduleRow[] = [
  {
    index: 1,
    person: 'liuqi',
    time: '2025-12-03 17:51:00',
    position: '上机位1',
    status: '在岗',
    statusColor: '#16a34a',
    duration: '314.38'
  },
  {
    index: 2,
    person: '杨凯源',
    time: '2025-12-03 10:22:26',
    position: '上机位1',
    status: '休息',
    statusColor: '#64748b',
    duration: '696.72'
  },
  {
    index: 3,
    person: 'liuqi',
    time: '2025-11-26 09:48:44',
    position: '-',
    status: '-',
    duration: '0'
  },
  {
    index: 4,
    person: 'liuqi',
    time: '2025-11-20 15:27:17',
    position: '上机位1',
    status: '-',
    duration: '-'
  },
  {
    index: 5,
    person: 'liuqi',
    time: '2025-11-19 16:41:38',
    position: '-',
    status: '-',
    duration: '481.58'
  },
  {
    index: 6,
    person: '杨凯源',
    time: '2025-11-04 09:39:17',
    position: '上机位1',
    status: '-',
    duration: '-'
  },
  {
    index: 7,
    person: '杨凯源',
    time: '2025-11-04 09:39:00',
    position: '上机位1',
    status: '-',
    duration: '0.48'
  },
  {
    index: 8,
    person: '杨凯源',
    time: '2025-11-04 09:09:28',
    position: '上机位1',
    status: '-',
    duration: '-'
  },
  {
    index: 9,
    person: '杨凯源',
    time: '2025-11-04 09:08:54',
    position: '上机位1',
    status: '-',
    duration: '162.17'
  },
  {
    index: 10,
    person: '杨凯源',
    time: '2025-10-28 14:58:38',
    position: '上机位1',
    status: '-',
    duration: '-'
  }
]

const departmentCategories = ['造型', '熔炼', '制芯', '清理']

interface StackedSeries {
  name: string
  data: number[]
  colors: [string, string]
}

const departmentSeries: StackedSeries[] = [
  { name: '一线人员', data: [45, 52, 38, 42], colors: ['#2563eb', '#3A6FD9'] },
  { name: '技术支持', data: [12, 15, 10, 11], colors: ['#16a34a', '#3AB886'] },
  { name: '管理技术', data: [8, 10, 7, 9], colors: ['#d97706', '#D69D06'] }
]

const outputTrendMonths = ['1月', '2月', '3月', '4月', '5月', '6月']

const outputTrendData = [58, 61, 63, 62, 65, 64.5]

const outputPerCapita = '64.5'

type TrainingTone = 'green' | 'yellow' | 'blue' | 'purple'

interface TrainingStat {
  label: string
  value: string
  change: string
  tone: TrainingTone
}

const trainingStats: TrainingStat[] = [
  { label: '培训完成率', value: '95%', change: '↑ 5%', tone: 'green' },
  { label: '持证上岗率', value: '98%', change: '↑ 2%', tone: 'yellow' },
  { label: '技能等级达标率', value: '92%', change: '↑ 3%', tone: 'blue' },
  { label: '年度考核优秀率', value: '88%', change: '↑ 4%', tone: 'purple' }
]

interface DynamicsSeriesConfig {
  name: string
  baseCount: number
  variance: number
  color: string
  areaColors: [string, string]
}

const dynamicsSeriesConfig: DynamicsSeriesConfig[] = [
  {
    name: '大机',
    baseCount: 85,
    variance: 15,
    color: '#16a34a',
    areaColors: ['rgba(90, 216, 166, 0.3)', 'rgba(90, 216, 166, 0.05)']
  },
  {
    name: '曲轴',
    baseCount: 75,
    variance: 12,
    color: '#2563eb',
    areaColors: ['rgba(91, 143, 249, 0.3)', 'rgba(91, 143, 249, 0.05)']
  },
  {
    name: '机体',
    baseCount: 65,
    variance: 10,
    color: '#d97706',
    areaColors: ['rgba(246, 189, 22, 0.3)', 'rgba(246, 189, 22, 0.05)']
  },
  {
    name: '新产品',
    baseCount: 55,
    variance: 8,
    color: '#7c3aed',
    areaColors: ['rgba(146, 112, 202, 0.3)', 'rgba(146, 112, 202, 0.05)']
  }
]

/** 00:00 至当前整点的时间标签 */
function createHourlyLabels(): string[] {
  const currentHour = new Date().getHours()
  return Array.from({ length: currentHour + 1 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)
}

/**
 * 按班次作息规律生成在岗人数曲线。
 * 原页面叠加 Math.random() 抖动，这里改用固定抖动序列，
 * 保证每次渲染数值稳定、便于核对。
 */
const jitterPattern = [0.2, -0.4, 0.6, -0.2, 0.5, -0.6, 0.1, 0.3, -0.3, 0.4]

function createPersonnelValues(
  baseCount: number,
  variance: number,
  pointCount: number
): number[] {
  const values: number[] = []
  for (let hour = 0; hour < pointCount; hour += 1) {
    let factor: number
    if (hour >= 6 && hour < 8) {
      factor = 0.7 + (hour - 6) * 0.15
    } else if (hour >= 8 && hour < 12) {
      factor = 1
    } else if (hour >= 12 && hour < 14) {
      factor = 0.85
    } else if (hour >= 14 && hour < 18) {
      factor = 0.95
    } else if (hour >= 18) {
      factor = 0.8
    } else {
      factor = 0.3
    }

    const jitter = (jitterPattern[hour % jitterPattern.length] * variance) / 2
    values.push(Math.max(0, Math.floor(baseCount * factor + jitter)))
  }
  return values
}

/* =========================
   ECharts 配置
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(248, 250, 252, 0.95)',
  borderColor: 'rgba(24, 144, 255, 0.3)',
  textStyle: { color: '#374151' }
}

const dashedSplitLine = {
  lineStyle: {
    type: 'dashed' as const,
    color: 'rgba(148, 163, 184, 0.3)'
  }
}

const valueAxisBase = {
  type: 'value' as const,
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: dashedSplitLine,
  axisLabel: { color: '#64748b', fontSize: 10 }
}

const categoryAxisBase = {
  type: 'category' as const,
  axisLine: { lineStyle: { color: '#cbd5e1' } },
  axisLabel: { color: '#64748b', fontSize: 11 },
  axisTick: { show: false }
}

/** 人力资源动态明细：横向条形图，逐条渐变着色 */
function createHrDynamicsOption(): EChartsOption {
  const barColors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#FF9D4D', '#5CDBD3', '#B37FEB']
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: valueAxisBase,
    yAxis: {
      ...categoryAxisBase,
      data: hrDistributionData.map((item) => item.category)
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        barWidth: '60%',
        data: hrDistributionData.map((item, index) => {
          const color = barColors[index % barColors.length]
          return {
            value: item.value,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color },
                  { offset: 1, color: `${color}CC` }
                ]
              },
              borderRadius: [0, 4, 4, 0]
            }
          }
        }),
        label: {
          show: true,
          position: 'right',
          color: '#374151',
          fontSize: 11,
          formatter: '{c} 人'
        }
      }
    ]
  } as EChartsOption
}

/** 潍柴金兰领聘任情况：环形图 */
function createAppointmentOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      textStyle: { color: '#64748b', fontSize: 12 },
      itemWidth: 14,
      itemHeight: 14
    },
    series: [
      {
        name: '聘任情况',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: '{d}%\n{b}',
          fontSize: 14,
          color: '#374151'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: { show: false },
        data: appointmentData.map((item) => ({
          value: item.value,
          name: item.name,
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
            }
          }
        }))
      }
    ]
  } as EChartsOption
}

/** 实时动态：各产品线在岗人数曲线 */
function createDynamicsOption(): EChartsOption {
  const labels = createHourlyLabels()
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis'
    },
    legend: {
      data: dynamicsSeriesConfig.map((item) => item.name),
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      itemWidth: 12,
      itemHeight: 12
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxisBase,
      data: labels,
      axisLabel: { color: '#64748b', fontSize: 10, interval: 'auto' },
      boundaryGap: false
    },
    yAxis: {
      ...valueAxisBase,
      name: '人数',
      nameTextStyle: { color: '#64748b', fontSize: 10 }
    },
    series: dynamicsSeriesConfig.map((item) => ({
      name: item.name,
      type: 'line' as const,
      smooth: true,
      data: createPersonnelValues(item.baseCount, item.variance, labels.length),
      lineStyle: { width: 2, color: item.color },
      itemStyle: { color: item.color },
      symbol: 'circle',
      symbolSize: 4,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: item.areaColors[0] },
            { offset: 1, color: item.areaColors[1] }
          ]
        }
      }
    }))
  } as EChartsOption
}

/** 各单位人员明细：堆叠柱状图 */
function createDepartmentOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: departmentSeries.map((item) => item.name),
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      itemWidth: 12,
      itemHeight: 12
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxisBase,
      data: departmentCategories
    },
    yAxis: {
      ...valueAxisBase,
      name: '人数',
      nameTextStyle: { color: '#64748b', fontSize: 11 }
    },
    series: departmentSeries.map((item) => ({
      name: item.name,
      type: 'bar' as const,
      stack: 'total',
      data: item.data,
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
        }
      }
    }))
  } as EChartsOption
}

/** 人均出产吨位：渐变趋势线 */
function createOutputTrendOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis'
    },
    grid: {
      left: '10%',
      right: '4%',
      bottom: '8%',
      top: '10%',
      containLabel: false
    },
    xAxis: {
      ...categoryAxisBase,
      data: outputTrendMonths,
      boundaryGap: false
    },
    yAxis: {
      ...valueAxisBase,
      name: '吨/人',
      nameTextStyle: { color: '#64748b', fontSize: 11 }
    },
    series: [
      {
        name: '人均出产',
        type: 'line',
        smooth: true,
        data: outputTrendData,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#3BA7FF' },
              { offset: 1, color: '#16a34a' }
            ]
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 167, 255, 0.3)' },
              { offset: 1, color: 'rgba(59, 167, 255, 0.05)' }
            ]
          }
        },
        itemStyle: {
          color: '#3BA7FF',
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  } as EChartsOption
}

/** 人员指标与培训：双仪表盘 */
function createIndicatorOption(): EChartsOption {
  return {
    tooltip: {
      formatter: '{b}: {c}'
    },
    series: [
      {
        name: '多技能水平',
        type: 'gauge',
        center: ['25%', '55%'],
        radius: '70%',
        min: 0,
        max: 5,
        splitNumber: 5,
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#2563eb' },
                { offset: 1, color: '#3BA7FF' }
              ]
            }
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(148, 163, 184, 0.3)']]
          }
        },
        axisTick: { show: false },
        splitLine: {
          length: 8,
          lineStyle: {
            width: 2,
            color: '#cbd5e1'
          }
        },
        axisLabel: {
          distance: 15,
          color: '#64748b',
          fontSize: 10
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#2563eb'
          }
        },
        title: {
          show: true,
          offsetCenter: [0, '80%'],
          color: '#64748b',
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#374151',
          offsetCenter: [0, '50%'],
          formatter: '{value} 级'
        },
        data: [{ value: 3.8, name: '多技能水平' }]
      },
      {
        name: '人均培训学时',
        type: 'gauge',
        center: ['75%', '55%'],
        radius: '70%',
        min: 0,
        max: 60,
        splitNumber: 6,
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#16a34a' },
                { offset: 1, color: '#3AB886' }
              ]
            }
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(148, 163, 184, 0.3)']]
          }
        },
        axisTick: { show: false },
        splitLine: {
          length: 8,
          lineStyle: {
            width: 2,
            color: '#cbd5e1'
          }
        },
        axisLabel: {
          distance: 15,
          color: '#64748b',
          fontSize: 10
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#16a34a'
          }
        },
        title: {
          show: true,
          offsetCenter: [0, '80%'],
          color: '#64748b',
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#374151',
          offsetCenter: [0, '50%'],
          formatter: '{value} 小时'
        },
        data: [{ value: 42, name: '人均培训学时' }]
      }
    ]
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */
const { time, date } = useClock()
const logoUrl = binhaiLogo

type MetricTab = 'skill' | 'training'

const activeTab = ref<MetricTab>('skill')
const alertVisible = ref(true)

const hrDynamicsOption = createHrDynamicsOption()
const appointmentOption = createAppointmentOption()
const dynamicsOption = createDynamicsOption()
const departmentOption = createDepartmentOption()
const outputTrendOption = createOutputTrendOption()
const indicatorOption = createIndicatorOption()
</script>

<template>
  <div class="dashboard-container">
    <!-- 顶部标题栏 -->
    <div class="screen-header">
      <div class="header-time">
        <div class="time-value">{{ time }}</div>
        <div class="date-value">{{ date }}</div>
      </div>

      <div class="header-title-wrapper">
        <div class="title-decoration-left"></div>
        <h1 class="header-title">人员管理大屏</h1>
        <div class="title-decoration-right"></div>
      </div>

      <div class="header-right">
        <div class="header-weather">
          <svg class="weather-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
          <div class="weather-text">
            <span class="weather-location">潍坊</span>
            <span class="weather-temp">18°C</span>
            <span class="weather-status">晴</span>
          </div>
        </div>
        <div class="header-logo">
          <img :src="logoUrl" alt="WEICHAI" class="logo-image" />
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <!-- 左侧列 -->
      <div class="column-wrapper">
        <!-- 人员概览+分布 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                />
              </svg>
            </div>
            <h3 class="panel-title">人员概览+分布</h3>
          </div>

          <div class="data-list">
            <!-- 总在岗人数/缺勤人数 -->
            <div class="data-item">
              <div class="data-item-icon green">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                  />
                </svg>
              </div>
              <div class="data-item-content">
                <div class="data-item-label">总在岗人数/缺勤人数</div>
                <div class="data-item-value">
                  <span style="color: #16a34a; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5)">256</span>
                  <span style="color: #64748b; margin: 0 4px">/</span>
                  <span style="color: #ef4444; text-shadow: 0 0 10px rgba(255, 82, 82, 0.5)">8</span>
                </div>
                <div class="data-item-progress">
                  <div class="progress-bar" style="width: 97%"></div>
                </div>
              </div>
            </div>

            <!-- 当前班次 -->
            <div class="data-item">
              <div class="data-item-icon green">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="data-item-content">
                <div class="data-item-label">当前班次</div>
                <div class="data-item-value">早班 (08:00-16:00)</div>
              </div>
            </div>

            <!-- 今日出勤达标率 -->
            <div class="data-item">
              <div class="data-item-icon gray">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="data-item-content">
                <div class="data-item-label">今日出勤达标率</div>
                <div class="data-item-value">97%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 人力资源动态明细 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 class="panel-title">人力资源动态明细</h3>
          </div>
          <div class="chart-area">
            <EChart :option="hrDynamicsOption" />
          </div>
        </div>

        <!-- 潍柴金兰领聘任情况 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h3 class="panel-title">潍柴金兰领聘任情况</h3>
          </div>
          <div class="chart-area">
            <EChart :option="appointmentOption" />
          </div>
        </div>
      </div>

      <!-- 中间列 -->
      <div class="column-wrapper">
        <!-- 实时动态 -->
        <div class="data-panel realtime-dynamics-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">实时动态</h3>
          </div>

          <!-- 动态列表 -->
          <div class="dynamics-list-new">
            <div v-for="row in dynamicsRows" :key="`${row.time}-${row.name}`" class="dynamics-row">
              <div class="dynamics-arrow">▶</div>
              <div class="dynamics-time">{{ row.time }}</div>
              <div class="dynamics-name">{{ row.name }}</div>
              <div class="dynamics-dot">·</div>
              <div class="dynamics-action">{{ row.action }}</div>
            </div>
          </div>

          <!-- 异常提醒弹窗 -->
          <div v-show="alertVisible" class="alert-box">
            <button class="alert-close" @click="alertVisible = false">×</button>
            <div class="alert-title">异常提醒</div>
            <div class="alert-content">超时班组人员、技能不匹配隐患</div>
          </div>

          <!-- 统计图表 -->
          <div class="chart-area">
            <EChart :option="dynamicsOption" />
          </div>
        </div>

        <!-- 排班信息总览 -->
        <div class="data-panel schedule-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">排班信息总览</h3>
          </div>

          <!-- 排班表格 -->
          <div class="schedule-table">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>排班人</th>
                  <th>排班时间</th>
                  <th>排班位置</th>
                  <th>状态</th>
                  <th>时长</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in scheduleRows" :key="row.index">
                  <td>{{ row.index }}</td>
                  <td>{{ row.person }}</td>
                  <td>{{ row.time }}</td>
                  <td>{{ row.position }}</td>
                  <td>
                    <span :style="row.statusColor ? { color: row.statusColor } : undefined">
                      {{ row.status }}
                    </span>
                  </td>
                  <td>{{ row.duration }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="column-wrapper">
        <!-- 各单位人员明细 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                />
              </svg>
            </div>
            <h3 class="panel-title">各单位人员明细</h3>
          </div>
          <div class="chart-area">
            <EChart :option="departmentOption" />
          </div>
        </div>

        <!-- 人均出产吨位 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                />
              </svg>
            </div>
            <h3 class="panel-title">人均出产吨位</h3>
          </div>
          <div class="big-value">
            <div class="big-number">{{ outputPerCapita }}</div>
            <div class="big-unit">吨/人</div>
          </div>
          <div class="chart-area">
            <EChart :option="outputTrendOption" />
          </div>
        </div>

        <!-- 人员指标与培训 -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fill-rule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="panel-title">人员指标与培训</h3>
            <div class="tab-buttons">
              <button
                class="tab-button"
                :class="{ active: activeTab === 'skill' }"
                @click="activeTab = 'skill'"
              >
                技能水平
              </button>
              <button
                class="tab-button"
                :class="{ active: activeTab === 'training' }"
                @click="activeTab = 'training'"
              >
                培训考核
              </button>
            </div>
          </div>

          <!-- 技能水平 -->
          <div v-if="activeTab === 'skill'" class="chart-area">
            <EChart :option="indicatorOption" />
          </div>

          <!-- 培训考核 -->
          <div v-else class="training-grid">
            <div v-for="item in trainingStats" :key="item.label" class="training-item">
              <div class="training-label">{{ item.label }}</div>
              <div class="training-value" :class="item.tone">{{ item.value }}</div>
              <div class="training-change">{{ item.change }}</div>
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
.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(24, 144, 255, 0.3);
  position: relative;
}

.screen-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(24, 144, 255, 0.8) 50%, transparent 100%);
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.6);
}

/* 左侧时间 */
.header-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
}

.time-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  line-height: 1;
}

.date-value {
  font-size: 12px;
  color: #64748b;
}

/* 中间标题 */
.header-title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.header-title {
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(24, 144, 255, 0.4);
}

.title-decoration-left,
.title-decoration-right {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(24, 144, 255, 0.8) 100%);
}

.title-decoration-right {
  background: linear-gradient(90deg, rgba(24, 144, 255, 0.8) 0%, transparent 100%);
}

/* 右侧区域 */
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 300px;
  justify-content: flex-end;
}

/* 右侧天气 */
.header-weather {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weather-icon {
  width: 24px;
  height: 24px;
  color: #1890ff;
}

.weather-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.weather-location {
  color: #64748b;
}

.weather-temp {
  color: #1890ff;
  font-weight: bold;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
}

.weather-status {
  color: #64748b;
}

/* Logo 样式 */
.header-logo {
  display: flex;
  align-items: center;
  padding-left: 20px;
  border-left: 1px solid rgba(24, 144, 255, 0.3);
}

.logo-image {
  height: 45px;
  width: auto;
  object-fit: contain;
}

/* 网格布局 */
.dashboard-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
  height: auto;
}

.column-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 数据面板 */
.data-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border: 1px solid rgba(24, 144, 255, 0.4);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  position: relative;
  height: 360px;
}

/* 中间列特殊高度 */
.realtime-dynamics-panel {
  height: 650px;
}

.schedule-panel {
  height: 450px;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.panel-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 144, 255, 0.2);
  border-radius: 6px;
  margin-right: 12px;
  color: #1890ff;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

/* data-panel 角装饰 */
.corner-tl {
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid #1890ff;
  border-left: 2px solid #1890ff;
  z-index: 10;
}

.corner-tr {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-top: 2px solid #1890ff;
  border-right: 2px solid #1890ff;
  z-index: 10;
}

.corner-bl {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid #1890ff;
  border-left: 2px solid #1890ff;
  z-index: 10;
}

.corner-br {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-bottom: 2px solid #1890ff;
  border-right: 2px solid #1890ff;
  z-index: 10;
}

/* 数据列表 */
.data-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.data-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(24, 144, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.data-item:hover {
  background: rgba(24, 144, 255, 0.1);
  border-color: rgba(24, 144, 255, 0.4);
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.3);
}

.data-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-right: 12px;
  flex-shrink: 0;
}

.data-item-icon.green {
  background: rgba(0, 255, 136, 0.2);
  color: #16a34a;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}

.data-item-icon.gray {
  background: rgba(138, 148, 166, 0.2);
  color: #64748b;
}

.data-item-content {
  flex: 1;
}

.data-item-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.data-item-value {
  font-size: 18px;
  font-weight: bold;
  color: #16a34a;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  font-family: 'DIN Alternate', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif;
}

.data-item-progress {
  width: 100%;
  height: 8px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 6px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #16a34a 0%, #1890ff 100%);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  transition: width 0.3s ease;
}

/* 实时动态列表 */
.dynamics-list-new {
  margin-bottom: 16px;
  max-height: 150px;
  overflow-y: auto;
}

.dynamics-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(24, 144, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.dynamics-row:hover {
  background: rgba(24, 144, 255, 0.1);
  border-color: rgba(24, 144, 255, 0.4);
  transform: translateX(4px);
}

.dynamics-arrow {
  color: #16a34a;
  font-size: 12px;
  margin-right: 10px;
  flex-shrink: 0;
}

.dynamics-time {
  color: #1890ff;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.dynamics-name {
  color: #1f2937;
  font-weight: 500;
  margin-right: 6px;
  flex-shrink: 0;
}

.dynamics-dot {
  color: #64748b;
  margin-right: 6px;
  flex-shrink: 0;
}

.dynamics-action {
  color: #64748b;
  flex: 1;
}

/* 异常提醒框 */
.alert-box {
  position: relative;
  background: linear-gradient(135deg, #ef4444 0%, #e53935 100%);
  border: 2px solid #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 0 30px rgba(255, 82, 82, 0.8);
}

.alert-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.alert-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.alert-content {
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 12px;
}

/* 排班表格样式 */
.schedule-table {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.schedule-table table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-table thead tr {
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 2px solid #3a9ff1;
}

.schedule-table thead th {
  color: #1f2937;
  font-weight: bold;
  font-size: 12px;
  text-align: center;
  padding: 8px 4px;
}

.schedule-table tbody tr {
  border-bottom: 1px solid rgba(58, 159, 241, 0.2);
  transition: background-color 0.2s ease;
}

.schedule-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 4px rgba(58, 159, 241, 0.2);
}

.schedule-table tbody td {
  color: #1f2937;
  font-size: 12px;
  text-align: center;
  padding: 8px 4px;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.tab-button {
  background: rgba(241, 245, 249, 0.5);
  border: 1px solid rgba(24, 144, 255, 0.3);
  color: #64748b;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: #16a34a;
}

.tab-button.active {
  background: rgba(90, 216, 166, 0.2);
  border-color: #16a34a;
  color: #16a34a;
  box-shadow: none;
}

/* 图表容器 */
.chart-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-area {
  flex: 1;
  min-height: 200px;
  width: 100%;
}

/* 大数值显示 */
.big-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 12px;
  gap: 12px;
}

.big-number {
  font-size: 48px;
  font-weight: 900;
  color: #16a34a;
  font-family: 'DIN Alternate', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.4);
  line-height: 1;
}

.big-unit {
  color: #64748b;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 培训考核网格 */
.training-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}

.training-item {
  text-align: center;
  padding: 12px;
  background: rgba(241, 245, 249, 0.5);
  border-radius: 4px;
}

.training-label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 8px;
}

.training-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.training-change {
  color: #64748b;
  font-size: 12px;
}

.training-value.green {
  color: #16a34a;
}

.training-value.yellow {
  color: #d97706;
}

.training-value.blue {
  color: #2563eb;
}

.training-value.purple {
  color: #7c3aed;
}

@media (max-width: 1400px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }

  .header-title {
    font-size: 22px;
    letter-spacing: 2px;
  }
}


/* =========================
   MES 浅色主题适配（以 MES 样式为主）
   ========================= */
.dashboard-container {
  height: auto;
  min-height: calc(100vh - 132px);
  background: #f5f5f5;
  color: #374151;
}

.screen-header,
.kpi-card,
.data-panel {
  background: #ffffff !important;
  border-color: #e5e7eb !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

.screen-header {
  border-bottom: 1px solid #e5e7eb !important;
}

.header-title {
  color: #1f2937 !important;
  font-size: 24px !important;
  letter-spacing: 2px;
  text-shadow: none !important;
}

.header-logo .logo-image {
  height: 32px;
}

.time-value,
.header-title,
.kpi-value,
.panel-title {
  color: #1f2937;
}

.time-value {
  color: #1890ff !important;
}

.date-value,
.weather-location,
.weather-status,
.kpi-title,
.panel-note,
.unit-label {
  color: #64748b !important;
}

.data-panel .corner-tl,
.data-panel .corner-tr,
.data-panel .corner-bl,
.data-panel .corner-br,
.kpi-card .corner-bl,
.kpi-card .corner-br {
  display: none;
}

.data-panel > .panel-header {
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 10px;
}

.data-panel .panel-icon,
.kpi-card .kpi-icon {
  color: #1890ff !important;
  background: rgba(24, 144, 255, 0.08) !important;
  border-color: rgba(24, 144, 255, 0.16) !important;
}

.table-header,
.assessment-table-header {
  background: #f5f7fa !important;
  color: #374151 !important;
}

.data-panel table th,
.data-panel table td {
  border-color: #eef0f3 !important;
}

.data-panel table tbody tr:nth-child(odd) {
  background: rgba(241, 245, 249, 0.65) !important;
}

.data-panel table tbody tr:hover {
  background: rgba(24, 144, 255, 0.06) !important;
}

.success-text,
.rate-value.success {
  color: #16a34a !important;
}

.error-text,
.rate-value.error {
  color: #ef4444 !important;
}
</style>
