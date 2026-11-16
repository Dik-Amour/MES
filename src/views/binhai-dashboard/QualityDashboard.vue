<script setup lang="ts">

import { computed, ref } from 'vue'

import EChart from '@/components/EChart.vue'
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
import type { EChartsOption } from 'echarts'

/* =========================
   页面静态数据
   ========================= */
/** 质量可视化大屏静态数据 */

interface DefectRateRow {
  label: string
  inner: string
  outer: string
}

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

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/** 年度废品率表格 */
const defectRateRows: DefectRateRow[] = [
  { label: '综合废品率', inner: '5.4%', outer: '5.4%' },
  { label: '中速机', inner: '5.4%', outer: '5.4%' },
  { label: '重潍柴', inner: '5.4%', outer: '5.4%' },
  { label: '大机', inner: '5.4%', outer: '5.4%' },
  { label: '博杜安', inner: '5.4%', outer: '5.4%' }
]

/** 产品质量指标：按产品系列切换 */
const qualityIndicatorProducts = ['中速机', '博杜安', '重潍柴', '大机', '其他产品'] as const
type QualityProduct = (typeof qualityIndicatorProducts)[number]

const qualityIndicators: Record<QualityProduct, number[]> = {
  中速机: [4.3, 4.5, 3.0, 3.0, 3.1, 2.7, 2.9, 3.2, 2.8, 0.5, 0.2, 0.1],
  博杜安: [3.8, 4.2, 2.8, 2.9, 3.0, 2.5, 2.7, 3.0, 2.6, 0.8, 0.4, 0.2],
  重潍柴: [4.1, 4.3, 3.2, 3.1, 3.3, 2.9, 3.1, 3.4, 3.0, 0.7, 0.3, 0.1],
  大机: [3.5, 3.8, 2.5, 2.6, 2.8, 2.3, 2.5, 2.8, 2.4, 0.6, 0.3, 0.2],
  其他产品: [3.9, 4.1, 2.9, 2.8, 3.0, 2.6, 2.8, 3.1, 2.7, 0.9, 0.5, 0.3]
}

type DefectLossYear = 2023 | 2024

/** 吨均废品损失：按年份切换（原页面为随机模拟数据，这里固化为稳定值） */
const defectLossByYear: Record<DefectLossYear, number[]> = {
  2024: [131, 123, 149, 128, 142, 137, 118, 145, 126, 139, 133, 147],
  2023: [137, 152, 128, 146, 141, 130, 154, 136, 148, 124, 150, 143]
}

/** 工艺质量检查统计 */
const processCheckData = {
  categories: ['工艺质量巡查', '工艺纪律检查', '工艺分层审核'],
  total: [33, 38, 45],
  closed: [28, 35, 42]
}

/** 产线质量分析：废品率（折线）与废品损失（堆叠柱）共用产线清单 */
const productionLines: LineSeries[] = [
  { name: '熔炼线', color: '#31d7ff', data: [2.8, 2.6, 2.9, 2.7, 2.5, 2.8, 2.6, 2.7, 2.9, 2.8, 2.6, 2.7] },
  { name: '大机', color: '#189fd9', data: [3.2, 3.0, 3.3, 3.1, 2.9, 3.2, 3.0, 3.1, 3.3, 3.2, 3.0, 3.1] },
  { name: '曲轴', color: '#31d7ff', data: [2.5, 2.3, 2.6, 2.4, 2.2, 2.5, 2.3, 2.4, 2.6, 2.5, 2.3, 2.4] },
  { name: '重潍柴', color: '#31d7ff', data: [2.9, 2.7, 3.0, 2.8, 2.6, 2.9, 2.7, 2.8, 3.0, 2.9, 2.7, 2.8] },
  { name: '新产品', color: '#31d7ff', data: [3.5, 3.3, 3.6, 3.4, 3.2, 3.5, 3.3, 3.4, 3.6, 3.5, 3.3, 3.4] },
  { name: '制芯', color: '#31d7ff', data: [2.2, 2.0, 2.3, 2.1, 1.9, 2.2, 2.0, 2.1, 2.3, 2.2, 2.0, 2.1] },
  { name: '清理', color: '#31d7ff', data: [2.6, 2.4, 2.7, 2.5, 2.3, 2.6, 2.4, 2.5, 2.7, 2.6, 2.4, 2.5] }
]

