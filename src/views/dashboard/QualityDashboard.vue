<template>
  <div class="quality-dashboard">
    <!-- 大屏标题 -->
    <DashboardHeader title="材料成型中心工业园区质量监管大屏" />

    <!-- 数据指标（单独一行） -->
    <div class="kpi-row">
      <div class="kpi-box" v-for="k in kpiItems" :key="k.label">
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-value">
          {{ k.value }}<span class="kpi-unit">{{ k.unit }}</span>
        </div>
      </div>
    </div>

    <div class="quality-grid">
      <!-- 第一行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">铸件综合废品率</span>
          <select v-model="scrapScope" class="series-select">
            <option value="factory">厂区统计</option>
            <option value="line">产线统计</option>
            <option value="material">材质统计</option>
          </select>
        </div>
        <div ref="scrapChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">主要产品废品率</span>
          <select v-model="productScrapType" class="series-select">
            <option value="comprehensive">综合废品率</option>
            <option value="external">外部废品率</option>
            <option value="internal">内部废品率</option>
          </select>
        </div>
        <div ref="productScrapChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">铸件刷镀率</span>
        </div>
        <div ref="silverChartRef" class="chart-body"></div>
      </div>

      <!-- 第二行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">吨均废品损失</span>
          <select v-model="lossScope" class="series-select">
            <option value="factory">厂区</option>
            <option value="line">产线</option>
            <option value="material">材质</option>
            <option value="product">主要产品系列</option>
          </select>
        </div>
        <div ref="lossChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">成品检验分析</span>
          <select v-model="repairLine" class="series-select">
            <option v-for="l in repairLineOptions" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div ref="repairChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">试车故障率 ppm</span>
          <div class="mini-tabs">
            <button :class="{ active: faultMode === 'factory' }" @click="faultMode = 'factory'">专业厂</button>
            <button :class="{ active: faultMode === 'line' }" @click="faultMode = 'line'">产线</button>
          </div>
        </div>
        <div ref="faultChartRef" class="chart-body"></div>
      </div>

      <!-- 第三行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">过程检验分析</span>
        </div>
        <div ref="processChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">异常数据分析</span>
          <select v-model="abnormalPeriod" class="series-select">
            <option value="day">按天</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
          </select>
        </div>
        <div ref="abnormalChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">工艺变更分析</span>
        </div>
        <div class="verify-grid">
          <div class="verify-box" v-for="v in verifyItems" :key="v.label">
            <div class="verify-label">{{ v.label }}</div>
            <div class="verify-value">
              {{ v.value }}<span class="verify-unit">{{ v.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 过程检验分析 - 当月各模块弹框 -->
    <div v-if="processModalVisible" class="q-modal-mask" @click.self="processModalVisible = false">
      <div class="q-modal">
        <div class="q-modal-header">
          <span class="q-modal-title">{{ processModalMonth }}各模块过程检验数据</span>
          <button class="q-modal-close" @click="processModalVisible = false">✕</button>
        </div>
        <div ref="processModalChartRef" class="q-modal-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 图表DOM与实例 ==========
const scrapChartRef = ref<HTMLElement>()
const productScrapChartRef = ref<HTMLElement>()
const silverChartRef = ref<HTMLElement>()
const lossChartRef = ref<HTMLElement>()
const repairChartRef = ref<HTMLElement>()
const faultChartRef = ref<HTMLElement>()
const processChartRef = ref<HTMLElement>()
const abnormalChartRef = ref<HTMLElement>()
const processModalChartRef = ref<HTMLElement>()
let processModalChart: echarts.ECharts | null = null
const processModalVisible = ref(false)
const processModalMonth = ref('1月')
const charts: Record<string, echarts.ECharts> = {}

// ========== 数据指标 ==========
const kpiItems = [
  { label: '铸件综合废品率', value: '1.28', unit: '%' },
  { label: '铸件吨均废品损失', value: '492.00', unit: '元/吨' },
  { label: '铸件试车故障率', value: '1.05', unit: '%' },
  { label: '检验一次合格率', value: '98.62', unit: '%' },
  { label: '过程检验合格率', value: '99.15', unit: '%' }
]

// ========== 状态 ==========
const scrapScope = ref('factory')
const productScrapType = ref('comprehensive')
const lossScope = ref('factory')
const repairLine = ref('造型一线大件')
const faultMode = ref<'factory' | 'line'>('factory')

const repairLineOptions = [
  '造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线HWS', '造型三线KW'
]

// 材质选项
const materialOptions = ['HT250', 'HT300', 'RuT450', 'QT600', '合金铸铁']

// ========== 模拟数据 ==========
const years3 = ['2024', '2025', '2026']
const colors3 = ['#4472c4', '#3ba8a0', '#70ad47']
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 10 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

const legend3 = {
  data: years3, top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9
}

// 通用分组柱状图配置
const groupedBarOption = (x: string[], data: number[][], unitFormatter = false) => ({
  tooltip: {
    trigger: 'axis',
    valueFormatter: unitFormatter ? (v: any) => v + '%' : undefined
  },
  legend: legend3,
  grid: { left: 44, right: 10, top: 30, bottom: 26 },
  xAxis: { type: 'category', data: x, ...baseAxis, splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9, rotate: x.length > 5 ? 20 : 0 } },
  yAxis: { type: 'value', ...baseAxis, axisLabel: { ...baseAxis.axisLabel, formatter: unitFormatter ? '{value}%' : '{value}' } },
  series: years3.map((y, i) => ({
    name: y, type: 'bar', data: data[i], barWidth: 10,
    itemStyle: { color: colors3[i] }
  }))
})

// 铸件综合废品率（厂区 / 产线 / 材质）
const scrapData: Record<string, number[][]> = {
  factory: [
    [1.0, 1.9, 1.5],
    [1.2, 1.7, 1.5],
    [1.25, 1.6, 1.4]
  ],
  line: [
    [1.1, 1.6, 1.3, 1.8, 1.5, 1.2],
    [1.3, 1.8, 1.5, 1.6, 1.4, 1.3],
    [1.2, 1.5, 1.4, 1.5, 1.6, 1.2]
  ],
  material: [
    [1.05, 1.32, 1.48, 1.18, 1.62],
    [1.18, 1.45, 1.62, 1.28, 1.75],
    [1.12, 1.38, 1.55, 1.22, 1.68]
  ]
}
const scrapX: Record<string, string[]> = {
  factory: ['安丘厂区', '寒亭厂区', '材料成型中心'],
  line: ['造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线HWS', '造型三线KW'],
  material: materialOptions
}

function renderScrap() {
  charts.scrap?.setOption(groupedBarOption(scrapX[scrapScope.value], scrapData[scrapScope.value], true), { notMerge: true })
}

// 主要产品废品率（综合 / 外部 / 内部）
const productX = ['WP12', 'WP13', 'WP10/WD615', 'WP10.5H', 'WP15', 'WP6', 'WP12T', 'WP2.3']
const productScrapData: Record<string, number[][]> = {
  comprehensive: [
    [1.02, 1.12, 1.06, 1.09, 1.03, 1.07, 1.05, 1.08],
    [1.12, 1.06, 1.09, 1.06, 1.08, 1.05, 1.07, 1.06],
    [1.05, 1.02, 1.04, 1.03, 1.06, 1.04, 1.02, 1.05]
  ],
  external: [
    [0.42, 0.48, 0.45, 0.46, 0.44, 0.47, 0.45, 0.46],
    [0.48, 0.44, 0.47, 0.45, 0.46, 0.44, 0.46, 0.45],
    [0.45, 0.43, 0.44, 0.43, 0.45, 0.44, 0.43, 0.44]
  ],
  internal: [
    [0.60, 0.64, 0.61, 0.63, 0.59, 0.60, 0.60, 0.62],
    [0.64, 0.62, 0.62, 0.61, 0.62, 0.61, 0.61, 0.61],
    [0.60, 0.59, 0.60, 0.60, 0.61, 0.60, 0.59, 0.61]
  ]
}
function renderProductScrap() {
  charts.productScrap?.setOption({
    ...groupedBarOption(productX, productScrapData[productScrapType.value], true),
    grid: { left: 44, right: 10, top: 30, bottom: 34 },
    xAxis: {
      type: 'category', data: productX, ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9, rotate: 25 }
    }
  }, { notMerge: true })
}

