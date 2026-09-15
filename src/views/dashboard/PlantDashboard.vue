<template>
  <div class="plant-dashboard">
    <!-- 顶部导航 + 标题 -->
    <DashboardHeader title="材料成型中心运营管控系统" />
    <div class="top-nav">
      <button
        v-for="n in topNavs"
        :key="n.key"
        class="nav-btn"
        @click="goDashboard(n.path)"
      >{{ n.label }}</button>
    </div>

    <div class="plant-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">生产指标</span>
            <div class="mini-tabs">
              <button v-for="y in years" :key="y" :class="{ active: prodYear === y }" @click="prodYear = y">{{ y }}</button>
            </div>
          </div>
          <div class="prod-panel">
            <div class="prod-summary">
              <div class="ps-cell">
                <div class="ps-title">累计产出入库吨位</div>
                <div class="ps-row">
                  <div class="ps-item">
                    <div class="ps-num">{{ prodData[prodYear].output }}</div>
                    <div class="ps-label">出产吨位</div>
                  </div>
                  <div class="ps-item">
                    <div class="ps-num">{{ prodData[prodYear].inbound }}</div>
                    <div class="ps-label">入库吨位</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="prod-side">
              <div class="ps-box">
                <div class="ps-label">出产累计同比</div>
                <div class="ps-value">{{ prodData[prodYear].outputYoY }}</div>
              </div>
              <div class="ps-box">
                <div class="ps-label">入库累计同比</div>
                <div class="ps-value">{{ prodData[prodYear].inboundYoY }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">每月出产趋势</span>
          </div>
          <div ref="monthlyTrendChartRef" class="chart-body"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">每日出产入库趋势</span>
          </div>
          <div ref="dailyTrendChartRef" class="chart-body"></div>
        </div>
      </div>

      <!-- 中列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">厂区指标</span>
          </div>
          <div class="plant-indicators">
            <div class="ind-row" v-for="(row, ri) in indicatorGroups" :key="ri">
              <div class="ind-box" v-for="it in row" :key="it.label">
                <div class="ind-label">{{ it.label }}</div>
                <div class="ind-value">{{ it.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">成本中心</span>
          </div>
          <div class="cost-top">
            <div class="cost-item">
              <div class="cost-label">单吨可控（元/台）</div>
              <div class="cost-value">3318.91</div>
            </div>
            <div class="cost-item">
              <div class="cost-label">制造费用（元/台）</div>
              <div class="cost-value">3387.08</div>
            </div>
          </div>
          <div class="cost-sub">吨均总成本（元/吨）</div>
          <div ref="costChartRef" class="chart-body cost-body"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">质量中心</span>
            <select v-model="qualityQuarter" class="series-select">
              <option>第一季度</option>
              <option>第二季度</option>
              <option>第三季度</option>
              <option>第四季度</option>
            </select>
          </div>
          <div class="quality-panel">
            <div class="q-block" v-for="q in qualityBlocks" :key="q.name">
              <div class="q-title">{{ q.name }}</div>
              <div class="q-weight">权重：{{ q.weight }}</div>
              <div class="q-chart" :ref="el => setQualityChartRef(q.key, el)"></div>
            </div>
          </div>
          <div class="q-legend">
            <span class="legend-item"><i class="dot" style="background:#7eb8e8"></i>实际值</span>
            <span class="legend-item"><i class="dot" style="background:#f5a623"></i>考核值</span>
          </div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">人力中心</span>
          </div>
          <div class="hr-panel">
            <div class="hr-left">
              <div ref="hrPieChartRef" class="hr-chart"></div>
              <div class="hr-total">1590人</div>
            </div>
            <div class="hr-right">
              <div ref="hrDonutChartRef" class="hr-chart"></div>
              <div class="hr-donut-legend">
                <span v-for="l in hrDonutLegend" :key="l.name" class="legend-item">
                  <i class="dot" :style="{ background: l.color }"></i>{{ l.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">设备中心</span>
          </div>
          <div class="device-grid">
            <div class="device-box" v-for="d in deviceItems" :key="d.label">
              <div class="device-label">{{ d.label }}<span v-if="d.unit">（{{ d.unit }}）</span></div>
              <div class="device-value">{{ d.value }}</div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">安防中心</span>
          </div>
          <div class="safety-panel">
            <div class="sf-title">累计已安全运行</div>
            <div class="sf-days"><b>191</b>天</div>
            <div class="sf-grid">
              <div class="sf-box">
                <div class="sf-label">当日异常报警次数</div>
                <div class="sf-label2">安全/环保</div>
                <div class="sf-value">92/45</div>
              </div>
              <div class="sf-box">
                <div class="sf-label">月度异常报警次数</div>
                <div class="sf-label2">安全/环保</div>
                <div class="sf-value">692/445</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 图表DOM与实例 ==========
const monthlyTrendChartRef = ref<HTMLElement>()
const dailyTrendChartRef = ref<HTMLElement>()
const costChartRef = ref<HTMLElement>()
const hrPieChartRef = ref<HTMLElement>()
const hrDonutChartRef = ref<HTMLElement>()
const qualityChartRefs: Record<string, HTMLElement | null> = {}
const setQualityChartRef = (key: string, el: any) => { qualityChartRefs[key] = el }
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
// 顶部大屏导航（点击跳转对应大屏）
const topNavs = [
  { key: 'production', label: '生产大屏', path: '/dashboard/production' },
  { key: 'quality', label: '质量大屏', path: '/dashboard/quality' },
  { key: 'personnel', label: '人力大屏', path: '/dashboard/personnel' },
  { key: 'equipment', label: '设备大屏', path: '/dashboard/equipment' },
  { key: 'safety', label: '安环大屏', path: '/dashboard/safety' }
]
const router = useRouter()
const goDashboard = (path: string) => {
  router.push(path)
}
const years = ['2023', '2024', '2025']
const prodYear = ref('2025')
const qualityQuarter = ref('第一季度')

// 生产指标数据
const prodData: Record<string, any> = {
  '2023': { output: 68210, inbound: 65980, outputYoY: '-12.35%', inboundYoY: '-11.08%' },
  '2024': { output: 62150, inbound: 60120, outputYoY: '-18.66%', inboundYoY: '-17.42%' },
  '2025': { output: 57091, inbound: 54917, outputYoY: '-29.04%', inboundYoY: '-28.32%' }
}

// 厂区指标
const indicatorGroups = [
  [
    { label: '单吨可控成本（铁）', value: '6954.00' },
    { label: '单吨可控成本（镍）', value: '8088.00' },
    { label: '质量PPAP阶段覆盖率', value: '1.00' }
  ],
  [
    { label: '存货周转次数（营业总成本）', value: '0.00' },
    { label: '人均产出（铸造工）', value: '30.09' },
    { label: '毛坯领用及时率', value: '800%' }
  ],
  [
    { label: '浇筑包数', value: '800.00箱' },
    { label: '熔炼台数', value: '800.00t' },
    { label: '耗电', value: '23873 kw·h' },
    { label: '天然气', value: '90.00 m³' },
    { label: '压缩空气', value: '39000' }
  ]
]

// 质量中心
const qualityBlocks = [
  { key: 'zeroKm', name: '生产厂零公里PPM', weight: '40%', actual: 268.7, target: 280.7 },
  { key: 'internalLoss', name: '内部废品损失', weight: '30%', actual: 2157, target: 1575 },
  { key: 'externalLoss', name: '外部废品损失', weight: '30%', actual: 492, target: 496 }
]

// 人力中心环形图数据
const hrDonutColors = ['#4472c4', '#ed7d31', '#3ba8a0', '#ffc000', '#a5a5a5', '#70ad47', '#c00000']
const hrDonutData = [
  { name: '造型一线大件', value: 88 },
  { name: '造型一线中件', value: 434 },
  { name: '造型二线大件', value: 124 },
  { name: '造型二线中件', value: 100 },
  { name: '造型三线KW', value: 68 },
  { name: '造型三线HWS', value: 123 },
  { name: '清理工段', value: 656 }
]
const hrDonutLegend = hrDonutData.map((d, i) => ({ name: d.name, color: hrDonutColors[i % hrDonutColors.length] }))

// 设备中心
const deviceItems = [
  { label: '设备数量', unit: '台/套', value: '2430' },
  { label: '机器人数量', unit: '台/套', value: '2430' },
  { label: '净值/原值', unit: '亿元', value: '5.02/26.85' },
  { label: '设备可动率', unit: '%', value: '71.37' },
  { label: 'MTBF', unit: '小时', value: '7744.04' },
  { label: 'MTTR', unit: '小时', value: '33' }
]

// ========== 通用配置 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 10 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 每月出产趋势
function renderMonthlyTrend() {
  charts.monthlyTrend?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['2024', '2025'], top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 50, right: 14, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: months, ...baseAxis, splitLine: { show: false } },
    yAxis: { type: 'value', max: 25000, ...baseAxis },
    series: [
      {
        name: '2024', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [3200, 7800, 19600, 12400, 6300, 12600, 12100, 10200, 22800, 11200, 11900, 24700],
        itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 2 }
      },
      {
        name: '2025', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [0, 0, 20000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 }
      }
    ]
  }, { notMerge: true })
}

// 每日出产入库趋势（柱 + 双折线）
function renderDailyTrend() {
  const x = ['2026/5/1', '2026/5/2', '2026/5/3', '2026/5/4', '2026/5/5']
  charts.dailyTrend?.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['出产', '入库', '出勤'], top: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 46, right: 46, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: x, ...baseAxis, splitLine: { show: false } },
    yAxis: [
      { type: 'value', max: 400, ...baseAxis },
      { type: 'value', max: 1200, ...baseAxis, position: 'right', splitLine: { show: false } }
    ],
    series: [
      {
        name: '出产', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [380, 0, 0, 370, 380], itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 }, yAxisIndex: 0
      },
      {
        name: '入库', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [0, 0, 0, 370, 375], itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 2 }, yAxisIndex: 0
      },
      {
        name: '出勤', type: 'bar', barWidth: 20,
        data: [1000, 1010, 1020, 1000, 990],
        itemStyle: { color: '#a5f0ea' }, yAxisIndex: 1
      }
    ]
  }, { notMerge: true })
}

