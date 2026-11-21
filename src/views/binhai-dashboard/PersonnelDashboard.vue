<script setup lang="ts">

import { computed, ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 人员可视化大屏静态数据 */

/** 顶部指标栏（6 项，样式对齐其他滨海大屏 top-indicators） */
const personnelIndicators: { label: string; value: string; unit: string; tone: string }[] = [
  { label: '厂区总人数', value: '486', unit: '人', tone: 'output' },
  { label: '熔炼线人数', value: '72', unit: '人', tone: 'output' },
  { label: '造型线人数', value: '128', unit: '人', tone: 'inbound' },
  { label: '清理线人数', value: '56', unit: '人', tone: 'output' },
  { label: '上机人数', value: '312', unit: '人', tone: 'inbound' },
  { label: '人员利用率', value: '92.5', unit: '%', tone: 'inbound' }
]

/** 产线人员排班统计：近 7 天 × 造型 / 熔炼 / 清理 */
type ScheduleLineKey = 'molding' | 'smelting' | 'cleaning'

const scheduleLineTabs: { key: ScheduleLineKey; label: string }[] = [
  { key: 'molding', label: '造型' },
  { key: 'smelting', label: '熔炼' },
  { key: 'cleaning', label: '清理' }
]

const scheduleDates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function mockScheduleCounts(line: ScheduleLineKey): number[] {
  const bases: Record<ScheduleLineKey, number> = { molding: 128, smelting: 72, cleaning: 56 }
  const seedMap: Record<ScheduleLineKey, number> = { molding: 11, smelting: 23, cleaning: 37 }
  const seed = seedMap[line]
  return scheduleDates.map((_, i) => {
    const weekend = (i + new Date().getDate()) % 7 === 0 || (i + new Date().getDate()) % 7 === 6
    const base = bases[line]
    const wave = Math.round(Math.sin(seed * 0.3 + i * 0.7) * (base * 0.08))
    return weekend ? Math.max(8, base - Math.round(base * 0.35) + wave) : base + wave
  })
}

const scheduleColorMap: Record<ScheduleLineKey, string> = {
  molding: '#31d7ff',
  smelting: '#ffd52a',
  cleaning: '#4ee6a6'
}

/* 人员利用率 */
type UtilScopeKey = 'plant' | 'line'

const utilizationScopeTabs: { key: UtilScopeKey; label: string }[] = [
  { key: 'plant', label: '分厂' },
  { key: 'line', label: '产线' }
]

const plantUtilizationData = [91.2, 92.5, 90.8, 93.1, 92.0, 88.6, 89.4]

const lineUtilizationSeries = [
  { name: '造型', color: '#31d7ff', data: [93.5, 94.2, 92.8, 94.8, 93.6, 90.2, 91.0] },
  { name: '熔炼', color: '#ffd52a', data: [90.8, 91.5, 89.6, 92.0, 91.2, 87.8, 88.5] },
  { name: '清理', color: '#4ee6a6', data: [89.2, 90.4, 88.6, 91.1, 90.0, 86.5, 87.2] }
]

/* 人员岗位统计 */
interface HrDatum {
  category: string
  value: number
}

const positionAnalysisData: HrDatum[] = [
  { category: '一线工人', value: 186 },
  { category: '生产辅助', value: 72 },
  { category: '工程技术', value: 56 },
  { category: '技术支持', value: 48 },
  { category: '管理人员', value: 42 },
  { category: '见习大学生', value: 28 },
  { category: '领导干部', value: 18 }
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

const outputTrendMonths = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/** 人均出产吨位：2025 / 2026 两条折线（吨/人） */
const outputTrendSeries = [
  { name: '2025', color: '#20cfff', data: [52, 54, 56, 55, 58, 60, 59, 61, 60, 62, 63, 64] },
  { name: '2026', color: '#4ee6a6', data: [56, 58, 60, 59, 62, 64, 63, 65, 64, 66, 67, 68] }
]

const outputPerCapita = '68.0'

/* 人员技能分析 */
type SkillPanelTab = 'skill' | 'person'

const skillPanelTabs: { key: SkillPanelTab; label: string }[] = [
  { key: 'person', label: '人员分析' },
  { key: 'skill', label: '技能分析' }
]

const skillPanelTab = ref<SkillPanelTab>('person')

const skillCloudPalette = [
  '#52c41a', '#1890ff', '#722ed1', '#fa8c16', '#fadb14',
  '#eb2f96', '#13c2c2', '#2f54eb', '#a0d911', '#f5222d',
  '#faad14', '#2db7a0', '#8c61ff', '#ff7a45', '#00b8d4'
]

interface SkillCloudItem {
  name: string
  value: number
  color: string
  x: number
  y: number
  rotate: number
}

const skillCloudRaw: { name: string; value: number; x: number; y: number; rotate: number }[] = [
  { name: '造型操作', value: 88, x: 38, y: 42, rotate: 0 },
  { name: '熔炼工艺', value: 76, x: 62, y: 55, rotate: 0 },
  { name: '设备点检', value: 70, x: 48, y: 28, rotate: 0 },
  { name: '质量检验', value: 66, x: 52, y: 70, rotate: 0 },
  { name: '清理工序', value: 58, x: 22, y: 58, rotate: 0 },
  { name: '制芯技能', value: 54, x: 74, y: 35, rotate: -90 },
  { name: '行车操作', value: 48, x: 18, y: 32, rotate: -90 },
  { name: '电焊维修', value: 46, x: 78, y: 62, rotate: 0 },
  { name: '叉车驾驶', value: 42, x: 30, y: 72, rotate: -90 },
  { name: '热处理', value: 40, x: 65, y: 20, rotate: 0 },
  { name: '模具维护', value: 36, x: 12, y: 48, rotate: -90 },
  { name: '安全员', value: 34, x: 85, y: 48, rotate: -90 },
  { name: '计量管理', value: 30, x: 42, y: 15, rotate: 0 },
  { name: '仓储物流', value: 28, x: 25, y: 18, rotate: -90 },
  { name: '能源管理', value: 26, x: 70, y: 78, rotate: 0 },
  { name: '工艺员', value: 24, x: 15, y: 75, rotate: 0 },
  { name: '班组长', value: 22, x: 88, y: 22, rotate: -90 },
  { name: '叉车维修', value: 18, x: 55, y: 12, rotate: 0 },
  { name: '环保监测', value: 16, x: 35, y: 85, rotate: -90 },
  { name: '信息化', value: 14, x: 8, y: 22, rotate: 0 },
  { name: '多技能', value: 50, x: 32, y: 55, rotate: 0 },
  { name: '标准化', value: 32, x: 58, y: 42, rotate: -90 },
  { name: 'TPM', value: 20, x: 48, y: 88, rotate: 0 },
  { name: '6S', value: 12, x: 90, y: 72, rotate: 0 }
]

const skillCloudData: SkillCloudItem[] = skillCloudRaw.map((item, index) => ({
  ...item,
  color: skillCloudPalette[index % skillCloudPalette.length]
}))

interface SkillPersonRow {
  line: string
  name: string
  skills: number
}

const skillPersonRank: SkillPersonRow[] = [
  { line: '造型', name: '刘强', skills: 18 },
  { line: '熔炼', name: '王磊', skills: 16 },
  { line: '清理', name: '赵敏', skills: 15 },
  { line: '造型', name: '陈杰', skills: 14 },
  { line: '熔炼', name: '李娜', skills: 13 },
  { line: '制芯', name: '周浩', skills: 13 },
  { line: '清理', name: '吴涛', skills: 12 },
  { line: '造型', name: '郑凯', skills: 12 },
  { line: '熔炼', name: '孙芳', skills: 11 },
  { line: '制芯', name: '马超', skills: 11 },
  { line: '清理', name: '黄伟', skills: 10 },
  { line: '造型', name: '徐静', skills: 10 },
  { line: '熔炼', name: '朱鹏', skills: 9 },
  { line: '制芯', name: '胡兵', skills: 9 },
  { line: '清理', name: '林峰', skills: 8 },
  { line: '造型', name: '何丽', skills: 8 },
  { line: '熔炼', name: '高翔', skills: 7 },
  { line: '制芯', name: '罗敏', skills: 7 }
]

const skillTop3 = computed(() => skillPersonRank.slice(0, 3))
const skillRestRows = computed(() => skillPersonRank.slice(3))
const skillRestScrollRows = computed(() => [...skillRestRows.value, ...skillRestRows.value])

const medalMeta = [
  { rank: 1, label: '冠军', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.16)', border: 'rgba(255, 215, 0, 0.65)' },
  { rank: 2, label: '亚军', color: '#c0c7d1', bg: 'rgba(192, 199, 209, 0.14)', border: 'rgba(192, 199, 209, 0.6)' },
  { rank: 3, label: '季军', color: '#e8a06a', bg: 'rgba(232, 160, 106, 0.14)', border: 'rgba(232, 160, 106, 0.6)' }
]

function skillCloudStyle(item: SkillCloudItem, index: number) {
  const min = 12
  const max = 42
  const values = skillCloudData.map((d) => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const ratio = (item.value - minV) / Math.max(maxV - minV, 1)
  return {
    left: `${item.x}%`,
    top: `${item.y}%`,
    fontSize: `${Math.round(min + ratio * (max - min))}px`,
    color: item.color,
    fontWeight: ratio > 0.5 ? 700 : 600,
    transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
    animationDelay: `${(index % 8) * 0.35}s`,
    animationDuration: `${4.5 + (index % 5) * 0.6}s`
  }
}

/* 人员培训分析 */
const trainingCompletionMonths = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]
const trainingCompletionTarget = 95
const trainingCompletionData = [91.2, 92.5, 93.0, 94.1, 93.6, 95.2, 96.0, 95.5, 96.8, 97.2, 96.5, 97.8]

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

/** 人均出产吨位：2025 / 2026 双折线，横轴 1–12 月 */
function createOutputTrendOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        let body = ''
        list.forEach((item: any) => {
          body += `${item.marker}${item.seriesName}: ${item.value} 吨/人<br/>`
        })
        return `${list[0].axisValue}<br/>${body}`
      }
    },
    legend: {
      data: outputTrendSeries.map((item) => item.name),
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 0,
      left: 'center',
      itemWidth: 14,
      itemHeight: 8
    },
    grid: {
      left: 44,
      right: 16,
      bottom: 28,
      top: 36,
      containLabel: true
    },
    xAxis: {
      ...categoryAxisBase,
      data: outputTrendMonths,
      boundaryGap: false,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxisBase,
      name: '吨/人',
      nameTextStyle: { color: '#a9c9d4', fontSize: 11 }
    },
    series: outputTrendSeries.map((item) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: item.data,
      lineStyle: { width: 2.5, color: item.color },
      itemStyle: { color: item.color, borderColor: '#061821', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${item.color}40` },
            { offset: 1, color: `${item.color}08` }
          ]
        }
      }
    }))
  } as EChartsOption
}

/** 产线人员排班统计：柱状图，横轴日期，纵轴人数 */
function createScheduleOption(line: ScheduleLineKey): EChartsOption {
  const color = scheduleColorMap[line]
  const label = scheduleLineTabs.find((tab) => tab.key === line)?.label ?? ''
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.axisValue}<br/>${item.marker}${label}排班人数: ${item.value} 人`
      }
    },
    legend: { show: false },
    grid: { left: 40, right: 12, bottom: 28, top: 24, containLabel: true },
    xAxis: {
      ...categoryAxisBase,
      data: scheduleDates,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0, rotate: 30 }
    },
    yAxis: {
      ...valueAxisBase,
      name: '人',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      min: 0
    },
    series: [
      {
        name: `${label}排班人数`,
        type: 'bar',
        barWidth: '55%',
        data: mockScheduleCounts(line),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color },
              { offset: 1, color: `${color}66` }
            ]
          },
          borderRadius: [3, 3, 0, 0]
        },
        label: { show: true, position: 'top', color: '#a9c9d4', fontSize: 9 }
      }
    ]
  } as EChartsOption
}

