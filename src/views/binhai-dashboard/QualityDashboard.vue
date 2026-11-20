<script setup lang="ts">

import { computed, ref } from 'vue'

import dayjs from 'dayjs'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 质量可视化大屏静态数据 */

interface LineSeries {
  name: string
  color: string
  data: number[]
}

interface ProductSeries {
  name: string
  color: string
  value: number[]
}

/** 废品率分析：产品系列 × 内废/外废 */
interface DefectSeriesData {
  name: string
  color: string
  /** 内废率（%），12 个月 */
  inner: number[]
  /** 外废率（%），12 个月 */
  outer: number[]
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/** 当月（0-based）；横轴只展示 1 月 ~ 当月 */
const currentMonthIndex = dayjs().month()

/** 顶部质量指标栏（6 项，样式对齐其他大屏 top-indicators） */
const qualityTopIndicators: { label: string; value: string; unit: string; tone: string }[] = [
  { label: '铸件综合废品率', value: '2.6', unit: '%', tone: 'output' },
  { label: '返工返修率', value: '1.8', unit: '%', tone: 'output' },
  { label: '返修焊补率', value: '3.2', unit: '%', tone: 'output' },
  { label: '检验一次合格率', value: '96.5', unit: '%', tone: 'inbound' },
  { label: '生产零公里ppm', value: '28', unit: 'ppm', tone: 'inbound' },
  { label: '吨均废品损失', value: '147', unit: '元', tone: 'output' }
]

/** 废品率分析：分厂 + 产品系列，柱内堆叠内废（蓝）/ 外废（橙） */
const defectAnalysisSeries: DefectSeriesData[] = [
  {
    name: '分厂',
    color: '#20cfff',
    inner: [2.4, 2.6, 1.8, 1.7, 1.8, 1.5, 1.6, 1.8, 1.6, 0.4, 0.2, 0.1],
    outer: [1.5, 1.6, 1.0, 1.1, 1.1, 1.0, 1.1, 1.2, 1.1, 0.3, 0.1, 0.1]
  },
  {
    name: '中速机',
    color: '#4ee6a6',
    inner: [2.6, 2.8, 1.9, 1.8, 1.9, 1.6, 1.7, 1.9, 1.7, 0.3, 0.2, 0.1],
    outer: [1.7, 1.7, 1.1, 1.2, 1.2, 1.1, 1.2, 1.3, 1.1, 0.2, 0.1, 0.1]
  },
  {
    name: '重潍柴',
    color: '#31d7ff',
    inner: [2.5, 2.6, 2.0, 1.9, 2.0, 1.8, 1.9, 2.0, 1.8, 0.4, 0.2, 0.1],
    outer: [1.6, 1.7, 1.2, 1.2, 1.3, 1.1, 1.2, 1.4, 1.2, 0.3, 0.1, 0.1]
  },
  {
    name: '大机',
    color: '#ffd52a',
    inner: [2.1, 2.3, 1.5, 1.5, 1.6, 1.4, 1.5, 1.6, 1.4, 0.3, 0.2, 0.1],
    outer: [1.4, 1.5, 0.9, 1.0, 1.1, 0.9, 1.0, 1.1, 1.0, 0.2, 0.1, 0.1]
  },
  {
    name: '博杜安',
    color: '#9b8cff',
    inner: [2.3, 2.5, 1.7, 1.7, 1.8, 1.5, 1.6, 1.8, 1.6, 0.4, 0.2, 0.1],
    outer: [1.5, 1.7, 1.1, 1.2, 1.2, 1.0, 1.1, 1.2, 1.0, 0.3, 0.1, 0.1]
  }
]

const INNER_COLOR = '#31d7ff'
const OUTER_COLOR = '#ff9a3c'

/** 吨均废品损失：最近三年（动态），默认今年 */
const currentYear = dayjs().year()
/** 上个月（0-based month index）；今年只展示到上个月 */
const lastCompletedMonthIndex = dayjs().subtract(1, 'month').month()

type DefectLossYear = number

const defectLossYears: DefectLossYear[] = [currentYear, currentYear - 1, currentYear - 2]

/** 按年份确定性 mock 吨均废品损失（元/吨），12 个月 */
function mockDefectLossYear(year: number): number[] {
  return months.map((_, index) => {
    const seed = year * 100 + index * 13 + 7
    return 118 + ((seed * 17) % 40)
  })
}

const defectLossByYear: Record<number, number[]> = {
  [currentYear]: mockDefectLossYear(currentYear),
  [currentYear - 1]: mockDefectLossYear(currentYear - 1),
  [currentYear - 2]: mockDefectLossYear(currentYear - 2)
}

/** 成品检验分析：三条曲线（返工率 / 内部报废率 / 检验一次合格率），数据源产线固定 */

/** 产线质量分析：熔炼线 / 造型线 / 清理线（废品率、废品损失、返工返修率共用） */
const productionLines: LineSeries[] = [
  { name: '熔炼线', color: '#ffd52a', data: [2.8, 2.6, 2.9, 2.7, 2.5, 2.8, 2.6, 2.7, 2.9, 2.8, 2.6, 2.7] },
  { name: '造型线', color: '#31d7ff', data: [3.2, 3.0, 3.3, 3.1, 2.9, 3.2, 3.0, 3.1, 3.3, 3.2, 3.0, 3.1] },
  { name: '清理线', color: '#4ee6a6', data: [2.2, 2.0, 2.3, 2.1, 1.9, 2.2, 2.0, 2.1, 2.3, 2.2, 2.0, 2.1] }
]

/** 废品损失（元/吨） */
const productionLineLoss: Record<string, number[]> = {
  熔炼线: [45, 42, 48, 44, 40, 46, 43, 44, 47, 45, 42, 43],
  造型线: [52, 48, 55, 51, 47, 53, 50, 51, 54, 52, 48, 50],
  清理线: [32, 30, 35, 31, 28, 33, 30, 31, 34, 32, 30, 31]
}

/** 返工返修率（%） */
const productionLineRepair: Record<string, number[]> = {
  熔炼线: [1.6, 1.5, 1.7, 1.4, 1.3, 1.5, 1.4, 1.3, 1.5, 1.4, 1.3, 1.4],
  造型线: [2.2, 2.0, 2.3, 1.9, 1.8, 2.1, 2.0, 1.9, 2.1, 1.9, 1.8, 1.9],
  清理线: [1.2, 1.1, 1.3, 1.0, 0.9, 1.2, 1.1, 1.0, 1.2, 1.1, 1.0, 1.1]
}

/** 生产零公里 PPM */
const zeroPpmData = [45, 38, 42, 35, 40, 33, 38, 36, 34, 32, 30, 28]

/** 主要产品质量情况：表格（产品件号 / 产品系列 / 毛坯名称 / 内部废品率 / 返工返修率） */
interface MainProductRow {
  partNo: string
  series: string
  blankName: string
  innerDefectRate: string
  repairRate: string
}

const mainProductRows: MainProductRow[] = [
  { partNo: 'WP12-001', series: '中速机', blankName: '缸体毛坯', innerDefectRate: '1.2%', repairRate: '1.8%' },
  { partNo: 'WP12-002', series: '中速机', blankName: '缸盖毛坯', innerDefectRate: '1.5%', repairRate: '2.1%' },
  { partNo: 'WP13-011', series: '博杜安', blankName: '曲轴毛坯', innerDefectRate: '0.9%', repairRate: '1.4%' },
  { partNo: 'WP13-012', series: '博杜安', blankName: '飞轮毛坯', innerDefectRate: '1.1%', repairRate: '1.6%' },
  { partNo: 'WD615-03', series: '重潍柴', blankName: '缸体毛坯', innerDefectRate: '1.4%', repairRate: '2.0%' },
  { partNo: 'WD615-04', series: '重潍柴', blankName: '油底壳毛坯', innerDefectRate: '1.0%', repairRate: '1.5%' },
  { partNo: 'WP10-021', series: '重潍柴', blankName: '进气歧管毛坯', innerDefectRate: '1.3%', repairRate: '1.9%' },
  { partNo: 'M55-008', series: '大机', blankName: '缸体毛坯', innerDefectRate: '0.8%', repairRate: '1.2%' },
  { partNo: 'M55-009', series: '大机', blankName: '缸盖毛坯', innerDefectRate: '1.0%', repairRate: '1.5%' },
  { partNo: 'WP15-016', series: '大机', blankName: '曲轴毛坯', innerDefectRate: '1.6%', repairRate: '2.3%' },
  { partNo: 'WP6-031', series: '中速机', blankName: '飞轮毛坯', innerDefectRate: '1.2%', repairRate: '1.7%' },
  { partNo: 'WP12T-05', series: '博杜安', blankName: '缸体毛坯', innerDefectRate: '1.1%', repairRate: '1.6%' },
  { partNo: 'WP2.3-07', series: '重潍柴', blankName: '曲轴毛坯', innerDefectRate: '1.5%', repairRate: '2.2%' },
  { partNo: 'HT250-12', series: '中速机', blankName: '轴承座毛坯', innerDefectRate: '0.7%', repairRate: '1.1%' },
  { partNo: 'QT600-09', series: '大机', blankName: '齿轮毛坯', innerDefectRate: '1.3%', repairRate: '1.8%' },
  { partNo: 'RuT450-3', series: '博杜安', blankName: '缸盖毛坯', innerDefectRate: '1.0%', repairRate: '1.5%' },
  { partNo: 'WP10.5H-2', series: '重潍柴', blankName: '排气歧管毛坯', innerDefectRate: '1.4%', repairRate: '2.0%' },
  { partNo: 'M55-014', series: '大机', blankName: '油底壳毛坯', innerDefectRate: '0.9%', repairRate: '1.3%' },
  { partNo: 'WP12-018', series: '中速机', blankName: '皮带轮毛坯', innerDefectRate: '1.1%', repairRate: '1.6%' },
  { partNo: '合金铸铁-1', series: '重潍柴', blankName: '缸套毛坯', innerDefectRate: '1.7%', repairRate: '2.4%' },
  { partNo: 'WP13-022', series: '博杜安', blankName: '凸轮轴毛坯', innerDefectRate: '1.2%', repairRate: '1.7%' },
  { partNo: 'WD615-08', series: '重潍柴', blankName: '飞轮壳毛坯', innerDefectRate: '1.0%', repairRate: '1.4%' },
  { partNo: 'WP6-040', series: '中速机', blankName: '水泵壳毛坯', innerDefectRate: '0.8%', repairRate: '1.2%' },
  { partNo: 'M55-021', series: '大机', blankName: '连杆毛坯', innerDefectRate: '1.5%', repairRate: '2.1%' }
]

/** 无缝自动滚动：数据复制两份，动画位移 50% */
const productScrollRows = computed(() => [...mainProductRows, ...mainProductRows])

/* =========================
   ECharts 配置
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(5, 24, 34, 0.96)',
  borderColor: 'rgba(0, 198, 239, 0.55)',
  textStyle: { color: '#dff8ff' }
}

const categoryAxis = {
  type: 'category' as const,
  axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
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
      color: 'rgba(72, 164, 194, 0.24)'
    }
  },
  axisLabel: { color: '#a9c9d4', fontSize: 10 }
}

/** 废品率分析：1~当月，按选中系列渲染，柱内堆叠内废/外废 */
function createDefectAnalysisOption(
  visibleMonths: string[],
  activeProducts: DefectSeriesData[]
): EChartsOption {
  const visibleCount = visibleMonths.length
  const products = activeProducts.length ? activeProducts : defectAnalysisSeries

  const series = products.flatMap((product) => [
    {
      name: product.name,
      type: 'bar' as const,
      stack: product.name,
      barWidth: '48%',
      barGap: '32%',
      data: product.inner.slice(0, visibleCount),
      itemStyle: {
        color: INNER_COLOR,
        borderColor: product.color,
        borderWidth: 1.5
      },
      emphasis: {
        itemStyle: {
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: `${product.color}88`
        }
      }
    },
    {
      name: product.name,
      type: 'bar' as const,
      stack: product.name,
      data: product.outer.slice(0, visibleCount),
      itemStyle: {
        color: OUTER_COLOR,
        borderColor: product.color,
        borderWidth: 1.5,
        borderRadius: [3, 3, 0, 0]
      },
      emphasis: {
        itemStyle: {
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: `${product.color}88`
        }
      }
    }
  ])

  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const month = list[0].axisValue
        const byProduct = new Map<string, { inner: number; outer: number; color: string }>()
        list.forEach((item: any, idx: number) => {
          const productIndex = Math.floor(idx / 2)
          const product = products[productIndex]
          if (!product) return
          const entry = byProduct.get(product.name) ?? { inner: 0, outer: 0, color: product.color }
          if (idx % 2 === 0) entry.inner += Number(item.value) || 0
          else entry.outer += Number(item.value) || 0
          byProduct.set(product.name, entry)
        })
        let body = ''
        byProduct.forEach((val, name) => {
          const total = Number((val.inner + val.outer).toFixed(2))
          body += `<span style="display:inline-block;width:8px;height:8px;background:${val.color};margin-right:4px;border:1px solid ${val.color}"></span>${name}<br/>`
          body += `&nbsp;&nbsp;内废: ${val.inner.toFixed(2)}%<br/>`
          body += `&nbsp;&nbsp;外废: ${val.outer.toFixed(2)}%<br/>`
          body += `&nbsp;&nbsp;综合: <b style="color:#ffd91a">${total}%</b><br/>`
        })
        return `${month}<br/>${body}`
      }
    },
    legend: { show: false },
    grid: {
      left: 48,
      right: 16,
      bottom: 12,
      top: 36,
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: visibleMonths,
      axisLabel: { color: '#a9c9d4', fontSize: 11, interval: 0 }
    },
    yAxis: {
      ...valueAxis,
      name: '废品率(%)',
      nameLocation: 'end',
      nameGap: 16,
      nameTextStyle: { color: '#a9c9d4', fontSize: 11, align: 'left' },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series
  } as EChartsOption
}

