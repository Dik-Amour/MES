<script setup lang="ts">

import { ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 人员可视化大屏静态数据 */

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
  { name: '助理技师', value: 45, colors: ['#20cfff', '#20cfff'] },
  { name: '技师', value: 68, colors: ['#4ee6a6', '#3ba8a0'] },
  { name: '高级技师', value: 32, colors: ['#ffd52a', '#D69D06'] }
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
    statusColor: '#4ee6a6',
    duration: '314.38'
  },
  {
    index: 2,
    person: '杨凯源',
    time: '2025-12-03 10:22:26',
    position: '上机位1',
    status: '休息',
    statusColor: '#a9c9d4',
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
  { name: '一线人员', data: [45, 52, 38, 42], colors: ['#20cfff', '#20cfff'] },
  { name: '技术支持', data: [12, 15, 10, 11], colors: ['#4ee6a6', '#3ba8a0'] },
  { name: '管理技术', data: [8, 10, 7, 9], colors: ['#ffd52a', '#D69D06'] }
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
    color: '#4ee6a6',
    areaColors: ['rgba(78, 230, 166, 0.3)', 'rgba(78, 230, 166, 0.05)']
  },
  {
    name: '曲轴',
    baseCount: 75,
    variance: 12,
    color: '#20cfff',
    areaColors: ['rgba(32, 207, 255, 0.3)', 'rgba(32, 207, 255, 0.05)']
  },
  {
    name: '机体',
    baseCount: 65,
    variance: 10,
    color: '#ffd52a',
    areaColors: ['rgba(255, 213, 42, 0.3)', 'rgba(255, 213, 42, 0.05)']
  },
  {
    name: '新产品',
    baseCount: 55,
    variance: 8,
    color: '#9b8cff',
    areaColors: ['rgba(155, 140, 255, 0.3)', 'rgba(155, 140, 255, 0.05)']
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
   ECharts 配置（深色底，对齐生产可视化大屏）
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(6, 24, 33, 0.94)',
  borderColor: 'rgba(0, 191, 235, 0.48)',
  textStyle: { color: '#dff8ff' }
}

const dashedSplitLine = {
  lineStyle: {
    type: 'dashed' as const,
    color: 'rgba(0, 154, 197, 0.28)'
  }
}

const valueAxisBase = {
  type: 'value' as const,
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: dashedSplitLine,
  axisLabel: { color: '#a9c9d4', fontSize: 10 }
}

const categoryAxisBase = {
  type: 'category' as const,
  axisLine: { lineStyle: { color: 'rgba(0, 191, 235, 0.35)' } },
  axisLabel: { color: '#a9c9d4', fontSize: 11 },
  axisTick: { show: false }
}