// 铸件刷银率
const silverX = ['造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线HWS', '造型三线KW']
const silverData = [
  [1.0, 1.08, 1.06, 1.09, 1.07, 1.08],
  [1.15, 1.12, 1.1, 1.13, 1.11, 1.12],
  [1.02, 1.04, 1.05, 1.06, 1.04, 1.02]
]

// 吨均废品损失（元/吨）
const lossLineX = ['造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线HWS', '造型三线KW']
const lossX: Record<string, string[]> = {
  factory: ['安丘厂区', '寒亭厂区', '材料成型中心'],
  line: lossLineX,
  material: materialOptions,
  product: productX
}
const lossData: Record<string, number[][]> = {
  factory: [
    [2950, 3100, 3050],
    [2980, 3150, 3080],
    [3050, 3120, 3100]
  ],
  line: [
    [2860, 3120, 3050, 2780, 3240, 2980],
    [2940, 3180, 3110, 2850, 3300, 3040],
    [2900, 3150, 3080, 2810, 3270, 3010]
  ],
  material: [
    [2880, 3120, 3260, 3050, 3480],
    [2950, 3200, 3340, 3120, 3560],
    [2910, 3160, 3300, 3080, 3520]
  ],
  product: [
    [2960, 3020, 2880, 3110, 3240, 2790, 3050, 3170],
    [3040, 3100, 2950, 3190, 3320, 2860, 3120, 3250],
    [3000, 3060, 2910, 3150, 3280, 2820, 3080, 3210]
  ]
}
function renderLoss() {
  const scope = lossScope.value
  const needRotate = scope === 'product' || scope === 'material' || scope === 'line'
  charts.loss?.setOption({
    ...groupedBarOption(lossX[scope], lossData[scope]),
    grid: { left: 56, right: 10, top: 34, bottom: needRotate ? 40 : 26 },
    xAxis: {
      type: 'category', data: lossX[scope], ...baseAxis, splitLine: { show: false },
      axisLabel: {
        ...baseAxis.axisLabel, interval: 0, fontSize: 9,
        rotate: scope === 'product' ? 25 : (scope === 'line' ? 20 : 0)
      }
    },
    yAxis: {
      type: 'value', ...baseAxis,
      name: '元/吨', nameTextStyle: { color: '#666', fontSize: 11, padding: [0, 0, 4, 0] }
    }
  }, { notMerge: true })
}