/** 吨均废品损失：横轴固定 1~12 月；今年只画到上个月，其余月无柱 */
function createDefectLossOption(year: DefectLossYear, dataMonths: string[]): EChartsOption {
  const fullData = defectLossByYear[year] ?? []
  // 横轴始终 12 个月；dataMonths 为有数据的月份范围
  const data = months.map((month) => {
    const index = dataMonths.indexOf(month)
    return index >= 0 ? (fullData[index] ?? null) : null
  })

  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item || item.value == null) return `${item?.axisValue ?? ''}（暂无数据）`
        return `${item.axisValue}<br/>${item.marker}吨均废品损失: ${item.value} 元/吨`
      }
    },
    grid: {
      left: 48,
      right: 16,
      bottom: 12,
      top: 36,
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      axisLabel: { color: '#a9c9d4', fontSize: 11, interval: 0 }
    },
    yAxis: {
      ...valueAxis,
      name: '元/吨',
      nameLocation: 'end',
      nameGap: 16,
      nameTextStyle: { color: '#a9c9d4', fontSize: 11, align: 'left' },
      axisLabel: { color: '#a9c9d4', fontSize: 10 }
    },
    series: [
      {
        name: '吨均废品损失',
        type: 'bar',
        barWidth: '50%',
        data,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#31d7ff' },
              { offset: 1, color: '#189fd9' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  } as EChartsOption
}

/** 成品检验分析：指标 tab（图例改为 tab），各指标纵轴量级独立 */
type InspectMetricKey = 'rework' | 'scrap' | 'firstPass'

interface InspectMetricMeta {
  key: InspectMetricKey
  label: string
  color: string
  /** 纵轴范围 */
  yMin: number
  yMax: number
}

const inspectMetrics: InspectMetricMeta[] = [
  { key: 'rework', label: '返工率', color: '#31d7ff', yMin: 0, yMax: 5 },
  { key: 'scrap', label: '内部报废率', color: '#4ee6a6', yMin: 0, yMax: 5 },
  { key: 'firstPass', label: '检验一次合格率', color: '#ffd52a', yMin: 90, yMax: 100 }
]

/** 按产线名确定性生成各指标月度数据（%） */
function genInspectSeries(lineName: string): Record<InspectMetricKey, number[]> {
  const seed = lineName.length + lineName.charCodeAt(0)
  const gen = (base: number, amp: number, digits = 2) =>
    months.map((_, i) => {
      const raw =
        base + Math.sin(seed * 0.7 + i * 0.8) * amp + Math.cos(seed + i * 0.5) * amp * 0.6
      return Number(raw.toFixed(digits))
    })
  return {
    // 返工率：低百分数
    rework: gen(1.8, 0.7, 2),
    // 内部报废率：低百分数
    scrap: gen(1.2, 0.5, 2),
    // 检验一次合格率：高百分数
    firstPass: gen(97.5, 1.2, 2)
  }
}

function createInspectOption(metricKey: InspectMetricKey): EChartsOption {
  const meta = inspectMetrics.find((item) => item.key === metricKey) ?? inspectMetrics[0]
  const data = genInspectSeries('造型一线大件')[metricKey]

  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        return `${item.axisValue}<br/>${item.marker}${meta.label}: ${item.value}%`
      }
    },
    legend: { show: false },
    grid: {
      left: 48,
      right: 16,
      top: 24,
      bottom: 28,
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      boundaryGap: false,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxis,
      min: meta.yMin,
      max: meta.yMax,
      name: '%',
      nameLocation: 'end',
      nameGap: 14,
      nameTextStyle: { color: '#a9c9d4', fontSize: 11, align: 'left' },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: meta.label,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data,
        lineStyle: { color: meta.color, width: 2.5 },
        itemStyle: { color: meta.color, borderColor: '#061821', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${meta.color}40` },
              { offset: 1, color: `${meta.color}08` }
            ]
          }
        }
      }
    ]
  } as EChartsOption
}

/** 产线质量分析：废品率（3 条折线） */
function createProductionDefectRateOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          result += `${item.marker}${item.seriesName}: ${item.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: productionLines.map((line) => line.name),
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 0,
      left: 'center'
    },
    grid: {
      left: 48,
      right: 16,
      bottom: 28,
      top: 36,
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxis,
      name: '%',
      nameLocation: 'end',
      nameGap: 14,
      nameTextStyle: { color: '#a9c9d4', fontSize: 11, align: 'left' },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series: productionLines.map((line) => ({
      name: line.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: line.data,
      lineStyle: { color: line.color, width: 2.5 },
      itemStyle: { color: line.color, borderColor: '#061821', borderWidth: 2 }
    }))
  } as EChartsOption
}

/** 产线质量分析：废品损失（3 组堆叠柱） */
function createProductionDefectLossOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          result += `${item.marker}${item.seriesName}: ${item.value} 元/吨<br/>`
        })
        return result
      }
    },
    legend: {
      data: productionLines.map((line) => line.name),
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 0,
      left: 'center'
    },
    grid: {
      left: 48,
      right: 16,
      bottom: 28,
      top: 36,
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxis,
      name: '元/吨',
      nameLocation: 'end',
      nameGap: 14,
      nameTextStyle: { color: '#a9c9d4', fontSize: 11, align: 'left' },
      axisLabel: { color: '#a9c9d4', fontSize: 10 }
    },
    series: productionLines.map((line) => ({
      name: line.name,
      type: 'bar',
      stack: 'total',
      barWidth: '55%',
      data: productionLineLoss[line.name],
      itemStyle: { color: line.color }
    }))
  } as EChartsOption
}