// 成本中心（固定成本 / 变动成本，横坐标为年份）
function renderCost() {
  const x = ['2021', '2022', '2023', '2024', '2025']
  charts.cost?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['固定成本', '变动成本'], top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 56, right: 14, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: x, ...baseAxis, splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9 } },
    yAxis: { type: 'value', max: 40000, ...baseAxis },
    series: [
      { name: '固定成本', type: 'bar', stack: 'cost', barWidth: 26, data: [12500, 11800, 12000, 10800, 9800], itemStyle: { color: '#b0b0b0' } },
      { name: '变动成本', type: 'bar', stack: 'cost', barWidth: 26, data: [17500, 16800, 16000, 14500, 13200], itemStyle: { color: '#8c8c8c' } }
    ]
  }, { notMerge: true })
}

// 质量中心三个小图
function renderQuality() {
  qualityBlocks.forEach(q => {
    const chart = charts[q.key]
    if (!chart) return
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 4, right: 4, top: 16, bottom: 4, containLabel: true },
      xAxis: { type: 'category', data: ['实际值'], ...baseAxis, splitLine: { show: false }, axisLabel: { show: false }, axisLine: { show: false } },
      yAxis: { type: 'value', show: false },
      series: [
        {
          name: '实际值', type: 'bar', barWidth: 14, data: [q.actual],
          itemStyle: { color: '#7eb8e8' },
          label: { show: true, position: 'top', color: '#333', fontSize: 9 }
        },
        {
          name: '考核值', type: 'bar', barWidth: 14, data: [q.target],
          itemStyle: { color: '#f5a623' },
          label: { show: true, position: 'top', color: '#333', fontSize: 9 },
          markLine: {
            silent: true, symbol: 'none',
            data: [{ yAxis: q.target }],
            lineStyle: { color: '#999', type: 'dashed', width: 1 },
            label: { show: false }
          }
        }
      ]
    }, { notMerge: true })
  })
}