// 成品检验分析（三条曲线）
const genRepairData = (lineName: string) => {
  const seed = lineName.length + lineName.charCodeAt(0)
  const gen = (base: number, amp: number) => months.map((_, i) =>
    Math.round(base + Math.sin(seed * 0.7 + i * 0.8) * amp + Math.cos(seed + i * 0.5) * amp * 0.6))
  return {
    '返工率': gen(150, 45),
    '内部报废率': gen(120, 40),
    '检验一次合格率': gen(170, 35)
  }
}
function renderRepair() {
  const d = genRepairData(repairLine.value)
  charts.repair?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['返工率', '内部报废率', '检验一次合格率'], top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8 },
    grid: { left: 44, right: 16, top: 30, bottom: 26 },
    xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', max: 260, ...baseAxis },
    series: (['返工率', '内部报废率', '检验一次合格率'] as const).map((name, i) => ({
      name, type: 'line', smooth: true, symbol: 'none',
      data: d[name], itemStyle: { color: ['#4472c4', '#3ba8a0', '#70ad47'][i] }, lineStyle: { width: 1.5 }
    }))
  }, { notMerge: true })
}

// 试车故障率 ppm
const faultXFactory = ['一号厂', '二号厂', '三号厂', '四号厂', '燃气动力', '博杜安', '材料成型中心']
const faultXLine = ['造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线KW', '造型三线HWS']
const faultDataFactory = [
  [1.0, 1.08, 1.05, 1.1, 1.06, 1.08, 1.12],
  [1.1, 1.05, 1.08, 1.04, 1.09, 1.05, 1.06],
  [1.0, 1.02, 1.03, 1.01, 1.04, 1.02, 1.0]
]
const faultDataLine = [
  [1.12, 1.05, 1.15, 0.98, 1.06, 1.1],
  [1.08, 1.02, 1.1, 0.95, 1.04, 1.08],
  [1.0, 0.98, 1.05, 0.92, 1.02, 1.03]
]
function renderFault() {
  const isFactory = faultMode.value === 'factory'
  const opt = groupedBarOption(isFactory ? faultXFactory : faultXLine, isFactory ? faultDataFactory : faultDataLine, true)
  charts.fault?.setOption(opt, { notMerge: true })
}