/** 人员利用率：近 7 天折线，分厂单线 / 产线三线 */
function createUtilizationOption(scope: UtilScopeKey): EChartsOption {
  const seriesList = scope === 'line'
    ? lineUtilizationSeries
    : [{ name: '分厂', color: '#31d7ff', data: plantUtilizationData }]
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        let body = ''
        list.forEach((item: any) => {
          body += `${item.marker}${item.seriesName}: ${item.value}%<br/>`
        })
        return `${list[0].axisValue}<br/>${body}`
      }
    },
    legend: {
      data: seriesList.map((item) => item.name),
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 0,
      left: 'center',
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: 44, right: 16, bottom: 28, top: 36, containLabel: true },
    xAxis: {
      ...categoryAxisBase,
      data: scheduleDates,
      boundaryGap: false,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxisBase,
      name: '%',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      min: 80,
      max: 100,
      axisLabel: { color: '#a9c9d4', fontSize: 10, formatter: '{value}%' }
    },
    series: seriesList.map((item) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: item.data,
      lineStyle: { color: item.color, width: 2.5 },
      itemStyle: { color: item.color, borderColor: '#061821', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${item.color}3A` },
            { offset: 1, color: `${item.color}08` }
          ]
        }
      }
    }))
  } as EChartsOption
}

/** 人员岗位统计：横向柱状图 */
function createPositionAnalysisOption(): EChartsOption {
  const colors = ['#4ee6a6', '#20cfff', '#ffd52a', '#31d7ff', '#9b8cff', '#3bd6c6', '#ff9a3c']
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.name}<br/>${item.marker}人数: ${item.value} 人`
      }
    },
    grid: { left: 8, right: 40, bottom: 8, top: 12, containLabel: true },
    xAxis: {
      ...valueAxisBase,
      name: '人数',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      min: 0
    },
    yAxis: {
      ...categoryAxisBase,
      data: positionAnalysisData.map((item) => item.category),
      axisLabel: { color: '#a9c9d4', fontSize: 11 }
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        barWidth: '58%',
        data: positionAnalysisData.map((item, index) => {
          const color = colors[index % colors.length]
          return {
            value: item.value,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color },
                  { offset: 1, color: `${color}88` }
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

/** 人员培训分析：培训完成率折线 + 目标参考线 */
function createTrainingCompletionOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        let body = ''
        list.forEach((item: any) => {
          if (item.seriesName === '目标值') {
            body += `${item.marker}目标值: ${trainingCompletionTarget}%<br/>`
            return
          }
          body += `${item.marker}培训完成率: ${item.value}%<br/>`
        })
        return `${list[0].axisValue}<br/>${body}`
      }
    },
    legend: {
      data: ['培训完成率', '目标值'],
      textStyle: { color: '#a9c9d4', fontSize: 11 },
      top: 0,
      left: 'center',
      itemWidth: 14,
      itemHeight: 8
    },
    grid: { left: 44, right: 20, bottom: 28, top: 40, containLabel: true },
    xAxis: {
      ...categoryAxisBase,
      data: trainingCompletionMonths,
      boundaryGap: false,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxisBase,
      name: '%',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      min: 0,
      max: 100,
      axisLabel: { color: '#a9c9d4', fontSize: 10, formatter: '{value}%' }
    },
    series: [
      {
        name: '培训完成率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: trainingCompletionData,
        lineStyle: {
          width: 3,
          color: '#31d7ff',
          shadowColor: 'rgba(49, 215, 255, 0.45)',
          shadowBlur: 8
        },
        itemStyle: { color: '#31d7ff', borderColor: '#061821', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(49, 215, 255, 0.28)' },
              { offset: 1, color: 'rgba(49, 215, 255, 0.04)' }
            ]
          }
        },
        label: {
          show: true,
          position: 'top',
          color: '#31d7ff',
          fontSize: 10,
          formatter: '{c}%'
        }
      },
      {
        name: '目标值',
        type: 'line',
        data: trainingCompletionMonths.map(() => trainingCompletionTarget),
        symbol: 'none',
        silent: true,
        lineStyle: { width: 2, type: 'dashed', color: '#ff4d4f' },
        itemStyle: { color: '#ff4d4f' },
        label: {
          show: true,
          position: 'insideEndTop',
          formatter: `目标 ${trainingCompletionTarget}%`,
          color: '#ff4d4f',
          fontSize: 11,
          backgroundColor: 'rgba(255, 77, 79, 0.15)',
          padding: [3, 6],
          borderRadius: 3
        },
        tooltip: { show: false }
      }
    ]
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */

const scheduleLineKey = ref<ScheduleLineKey>('molding')
const scheduleOption = computed(() => createScheduleOption(scheduleLineKey.value))

const utilizationScopeKey = ref<UtilScopeKey>('plant')
const utilizationOption = computed(() => createUtilizationOption(utilizationScopeKey.value))

const appointmentOption = createAppointmentOption()
const positionAnalysisOption = createPositionAnalysisOption()
const outputTrendOption = createOutputTrendOption()
const trainingCompletionOption = createTrainingCompletionOption()

</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="人员可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

    <!-- 顶部人员指标栏 -->
    <div class="top-indicators">
      <div
        v-for="item in personnelIndicators"
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
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <!-- 左侧列 -->
      <div class="column-wrapper">
        <!-- 人员岗位统计（第一行第一列） -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h3 class="panel-title">人员岗位统计</h3>
          </div>
          <div class="chart-area">
            <EChart :option="positionAnalysisOption" height="100%" />
          </div>
        </div>

        <!-- 人均出产吨位（第二行第一列） -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
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
      </div>

      <!-- 中间列 -->
      <div class="column-wrapper">
        <!-- 产线人员排班统计（第一行第二列） -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="panel-title">产线人员排班统计</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in scheduleLineTabs"
                :key="tab.key"
                type="button"
                class="tab-button"
                :class="{ active: scheduleLineKey === tab.key }"
                @click="scheduleLineKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-area">
            <EChart :option="scheduleOption" height="100%" />
          </div>
        </div>

        <!-- 人员技能分析（第二行第二列） -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h3 class="panel-title">人员技能分析</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in skillPanelTabs"
                :key="tab.key"
                type="button"
                class="tab-button"
                :class="{ active: skillPanelTab === tab.key }"
                @click="skillPanelTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div v-if="skillPanelTab === 'skill'" class="skill-cloud">
            <span
              v-for="(item, index) in skillCloudData"
              :key="item.name"
              class="skill-cloud-item"
              :style="skillCloudStyle(item, index)"
              :title="`${item.name}：${item.value} 人`"
            >
              {{ item.name }}
            </span>
          </div>

          <div v-else class="skill-person-panel">
            <div class="skill-top3">
              <div
                v-for="(row, index) in skillTop3"
                :key="row.name"
                class="skill-medal-card"
                :style="{
                  '--medal-color': medalMeta[index].color,
                  '--medal-bg': medalMeta[index].bg,
                  '--medal-border': medalMeta[index].border
                }"
              >
                <div class="skill-medal-rank">{{ medalMeta[index].rank }}</div>
                <div class="skill-medal-info">
                  <div class="skill-medal-name">{{ row.name }}</div>
                  <div class="skill-medal-skills">技能 <b>{{ row.skills }}</b> 项</div>
                </div>
                <div class="skill-medal-label">{{ medalMeta[index].label }}</div>
              </div>
            </div>

            <div class="skill-rank-head">
              <span>产线</span>
              <span>姓名</span>
              <span>技能数</span>
            </div>
            <div class="skill-rank-viewport">
              <div class="skill-rank-track">
                <div
                  v-for="(row, index) in skillRestScrollRows"
                  :key="`${row.name}-${index}`"
                  class="skill-rank-row"
                >
                  <span>{{ row.line }}</span>
                  <span>{{ row.name }}</span>
                  <span class="skills">{{ row.skills }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="column-wrapper">
        <!-- 人员利用率（第一行第三列） -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="panel-title">人员利用率</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in utilizationScopeTabs"
                :key="tab.key"
                type="button"
                class="tab-button"
                :class="{ active: utilizationScopeKey === tab.key }"
                @click="utilizationScopeKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-area">
            <EChart :option="utilizationOption" height="100%" />
          </div>
        </div>

        <!-- 人员培训分析（第二行第三列） -->
        <div class="data-panel">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="panel-header">
            <div class="panel-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="panel-title">人员培训分析</h3>
          </div>
          <div class="chart-area">
            <EChart :option="trainingCompletionOption" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./dashboard-common.css"></style>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  /* 仅三列容器；行高由 column-wrapper 内两行 360 控制 */
  gap: 16px;
  height: auto;
  align-items: start;
}

