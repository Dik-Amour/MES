<template>
  <div class="production-dashboard">
    <!-- 大屏标题 -->
    <div class="screen-title">材料成型中心工业园区生产运营大屏</div>

    <div class="dashboard-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">产线出入库统计</span>
            <div class="legend-dots">
              <span class="legend-item"><i class="dot" style="background:#4472c4"></i>出产</span>
              <span class="legend-item"><i class="dot" style="background:#3ba8a0"></i>入库</span>
            </div>
          </div>
          <div ref="lineInOutChartRef" class="chart-body"></div>
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

      <!-- 中列 -->
      <div class="col center-col">
        <div class="center-stats">
          <div class="stat-block">
            <div class="stat-title">当月出产</div>
            <div class="stat-value">731.2<span class="unit">吨</span></div>
            <div class="stat-sub">同比：4.5%　环比：-2.3%</div>
          </div>
          <div class="stat-block">
            <div class="stat-title">当月入库</div>
            <div class="stat-value">731.2<span class="unit">吨</span></div>
            <div class="stat-sub">同比：3.8%　环比：1.6%</div>
          </div>
        </div>

        <div class="center-middle">
          <div class="stat-block big">
            <div class="stat-title">年度出产</div>
            <div class="stat-value">339,200<span class="unit">吨</span></div>
          </div>
          <div class="casting-placeholder">
            <div class="casting-box">铸件图</div>
          </div>
          <div class="stat-block big">
            <div class="stat-title">年度入库</div>
            <div class="stat-value">339,200<span class="unit">吨</span></div>
          </div>
        </div>

        <div class="center-stats">
          <div class="stat-block">
            <div class="stat-title">在制品数</div>
            <div class="stat-value">339,200<span class="unit">件</span></div>
          </div>
          <div class="stat-block">
            <div class="stat-title">成品数</div>
            <div class="stat-value">339,200<span class="unit">件</span></div>
          </div>
        </div>

        <div class="chart-card annual-card">
          <div class="chart-header">
            <span class="chart-title">年度统计</span>
            <div class="mini-tabs">
              <button :class="{ active: annualMode === 'prod' }" @click="annualMode = 'prod'">年度出产</button>
              <button :class="{ active: annualMode === 'in' }" @click="annualMode = 'in'">年度入库</button>
            </div>
          </div>
          <div ref="annualChartRef" class="chart-body annual-body"></div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="col">
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
            <div class="legend-dots">
              <span class="legend-item"><i class="dot line-dot"></i>2025</span>
              <span class="legend-item"><i class="dot line-dot2"></i>2026</span>
            </div>
          </div>
          <div :ref="el => setLineChartRef(line.key, el)" class="chart-body line-body"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

const seriesOptions = ['WP12', 'WP13']

// ========== 图表实例与DOM ==========
const lineInOutChartRef = ref<HTMLElement>()
const factoryChartRef = ref<HTMLElement>()
const tonnageChartRef = ref<HTMLElement>()
const annualChartRef = ref<HTMLElement>()
const lineChartRefs: Record<string, HTMLElement | null> = {}
const setLineChartRef = (key: string, el: any) => { lineChartRefs[key] = el }

const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const factoryMode = ref<'month' | 'year'>('month')
const tonnageMode = ref<'prod' | 'in'>('prod')
const annualMode = ref<'prod' | 'in'>('prod')
const lineDetailModes = reactive<Record<string, string>>({
  'line1': 'line1-large',
  'line2': 'line2-large',
  'line3': 'line3-hws'
})
const lineDetailSeries = reactive<Record<string, string>>({ 'line1': '', 'line2': '', 'line3': '' })

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
  }
]

// ========== 模拟数据 ==========
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

// 产线出入库统计
const lineInOutData = {
  lines: ['造型一线', '造型二线', '造型三线', '造型四线'],
  prod: [100, 140, 230, 100],
  in: [150, 100, 205, 145]
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

// 年度统计（3年 x 12月）
const annualData = {
  years: ['2024', '2025', '2026'],
  prod: [
    [100, 130, 230, 100, 152, 152, 155, 140, 230, 100, 120, 140],
    [130, 200, 210, 140, 190, 165, 190, 175, 210, 105, 145, 145],
    [155, 235, 240, 210, 218, 185, 210, 190, 225, 160, 155, 100]
  ],
  in: [
    [90, 120, 210, 95, 140, 140, 145, 130, 210, 95, 110, 130],
    [120, 180, 195, 130, 175, 152, 175, 160, 195, 98, 132, 132],
    [145, 215, 225, 195, 205, 172, 198, 178, 212, 148, 142, 95]
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

function renderLineInOut() {
  charts.lineInOut?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 10, top: 20, bottom: 24 },
    xAxis: { type: 'category', data: lineInOutData.lines, ...baseAxis, splitLine: { show: false } },
    yAxis: { type: 'value', ...baseAxis },
    series: [
      { name: '出产', type: 'bar', data: lineInOutData.prod, itemStyle: { color: '#4472c4' }, barWidth: 14 },
      { name: '入库', type: 'bar', data: lineInOutData.in, itemStyle: { color: '#3ba8a0' }, barWidth: 14 }
    ]
  })
}