/** 产线质量分析：返工返修率（3 条折线，%） */
function createProductionRepairOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          result += `${item.marker}${item.seriesName}: ${item.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: productionLines.map((line) => line.name),
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 0,
      left: 'center'
    },
    grid: {
      left: 48,
      right: 16,
      bottom: 28,
      top: 36,
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      axisLabel: { color: '#a9c9d4', fontSize: 10, interval: 0 }
    },
    yAxis: {
      ...valueAxis,
      min: 0,
      max: 4,
      name: '%',
      nameLocation: 'end',
      nameGap: 14,
      nameTextStyle: { color: '#a9c9d4', fontSize: 11, align: 'left' },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series: productionLines.map((line) => ({
      name: line.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: productionLineRepair[line.name],
      lineStyle: { color: line.color, width: 2.5 },
      itemStyle: { color: line.color, borderColor: '#061821', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${line.color}33` },
            { offset: 1, color: `${line.color}08` }
          ]
        }
      }
    }))
  } as EChartsOption
}

/** 生产零公里 PPM：柱体颜色随数值变化 */
function createZeroPpmOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => `${params[0].axisValue}<br/>${params[0].marker}PPM: ${params[0].value}`
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      axisLabel: { color: '#a9c9d4', fontSize: 11 }
    },
    yAxis: {
      ...valueAxis,
      name: 'PPM',
      nameTextStyle: { color: '#a9c9d4', fontSize: 11 },
      axisLabel: { color: '#a9c9d4', fontSize: 11 }
    },
    series: [
      {
        name: 'PPM',
        type: 'bar',
        barWidth: '50%',
        data: zeroPpmData,
        itemStyle: {
          color: (params: any) => {
            const value = params.value as number
            if (value <= 30) {
              return {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#4ee6a6' },
                  { offset: 1, color: '#20b98a' }
                ]
              }
            }
            if (value <= 40) {
              return {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#ffd52a' },
                  { offset: 1, color: '#d69a0e' }
                ]
              }
            }
            return {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#FF6B6B' },
                { offset: 1, color: '#C92A2A' }
              ]
            }
          },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#dff8ff',
          fontSize: 11,
          fontWeight: 'bold'
        }
      }
    ]
  } as EChartsOption
}