const productionLineLoss: Record<string, number[]> = {
  熔炼线: [45, 42, 48, 44, 40, 46, 43, 44, 47, 45, 42, 43],
  大机: [52, 48, 55, 51, 47, 53, 50, 51, 54, 52, 48, 50],
  曲轴: [38, 35, 41, 37, 33, 39, 36, 37, 40, 38, 35, 36],
  重潍柴: [48, 45, 51, 47, 43, 49, 46, 47, 50, 48, 45, 46],
  新产品: [58, 55, 61, 57, 53, 59, 56, 57, 60, 58, 55, 56],
  制芯: [32, 30, 35, 31, 28, 33, 30, 31, 34, 32, 30, 31],
  清理: [42, 39, 45, 41, 37, 43, 40, 41, 44, 42, 39, 40]
}

/** 生产零公里 PPM */
const zeroPpmData = [45, 38, 42, 35, 40, 33, 38, 36, 34, 32, 30, 28]

/** 主要产品质量情况：Top15 毛坯件号 */
const top15Parts = [
  '件号1',
  '件号2',
  '件号3',
  '件号4',
  '件号5',
  '件号6',
  '件号7',
  '件号8',
  '件号9',
  '件号10',
  '件号11',
  '件号12',
  '件号13',
  '件号14',
  '件号15'
]

const mainProductDefectRate: ProductSeries[] = [
  {
    name: '造型',
    color: '#31d7ff',
    value: [1.2, 1.5, 1.8, 1.3, 1.6, 1.4, 1.7, 1.5, 1.9, 1.4, 1.6, 1.3, 1.8, 1.5, 1.7]
  },
  {
    name: '熔炼',
    color: '#4ee6a6',
    value: [0.8, 1.0, 1.2, 0.9, 1.1, 1.0, 1.3, 1.1, 1.4, 1.0, 1.2, 0.9, 1.3, 1.1, 1.2]
  },
  {
    name: '清理',
    color: '#ffd52a',
    value: [0.5, 0.7, 0.9, 0.6, 0.8, 0.7, 1.0, 0.8, 1.1, 0.7, 0.9, 0.6, 1.0, 0.8, 0.9]
  }
]

const mainProductRepairRate: ProductSeries[] = [
  {
    name: '造型',
    color: '#31d7ff',
    value: [2.1, 2.4, 2.7, 2.2, 2.5, 2.3, 2.6, 2.4, 2.8, 2.3, 2.5, 2.2, 2.7, 2.4, 2.6]
  },
  {
    name: '熔炼',
    color: '#4ee6a6',
    value: [1.5, 1.8, 2.0, 1.6, 1.9, 1.7, 2.1, 1.9, 2.3, 1.7, 2.0, 1.6, 2.1, 1.9, 2.0]
  },
  {
    name: '清理',
    color: '#ffd52a',
    value: [1.0, 1.2, 1.5, 1.1, 1.4, 1.2, 1.6, 1.4, 1.8, 1.2, 1.5, 1.1, 1.6, 1.4, 1.5]
  }
]

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

/** 产品质量指标：单折线，按产品系列切换 */
function createQualityIndicatorOption(product: QualityProduct): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      formatter: (params: any) =>
        `${params[0].axisValue}<br/>${params[0].marker}${product}: ${params[0].value}%`
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '8%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: 'rgba(72, 164, 194, 0.18)'
        }
      }
    },
    yAxis: {
      ...valueAxis,
      name: '%',
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: product,
        type: 'line',
        data: qualityIndicators[product],
        lineStyle: {
          color: '#ff4d4f',
          width: 3,
          shadowColor: 'rgba(255, 77, 79, 0.3)',
          shadowBlur: 10
        },
        itemStyle: {
          color: '#ff4d4f',
          borderWidth: 2,
          borderColor: '#061821',
          shadowColor: 'rgba(255, 77, 79, 0.5)',
          shadowBlur: 8
        },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(255, 77, 79, 0.8)'
          }
        }
      }
    ]
  } as EChartsOption
}