function renderFactory() {
  const d = factoryData[factoryMode.value]
  charts.factory?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 90, right: 40, top: 10, bottom: 24 },
    xAxis: { type: 'value', ...baseAxis, splitLine: { show: true } },
    yAxis: { type: 'category', data: d.names, ...baseAxis, splitLine: { show: false } },
    series: [
      {
        type: 'bar', data: d.values, itemStyle: { color: '#4472c4' }, barWidth: 12,
        label: { show: true, position: 'right', color: '#666', fontSize: 11 }
      }
    ]
  }, { notMerge: true })
}

function renderTonnage() {
  const colorMap: Record<string, string> = {
    '造型一线': '#4472c4', '造型二线': '#3ba8a0', '造型三线': '#70ad47', '造型四线': '#ffc000'
  }
  charts.tonnage?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie', radius: '65%', center: ['50%', '50%'],
        data: tonnageData[tonnageMode.value].map(item => ({ ...item, itemStyle: { color: colorMap[item.name] } })),
        label: { color: '#666', fontSize: 11, formatter: '{b}\n{c}' },
        labelLine: { length: 8, length2: 8 }
      }
    ]
  }, { notMerge: true })
}

function renderAnnual() {
  const d = annualData[annualMode.value]
  charts.annual?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: annualData.years, top: 0, textStyle: { color: '#666', fontSize: 11 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 40, right: 10, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: months, ...baseAxis, splitLine: { show: false } },
    yAxis: { type: 'value', ...baseAxis },
    series: annualData.years.map((y, i) => ({
      name: y, type: 'bar', data: d[i], barWidth: 8,
      itemStyle: { color: ['#2f3542', '#747d8c', '#a4b0be'][i] },
      label: { show: true, position: 'top', color: '#999', fontSize: 9 }
    }))
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
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 10, top: 20, bottom: 24 },
    xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', ...baseAxis },
    series: years.map((y, i) => ({
      name: y, type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: data[y].map((v: number, idx: number) => {
        if (!wave) return v
        // 各年份使用不同相位，两条曲线波动错开
        return Math.max(60, Math.round(v + Math.sin(wave.phase + y.charCodeAt(3) * 0.3 + idx * wave.freq) * wave.amp + wave.offset))
      }),
      itemStyle: { color: i === 0 ? '#4472c4' : '#3ba8a0' },
      lineStyle: { width: 2 },
      label: { show: true, color: '#999', fontSize: 9, formatter: (p: any) => p.value ?? '' },
      connectNulls: false
    }))
  }, { notMerge: true })
}

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderLineInOut()
  renderFactory()
  renderTonnage()
  renderAnnual()
  lineDetailConfigs.forEach(cfg => renderLineDetail(cfg.key))
}

onMounted(async () => {
  await nextTick()
  initChart(lineInOutChartRef.value, 'lineInOut')
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
watch([annualMode], renderAnnual)
watch([lineDetailModes, lineDetailSeries], () => {
  lineDetailConfigs.forEach(cfg => renderLineDetail(cfg.key))
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.production-dashboard {
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 27% 46% 27%;
  gap: 8px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.center-col {
  gap: 12px;
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

.chart-header.sub {
  margin-top: 2px;
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
  gap: 10px;
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

.line-dot { background: #4472c4; }
.line-dot2 { background: #3ba8a0; }

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
  height: 200px;
}

.annual-body {
  height: 210px;
}

.line-body {
  height: 175px;
}

/* 中间统计区 */
.center-stats {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}

.stat-block {
  text-align: center;
}

.stat-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: #222;
}

.stat-value .unit {
  font-size: 14px;
  font-weight: 400;
  color: #666;
  margin-left: 4px;
}

.stat-sub {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.stat-block.big .stat-value {
  font-size: 34px;
}

.center-middle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.casting-placeholder {
  flex: 1;
  display: flex;
  justify-content: center;
}

.casting-box {
  width: 320px;
  height: 220px;
  border: 1px solid #e0e0e0;
  background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><line x1="0" y1="0" x2="100%" y2="100%" stroke="%23e0e0e0" stroke-width="1"/><line x1="100%" y1="0" x2="0" y2="100%" stroke="%23e0e0e0" stroke-width="1"/></svg>');
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 20px;
  letter-spacing: 4px;
}

.annual-card {
  flex: 1;
}
</style>