/* =========================
   页面状态与交互
   ========================= */

type ProductionType = 'defectRate' | 'defectLoss' | 'repairRate'

const defectLossYear = ref<DefectLossYear>(currentYear)
const productionType = ref<ProductionType>('defectRate')

const defectLossYearTabs = computed(() =>
  defectLossYears.map((year) => ({ key: year, label: `${year}年` }))
)

/** 有数据的月份：今年到上个月；往年全年（横轴始终 1~12 月） */
const visibleDefectLossMonths = computed(() => {
  if (defectLossYear.value === currentYear) {
    return months.slice(0, lastCompletedMonthIndex + 1)
  }
  return months
})

/** 废品率分析：系列 tab（分厂与产品系列展示一致，均为单系列） */
type DefectSeriesKey = string
const defectSeriesKey = ref<DefectSeriesKey>('分厂')

const defectSeriesTabs = computed(() =>
  defectAnalysisSeries.map((item) => ({ key: item.name, label: item.name }))
)

const activeDefectSeries = computed(() => {
  const found = defectAnalysisSeries.filter((item) => item.name === defectSeriesKey.value)
  return found.length ? found : [defectAnalysisSeries[0]]
})

/** 横轴可见月份：1 月 ~ 当月（当月未到不展示） */
const visibleDefectMonths = computed(() =>
  months.slice(0, currentMonthIndex + 1)
)

