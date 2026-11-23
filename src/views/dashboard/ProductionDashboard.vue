<template>
  <div class="production-dashboard">
    <!-- 大屏标题 -->
    <DashboardHeader title="材料成型中心运营大屏" :show-weather="false" variant="fui" show-nav />

    <!-- 指标行（120px） -->
    <div class="prod-metrics">
      <div class="prod-metric-card" v-for="m in topMetrics" :key="m.label">
        <div class="prod-metric-content">
          <div class="prod-metric-label">{{ m.label }}</div>
          <div class="prod-metric-value">
            {{ m.value }}<span v-if="m.unit" class="prod-metric-unit">{{ m.unit }}</span>
          </div>
          <div v-if="m.sub" class="prod-metric-sub">{{ m.sub }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">产线生产分析</span>
            <select v-model="planLine" class="series-select">
              <option v-for="name in planLineOptions" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <div ref="planOutputChartRef" class="chart-body"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">厂区出入库统计</span>
            <div class="mini-tabs">
              <button :class="{ active: factoryMode === 'month' }" @click="factoryMode = 'month'">当月</button>
              <button :class="{ active: factoryMode === 'year' }" @click="factoryMode = 'year'">当年</button>
            </div>
          </div>
          <div ref="factoryChartRef" class="chart-body"></div>
        </div>
      </div>

      <!-- 中列：第二行为产线吨位占比（第二行第二列） -->
      <div class="col center-col">
        <div class="chart-card annual-card">
          <div class="chart-header">
            <span class="chart-title">年度生产统计</span>
            <select v-model="annualLine" class="series-select">
              <option v-for="name in planLineOptions" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <div ref="annualChartRef" class="chart-body annual-body"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">产线吨位占比</span>
            <div class="mini-tabs">
              <button :class="{ active: tonnageMode === 'prod' }" @click="tonnageMode = 'prod'">出产</button>
              <button :class="{ active: tonnageMode === 'in' }" @click="tonnageMode = 'in'">入库</button>
            </div>
          </div>
          <div ref="tonnageChartRef" class="chart-body"></div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="col right-col">
        <div class="right-scroll">
          <div class="chart-card" v-for="line in lineDetailConfigs" :key="line.key">
            <div class="chart-header">
              <span class="chart-title">{{ line.title }}</span>
              <div class="mini-tabs">
                <button
                  v-for="tab in line.tabs"
                  :key="tab.key"
                  :class="{ active: lineDetailModes[line.key] === tab.key }"
                  @click="lineDetailModes[line.key] = tab.key"
                >{{ tab.label }}</button>
              </div>
            </div>
            <div class="chart-header sub">
              <select v-model="lineDetailSeries[line.key]" class="series-select">
                <option value="">产品系列</option>
                <option v-for="s in seriesOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div :ref="el => setLineChartRef(line.key, el)" class="chart-body line-body"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹框已随产线出入库/年度统计合并移除 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

const seriesOptions = ['WP12', 'WP13']

/** 指标行：原中间区 6 项指标 */
const topMetrics = [
  { label: '当月出产', value: '731.2', unit: '吨', sub: '同比：4.5%　环比：-2.3%' },
  { label: '当月入库', value: '731.2', unit: '吨', sub: '同比：3.8%　环比：1.6%' },
  { label: '年度出产', value: '339,200', unit: '吨', sub: '' },
  { label: '年度入库', value: '339,200', unit: '吨', sub: '' },
  { label: '在制品数', value: '339,200', unit: '件', sub: '' },
  { label: '成品数', value: '339,200', unit: '件', sub: '' }
]

// ========== 图表实例与DOM ==========
const planOutputChartRef = ref<HTMLElement>()
const factoryChartRef = ref<HTMLElement>()
const tonnageChartRef = ref<HTMLElement>()
const annualChartRef = ref<HTMLElement>()
const lineChartRefs: Record<string, HTMLElement | null> = {}
const setLineChartRef = (key: string, el: any) => { lineChartRefs[key] = el }

const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const factoryMode = ref<'month' | 'year'>('month')
const tonnageMode = ref<'prod' | 'in'>('prod')
/** 年度出产统计：产线下拉 */
const annualLine = ref('')

// 计划&出产&投料分析：产线下拉（与首页生产分析一致）
const planLineOptions = [
  '造型一线大件',
  '造型一线中件',
  '造型二线大件',
  '造型二线中件',
  '造型三线KW',
  '造型三线HWS',
  '造型四线大件（安丘）',
  '造型四线中件（安丘）'
]
const planLine = ref(planLineOptions[0])
annualLine.value = planLineOptions[0]

/** 近7天标签（MM-DD，含今天） */
const planDays = (() => {
  const now = new Date()
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    labels.push(
      `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
  }
  return labels
})()

/** 按产线名生成近7天 计划 / 出产 / 投料 mock */
function buildPlanOutputSeries(line: string) {
  let seed = 0
  for (let i = 0; i < line.length; i++) seed = (seed * 31 + line.charCodeAt(i)) >>> 0
  const plan: number[] = []
  const output: number[] = []
  const feed: number[] = []
  for (let day = 0; day < 7; day++) {
    const base = 70 + ((seed >> (day * 3)) % 40)
    const p = base + (day % 3) * 5
    const o = Math.round(p * (0.82 + ((seed + day * 17) % 18) / 100))
    const f = Math.round(o * (1.05 + ((seed + day * 11) % 12) / 100))
    plan.push(p)
    output.push(o)
    feed.push(f)
  }
  return { plan, output, feed }
}

const lineDetailModes = reactive<Record<string, string>>({
  'line1': 'line1-large',
  'line2': 'line2-large',
  'line3': 'line3-hws',
  'line4': 'line4-large'
})
const lineDetailSeries = reactive<Record<string, string>>({ 'line1': '', 'line2': '', 'line3': '', 'line4': '' })

const lineDetailConfigs = [
  {
    key: 'line1', title: '造型一线生产详情',
    tabs: [{ key: 'line1-large', label: '造型一线大件' }, { key: 'line1-medium', label: '造型一线中件' }]
  },
  {
    key: 'line2', title: '造型二线生产详情',
    tabs: [{ key: 'line2-large', label: '造型二线大件' }, { key: 'line2-medium', label: '造型二线中件' }]
  },
  {
    key: 'line3', title: '造型三线生产详情',
    tabs: [{ key: 'line3-hws', label: '造型三线HWS' }, { key: 'line3-kw', label: '造型三线KW' }]
  },
  {
    key: 'line4', title: '造型四线生产详情',
    tabs: [{ key: 'line4-large', label: '造型四线大件' }, { key: 'line4-medium', label: '造型四线中件' }]
  }
]

// ========== 模拟数据 ==========
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

/** 年度出产统计：按产线生成近12月 出产 / 入库 mock */
function buildAnnualInOut(line: string) {
  let seed = 0
  for (let i = 0; i < line.length; i++) seed = (seed * 31 + line.charCodeAt(i)) >>> 0
  const prod: number[] = []
  const inbound: number[] = []
  for (let m = 0; m < 12; m++) {
    const base = 100 + ((seed >> (m * 2)) % 80)
    const p = base + (m % 4) * 8
    const inboundV = Math.round(p * (0.88 + ((seed + m * 13) % 20) / 100))
    prod.push(p)
    inbound.push(inboundV)
  }
  return { prod, inbound }
}

// 厂区出入库统计
const factoryNames = ['工业园区出产', '工业园区入库', '安丘厂区出产', '安丘厂区入库', '曲轴箱出产', '曲轴箱入库']
const factoryData = {
  month: {
    names: [...factoryNames].reverse(),
    values: [2000, 2600, 4100, 1900, 2400, 3600].reverse()
  },
  year: {
    names: [...factoryNames].reverse(),
    values: [24000, 31000, 48000, 23000, 28500, 42000].reverse()
  }
}

// 产线吨位占比
const tonnageData = {
  prod: [
    { name: '造型一线', value: 100 },
    { name: '造型二线', value: 150 },
    { name: '造型三线', value: 153 },
    { name: '造型四线', value: 154 }
  ],
  in: [
    { name: '造型一线', value: 120 },
    { name: '造型二线', value: 160 },
    { name: '造型三线', value: 140 },
    { name: '造型四线', value: 130 }
  ]
}

// 各产线生产详情（月度曲线，2025/2026两年）
const genLineData = (seed: number) => {
  const base2025 = [150, 158, 235, 160, 150, 165, 155, 168, 172, 190, 178, 150]
  const base2026 = [105, 175, 230, 100, 165, 180, 168, 150, 178, 190, 215, 152]
  const jitter = (arr: number[]) => arr.map((v, i) => Math.max(60, Math.round(v + Math.sin(seed + i) * 25)))
  return { '2025': jitter(base2025), '2026': jitter(base2026) }
}
const lineDetailData: Record<string, any> = {}
lineDetailConfigs.forEach(cfg => {
  cfg.tabs.forEach(tab => {
    lineDetailData[`${cfg.key}::${tab.key}`] = genLineData(tab.key.length + cfg.key.charCodeAt(0))
  })
})

// ========== 图表配置 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 11 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

// 统一单位：吨
const TON_UNIT = '吨'
const tons = (v: any) => `${v ?? ''} ${TON_UNIT}`
const axisNameStyle = { color: '#666', fontSize: 10 }

/** 产线生产分析：近7天分组柱 + 计划达成率折线（纵轴单位：件） */
function renderPlanOutput() {
  const d = buildPlanOutputSeries(planLine.value)
  const rate = d.plan.map((p, i) => (p ? Math.round((d.output[i] / p) * 1000) / 10 : 0))
  charts.planOutput?.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const lines = [`${params[0].axisValue}<br/>`]
        params.forEach((p: any) => {
          if (p.seriesName === '计划达成率') {
            lines.push(`${p.marker} ${p.seriesName}: ${p.value}%<br/>`)
          } else {
            lines.push(`${p.marker} ${p.seriesName}: ${p.value} 件<br/>`)
          }
        })
        return lines.join('')
      }
    },
    legend: {
      data: ['计划数', '出产数', '投料数', '计划达成率'],
      top: 0,
      left: 'center',
      textStyle: { color: '#666', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 9
    },
    grid: { left: 46, right: 44, top: 36, bottom: 24 },
    xAxis: {
      type: 'category',
      data: planDays,
      ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: '件',
        nameTextStyle: axisNameStyle,
        ...baseAxis
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        ...baseAxis,
        position: 'right',
        splitLine: { show: false },
        axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%', fontSize: 10 },
        name: '%',
        nameTextStyle: axisNameStyle
      }
    ],
    series: [
      {
        name: '计划数',
        type: 'bar',
        barWidth: 12,
        barGap: '30%',
        data: d.plan,
        itemStyle: { color: '#7ec8f5' }
      },
      {
        name: '出产数',
        type: 'bar',
        barWidth: 12,
        data: d.output,
        itemStyle: { color: '#18b6d8' }
      },
      {
        name: '投料数',
        type: 'bar',
        barWidth: 12,
        data: d.feed,
        itemStyle: { color: '#7ed99a' }
      },
      {
        name: '计划达成率',
        type: 'line',
        yAxisIndex: 1,
        data: rate,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: '#ffb020' },
        itemStyle: { color: '#ffb020' },
        label: {
          show: true,
          position: 'top',
          color: '#c90',
          fontSize: 9,
          formatter: '{c}%'
        }
      }
    ]
  }, { notMerge: true })
}

function renderFactory() {
  const d = factoryData[factoryMode.value]
  charts.factory?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: tons },
    grid: { left: 90, right: 46, top: 16, bottom: 24 },
    xAxis: { type: 'value', name: TON_UNIT, nameTextStyle: axisNameStyle, ...baseAxis, splitLine: { show: true } },
    yAxis: { type: 'category', data: d.names, ...baseAxis, splitLine: { show: false } },
    series: [
      {
        type: 'bar', data: d.values, itemStyle: { color: '#4472c4' }, barWidth: 12,
        label: { show: true, position: 'right', color: '#666', fontSize: 11, formatter: (p: any) => tons(p.value) }
      }
    ]
  }, { notMerge: true })
}

function renderTonnage() {
  const colorMap: Record<string, string> = {
    '造型一线': '#4472c4', '造型二线': '#3ba8a0', '造型三线': '#70ad47', '造型四线': '#ffc000'
  }
  charts.tonnage?.setOption({
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.value} ${TON_UNIT} (${p.percent}%)` },
    series: [
      {
        type: 'pie', radius: ['45%', '65%'], center: ['50%', '50%'],
        data: tonnageData[tonnageMode.value].map(item => ({ ...item, itemStyle: { color: colorMap[item.name] } })),
        label: { color: '#666', fontSize: 11, formatter: (p: any) => `${p.name}\n${p.value}${TON_UNIT}` },
        labelLine: { length: 8, length2: 8 }
      }
    ]
  }, { notMerge: true })
}

