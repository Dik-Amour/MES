<template>
  <div class="quality-dashboard">
    <!-- 大屏标题 -->
    <div class="screen-title">材料成型中心工业园区质量监管大屏</div>

    <div class="quality-grid">
      <!-- 第一行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">铸件综合废品率</span>
          <select v-model="scrapScope" class="series-select">
            <option value="factory">厂区统计</option>
            <option value="line">产线统计</option>
          </select>
        </div>
        <div ref="scrapChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">主要产品废品率</span>
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
        </div>
        <div ref="lossChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">返修焊补分析</span>
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
          <span class="chart-title">熔炼靶心率分析</span>
        </div>
        <div ref="hitRateChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">熔炼退火率</span>
        </div>
        <div ref="annealChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">熔炼凉火率</span>
        </div>
        <div ref="coolChartRef" class="chart-body"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

// ========== 图表DOM与实例 ==========
const scrapChartRef = ref<HTMLElement>()
const productScrapChartRef = ref<HTMLElement>()
const silverChartRef = ref<HTMLElement>()
const lossChartRef = ref<HTMLElement>()
const repairChartRef = ref<HTMLElement>()
const faultChartRef = ref<HTMLElement>()
const hitRateChartRef = ref<HTMLElement>()
const annealChartRef = ref<HTMLElement>()
const coolChartRef = ref<HTMLElement>()
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const scrapScope = ref('factory')
const repairLine = ref('造型一线大件')
const faultMode = ref<'factory' | 'line'>('factory')

const repairLineOptions = [
  '造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线HWS', '造型三线KW'
]

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

// 铸件综合废品率
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
  ]
}
const scrapX: Record<string, string[]> = {
  factory: ['安丘厂区', '寒亭厂区', '材料成型中心'],
  line: ['造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线HWS', '造型三线KW']
}

function renderScrap() {
  charts.scrap?.setOption(groupedBarOption(scrapX[scrapScope.value], scrapData[scrapScope.value], true), { notMerge: true })
}

// 主要产品废品率（2025/2026 两年，横坐标取自系列编号）
const productX = ['WP12', 'WP13', 'WP10/WD615', 'WP10.5H', 'WP15', 'WP6', 'WP12T', 'WP2.3']
const productData = [
  [1.0, 1.1, 1.05, 1.08, 1.02, 1.06, 1.04, 1.07],
  [1.1, 1.05, 1.08, 1.05, 1.07, 1.04, 1.06, 1.05]
]
function renderProductScrap() {
  charts.productScrap?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + '%' },
    legend: { data: ['2025', '2026'], top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 44, right: 10, top: 30, bottom: 26 },
    xAxis: { type: 'category', data: productX, ...baseAxis, splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9, rotate: 25 } },
    yAxis: { type: 'value', max: 1.2, ...baseAxis, axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' } },
    series: [
      { name: '2025', type: 'bar', data: productData[0], barWidth: 10, itemStyle: { color: '#4472c4' } },
      { name: '2026', type: 'bar', data: productData[1], barWidth: 10, itemStyle: { color: '#3ba8a0' } }
    ]
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
const lossX = ['安丘厂区', '寒亭厂区', '材料成型中心']
const lossData = [
  [2950, 3100, 3050],
  [2980, 3150, 3080],
  [3050, 3120, 3100]
]
function renderLoss() {
  charts.loss?.setOption({
    ...groupedBarOption(lossX, lossData),
    yAxis: {
      type: 'value', ...baseAxis,
      name: '元/吨', nameTextStyle: { color: '#666', fontSize: 11, padding: [0, 0, 4, 0] }
    },
    grid: { left: 52, right: 10, top: 34, bottom: 26 }
  }, { notMerge: true })
}

// 返修焊补分析（三条曲线）
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

// 熔炼三项（靶心率/退火率/凉火率）
const meltX = ['熔炼一线', '熔炼二线', '熔炼三线']
const meltData = {
  hitRate: [
    [0.2, 0.1, 0.1],
    [0.2, 0.3, 0.1],
    [0.3, 0.4, 0.3]
  ],
  anneal: [
    [0.2, 0.1, 0.1],
    [0.2, 0.3, 0.1],
    [0.3, 0.4, 0.3]
  ],
  cool: [
    [0.2, 0.1, 0.1],
    [0.2, 0.3, 0.1],
    [0.3, 0.4, 0.3]
  ]
}
const renderMelt = (key: 'hitRate' | 'anneal' | 'cool') => {
  charts[key]?.setOption(groupedBarOption(meltX, meltData[key], true), { notMerge: true })
}

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
  renderMelt('hitRate')
  renderMelt('anneal')
  renderMelt('cool')
}

const handleResize = () => Object.values(charts).forEach(c => c.resize())

onMounted(async () => {
  await nextTick()
  initChart(scrapChartRef.value, 'scrap')
  initChart(productScrapChartRef.value, 'productScrap')
  initChart(silverChartRef.value, 'silver')
  initChart(lossChartRef.value, 'loss')
  initChart(repairChartRef.value, 'repair')
  initChart(faultChartRef.value, 'fault')
  initChart(hitRateChartRef.value, 'hitRate')
  initChart(annealChartRef.value, 'anneal')
  initChart(coolChartRef.value, 'cool')
  renderAll()
  window.addEventListener('resize', handleResize)
})

watch([scrapScope], renderScrap)
watch([repairLine], renderRepair)
watch([faultMode], renderFault)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.quality-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
}

.screen-title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  padding: 8px 0 12px;
  border: 1px solid #eee;
  margin-bottom: 8px;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.chart-card {
  background: #f2f2f2;
  border-radius: 4px;
  padding: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chart-title {
  background: #fff;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  border-radius: 2px;
}

.legend-dots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
  background: #fff;
  padding: 1px 6px;
  border-radius: 2px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: #4472c4;
}

.mini-tabs {
  display: flex;
  gap: 4px;
}

.mini-tabs button {
  border: none;
  background: #fff;
  color: #4472c4;
  font-size: 12px;
  padding: 2px 10px;
  cursor: pointer;
  border-radius: 2px;
}

.mini-tabs button.active {
  background: #4472c4;
  color: #fff;
}

.series-select {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  color: #333;
  background: #fff;
}

.chart-body {
  height: 195px;
}
</style>