const defectAnalysisOption = computed(() =>
  createDefectAnalysisOption(visibleDefectMonths.value, activeDefectSeries.value)
)
const defectLossOption = computed(() =>
  createDefectLossOption(defectLossYear.value, visibleDefectLossMonths.value)
)
const inspectMetricKey = ref<InspectMetricKey>('rework')
const inspectOption = computed(() => createInspectOption(inspectMetricKey.value))
const productionDefectRateOption = createProductionDefectRateOption()
const productionDefectLossOption = createProductionDefectLossOption()
const productionRepairOption = createProductionRepairOption()
const zeroPpmOption = createZeroPpmOption()

/* 废品率分析：点击柱子 → 月份 + 系列明细弹窗 */
interface DefectDetailModal {
  monthLabel: string
  seriesName: string
  color: string
  inner: number
  outer: number
  total: number
}

const defectDetail = ref<DefectDetailModal | null>(null)
const defectDetailOpen = computed({
  get: () => defectDetail.value !== null,
  set: (open: boolean) => {
    if (!open) defectDetail.value = null
  }
})

/** 明细 mock：按月份+系列确定性生成班组拆分 */
function buildDefectDetailRows(monthIndex: number, seriesName: string) {
  const product = defectAnalysisSeries.find((item) => item.name === seriesName)
  const inner = product?.inner[monthIndex] ?? 0
  const outer = product?.outer[monthIndex] ?? 0
  const teams = ['造型一班', '造型二班', '熔炼班', '清理班']
  const weights = [0.32, 0.28, 0.22, 0.18]
  const seed = (monthIndex + 1) * 17 + seriesName.charCodeAt(0)
  return teams.map((team, index) => {
    const jitter = 0.9 + ((seed + index * 13) % 20) / 100
    const teamInner = Number(((inner * weights[index]) * jitter).toFixed(2))
    const teamOuter = Number(((outer * weights[index]) * (2 - jitter)).toFixed(2))
    return {
      team,
      inner: teamInner,
      outer: teamOuter,
      total: Number((teamInner + teamOuter).toFixed(2)),
      qty: 40 + ((seed * 7 + index * 11) % 80)
    }
  })
}

const defectDetailRows = computed(() => {
  if (!defectDetail.value) return []
  const monthIndex = visibleDefectMonths.value.findIndex(
    (label) => label === defectDetail.value?.monthLabel
  )
  if (monthIndex < 0) return []
  return buildDefectDetailRows(monthIndex, defectDetail.value.seriesName)
})