// ========== 过程检验分析 ==========
const processSeriesNames = ['过程检验数量', '已检验数量', '合格数']
const processSeriesColors = ['#4472c4', '#5ec4d4', '#70ad47']
// 各月数据（按 series 顺序：过程检验数量 / 已检验数量 / 合格数）
const processData = [
  [1580, 1620, 1550, 1680, 1720, 1650, 1590, 1700, 1740, 1660, 1610, 1690],
  [1520, 1560, 1490, 1610, 1660, 1580, 1530, 1640, 1680, 1600, 1550, 1630],
  [1505, 1546, 1474, 1596, 1645, 1565, 1516, 1626, 1665, 1585, 1535, 1616]
]
// 弹框：各模块与拆分比例
const processModules = ['造型', '制芯', '清理', '混砂']
const processModuleRatios = [0.38, 0.27, 0.21, 0.14]

function renderProcess() {
  charts.process?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: processSeriesNames, top: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 12, itemHeight: 8
    },
    grid: { left: 48, right: 12, top: 32, bottom: 34 },
    xAxis: {
      type: 'category', data: months, ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9, rotate: 30 }
    },
    yAxis: { type: 'value', name: '数量', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
    series: processSeriesNames.map((name, i) => ({
      name, type: 'bar', data: processData[i], barWidth: 7,
      itemStyle: { color: processSeriesColors[i] }
    }))
  }, { notMerge: true })
  charts.process?.off('click')
  charts.process?.on('click', (params: any) => openProcessModal(params.name))
}

function openProcessModal(monthName: string) {
  processModalMonth.value = monthName
  processModalVisible.value = true
}

watch(processModalVisible, (v) => {
  if (!v) return
  nextTick(() => {
    if (!processModalChartRef.value) return
    if (processModalChart) processModalChart.dispose()
    processModalChart = echarts.init(processModalChartRef.value)
    const idx = months.indexOf(processModalMonth.value)
    const safeIdx = idx >= 0 ? idx : 0
    const moduleData = processData.map(row =>
      processModuleRatios.map(r => Math.round(row[safeIdx] * r))
    )
    processModalChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        data: processSeriesNames, top: 0,
        textStyle: { color: '#666', fontSize: 11 }, itemWidth: 14, itemHeight: 9
      },
      grid: { left: 58, right: 24, top: 40, bottom: 30 },
      xAxis: {
        type: 'category', data: processModules, ...baseAxis,
        splitLine: { show: false },
        axisLabel: { ...baseAxis.axisLabel, fontSize: 11 }
      },
      yAxis: { type: 'value', name: '数量', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
      series: processSeriesNames.map((name, i) => ({
        name, type: 'bar', data: moduleData[i], barWidth: 20,
        itemStyle: { color: processSeriesColors[i] },
        label: { show: true, position: 'top', color: '#666', fontSize: 10 }
      }))
    }, { notMerge: true })
  })
})

