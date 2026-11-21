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

interface EquipmentStatRow {
  code: string
  name: string
  runtime: string
  availability: string
}

interface AbnormalRow {
  /** 部门车间 */
  dept: string
  device: string
  issue: string
  handler: string
  /** 异常时长，如 2.5h */
  duration: string
  /** 最近异常时间 */
  time: string
}

type ProductionLineKey = 'smelting' | 'molding' | 'cleaning'

/** MTBF / MTTR 分析维度：汇总显示三条产线，单产线只显示对应曲线 */
type MetricScopeKey = 'summary' | ProductionLineKey

type DowntimeYearKey = 'thisYear' | 'lastYear'

interface DowntimeAnalysis {
  months: string[]
  /** 完成值（实际停机率） */
  actual: number[]
  /** 目标值 */
  target: number
}

interface MtbfSeries {
  name: string
  data: number[]
  color: string
}

interface LineAnalysis {
  months: string[]
  series: MtbfSeries[]
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

/** 设备停机率分析（今年 / 去年） */
const downtimeAnalysisData: Record<DowntimeYearKey, DowntimeAnalysis> = {
  thisYear: {
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    actual: [2.8, 2.5, 3.1, 2.4, 2.2, 2.6, 2.3, 2.1, 2.4, 2.0, 2.2, 2.3],
    target: 3.0
  },
  lastYear: {
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    actual: [3.4, 3.2, 3.5, 3.0, 2.9, 3.2, 3.1, 2.8, 3.0, 2.7, 2.9, 3.1],
    target: 3.5
  }
}

/** 设备MTBF分析：12个月 × 熔炼/造型/清理 */
const mtbfAnalysisData: LineAnalysis = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  series: [
    {
      name: '熔炼',
      color: '#ffd52a',
      data: [186, 192, 178, 205, 214, 198, 188, 221, 209, 230, 218, 226]
    },
    {
      name: '造型',
      color: '#4ee6a6',
      data: [162, 175, 168, 188, 196, 182, 171, 203, 194, 210, 201, 208]
    },
    {
      name: '清理',
      color: '#3bd6c6',
      data: [148, 156, 152, 169, 178, 164, 158, 185, 176, 192, 184, 190]
    }
  ]
}

/** 设备MTTR分析：12个月 × 熔炼/造型/清理 */
const mttrAnalysisData: LineAnalysis = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  series: [
    {
      name: '熔炼',
      color: '#ffd52a',
      data: [28, 26, 31, 24, 22, 27, 25, 21, 23, 20, 22, 21]
    },
    {
      name: '造型',
      color: '#4ee6a6',
      data: [32, 30, 35, 28, 26, 31, 29, 25, 27, 24, 26, 25]
    },
    {
      name: '清理',
      color: '#3bd6c6',
      data: [36, 34, 38, 32, 30, 35, 33, 29, 31, 28, 30, 29]
    }
  ]
}

function createEquipmentStats(prefix: string, names: string[], runtimeBase: number, availBase: number): EquipmentStatRow[] {
  return names.map((name, index) => {
    const runtime = Math.max(120, runtimeBase + ((index * 37) % 180) - 60)
    const availability = Math.min(99.8, Math.max(82, availBase + ((index * 13) % 15) - 6))
    return {
      code: `${prefix}-${String(index + 1).padStart(3, '0')}`,
      name,
      runtime: `${runtime} h`,
      availability: `${availability.toFixed(1)}%`
    }
  })
}