// 人力中心 - 车间/科室饼图
function renderHrPie() {
  charts.hrPie?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: {
      data: ['车间人员', '科室人员'],
      orient: 'horizontal', bottom: 6, left: 'center',
      textStyle: { color: '#666', fontSize: 11 },
      itemWidth: 12, itemHeight: 8,
      formatter: (name: string) => {
        const val = name === '车间人员' ? 1173 : 417
        return `${name} ${val}`
      }
    },
    series: [{
      type: 'pie', radius: '72%', center: ['50%', '42%'],
      data: [
        { name: '车间人员', value: 1173, itemStyle: { color: '#ffc000' } },
        { name: '科室人员', value: 417, itemStyle: { color: '#3ba8a0' } }
      ],
      label: { show: false },
      labelLine: { show: false }
    }]
  }, { notMerge: true })
}

// 人力中心 - 产线分布环形图
function renderHrDonut() {
  charts.hrDonut?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人' },
    series: [{
      type: 'pie', radius: ['42%', '62%'], center: ['50%', '42%'],
      data: hrDonutData.map((d, i) => ({ ...d, itemStyle: { color: hrDonutColors[i % hrDonutColors.length] } })),
      label: { show: true, color: '#666', fontSize: 9, formatter: '{b}\n{c}' },
      labelLine: { length: 4, length2: 6 }
    }]
  }, { notMerge: true })
}

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderMonthlyTrend()
  renderDailyTrend()
  renderCost()
  renderQuality()
  renderHrPie()
  renderHrDonut()
}