// ========== 异常数据分析 ==========
const abnormalPeriod = ref<'day' | 'week' | 'month'>('day')
const abnormalLines = [
  '造型一线大件', '造型一线中件', '造型二线大件',
  '造型二线中件', '造型三线HWS', '造型三线KW'
]
const abnormalData: Record<string, number[]> = {
  day: [18, 12, 26, 9, 21, 15],
  week: [126, 88, 174, 62, 143, 105],
  month: [542, 386, 728, 271, 615, 448]
}

function renderAbnormal() {
  const data = abnormalData[abnormalPeriod.value] || abnormalData.day
  const maxVal = Math.max(...data)
  charts.abnormal?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 48, right: 14, top: 24, bottom: 42 },
    xAxis: {
      type: 'category', data: abnormalLines, ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9, rotate: 30 }
    },
    yAxis: {
      type: 'value', max: Math.ceil(maxVal * 1.15),
      name: '数量', nameTextStyle: { color: '#666', fontSize: 10 },
      ...baseAxis
    },
    series: [{
      type: 'bar', data, barWidth: 22,
      itemStyle: { color: '#ed7d31' },
      label: { show: true, position: 'top', color: '#666', fontSize: 10 }
    }]
  }, { notMerge: true })
}

// ========== 工艺变更分析（验证计划指标） ==========
const verifyItems = [
  { label: '验证计划总数量', value: '128', unit: '项' },
  { label: '进行中数量', value: '32', unit: '项' },
  { label: '待验证数量', value: '45', unit: '项' },
  { label: '已封闭数量', value: '51', unit: '项' }
]

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderScrap()
  renderProductScrap()
  charts.silver?.setOption(groupedBarOption(silverX, silverData, true), { notMerge: true })
  renderLoss()
  renderRepair()
  renderFault()
  renderProcess()
  renderAbnormal()
}

const handleResize = () => {
  Object.values(charts).forEach(c => c.resize())
  processModalChart?.resize()
}

onMounted(async () => {
  await nextTick()
  initChart(scrapChartRef.value, 'scrap')
  initChart(productScrapChartRef.value, 'productScrap')
  initChart(silverChartRef.value, 'silver')
  initChart(lossChartRef.value, 'loss')
  initChart(repairChartRef.value, 'repair')
  initChart(faultChartRef.value, 'fault')
  initChart(processChartRef.value, 'process')
  initChart(abnormalChartRef.value, 'abnormal')
  renderAll()
  window.addEventListener('resize', handleResize)
})

watch([scrapScope], renderScrap)
watch([productScrapType], renderProductScrap)
watch([lossScope], renderLoss)
watch([repairLine], renderRepair)
watch([faultMode], renderFault)
watch([abnormalPeriod], renderAbnormal)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
  processModalChart?.dispose()
})
</script>

<style scoped>
.quality-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}


/* 数据指标 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.kpi-box {
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-left: 3px solid #4472c4;
  border-radius: 4px;
  padding: 10px 12px;
}

.kpi-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.1;
  white-space: nowrap;
}

.kpi-unit {
  font-size: 12px;
  font-weight: 400;
  color: #888;
  margin-left: 4px;
}

/* 待生成模块占位 */
.module-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 12px;
  letter-spacing: 2px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
}

/* 工艺变更分析 - 验证计划指标 */
.verify-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  height: 195px;
  align-content: center;
}

.verify-box {
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-left: 3px solid #4472c4;
  border-radius: 4px;
  padding: 10px 12px;
  min-width: 0;
}

.verify-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verify-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.1;
  white-space: nowrap;
}

.verify-unit {
  font-size: 11px;
  font-weight: 400;
  color: #888;
  margin-left: 4px;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.chart-header {
  margin-bottom: 4px;
}
.chart-body {
  height: 195px;
}

/* 弹框 */
.q-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-modal {
  background: #fff;
  border-radius: 6px;
  width: 780px;
  max-width: 92vw;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}

.q-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #e8e8e8;
}

.q-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.q-modal-close {
  border: none;
  background: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}

.q-modal-close:hover {
  color: #333;
}

.q-modal-chart {
  height: 400px;
  padding: 12px;
}
</style>