/** 主要生产设备统计（按产线切换） */
const equipmentStatsData: Record<ProductionLineKey, EquipmentStatRow[]> = {
  smelting: createEquipmentStats(
    'SM',
    [
      '1#熔炼炉', '2#熔炼炉', '3#熔炼炉', '4#熔炼炉', '5#熔炼炉',
      '中频炉A', '中频炉B', '中频炉C', '保温炉1号', '保温炉2号',
      '加料车1号', '加料车2号', '扒渣机1号', '扒渣机2号', '测温仪1号',
      '测温仪2号', '除尘风机1号', '除尘风机2号', '冷却水泵1号', '冷却水泵2号',
      '液压站1号', '液压站2号', '炉前吊车1号', '炉前吊车2号', '原料称重秤',
      '合金料斗1号', '合金料斗2号', '废钢输送线', '炉衬打结机', '炉盖升降机',
      '烟气净化器', '余热回收装置', '出铁槽1号', '出铁槽2号', '流槽预热器',
      '电磁搅拌器', '真空脱气装置', '光谱分析仪', '直读光谱仪', '炉前取样器'
    ],
    680,
    94.5
  ),
  molding: createEquipmentStats(
    'MD',
    [
      '大件造型线', '中件造型线', '小件造型线', '静压造型线', '气冲造型线',
      '造型线1号', '造型线2号', '造型线3号', '造型线4号', '造型线5号',
      '射芯机1号', '射芯机2号', '射芯机3号', '制芯机1号', '制芯机2号',
      '制芯机3号', '制芯机4号', '混砂机1号', '混砂机2号', '旧砂再生机',
      '砂处理线', '输送皮带1号', '输送皮带2号', '输送皮带3号', '落砂机',
      '振动给料机', '磁选机', '筛砂机', '松砂机', '型砂试验仪',
      '模板更换装置', '合箱机', '下芯机械手', '压铁机', '翻箱机',
      '修型工作台', '涂料搅拌机', '烘干炉', '冷却通道', '砂箱堆垛机'
    ],
    620,
    93.2
  ),
  cleaning: createEquipmentStats(
    'CL',
    [
      '清理设备1号', '清理设备2号', '清理设备3号', '清理设备4号', '抛丸机1号',
      '抛丸机2号', '抛丸机3号', '抛丸机4号', '喷砂机1号', '喷砂机2号',
      '砂轮机1号', '砂轮机2号', '砂轮机3号', '切割机1号', '切割机2号',
      '打磨台1号', '打磨台2号', '打磨台3号', '打磨台4号', '气动工具站',
      '打磨机械手', '切割机械手', '除尘器1号', '除尘器2号', '除尘器3号',
      '输送辊道1号', '输送辊道2号', '料框吊具', '翻转台', '分拣台',
      '清洗机1号', '清洗机2号', '烘干线', '喷涂线', '烘干炉',
      '悬挂输送链', '积放链', '转运车', '废料收集器', '磁力分选器'
    ],
    590,
    92.8
  )
}

/** 设备异常处理明细（按异常时长降序） */
const abnormalRows: AbnormalRow[] = [
  { dept: '熔炼车间', device: '熔炼炉1号', issue: '电气故障', handler: '陈明', duration: '4.5h', time: '11-17 12:30' },
  { dept: '制芯车间', device: '制芯机2号', issue: '设备故障', handler: '张三', duration: '3.2h', time: '11-17 15:31' },
  { dept: '造型车间', device: '造型线1号', issue: '运行中断', handler: '李岩', duration: '2.5h', time: '11-17 15:26' },
  { dept: '造型车间', device: '造型线2号', issue: '压力不足', handler: '刘芳', duration: '2.0h', time: '11-17 13:45' },
  { dept: '熔炼车间', device: '熔炼炉3号', issue: '温度异常', handler: '王力', duration: '1.8h', time: '11-17 15:29' },
  { dept: '清理车间', device: '清理设备', issue: '振动异常', handler: '赵强', duration: '1.5h', time: '11-17 14:15' },
  { dept: '制芯车间', device: '制芯机1号', issue: '液压异常', handler: '周杰', duration: '1.2h', time: '11-16 11:20' },
  { dept: '造型车间', device: '造型线3号', issue: '传感器故障', handler: '吴涛', duration: '0.8h', time: '11-16 10:50' }
]

function parseDurationHours(duration: string): number {
  const matched = duration.match(/^([\d.]+)/)
  return matched ? Number(matched[1]) : 0
}

/** 异常时长最大在前 */
const sortedAbnormalRows = computed(() =>
  [...abnormalRows].sort((a, b) => parseDurationHours(b.duration) - parseDurationHours(a.duration))
)

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

/** 设备停机率分析：完成值曲线 + 目标值横向虚线 */
function createDowntimeAnalysisOption(data: DowntimeAnalysis): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const lines = params.map((p: any) => `${p.marker}${p.seriesName}: ${p.value}%`)
        return `${params[0].axisValue}<br/>${lines.join('<br/>')}`
      }
    },
    legend: {
      ...legendBase,
      data: ['完成值', '目标值'],
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
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '停机率 %',
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(72, 164, 194, 0.24)'
        }
      },
      axisLabel: {
        color: '#a9c9d4',
        fontSize: 10,
        formatter: '{value}%'
      },
      min: 0
    },
    series: [
      {
        name: '完成值',
        type: 'line',
        smooth: true,
        data: data.actual,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          width: 3,
          color: '#31d7ff',
          shadowColor: 'rgba(49, 215, 255, 0.45)',
          shadowBlur: 10
        },
        itemStyle: {
          color: '#31d7ff',
          borderWidth: 2,
          borderColor: '#061821'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(49, 215, 255, 0.28)' },
              { offset: 1, color: 'rgba(49, 215, 255, 0.02)' }
            ]
          }
        }
      },
      {
        name: '目标值',
        type: 'line',
        data: data.months.map((_, index) => ({
          value: data.target,
          label: {
            show: index === data.months.length - 1,
            position: 'insideEndTop',
            formatter: `目标 ${data.target}%`,
            color: '#ffd52a',
            fontSize: 11,
            backgroundColor: 'rgba(246, 189, 22, 0.16)',
            padding: [3, 6],
            borderRadius: 3
          }
        })),
        symbol: 'none',
        silent: true,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#ffd52a'
        },
        itemStyle: { color: '#ffd52a' },
        tooltip: { show: false }
      }
    ]
  } as EChartsOption
}