const handleResize = () => Object.values(charts).forEach(c => c.resize())

onMounted(async () => {
  await nextTick()
  initChart(monthlyTrendChartRef.value, 'monthlyTrend')
  initChart(dailyTrendChartRef.value, 'dailyTrend')
  initChart(costChartRef.value, 'cost')
  qualityBlocks.forEach(q => initChart(qualityChartRefs[q.key] ?? undefined, q.key))
  initChart(hrPieChartRef.value, 'hrPie')
  initChart(hrDonutChartRef.value, 'hrDonut')
  renderAll()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.plant-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
}

.top-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.nav-btn {
  background: #fff;
  border: 1px solid #4472c4;
  color: #4472c4;
  font-size: 13px;
  font-weight: 500;
  padding: 3px 16px;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #4472c4;
  color: #fff;
}

.plant-grid {
  display: grid;
  grid-template-columns: 30% 36% 34%;
  gap: 8px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.chart-card {
  background: #f2f2f2;
  border-radius: 4px;
  padding: 8px;
  min-width: 0;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.chart-title {
  background: #fff;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  border-radius: 2px;
  white-space: nowrap;
}

.mini-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.mini-tabs button {
  border: none;
  background: #fff;
  color: #4472c4;
  font-size: 11px;
  padding: 2px 7px;
  cursor: pointer;
  border-radius: 2px;
  white-space: nowrap;
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
  background: #fff;
  color: #333;
}

.chart-body {
  height: 175px;
}

.cost-body {
  height: 150px;
}

/* 生产指标 */
.prod-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 8px 4px 4px;
}

.prod-summary {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 8px;
}

.ps-title {
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
}

.ps-row {
  display: flex;
  gap: 10px;
}

.ps-item {
  flex: 1;
  text-align: center;
}

.ps-num {
  font-size: 21px;
  font-weight: 700;
  color: #222;
}

.ps-label {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.prod-side {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.ps-box {
  flex: 1;
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 8px 6px;
  text-align: center;
  min-width: 0;
}

.ps-value {
  font-size: 16px;
  font-weight: 700;
  color: #222;
  white-space: nowrap;
}

/* 厂区指标 */
.plant-indicators {
  padding: 8px 4px 4px;
}

.ind-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.ind-box {
  flex: 1;
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 8px 4px;
  text-align: center;
  min-width: 0;
}

.ind-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.25;
  min-height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ind-value {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}

/* 成本中心 */
.cost-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 6px 4px;
}

.cost-item {
  background: #fff;
  border: 1px solid #e8e8e8;
  text-align: center;
  padding: 8px 4px;
}

.cost-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.cost-value {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

.cost-sub {
  font-size: 10px;
  color: #888;
  text-align: left;
  margin: 2px 0 2px;
}

/* 质量中心 */
.quality-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
}

.q-block {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 4px 2px;
  text-align: center;
  min-width: 0;
  overflow: hidden;
}

.q-title {
  font-size: 10px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.q-weight {
  font-size: 9px;
  color: #888;
  margin-bottom: 2px;
}

.q-chart {
  height: 110px;
  width: 100%;
}

.q-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 4px;
}

/* 人力中心 */
.hr-panel {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 6px;
  padding: 6px 4px;
  position: relative;
}

.hr-left, .hr-right {
  position: relative;
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 4px;
}

.hr-chart {
  height: 210px;
}

.hr-donut-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 2px;
}

.hr-total {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
  font-weight: 700;
  color: #333;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.hr-donut-legend {
  max-height: 46px;
  overflow-y: auto;
}

/* 设备中心 */
.device-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 40px 4px 4px;
}

.device-box {
  text-align: center;
}

.device-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
}

.device-value {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

/* 安防中心 */
.safety-panel {
  padding: 10px 8px;
}

.sf-title {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.sf-days {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 14px;
}

.sf-days b {
  font-size: 22px;
  color: #222;
  margin-right: 2px;
}

.sf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sf-box {
  background: #fff;
  border: 1px solid #e8e8e8;
  text-align: center;
  padding: 10px 6px;
}

.sf-label {
  font-size: 11px;
  color: #333;
  margin-bottom: 4px;
}

.sf-label2 {
  font-size: 10px;
  color: #888;
  margin-bottom: 6px;
}

.sf-value {
  font-size: 17px;
  font-weight: 700;
  color: #222;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>