function handleDefectChartClick(payload: unknown) {
  const params = payload as { seriesIndex?: number; dataIndex?: number } | null
  if (!params || typeof params.seriesIndex !== 'number' || typeof params.dataIndex !== 'number') return

  const products = activeDefectSeries.value
  const productIndex = Math.floor(params.seriesIndex / 2)
  const product = products[productIndex]
  if (!product) return

  const monthLabel = visibleDefectMonths.value[params.dataIndex]
  if (!monthLabel) return

  const inner = product.inner[params.dataIndex] ?? 0
  const outer = product.outer[params.dataIndex] ?? 0

  defectDetail.value = {
    monthLabel,
    seriesName: product.name,
    color: product.color,
    inner,
    outer,
    total: Number((inner + outer).toFixed(2))
  }
}
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="质量可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

    <!-- 顶部质量指标栏 -->
    <div class="top-indicators">
      <div
        v-for="item in qualityTopIndicators"
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
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- 两行三列：1废品率 2吨均 3成品检验 / 4产线 5主要产品 6零公里 -->
    <div class="dashboard-row dashboard-grid-2x3">
      <div class="data-panel">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="panel-header">
          <div class="panel-icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 9.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">废品率分析</h3>
          <div class="tab-buttons defect-series-tabs">
            <button
              v-for="tab in defectSeriesTabs"
              :key="tab.key"
              type="button"
              class="tab-button"
              :class="{ active: defectSeriesKey === tab.key }"
              @click="defectSeriesKey = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="defect-legend">
          <span class="defect-legend-item">
            <i class="swatch" :style="{ background: INNER_COLOR }"></i>
            内废
          </span>
          <span class="defect-legend-item">
            <i class="swatch" :style="{ background: OUTER_COLOR }"></i>
            外废
          </span>
        </div>

        <div class="chart-area defect-chart-area">
          <EChart :option="defectAnalysisOption" @click="handleDefectChartClick" />
        </div>
      </div>

      <div class="data-panel">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="panel-header">
          <div class="panel-icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 9.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">吨均废品损失</h3>
          <div class="tab-buttons">
            <button
              v-for="tab in defectLossYearTabs"
              :key="tab.key"
              type="button"
              class="tab-button"
              :class="{ active: defectLossYear === tab.key }"
              @click="defectLossYear = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <div class="chart-area">
          <EChart :option="defectLossOption" />
        </div>
      </div>

      <div class="data-panel">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="panel-header">
          <div class="panel-icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">成品检验分析</h3>
          <div class="tab-buttons">
            <button
              v-for="metric in inspectMetrics"
              :key="metric.key"
              type="button"
              class="tab-button"
              :class="{ active: inspectMetricKey === metric.key }"
              @click="inspectMetricKey = metric.key"
            >
              {{ metric.label }}
            </button>
          </div>
        </div>
        <div class="chart-area">
          <EChart :option="inspectOption" />
        </div>
      </div>

      <div class="data-panel">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="panel-header">
          <div class="panel-icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">产线质量分析</h3>
          <div class="tab-buttons">
            <button
              class="tab-button"
              :class="{ active: productionType === 'defectRate' }"
              @click="productionType = 'defectRate'"
            >
              废品率
            </button>
            <button
              class="tab-button"
              :class="{ active: productionType === 'defectLoss' }"
              @click="productionType = 'defectLoss'"
            >
              废品损失
            </button>
            <button
              class="tab-button"
              :class="{ active: productionType === 'repairRate' }"
              @click="productionType = 'repairRate'"
            >
              返工返修率
            </button>
          </div>
        </div>

        <div class="chart-container">
          <div v-if="productionType === 'defectRate'" class="chart-area">
            <EChart :option="productionDefectRateOption" />
          </div>
          <div v-else-if="productionType === 'defectLoss'" class="chart-area">
            <EChart :option="productionDefectLossOption" />
          </div>
          <div v-else class="chart-area">
            <EChart :option="productionRepairOption" />
          </div>
        </div>
      </div>

      <div class="data-panel">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="panel-header">
          <div class="panel-icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">主要产品质量情况</h3>
        </div>

        <div class="product-table-wrap">
          <div class="product-table-head">
            <span>产品件号</span>
            <span>产品系列</span>
            <span>毛坯名称</span>
            <span>内部废品率</span>
            <span>返工返修率</span>
          </div>
          <div class="product-table-viewport">
            <!-- 双份数据无缝循环上滚 -->
            <div class="product-table-track">
              <div
                v-for="(row, index) in productScrollRows"
                :key="`${row.partNo}-${index}`"
                class="product-table-row"
                :class="{ ghost: index >= mainProductRows.length }"
              >
                <span>{{ row.partNo }}</span>
                <span>{{ row.series }}</span>
                <span>{{ row.blankName }}</span>
                <span class="rate inner">{{ row.innerDefectRate }}</span>
                <span class="rate repair">{{ row.repairRate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="data-panel">
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
        <div class="panel-header">
          <div class="panel-icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">生产零公里PPM</h3>
        </div>
        <div class="chart-area">
          <EChart :option="zeroPpmOption" />
        </div>
      </div>
    </div>

    <!-- 废品率分析：点击柱子 → 月份 + 系列明细 -->
    <Teleport to="body">
      <div
        v-if="defectDetailOpen"
        class="defect-modal-mask"
        @click.self="defectDetailOpen = false"
      >
        <div class="defect-modal" role="dialog" aria-modal="true">
          <div class="defect-modal-corner tl"></div>
          <div class="defect-modal-corner tr"></div>
          <div class="defect-modal-corner bl"></div>
          <div class="defect-modal-corner br"></div>

          <button
            type="button"
            class="defect-modal-close"
            aria-label="关闭"
            @click="defectDetailOpen = false"
          >
            ×
          </button>

          <div class="defect-modal-header">
            <h3 class="defect-modal-title">
              {{ defectDetail?.monthLabel }} {{ defectDetail?.seriesName }} 废品率详情
            </h3>
          </div>

          <div v-if="defectDetail" class="defect-modal-body">
            <div class="defect-modal-stats">
              <div class="stat-card">
                <span class="stat-label">内废率</span>
                <span class="stat-value" :style="{ color: INNER_COLOR }">
                  {{ defectDetail.inner.toFixed(2) }}%
                </span>
              </div>
              <div class="stat-card">
                <span class="stat-label">外废率</span>
                <span class="stat-value" :style="{ color: OUTER_COLOR }">
                  {{ defectDetail.outer.toFixed(2) }}%
                </span>
              </div>
              <div class="stat-card">
                <span class="stat-label">综合废品率</span>
                <span class="stat-value accent">{{ defectDetail.total.toFixed(2) }}%</span>
              </div>
            </div>

            <div class="defect-modal-meta">
              <span>
                系列：
                <i
                  class="series-dot"
                  :style="{ borderColor: defectDetail.color, background: `${defectDetail.color}33` }"
                ></i>
                {{ defectDetail.seriesName }}
              </span>
              <span>口径：内废 + 外废 = 综合废品率</span>
            </div>

            <div class="defect-modal-table-wrap">
              <table class="defect-modal-table">
                <thead>
                  <tr>
                    <th>班组/工序</th>
                    <th>内废率</th>
                    <th>外废率</th>
                    <th>综合废品率</th>
                    <th>抽检数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in defectDetailRows" :key="row.team">
                    <td>{{ row.team }}</td>
                    <td class="num" :style="{ color: INNER_COLOR }">{{ row.inner }}%</td>
                    <td class="num" :style="{ color: OUTER_COLOR }">{{ row.outer }}%</td>
                    <td class="num accent">{{ row.total }}%</td>
                    <td>{{ row.qty }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  min-height: calc(100vh - 132px) !important;
  padding: 10px !important;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;
  /* 背景沿用生产 / 设备可视化大屏 */
  color: #dff8ff !important;
  background-color: #041019 !important;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(0, 166, 216, 0.12), transparent 27%),
    radial-gradient(circle at 82% 78%, rgba(0, 119, 177, 0.1), transparent 31%),
    linear-gradient(rgba(35, 146, 177, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 146, 177, 0.055) 1px, transparent 1px) !important;
  background-size: auto, auto, 32px 32px, 32px 32px;
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.46) !important;
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
}

/* 顶部指标栏：对齐生产可视化大屏 top-indicators */
.top-indicators {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 14px;
}

.top-indicator-card {
  position: relative;
  width: 100%;
  height: 110px;
  min-height: 110px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
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
  min-width: 0;
}

.top-indicator-label {
  margin-bottom: 8px;
  color: #a9c9d4;
  font-size: 13px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-indicator-value {
  color: #ffd91a;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 14px rgba(255, 217, 26, 0.36);
  white-space: nowrap;
}

.top-indicator-unit {
  margin-left: 6px;
  color: #b8d6df;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
}

.top-indicator-icon {
  position: relative;
  z-index: 1;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
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

@media (min-width: 1201px) and (max-width: 1600px) {
  .top-indicator-card {
    padding: 12px 12px;
  }

  .top-indicator-icon {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
  }

  .top-indicator-value {
    font-size: 24px;
  }

  .top-indicator-label {
    font-size: 12px;
  }
}

@media (max-width: 1200px) {
  .top-indicators {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* 网格布局：默认三列；质量大屏为两行三列 */
.dashboard-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px !important;
  margin-bottom: 14px;
}

.dashboard-row.dashboard-grid-2x3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
}

.dashboard-row.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dashboard-row.wide-columns {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}

/* 废品率分析：仅内废 / 外废图例（系列由标题 Tab 切换） */
.defect-legend {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 8px 16px;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.defect-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a9c9d4;
  font-size: 12px;
  white-space: nowrap;
}

.defect-legend-item .swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.defect-chart-area {
  min-height: 0;
  flex: 1;
}

/* 废品率明细弹窗 */
.defect-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(2, 12, 18, 0.72);
  backdrop-filter: blur(2px);
}

.defect-modal {
  position: relative;
  width: min(720px, 94vw);
  max-height: min(86vh, 720px);
  display: flex;
  flex-direction: column;
  color: #dff8ff;
  background:
    linear-gradient(180deg, rgba(8, 48, 72, 0.96), rgba(4, 24, 36, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(0, 180, 230, 0.18), transparent 55%);
  border: 1px solid rgba(0, 210, 255, 0.75);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(0, 120, 180, 0.25),
    0 0 28px rgba(0, 190, 255, 0.28),
    inset 0 0 40px rgba(0, 100, 150, 0.12);
}

.defect-modal::before,
.defect-modal::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 2px;
  pointer-events: none;
}

.defect-modal::before {
  top: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  box-shadow: 0 0 10px rgba(24, 210, 255, 0.85);
}

.defect-modal::after {
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(24, 210, 255, 0.55), transparent);
}

.defect-modal-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  z-index: 2;
  pointer-events: none;
}