/** 设备MTBF / MTTR 折线分析：横轴月份，纵轴时间，三条产线 */
function createLineAnalysisOption(
  data: LineAnalysis,
  config: { yAxisName: string; valueUnit: string }
): EChartsOption {
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const lines = params.map((p: any) => `${p.marker}${p.seriesName}: ${p.value} ${config.valueUnit}`)
        return `${params[0].axisValue}<br/>${lines.join('<br/>')}`
      }
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
      data: data.months,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: config.yAxisName,
      nameTextStyle: { color: '#a9c9d4', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(72, 164, 194, 0.24)'
        }
      },
      axisLabel: { color: '#a9c9d4', fontSize: 10 },
      min: 0
    },
    series: data.series.map((item) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: item.data,
      lineStyle: {
        width: 3,
        color: item.color,
        shadowColor: `${item.color}66`,
        shadowBlur: 8
      },
      itemStyle: {
        color: item.color,
        borderWidth: 2,
        borderColor: '#061821'
      },
      /** 与设备停机率分析一致：曲线下方面积阴影 */
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${item.color}59` },
            { offset: 1, color: `${item.color}05` }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      }
    }))
  } as EChartsOption
}

/* =========================
   页面状态与交互
   ========================= */

const downtimeYearTabs: { key: DowntimeYearKey; label: string }[] = [
  { key: 'thisYear', label: '今年' },
  { key: 'lastYear', label: '去年' }
]

const downtimeYearKey = ref<DowntimeYearKey>('thisYear')

const productionLineTabs: { key: ProductionLineKey; label: string }[] = [
  { key: 'smelting', label: '熔炼' },
  { key: 'molding', label: '造型' },
  { key: 'cleaning', label: '清理' }
]

const productionLineKey = ref<ProductionLineKey>('smelting')

const equipmentStatsRows = computed(() => equipmentStatsData[productionLineKey.value])

const metricScopeTabs: { key: MetricScopeKey; label: string }[] = [
  { key: 'summary', label: '汇总' },
  { key: 'smelting', label: '熔炼' },
  { key: 'molding', label: '造型' },
  { key: 'cleaning', label: '清理' }
]

const scopeSeriesName: Record<MetricScopeKey, string | null> = {
  summary: null,
  smelting: '熔炼',
  molding: '造型',
  cleaning: '清理'
}

/** 汇总：三条产线按月取平均，合并为全车间一条曲线 */
function summarizeLineSeries(data: LineAnalysis): LineAnalysis {
  const months = data.months
  const monthsCount = months.length
  const summary = months.map((_, index) => {
    const total = data.series.reduce((sum, item) => sum + (item.data[index] ?? 0), 0)
    return Math.round((total / Math.max(data.series.length, 1)) * 10) / 10
  })
  return {
    months,
    series: [
      {
        name: '全车间',
        color: '#31d7ff',
        data: summary
      }
    ]
  }
}

function resolveLineSeries(data: LineAnalysis, scope: MetricScopeKey): LineAnalysis {
  if (scope === 'summary') return summarizeLineSeries(data)
  const name = scopeSeriesName[scope]
  return {
    months: data.months,
    series: data.series.filter((item) => item.name === name)
  }
}

const mtbfScopeKey = ref<MetricScopeKey>('summary')
const mttrScopeKey = ref<MetricScopeKey>('summary')

const equipmentCountOption = createEquipmentCountOption(equipmentDistribution)
const mtbfOption = computed(() =>
  createLineAnalysisOption(resolveLineSeries(mtbfAnalysisData, mtbfScopeKey.value), {
    yAxisName: '时',
    valueUnit: 'h'
  })
)
const mttrOption = computed(() =>
  createLineAnalysisOption(resolveLineSeries(mttrAnalysisData, mttrScopeKey.value), {
    yAxisName: '分',
    valueUnit: 'min'
  })
)
const downtimeAnalysisOption = computed(() =>
  createDowntimeAnalysisOption(downtimeAnalysisData[downtimeYearKey.value])
)
</script>

<template>
  <div class="dashboard-container">
    <DashboardHeader
      title="设备可视化大屏"
      weather="潍坊 18℃ 晴"
      variant="fui"
    />

    <!-- 设备总览指标：与人员大屏 top-indicators 统一 -->
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
          <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20">
            <path :d="item.iconPath" />
          </svg>
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

        <!-- 设备MTBF分析 -->
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
            <h3 class="panel-title">设备MTBF分析</h3>
            <div class="tab-buttons tab-buttons-compact">
              <button
                v-for="tab in metricScopeTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: mtbfScopeKey === tab.key }"
                @click="mtbfScopeKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="mtbfOption" />
          </div>
        </div>
      </div>

      <!-- 中间列 -->
      <div class="column">
        <!-- 设备停机率分析 -->
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
            <h3 class="panel-title">设备停机率分析</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in downtimeYearTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: downtimeYearKey === tab.key }"
                @click="downtimeYearKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="downtimeAnalysisOption" />
          </div>
        </div>

        <!-- 设备MTTR分析 -->
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
            <h3 class="panel-title">设备MTTR分析</h3>
            <div class="tab-buttons tab-buttons-compact">
              <button
                v-for="tab in metricScopeTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: mttrScopeKey === tab.key }"
                @click="mttrScopeKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <EChart :option="mttrOption" />
          </div>
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="column">
        <!-- 主要生产设备统计 -->
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
            <h3 class="panel-title">主要生产设备统计</h3>
            <div class="tab-buttons">
              <button
                v-for="tab in productionLineTabs"
                :key="tab.key"
                class="tab-button"
                :class="{ active: productionLineKey === tab.key }"
                @click="productionLineKey = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="equipment-table equipment-table-scroll table-autoscroll">
            <div class="table-autoscroll-head">
                            <table>
              <colgroup><col style="width:25.0%"><col style="width:25.0%"><col style="width:25.0%"><col style="width:25.0%"></colgroup><thead>
                                            <tr>
                                              <th>设备编号</th>
                                              <th>设备名称</th>
                                              <th>运行时长</th>
                                              <th>可动率</th>
                                            </tr>
                                          </thead></table>
            </div>
            <div class="table-autoscroll-viewport">
              <div class="table-autoscroll-track">
                                <table>
              <colgroup><col style="width:25.0%"><col style="width:25.0%"><col style="width:25.0%"><col style="width:25.0%"></colgroup><tbody>
                                              <tr
                                                v-for="(row, index) in equipmentStatsRows"
                                                :key="`${row.code}-${index}`"
                                              >
                                                <td>{{ row.code }}</td>
                                                <td>{{ row.name }}</td>
                                                <td>{{ row.runtime }}</td>
                                                <td>
                                                  <span
                                                    class="availability-rate"
                                                    :class="{
                                                      'availability-high': parseFloat(row.availability) >= 95,
                                                      'availability-mid': parseFloat(row.availability) >= 90 && parseFloat(row.availability) < 95,
                                                      'availability-low': parseFloat(row.availability) < 90
                                                    }"
                                                  >{{ row.availability }}</span>
                                                </td>
                                              </tr>
                                            </tbody></table>
                                <table aria-hidden="true">
              <colgroup><col style="width:25.0%"><col style="width:25.0%"><col style="width:25.0%"><col style="width:25.0%"></colgroup><tbody>
                                              <tr
                                                v-for="(row, index) in equipmentStatsRows"
                                                :key="`${row.code}-${index}`"
                                              >
                                                <td>{{ row.code }}</td>
                                                <td>{{ row.name }}</td>
                                                <td>{{ row.runtime }}</td>
                                                <td>
                                                  <span
                                                    class="availability-rate"
                                                    :class="{
                                                      'availability-high': parseFloat(row.availability) >= 95,
                                                      'availability-mid': parseFloat(row.availability) >= 90 && parseFloat(row.availability) < 95,
                                                      'availability-low': parseFloat(row.availability) < 90
                                                    }"
                                                  >{{ row.availability }}</span>
                                                </td>
                                              </tr>
                                            </tbody></table>
              </div>
            </div>
          </div>        </div>

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
          <div class="equipment-table table-autoscroll">
            <div class="table-autoscroll-head">
                            <table>
              <colgroup><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"></colgroup><thead>
                                            <tr>
                                              <th>部门车间</th>
                                              <th>设备名称</th>
                                              <th>异常类型</th>
                                              <th>处理人</th>
                                              <th>异常时长</th>
                                              <th>最近异常时间</th>
                                            </tr>
                                          </thead></table>
            </div>
            <div class="table-autoscroll-viewport">
              <div class="table-autoscroll-track">
                                <table>
              <colgroup><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"></colgroup><tbody>
                                              <tr v-for="(row, index) in sortedAbnormalRows" :key="`${row.device}-${index}`">
                                                <td>{{ row.dept }}</td>
                                                <td>{{ row.device }}</td>
                                                <td><span class="abnormal-issue">{{ row.issue }}</span></td>
                                                <td>{{ row.handler }}</td>
                                                <td><span class="abnormal-rate">{{ row.duration }}</span></td>
                                                <td>{{ row.time }}</td>
                                              </tr>
                                            </tbody></table>
                                <table aria-hidden="true">
              <colgroup><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"><col style="width:16.67%"></colgroup><tbody>
                                              <tr v-for="(row, index) in sortedAbnormalRows" :key="`${row.device}-${index}`">
                                                <td>{{ row.dept }}</td>
                                                <td>{{ row.device }}</td>
                                                <td><span class="abnormal-issue">{{ row.issue }}</span></td>
                                                <td>{{ row.handler }}</td>
                                                <td><span class="abnormal-rate">{{ row.duration }}</span></td>
                                                <td>{{ row.time }}</td>
                                              </tr>
                                            </tbody></table>
              </div>
            </div>
          </div>        </div>
      </div>
    </div>
  </div>
</template>

<style src="./dashboard-common.css"></style>
<style scoped>
.equipment-table { flex: 1; min-height: 0; overflow: hidden !important; }
.equipment-table-scroll {
  max-height: 280px;
  overscroll-behavior: contain;
}




.dashboard-container {
  width: 100%;
  height: 100%;
  /* 与人员/质量大屏一致 */
  padding: 10px !important;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;
  color: #dff8ff !important;
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
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
/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
  height: auto;
  min-height: calc(100vh - 310px);
}

.column {
  display: grid;
  grid-template-rows: 360px 360px;
  gap: 15px;
  min-width: 0;
  min-height: 0;
}

.column > .data-panel {
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
}

/* 数据面板样式：沿用生产可视化大屏 */
.dashboard-container .data-panel {
  height: 360px !important;
  min-height: 360px !important;
  max-height: 360px !important;
  box-sizing: border-box !important;
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
  white-space: nowrap;
  flex-shrink: 0;
}

.dashboard-container .data-panel .panel-title::after {
  content: '';
  display: inline-block;
  width: 18px;
  height: 1px;
  margin-left: 8px;
  vertical-align: middle;
  background: linear-gradient(90deg, #17cfff, transparent);
}

.dashboard-container .data-panel .panel-header:has(.tab-buttons) .panel-title::after {
  display: none;
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
.dashboard-container .data-panel .corner-br {
  display: block !important;
  width: 14px !important;
  height: 14px !important;
  border-color: #1bd5ff !important;
  filter: drop-shadow(0 0 4px rgba(27, 213, 255, 0.75));
  z-index: 10 !important;
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
  flex-shrink: 0;
}

.tab-button:first-child {
  border-radius: 4px 0 0 4px;
}

.tab-button:last-child {
  border-radius: 0 4px 4px 0;
}

.dashboard-container .tab-buttons-compact .tab-button {
  font-size: 10px;
  padding: 4px 6px;
  letter-spacing: 0;
}

.dashboard-container .data-panel .panel-header:has(.tab-buttons-compact) .panel-title {
  font-size: 13px;
  letter-spacing: 0;
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

.equipment-table-scroll {
  max-height: 280px;
  overscroll-behavior: contain;
}





.abnormal-rate {
  color: #ff5f87;
  font-weight: bold;
}

.availability-rate {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.availability-high {
  color: #4ee6a6;
}

.availability-mid {
  color: #ffd52a;
}

.availability-low {
  color: #ff5f87;
}

.abnormal-issue {
  color: #ff5f87;
  font-weight: 500;
}





/* 响应式设计 */
@media (max-width: 1500px) {
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
}

@media (max-width: 768px) {
}

@media (max-width: 480px) {
}

</style>