/** 人力资源动态明细：横向条形图，逐条渐变着色 */
function createHrDynamicsOption(): EChartsOption {
  const barColors = ['#20cfff', '#4ee6a6', '#ffd52a', '#9b8cff', '#ffd52a', '#4ee6a6', '#20cfff']
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
          color: '#dff8ff',
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
      textStyle: { color: '#a9c9d4', fontSize: 12 },
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
          color: '#f4fdff'
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
      textStyle: { color: '#a9c9d4', fontSize: 11 },
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
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 'auto' },
      boundaryGap: false
    },
    yAxis: {
      ...valueAxisBase,
      name: '人数',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 }
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
      textStyle: { color: '#a9c9d4', fontSize: 11 },
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
      nameTextStyle: { color: '#a9c9d4', fontSize: 11 }
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
      nameTextStyle: { color: '#a9c9d4', fontSize: 11 }
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
              { offset: 0, color: '#20cfff' },
              { offset: 1, color: '#4ee6a6' }
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
              { offset: 0, color: 'rgba(32, 207, 255, 0.3)' },
              { offset: 1, color: 'rgba(32, 207, 255, 0.05)' }
            ]
          }
        },
        itemStyle: {
          color: '#20cfff',
          borderColor: '#061821',
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
      formatter: '{b}: {c}',
      ...tooltipBase
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
                { offset: 0, color: '#20cfff' },
                { offset: 1, color: '#20cfff' }
              ]
            }
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(0, 154, 197, 0.28)']]
          }
        },
        axisTick: { show: false },
        splitLine: {
          length: 8,
          lineStyle: {
            width: 2,
            color: 'rgba(0, 191, 235, 0.45)'
          }
        },
        axisLabel: {
          distance: 15,
          color: '#a9c9d4',
          fontSize: 10
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#20cfff'
          }
        },
        title: {
          show: true,
          offsetCenter: [0, '80%'],
          color: '#a9c9d4',
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#ffd91a',
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
                { offset: 0, color: '#4ee6a6' },
                { offset: 1, color: '#20cfff' }
              ]
            }
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(0, 154, 197, 0.28)']]
          }
        },
        axisTick: { show: false },
        splitLine: {
          length: 8,
          lineStyle: {
            width: 2,
            color: 'rgba(0, 191, 235, 0.45)'
          }
        },
        axisLabel: {
          distance: 15,
          color: '#a9c9d4',
          fontSize: 10
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#4ee6a6'
          }
        },
        title: {
          show: true,
          offsetCenter: [0, '80%'],
          color: '#a9c9d4',
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#ffd91a',
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

type MetricTab = 'skill' | 'training'

const activeTab = ref<MetricTab>('skill')

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
    <DashboardHeader
      title="人员可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

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
                  <span style="color: #4ee6a6; text-shadow: 0 0 10px rgba(78, 230, 166, 0.5)">256</span>
                  <span style="color: #a9c9d4; margin: 0 4px">/</span>
                  <span style="color: #ff5f87; text-shadow: 0 0 10px rgba(255, 95, 135, 0.5)">8</span>
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

.dashboard-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  height: auto;
  min-height: calc(100vh - 200px);
}

.column-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* 数据面板：沿用生产可视化大屏 */
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

.realtime-dynamics-panel {
  height: 650px;
}

.schedule-panel {
  height: 450px;
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

/* 角装饰 */
.corner-tl,
.corner-tr,
.corner-bl,
.corner-br {
  position: absolute;
  width: 14px;
  height: 14px;
  z-index: 10;
  border-color: #1bd5ff;
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

/* 数据列表 */
.data-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.data-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(0, 143, 184, 0.12);
  border: 1px solid rgba(0, 191, 235, 0.28);
  border-radius: 3px;
  transition: all 0.3s ease;
}

.data-item:hover {
  background: rgba(0, 169, 215, 0.16);
  border-color: rgba(0, 191, 235, 0.5);
  box-shadow: inset 0 0 14px rgba(0, 154, 201, 0.12);
}

.data-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  margin-right: 12px;
  flex-shrink: 0;
}

.data-item-icon.green {
  background: rgba(43, 214, 157, 0.14);
  color: #4ee6a6;
  border: 1px solid rgba(83, 255, 197, 0.4);
  box-shadow: inset 0 0 12px rgba(78, 230, 166, 0.12);
}

.data-item-icon.gray {
  background: rgba(0, 174, 220, 0.12);
  color: #62e8ff;
  border: 1px solid rgba(55, 220, 255, 0.4);
}

.data-item-content {
  flex: 1;
  min-width: 0;
}

.data-item-label {
  font-size: 13px;
  color: #a9c9d4;
  margin-bottom: 6px;
}

.data-item-value {
  font-size: 18px;
  font-weight: 800;
  color: #f4fdff;
  text-shadow: 0 0 10px rgba(31, 204, 255, 0.25);
  font-family: 'DIN Alternate', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif;
  font-variant-numeric: tabular-nums;
}

.data-item-progress {
  width: 100%;
  height: 7px;
  background: rgba(0, 126, 165, 0.2);
  border: 1px solid rgba(0, 181, 224, 0.26);
  border-radius: 1px;
  overflow: hidden;
  margin-top: 6px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.45);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0aaad9, #35e4ff 72%, #ffd91a);
  border-radius: 1px;
  box-shadow: 0 0 9px rgba(53, 228, 255, 0.72);
  transition: width 0.3s ease;
}