/** 年度出产统计：近12月 出产/入库 分组柱（吨） */
function renderAnnual() {
  const d = buildAnnualInOut(annualLine.value)
  charts.annual?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: tons },
    legend: {
      data: ['出产', '入库'],
      top: 0,
      left: 'center',
      textStyle: { color: '#666', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 9
    },
    grid: { left: 46, right: 14, top: 34, bottom: 24 },
    xAxis: {
      type: 'category',
      data: months,
      ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, fontSize: 10 }
    },
    yAxis: { type: 'value', name: TON_UNIT, nameTextStyle: axisNameStyle, ...baseAxis },
    series: [
      {
        name: '出产',
        type: 'bar',
        barWidth: 14,
        barGap: '30%',
        data: d.prod,
        itemStyle: { color: '#4472c4' }
      },
      {
        name: '入库',
        type: 'bar',
        barWidth: 14,
        data: d.inbound,
        itemStyle: { color: '#3ba8a0' }
      }
    ]
  }, { notMerge: true })
}

function renderLineDetail(key: string) {
  const chart = charts[key]
  if (!chart) return
  const data = lineDetailData[`${key}::${lineDetailModes[key]}`]
  const seriesFilter = lineDetailSeries[key]
  const years = ['2025', '2026']
  // 不同系列采用不同的波动参数（振幅/相位/偏移），切换系列时曲线呈现明显不同的波动形态
  const seriesWave: Record<string, { amp: number; phase: number; freq: number; offset: number }> = {
    'WP12': { amp: 38, phase: 0.6, freq: 0.85, offset: 12 },
    'WP13': { amp: 52, phase: 2.1, freq: 0.55, offset: -18 }
  }
  const wave = seriesFilter ? seriesWave[seriesFilter] : null
  chart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: tons },
    legend: {
      data: years, top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 11 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 46, right: 14, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', name: TON_UNIT, nameTextStyle: axisNameStyle, ...baseAxis },
    series: years.map((y, i) => ({
      name: y, type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: data[y].map((v: number, idx: number) => {
        if (!wave) return v
        // 各年份使用不同相位，两条曲线波动错开
        return Math.max(60, Math.round(v + Math.sin(wave.phase + y.charCodeAt(3) * 0.3 + idx * wave.freq) * wave.amp + wave.offset))
      }),
      itemStyle: { color: i === 0 ? '#4472c4' : '#3ba8a0' },
      lineStyle: { width: 2 },
      label: { show: true, color: '#999', fontSize: 9 }
    }))
  }, { notMerge: true })
}

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderPlanOutput()
  renderFactory()
  renderTonnage()
  renderAnnual()
  lineDetailConfigs.forEach(cfg => renderLineDetail(cfg.key))
}