.defect-modal-corner.tl {
  top: -1px;
  left: -1px;
  border-top: 3px solid #1bd5ff;
  border-left: 3px solid #1bd5ff;
}

.defect-modal-corner.tr {
  top: -1px;
  right: -1px;
  border-top: 3px solid #1bd5ff;
  border-right: 3px solid #1bd5ff;
}

.defect-modal-corner.bl {
  bottom: -1px;
  left: -1px;
  border-bottom: 3px solid #1bd5ff;
  border-left: 3px solid #1bd5ff;
}

.defect-modal-corner.br {
  bottom: -1px;
  right: -1px;
  border-bottom: 3px solid #1bd5ff;
  border-right: 3px solid #1bd5ff;
}

.defect-modal-close {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 3;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #9fd9ea;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.defect-modal-close:hover {
  color: #fff;
  text-shadow: 0 0 8px rgba(24, 210, 255, 0.9);
}

.defect-modal-header {
  flex-shrink: 0;
  padding: 22px 48px 12px;
  text-align: center;
}

.defect-modal-title {
  margin: 0;
  display: inline-block;
  padding-bottom: 10px;
  color: #f4fdff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 14px rgba(31, 204, 255, 0.35);
}

.defect-modal-title::after {
  content: '';
  display: block;
  width: 64px;
  height: 3px;
  margin: 10px auto 0;
  background: #ffd91a;
  box-shadow: 0 0 10px rgba(255, 217, 26, 0.75);
}

.defect-modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 28px 28px;
}

.defect-modal-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  padding: 12px;
  text-align: center;
  background: rgba(6, 40, 58, 0.78);
  border: 1px solid rgba(0, 190, 235, 0.32);
  border-radius: 4px;
}

.stat-label {
  display: block;
  margin-bottom: 6px;
  color: #a9c9d4;
  font-size: 12px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stat-value.accent {
  color: #ffd91a;
  text-shadow: 0 0 10px rgba(255, 217, 26, 0.3);
}

.defect-modal-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #a9c9d4;
  font-size: 13px;
}

.series-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border: 2px solid;
  border-radius: 2px;
  vertical-align: middle;
}