/* 实时动态列表 */
.dynamics-list-new {
  margin-bottom: 16px;
  max-height: 150px;
  overflow-y: auto;
  flex-shrink: 0;
}

.dynamics-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(5, 27, 37, 0.78);
  border: 1px solid rgba(0, 154, 197, 0.22);
  border-radius: 3px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.dynamics-row:hover {
  background: rgba(0, 169, 215, 0.13);
  border-color: rgba(0, 191, 235, 0.44);
  transform: translateX(4px);
}

.dynamics-arrow {
  color: #4ee6a6;
  font-size: 12px;
  margin-right: 10px;
  flex-shrink: 0;
}

.dynamics-time {
  color: #35e4ff;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  font-weight: 700;
  margin-right: 12px;
  flex-shrink: 0;
}

.dynamics-name {
  color: #f4fdff;
  font-weight: 600;
  margin-right: 6px;
  flex-shrink: 0;
}

.dynamics-dot {
  color: #a9c9d4;
  margin-right: 6px;
  flex-shrink: 0;
}

.dynamics-action {
  color: #a9c9d4;
  flex: 1;
}

/* 排班表格样式 */
.schedule-table {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.5) transparent;
}

.schedule-table table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-table thead tr {
  background: rgba(0, 143, 184, 0.17);
  border-bottom: 1px solid rgba(0, 192, 235, 0.44);
}

.schedule-table thead th {
  color: #75dff7;
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  padding: 8px 4px;
}

.schedule-table tbody tr {
  border-bottom: 1px solid rgba(0, 154, 197, 0.16);
  transition: background-color 0.2s ease;
}

.schedule-table tbody tr:nth-child(odd) {
  background: rgba(7, 36, 48, 0.78);
}

.schedule-table tbody tr:hover {
  background: rgba(0, 169, 215, 0.13);
}

.schedule-table tbody td {
  color: #cde7ee;
  font-size: 12px;
  text-align: center;
  padding: 8px 4px;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  font-variant-numeric: tabular-nums;
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.tab-button {
  background: rgba(4, 24, 33, 0.88);
  border: 1px solid rgba(0, 184, 225, 0.4);
  color: #9cc8d5;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-button:hover {
  color: #effcff;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34));
  border-color: #26d5ff;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
}

.tab-button.active {
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34));
  border-color: #26d5ff;
  color: #effcff;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
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
  flex-shrink: 0;
}

.big-number {
  font-size: 48px;
  font-weight: 800;
  color: #ffd91a;
  font-family: 'DIN Alternate', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 18px rgba(255, 217, 26, 0.36);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.big-unit {
  color: #a7cad5;
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
  flex: 1;
  align-content: center;
}

.training-item {
  text-align: center;
  padding: 12px;
  position: relative;
  overflow: hidden;
  background-color: #082532;
  background-image:
    linear-gradient(180deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    linear-gradient(90deg, rgba(0, 196, 240, 0.1), transparent 58%);
  border: 1px solid rgba(0, 190, 235, 0.56);
  border-radius: 3px;
  box-shadow:
    inset 0 0 22px rgba(0, 154, 201, 0.09),
    0 0 10px rgba(0, 0, 0, 0.24);
}

.training-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 58%;
  height: 2px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.82);
}

.training-label {
  color: #a9c9d4;
  font-size: 12px;
  margin-bottom: 8px;
}

.training-value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
}

.training-change {
  color: #a7cad5;
  font-size: 12px;
}

.training-value.green {
  color: #4ee6a6;
  text-shadow: 0 0 10px rgba(78, 230, 166, 0.25);
}

.training-value.yellow {
  color: #ffd91a;
  text-shadow: 0 0 10px rgba(255, 217, 26, 0.28);
}

.training-value.blue {
  color: #31d7ff;
  text-shadow: 0 0 10px rgba(49, 215, 255, 0.28);
}

.training-value.purple {
  color: #9b8cff;
  text-shadow: 0 0 10px rgba(155, 140, 255, 0.28);
}