.column-wrapper {
  display: grid;
  /* 与 dashboard-row 两行对齐：每列上下都是 360px */
  grid-template-rows: 360px 360px;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.column-wrapper > .data-panel {
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
  width: 100%;
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
  min-height: 360px;
  max-height: 360px;
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
  min-height: 0;
  height: 0;
  width: 100%;
  overflow: hidden;
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
.dynamics-list-new::-webkit-scrollbar-track,
.dynamics-list-new::-webkit-scrollbar-thumb,
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
  /* 六宫格统一高度，避免被其它规则覆盖 */
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
  box-sizing: border-box !important;
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

.dashboard-container .dashboard-row {
  gap: 16px !important;
}



/* ===== 还原：技能分析词云 / 奖牌 / 滚动榜 ===== */
.skill-cloud {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(0, 120, 180, 0.12), transparent 70%),
    radial-gradient(ellipse at 20% 30%, rgba(120, 80, 220, 0.08), transparent 45%);
  border-radius: 4px;
}

.skill-cloud-item {
  position: absolute;
  line-height: 1.15;
  cursor: default;
  white-space: nowrap;
  user-select: none;
  text-shadow: 0 0 12px currentColor;
  will-change: transform;
  animation-name: skill-cloud-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  transition: filter 0.2s ease;
}

.skill-cloud-item:hover {
  filter: brightness(1.25) drop-shadow(0 0 8px currentColor);
  animation-play-state: paused;
  z-index: 2;
}

@keyframes skill-cloud-float {
  0% { translate: 0 0; opacity: 0.88; }
  100% { translate: 0 -8px; opacity: 1; }
}

.skill-person-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-top3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  flex-shrink: 0;
}