/** 吨均废品损失：按年份切换 */
function createDefectLossOption(year: DefectLossYear): EChartsOption {
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
    xAxis: {
      ...categoryAxis,
      data: months
    },
    yAxis: {
      ...valueAxis,
      name: '元/吨'
    },
    series: [
      {
        name: '吨均废品损失',
        type: 'bar',
        barWidth: '50%',
        data: defectLossByYear[year],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#31d7ff' },
              { offset: 1, color: '#31d7ff' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  } as EChartsOption
}

/** 工艺质量检查统计：横向条形，总问题数 + 封闭数叠加 */
function createProcessCheckOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          result += `${item.marker}${item.seriesName}: ${item.value}<br/>`
        })
        return result
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'category',
      data: processCheckData.categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 11
      }
    },
    series: [
      {
        name: '总问题数',
        type: 'bar',
        data: processCheckData.total,
        itemStyle: {
          color: 'rgba(255, 255, 255, 0.8)',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '25%',
        barCategoryGap: '40%',
        label: {
          show: true,
          position: 'right',
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: (params: any) => `${params.value}`,
          offset: [5, 0]
        }
      },
      {
        name: '封闭数',
        type: 'bar',
        data: processCheckData.closed,
        itemStyle: {
          color: '#31d7ff',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '25%',
        barGap: '-100%'
      }
    ]
  } as EChartsOption
}

/** 产线质量分析：废品率（7 条折线） */
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
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months
    },
    yAxis: {
      ...valueAxis,
      name: '废品率(%)',
      nameTextStyle: { color: '#a9c9d4', fontSize: 11 },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series: productionLines.map((line) => ({
      name: line.name,
      type: 'line',
      data: line.data,
      lineStyle: { color: line.color, width: 2 },
      itemStyle: { color: line.color },
      smooth: true
    }))
  } as EChartsOption
}

