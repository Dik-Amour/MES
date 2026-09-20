<template>
  <div class="production-dashboard">
    <!-- 大屏标题 -->
    <DashboardHeader title="材料成型中心工业园区生产运营大屏" />

    <div class="dashboard-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">产线出入库统计</span>
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
          <div class="casting-img-wrap">
            <img :src="castingImg" class="casting-img" alt="铸件图" draggable="false" />
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

    <!-- 产线出入库详情弹框 -->
    <div v-if="lineModalVisible" class="p-modal-mask" @click.self="lineModalVisible = false">
      <div class="p-modal">
        <div class="p-modal-header">
          <span class="p-modal-title">{{ lineModalName }}出入库吨位</span>
          <button class="p-modal-close" @click="lineModalVisible = false">✕</button>
        </div>
        <table class="p-modal-table">
          <thead>
            <tr>
              <th>产线</th><th>出产（吨）</th><th>入库（吨）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in lineModalRows" :key="r.line">
              <td>{{ r.line }}</td>
              <td>{{ r.prod }}</td>
              <td>{{ r.inbound }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 年度统计 - 月份厂区详情弹框 -->
    <div v-if="annualModalVisible" class="p-modal-mask" @click.self="annualModalVisible = false">
      <div class="p-modal">
        <div class="p-modal-header">
          <span class="p-modal-title">{{ annualModalMonth }}{{ annualMode === 'prod' ? '出产' : '入库' }}数据</span>
          <button class="p-modal-close" @click="annualModalVisible = false">✕</button>
        </div>
        <table class="p-modal-table">
          <thead>
            <tr>
              <th>月份</th>
              <th v-for="f in factorySplit" :key="f.name">{{ f.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in annualModalRows" :key="r.label">
              <td>{{ r.label }}</td>
              <td v-for="(v, i) in r.values" :key="i">{{ v }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'
import castingImg from '@/assets/image/发动机.png'

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

// 产线出入库统计
const lineInOutData = {
  lines: ['造型一线', '造型二线', '造型三线', '造型四线'],
  prod: [100, 140, 230, 100],
  in: [150, 100, 205, 145]
}

// 各产线下的子产线（出产/入库之和等于该产线总量）
const lineSubData: Record<string, { line: string; prod: number; inbound: number }[]> = {
  '造型一线': [
    { line: '造型一线大件', prod: 55, inbound: 85 },
    { line: '造型一线中件', prod: 45, inbound: 65 }
  ],
  '造型二线': [
    { line: '造型二线大件', prod: 78, inbound: 56 },
    { line: '造型二线中件', prod: 62, inbound: 44 }
  ],
  '造型三线': [
    { line: '造型三线KW', prod: 120, inbound: 110 },
    { line: '造型三线HWS', prod: 110, inbound: 95 }
  ],
  '造型四线': [
    { line: '造型四线大件', prod: 58, inbound: 80 },
    { line: '造型四线中件', prod: 42, inbound: 65 }
  ]
}

// 产线出入库详情弹框
const lineModalVisible = ref(false)
const lineModalName = ref('')
const lineModalRows = computed(() => lineSubData[lineModalName.value] ?? [])

function openLineModal(lineName: string) {
  lineModalName.value = lineName
  lineModalVisible.value = true
}

// 年度统计 - 月份厂区明细弹框
const factorySplit: { name: string; ratio: number }[] = [
  { name: '安丘厂区', ratio: 0.56 },
  { name: '寒亭厂区', ratio: 0.44 }
]
const annualModalVisible = ref(false)
const annualModalMonth = ref('')
const annualModalRows = computed(() => {
  const mIdx = months.indexOf(annualModalMonth.value)
  if (mIdx < 0) return []
  const src = annualMode.value === 'prod' ? annualData.prod : annualData.in
  return annualData.years.map((y, yIdx) => ({
    label: `${y}年${annualModalMonth.value}`,
    values: factorySplit.map(f => Math.round(src[yIdx][mIdx] * f.ratio))
  }))
})

function openAnnualModal(monthLabel: string) {
  annualModalMonth.value = monthLabel
  annualModalVisible.value = true
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

// 统一单位：吨
const TON_UNIT = '吨'
const tons = (v: any) => `${v ?? ''} ${TON_UNIT}`
const axisNameStyle = { color: '#666', fontSize: 10 }

function renderLineInOut() {
  charts.lineInOut?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: tons },
    legend: {
      data: ['出产', '入库'], top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 11 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 48, right: 14, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: lineInOutData.lines, ...baseAxis, splitLine: { show: false } },
    yAxis: { type: 'value', name: TON_UNIT, nameTextStyle: axisNameStyle, ...baseAxis },
    series: [
      {
        name: '出产', type: 'bar', data: lineInOutData.prod, itemStyle: { color: '#4472c4' }, barWidth: 14,
        label: { show: true, position: 'top', color: '#4472c4', fontSize: 9, formatter: (p: any) => tons(p.value) }
      },
      {
        name: '入库', type: 'bar', data: lineInOutData.in, itemStyle: { color: '#3ba8a0' }, barWidth: 14,
        label: { show: true, position: 'top', color: '#3ba8a0', fontSize: 9, formatter: (p: any) => tons(p.value) }
      }
    ]
  }, { notMerge: true })
  charts.lineInOut?.off('click')
  charts.lineInOut?.on('click', (params: any) => {
    if (params.name) openLineModal(params.name)
  })
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
        type: 'pie', radius: '65%', center: ['50%', '50%'],
        data: tonnageData[tonnageMode.value].map(item => ({ ...item, itemStyle: { color: colorMap[item.name] } })),
        label: { color: '#666', fontSize: 11, formatter: (p: any) => `${p.name}\n${p.value}${TON_UNIT}` },
        labelLine: { length: 8, length2: 8 }
      }
    ]
  }, { notMerge: true })
}

function renderAnnual() {
  const d = annualData[annualMode.value]
  charts.annual?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: tons },
    legend: { data: annualData.years, top: 0, textStyle: { color: '#666', fontSize: 11 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 46, right: 14, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: months, ...baseAxis, splitLine: { show: false } },
    yAxis: { type: 'value', name: TON_UNIT, nameTextStyle: axisNameStyle, ...baseAxis },
    series: annualData.years.map((y, i) => ({
      name: y, type: 'bar', data: d[i], barWidth: 8,
      itemStyle: { color: ['#2f3542', '#747d8c', '#a4b0be'][i] },
      label: { show: true, position: 'top', color: '#999', fontSize: 9 }
    }))
  }, { notMerge: true })
  charts.annual?.off('click')
  charts.annual?.on('click', (params: any) => {
    if (params.name) openAnnualModal(params.name)
  })
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 27% 46% 27%;
  gap: 8px;
}

/* 产线出入库详情弹框 */
.p-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.p-modal {
  background: #fff;
  border-radius: 6px;
  width: 560px;
  max-width: 92vw;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.p-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #e8e8e8;
}

.p-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.p-modal-close {
  border: none;
  background: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}

.p-modal-close:hover {
  color: #333;
}

.p-modal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.p-modal-table th,
.p-modal-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.p-modal-table th {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}

.p-modal-table tbody tr:last-child td {
  border-bottom: none;
  font-weight: 600;
  color: #1a1a1a;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  gap: 8px;
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

.stat-block.big {
  white-space: nowrap;
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: 220px;
}

.stat-block.big {
  white-space: nowrap;
  text-align: center;
}

.casting-img-wrap {
  width: 160px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.casting-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}

.annual-card {
  flex: 1;
}
</style>