onMounted(async () => {
  await nextTick()
  initChart(planOutputChartRef.value, 'planOutput')
  initChart(factoryChartRef.value, 'factory')
  initChart(tonnageChartRef.value, 'tonnage')
  initChart(annualChartRef.value, 'annual')
  lineDetailConfigs.forEach(cfg => initChart(lineChartRefs[cfg.key] ?? undefined, cfg.key))
  renderAll()

  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  Object.values(charts).forEach(c => c.resize())
}

watch([factoryMode], renderFactory)
watch([tonnageMode], renderTonnage)
watch(annualLine, renderAnnual)
watch(planLine, renderPlanOutput)
watch([lineDetailModes, lineDetailSeries], () => {
  lineDetailConfigs.forEach(cfg => renderLineDetail(cfg.key))
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style src="./dashboard-common.css"></style>

<style scoped>
.production-dashboard {
  padding: 8px;
  background: #f0f2f5;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}

/* 与首页一致：三列等宽，模块间距 10px */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  /* 默认 stretch：右列 absolute 滚动需要跟随最高列 */
}

/* 顶部指标行：高度 120px（与首页一致） */
.prod-metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.prod-metric-card {
  height: 120px;
  min-height: 120px;
  max-height: 120px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-left: 3px solid #4472c4;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.prod-metric-content {
  min-width: 0;
  width: 100%;
}

.prod-metric-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prod-metric-value {
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prod-metric-unit {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #888;
}

.prod-metric-sub {
  margin-top: 6px;
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1400px) {
  .prod-metric-value {
    font-size: 18px;
  }
}

.col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

/* 与首页一致：模块卡固定 360px，内部图表撑满 */
.dashboard-grid .chart-card {
  height: 360px;
  min-height: 360px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.dashboard-grid .chart-card .chart-header {
  flex-shrink: 0;
}

.dashboard-grid .chart-card .chart-body {
  flex: 1;
  min-height: 0;
  height: auto;
}

/* 右侧生产详情列：高度跟随其他列，内容超出时内部滚动 */
.right-col {
  position: relative;
  min-height: 0;
}

.right-scroll {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: #b8b8b8 #f2f2f2;
}

.right-scroll::-webkit-scrollbar {
  width: 6px;
}

.right-scroll::-webkit-scrollbar-thumb {
  background: #b8b8b8;
  border-radius: 3px;
}

.right-scroll::-webkit-scrollbar-track {
  background: #f2f2f2;
}

.right-scroll .chart-card {
  flex-shrink: 0;
}

.right-scroll .chart-card:last-child {
  margin-bottom: 4px;
}

.center-col {
  gap: 10px;
}
.chart-header {
  margin-bottom: 4px;
}

.chart-header.sub {
  margin-top: 2px;
}

/* 图表高度由 .dashboard-grid .chart-card 统一控制（360px 内 flex 撑满） */
.chart-body {
  height: auto;
}

.annual-body {
  height: auto;
}

.line-body {
  height: auto;
}

.annual-card {
  /* 高度与首页模块一致：360px，不再拉伸撑满列 */
  height: 360px;
}
</style>