.dynamics-list-new::-webkit-scrollbar,
.schedule-table::-webkit-scrollbar,
.data-list::-webkit-scrollbar {
  width: 4px;
}

.dynamics-list-new::-webkit-scrollbar-track,
.schedule-table::-webkit-scrollbar-track,
.data-list::-webkit-scrollbar-track {
  background: transparent;
}

.dynamics-list-new::-webkit-scrollbar-thumb,
.schedule-table::-webkit-scrollbar-thumb,
.data-list::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.5);
  border-radius: 2px;
}

@media (max-width: 1400px) {
  .dashboard-row {
    grid-template-columns: minmax(0, 1fr);
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


.dashboard-container .kpi-card,
.dashboard-container .data-item {
  color: #dff8ff !important;
  background: rgba(0, 143, 184, 0.12) !important;
  background-color: rgba(0, 143, 184, 0.12) !important;
  background-image: none !important;
  border: 1px solid rgba(0, 191, 235, 0.28) !important;
  border-left: 1px solid rgba(0, 191, 235, 0.28) !important;
  border-radius: 3px !important;
  box-shadow: none !important;
}

.dashboard-container .data-item:hover {
  background: rgba(0, 169, 215, 0.16) !important;
  border-color: rgba(0, 191, 235, 0.5) !important;
  box-shadow: inset 0 0 14px rgba(0, 154, 201, 0.12) !important;
}

.dashboard-container .data-item-label {
  color: #a9c9d4 !important;
}

.dashboard-container .data-item-value {
  color: #f4fdff !important;
  text-shadow: 0 0 10px rgba(31, 204, 255, 0.25) !important;
}

.dashboard-container .data-item-progress {
  background: rgba(0, 126, 165, 0.2) !important;
  border: 1px solid rgba(0, 181, 224, 0.26) !important;
}

.dashboard-container .progress-bar {
  background: linear-gradient(90deg, #0aaad9, #35e4ff 72%, #ffd91a) !important;
}

.dashboard-container .dynamics-row {
  background: rgba(5, 27, 37, 0.78) !important;
  border: 1px solid rgba(0, 154, 197, 0.22) !important;
  color: #a9c9d4 !important;
}

.dashboard-container .dynamics-name {
  color: #f4fdff !important;
}

.dashboard-container .dynamics-time {
  color: #35e4ff !important;
}

.dashboard-container .dynamics-arrow {
  color: #4ee6a6 !important;
}

.dashboard-container .big-number {
  color: #ffd91a !important;
  text-shadow: 0 0 18px rgba(255, 217, 26, 0.36) !important;
}

.dashboard-container .big-unit {
  color: #a7cad5 !important;
}

.dashboard-container .training-item {
  background: #082532 !important;
  background-color: #082532 !important;
  background-image:
    linear-gradient(180deg, rgba(13, 63, 82, 0.98), rgba(6, 31, 42, 0.98)),
    linear-gradient(90deg, rgba(0, 196, 240, 0.1), transparent 58%) !important;
  border: 1px solid rgba(0, 190, 235, 0.56) !important;
  border-radius: 3px !important;
}

.dashboard-container .training-label,
.dashboard-container .training-change {
  color: #a9c9d4 !important;
}

.dashboard-container .schedule-table thead tr {
  background: rgba(0, 143, 184, 0.17) !important;
  border-bottom: 1px solid rgba(0, 192, 235, 0.44) !important;
}

.dashboard-container .schedule-table thead th {
  color: #75dff7 !important;
}

.dashboard-container .schedule-table tbody td {
  color: #cde7ee !important;
}

.dashboard-container .schedule-table tbody tr {
  border-bottom: 1px solid rgba(0, 154, 197, 0.16) !important;
}

.dashboard-container .schedule-table tbody tr:nth-child(odd) {
  background: rgba(7, 36, 48, 0.78) !important;
}

.dashboard-container .schedule-table tbody tr:hover {
  background: rgba(0, 169, 215, 0.13) !important;
}

.dashboard-container .dashboard-row {
  gap: 16px !important;
}

</style>