.skill-medal-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  background: var(--medal-bg);
  border: 1px solid var(--medal-border);
  border-radius: 6px;
  overflow: hidden;
  min-width: 0;
}

.skill-medal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, var(--medal-color), transparent);
  box-shadow: 0 0 8px var(--medal-color);
}

.skill-medal-rank {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--medal-color);
  color: var(--medal-color);
  font-weight: 800;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.25);
  box-shadow: 0 0 10px var(--medal-color);
}

.skill-medal-info { min-width: 0; flex: 1; }

.skill-medal-name {
  color: #f4fdff;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-medal-skills {
  color: #a9c9d4;
  font-size: 11px;
  margin-top: 2px;
}

.skill-medal-skills b {
  color: var(--medal-color);
  font-size: 14px;
}

.skill-medal-label {
  position: absolute;
  right: 6px;
  top: 6px;
  font-size: 10px;
  color: var(--medal-color);
  opacity: 0.85;
}

.skill-rank-head,
.skill-rank-row {
  display: grid;
  grid-template-columns: 1fr 1fr 0.8fr;
  gap: 4px;
  text-align: center;
}

.skill-rank-head {
  flex-shrink: 0;
  padding: 7px 6px;
  background: rgba(0, 143, 184, 0.28);
  border: 1px solid rgba(0, 192, 235, 0.3);
  border-radius: 3px 3px 0 0;
}

.skill-rank-head span {
  color: #75dff7;
  font-size: 12px;
  font-weight: 600;
}

.skill-rank-viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(0, 190, 235, 0.22);
  border-top: none;
  border-radius: 0 0 3px 3px;
}

.skill-rank-track {
  animation: skill-rank-scroll 22s linear infinite;
}

.skill-rank-viewport:hover .skill-rank-track {
  animation-play-state: paused;
}

@keyframes skill-rank-scroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.skill-rank-row {
  padding: 7px 6px;
  border-bottom: 1px solid rgba(0, 154, 197, 0.14);
  background: rgba(5, 27, 37, 0.72);
}

.skill-rank-row:nth-child(even) {
  background: rgba(7, 36, 48, 0.78);
}

.skill-rank-row span {
  color: #cde7ee;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-rank-row .skills {
  color: #ffd91a;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .skill-cloud-item, .skill-rank-track { animation: none; }
}

</style>