.defect-modal-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(0, 190, 235, 0.28);
  border-radius: 2px;
}

.defect-modal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.defect-modal-table th,
.defect-modal-table td {
  padding: 12px 10px;
  text-align: center;
  white-space: nowrap;
}

.defect-modal-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(0, 160, 210, 0.45), rgba(0, 100, 150, 0.35));
  color: #f4fdff;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 200, 240, 0.45);
}

.defect-modal-table tbody td {
  background: rgba(6, 40, 58, 0.72);
  color: #dff8ff;
  border-bottom: 1px solid rgba(0, 150, 190, 0.18);
}

.defect-modal-table tbody tr:nth-child(odd) td {
  background: rgba(10, 52, 74, 0.78);
}

.defect-modal-table .num {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.defect-modal-table .num.accent {
  color: #ffd91a;
}

.defect-modal-table-wrap::-webkit-scrollbar {
  width: 6px;
}

.defect-modal-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.55);
  border-radius: 3px;
}

/* 数据面板：沿用生产 / 设备可视化大屏 */
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
  /* 与其他滨海大屏模块高度一致 */
  height: 360px;
  overflow: hidden;
  box-sizing: border-box;
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
  flex: 1;
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

/* data-panel 角装饰 */
.dashboard-container .data-panel .corner-tl,
.dashboard-container .data-panel .corner-tr,
.dashboard-container .data-panel .corner-bl,
.dashboard-container .data-panel .corner-br {
  display: block !important;
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: #1bd5ff !important;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
  z-index: 10;
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

/* 废品率表格样式 */
.defect-rate-table {
  font-family: 'Microsoft YaHei', 'Source Han Sans CN', sans-serif;
  flex: 1;
  min-height: 0;
  color: #cde7ee;
}

.table-header {
  background: rgba(0, 143, 184, 0.17) !important;
  margin-bottom: 4px;
}

.header-row {
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 192, 235, 0.44);
}

.header-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.column-title {
  color: #75dff7;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
}

.table-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.data-row {
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 154, 197, 0.16);
  transition: background-color 0.2s ease;
}

.data-row:nth-child(odd) {
  background: rgba(7, 36, 48, 0.5);
}

.data-row:hover {
  background: rgba(0, 169, 215, 0.13);
}

.product-label {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 8px;
}

.product-name {
  color: #cde7ee;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
}

.data-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.rate-value {
  color: #f4fdff;
  font-weight: 700;
  font-family: 'DIN Alternate', 'Source Han Sans CN', sans-serif;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(31, 204, 255, 0.25);
}

/* 切换按钮样式 */
.tab-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* 主要产品质量情况：表头固定 + 内容自动上滚 */
.product-table-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(0, 190, 235, 0.22);
  border-radius: 2px;
}

.product-table-head {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr 1.2fr 0.9fr 0.9fr;
  flex-shrink: 0;
  background: rgba(0, 143, 184, 0.28);
  border-bottom: 1px solid rgba(0, 192, 235, 0.44);
}

.product-table-head span {
  padding: 9px 4px;
  color: #75dff7;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.product-table-viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.product-table-track {
  will-change: transform;
  animation: product-table-scroll 28s linear infinite;
}

.product-table-wrap:hover .product-table-track {
  animation-play-state: paused;
}

@keyframes product-table-scroll {
  0% {
    transform: translateY(0);
  }
  100% {
    /* 双份数据，滚完第一份回到起点 */
    transform: translateY(-50%);
  }
}

.product-table-row {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr 1.2fr 0.9fr 0.9fr;
  align-items: center;
  border-bottom: 1px solid rgba(0, 154, 197, 0.16);
  background: rgba(5, 27, 37, 0.72);
}

.product-table-row:nth-child(even) {
  background: rgba(7, 36, 48, 0.78);
}

.product-table-row:hover {
  background: rgba(0, 169, 215, 0.13);
}

.product-table-row span {
  padding: 9px 4px;
  color: #cde7ee;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-table-row .rate {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.product-table-row .rate.inner {
  color: #31d7ff;
}

.product-table-row .rate.repair {
  color: #ffd52a;
}

@media (prefers-reduced-motion: reduce) {
  .product-table-track {
    animation: none;
  }
}

.dashboard-container .tab-button {
  color: #9cc8d5 !important;
  background: rgba(4, 24, 33, 0.88) !important;
  border: 1px solid rgba(0, 184, 225, 0.4) !important;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 50px;
  text-align: center;
  white-space: nowrap;
}

.dashboard-container .tab-button:hover,
.dashboard-container .tab-button.active {
  color: #effcff !important;
  background: linear-gradient(180deg, rgba(0, 177, 220, 0.46), rgba(0, 101, 135, 0.34)) !important;
  border-color: #26d5ff !important;
  box-shadow: inset 0 0 10px rgba(38, 213, 255, 0.18);
}

/* 废品率分析：标题右侧产品系列 tab（更紧凑，避免挤出面板） */
.dashboard-container .defect-series-tabs {
  gap: 4px;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
}

.dashboard-container .defect-series-tabs .tab-button {
  min-width: 0;
  padding: 3px 6px;
  font-size: 10px;
  flex-shrink: 0;
}

/* 质量指标tab样式 */
.quality-indicator-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
  flex-wrap: wrap;
  margin-top: auto;
  flex-shrink: 0;
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
  width: 100%;
}

@media (max-width: 1200px) {
  .dashboard-row,
  .dashboard-row.two-columns,
  .dashboard-row.wide-columns,
  .dashboard-row.dashboard-grid-2x3 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