/** 产线质量分析：废品损失（7 组堆叠柱） */
function createProductionDefectLossOption(): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: productionLines.map((line) => line.name),
      textStyle: { color: '#a9c9d4', fontSize: 10 },
      top: 0,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: months
    },
    yAxis: {
      ...valueAxis,
      name: '损失(元/吨)',
      nameTextStyle: { color: '#a9c9d4', fontSize: 11 }
    },
    series: productionLines.map((line) => ({
      name: line.name,
      type: 'bar',
      stack: 'total',
      data: productionLineLoss[line.name],
      itemStyle: { color: line.color }
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

/** 主要产品质量情况：Top15 件号堆叠柱（废品率 / 返修焊补率共用结构） */
function createMainProductOption(series: ProductSeries[]): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          result += `${item.marker}${item.seriesName}: ${item.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: series.map((item) => item.name),
      textStyle: { color: '#a9c9d4', fontSize: 12 },
      top: 10,
      right: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      ...categoryAxis,
      data: top15Parts,
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      ...valueAxis,
      name: '%',
      nameTextStyle: { color: '#a9c9d4', fontSize: 12 },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      }
    },
    series: series.map((item) => ({
      name: item.name,
      type: 'bar',
      stack: 'total',
      data: item.value,
      itemStyle: { color: item.color }
    }))
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */

type ProductionType = 'defectRate' | 'defectLoss'
type MainProductType = 'defectRate' | 'repairRate'

const activeProduct = ref<QualityProduct>('中速机')
const defectLossYear = ref<DefectLossYear>(2024)
const productionType = ref<ProductionType>('defectRate')
const mainType = ref<MainProductType>('defectRate')

const qualityOption = computed(() => createQualityIndicatorOption(activeProduct.value))
const defectLossOption = computed(() => createDefectLossOption(defectLossYear.value))
const processCheckOption = createProcessCheckOption()
const productionDefectRateOption = createProductionDefectRateOption()
const productionDefectLossOption = createProductionDefectLossOption()
const zeroPpmOption = createZeroPpmOption()
const mainDefectRateOption = createMainProductOption(mainProductDefectRate)
const mainRepairRateOption = createMainProductOption(mainProductRepairRate)
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="质量可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

    <!-- 第一行：年度废品率、产品质量指标、吨均废品损失 -->
    <div class="dashboard-row">
      <!-- 年度废品率 -->
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
          <h3 class="panel-title">年度废品率</h3>
        </div>

        <!-- 表格形式的废品率数据 -->
        <div class="defect-rate-table">
          <div class="table-header">
            <div class="header-row">
              <div class="header-cell product-name"></div>
              <div class="header-cell data-column">
                <div class="column-title">内废</div>
              </div>
              <div class="header-cell data-column">
                <div class="column-title">外废</div>
              </div>
            </div>
          </div>

          <div class="table-body">
            <div v-for="row in defectRateRows" :key="row.label" class="data-row">
              <div class="product-label">
                <span class="product-name">{{ row.label }}</span>
              </div>
              <div class="data-cell">
                <span class="rate-value">{{ row.inner }}</span>
              </div>
              <div class="data-cell">
                <span class="rate-value">{{ row.outer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 产品质量指标 -->
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
          <h3 class="panel-title">产品质量指标</h3>
        </div>
        <div class="chart-container">
          <div class="chart-area" style="min-height: 200px">
            <EChart :option="qualityOption" />
          </div>
          <!-- Tab切换按钮 -->
          <div class="quality-indicator-tabs">
            <button
              v-for="product in qualityIndicatorProducts"
              :key="product"
              class="tab-button"
              :class="{ active: activeProduct === product }"
              @click="activeProduct = product"
            >
              {{ product }}
            </button>
          </div>
        </div>
      </div>

      <!-- 吨均废品损失 -->
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
          <h3 class="panel-title">吨均废品损失</h3>
          <div class="tab-buttons">
            <button
              class="tab-button"
              :class="{ active: defectLossYear === 2023 }"
              @click="defectLossYear = 2023"
            >
              2023年
            </button>
            <button
              class="tab-button"
              :class="{ active: defectLossYear === 2024 }"
              @click="defectLossYear = 2024"
            >
              2024年
            </button>
          </div>
        </div>
        <div class="chart-area">
          <EChart :option="defectLossOption" />
        </div>
      </div>
    </div>

    <!-- 第二行：工艺检查问题记录、产线废品率与损失 -->
    <div class="dashboard-row wide-columns">
      <!-- 工艺检查问题记录 -->
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
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="panel-title">工艺质量检查统计</h3>
        </div>
        <div class="chart-area">
          <EChart :option="processCheckOption" />
        </div>
      </div>

      <!-- 产线质量分析 -->
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
          </div>
        </div>

        <div class="chart-container">
          <div v-if="productionType === 'defectRate'" class="chart-area">
            <EChart :option="productionDefectRateOption" />
          </div>
          <div v-else class="chart-area">
            <EChart :option="productionDefectLossOption" />
          </div>
        </div>
      </div>
    </div>

    <!-- 第三行：生产零公里PPM和主要产品质量情况 -->
    <div class="dashboard-row wide-columns">
      <!-- 生产零公里PPM -->
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

      <!-- 主要产品质量情况 -->
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
          <h3 class="panel-title">主要产品质量情况</h3>
          <div class="tab-buttons">
            <button
              class="tab-button"
              :class="{ active: mainType === 'defectRate' }"
              @click="mainType = 'defectRate'"
            >
              产品废品率
            </button>
            <button
              class="tab-button"
              :class="{ active: mainType === 'repairRate' }"
              @click="mainType = 'repairRate'"
            >
              返修焊补率
            </button>
          </div>
        </div>

        <div class="chart-container">
          <div v-if="mainType === 'defectRate'" class="chart-area">
            <EChart :option="mainDefectRateOption" />
          </div>
          <div v-else class="chart-area">
            <EChart :option="mainRepairRateOption" />
          </div>
        </div>
      </div>
    </div>
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

/* 网格布局 */
.dashboard-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px !important;
  margin-bottom: 16px;
}

.dashboard-row.two-columns,
.dashboard-row.wide-columns {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
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
  min-height: 250px;
  width: 100%;
}

@media (max-width: 1200px) {
  .dashboard-row,
  .dashboard-row.two-columns,
  .dashboard-row.wide-columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
