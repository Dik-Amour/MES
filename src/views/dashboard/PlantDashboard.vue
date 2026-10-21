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
            <span class="chart-title">产线出产情况</span>
          </div>
          <div class="line-output-table">
            <div class="lot-head">
              <span class="lot-col lot-col-name">产线</span>
              <span class="lot-col">浇注数</span>
              <span class="lot-col">清理数</span>
            </div>
            <div class="lot-row" v-for="r in lineOutputData" :key="r.name">
              <span class="lot-col lot-col-name">{{ r.name }}</span>
              <span class="lot-col">{{ r.pour }}</span>
              <span class="lot-col">{{ r.clean }}</span>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">动能消耗统计</span>
            <select v-model="energyLine" class="series-select">
              <option>全部</option>
              <option v-for="l in energyLineOptions" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div class="energy-summary">
            <div class="energy-box">
              <div class="energy-box-label">耗能</div>
              <div class="energy-box-value">23813 <span class="energy-box-unit">kw·h</span></div>
            </div>
            <div class="energy-box">
              <div class="energy-box-label">天然气</div>
              <div class="energy-box-value">9000 <span class="energy-box-unit">m³</span></div>
            </div>
            <div class="energy-box">
              <div class="energy-box-label">压缩空气</div>
              <div class="energy-box-value">39000</div>
            </div>
          </div>
          <div ref="energyChartRef" class="chart-body" style="height:195px"></div>
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
            <span class="cost-unit">单位：元/吨</span>
          </div>
          <div ref="costChartRef" class="chart-body cost-body" @click="onCostChartClick"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">质量中心</span>
          </div>
          <div ref="qualityChartRef" class="chart-body quality-chart"></div>
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
          <div ref="safetyChartRef" class="chart-body safety-chart"></div>
        </div>
      </div>
    </div>

    <!-- 成本吨均动能费用弹框 -->
    <div v-if="costModalVisible" class="cost-modal-mask" @click.self="costModalVisible = false">
      <div class="cost-modal">
        <div class="cost-modal-header">
          <span class="cost-modal-title">{{ costModalFactory }}{{ costModalYear }}年成本吨均动能费用</span>
          <div class="cost-modal-actions">
            <select v-model="costTrendCategory" class="series-select">
              <option v-for="c in costTrendCategories" :key="c" :value="c">{{ c }}</option>
            </select>
            <button class="cost-modal-close" @click="costModalVisible = false">✕</button>
          </div>
        </div>
        <div ref="costTrendChartRef" class="cost-modal-chart"></div>
      </div>
    </div>

    <!-- 人员岗位分布弹框 -->
    <div v-if="hrModalVisible" class="cost-modal-mask" @click.self="hrModalVisible = false">
      <div class="cost-modal">
        <div class="cost-modal-header">
          <span class="cost-modal-title">{{ hrModalTitleText }}</span>
          <button class="cost-modal-close" @click="hrModalVisible = false">✕</button>
        </div>
        <div ref="hrModalChartRef" class="hr-modal-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 图表DOM与实例 ==========
const energyChartRef = ref<HTMLElement>()
const costChartRef = ref<HTMLElement>()
const costTrendChartRef = ref<HTMLElement>()
let costTrendChart: echarts.ECharts | null = null
const costModalVisible = ref(false)
const costModalYear = ref('2025')
const hrPieChartRef = ref<HTMLElement>()
const hrDonutChartRef = ref<HTMLElement>()
const hrModalChartRef = ref<HTMLElement>()
let hrModalChart: echarts.ECharts | null = null
const hrModalVisible = ref(false)
const hrModalTitle = ref('')
const safetyChartRef = ref<HTMLElement>()
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
const qualityChartRef = ref<HTMLElement>()

// 生产指标数据
const prodData: Record<string, any> = {
  '2023': { output: 68210, inbound: 65980, outputYoY: '-12.35%', inboundYoY: '-11.08%' },
  '2024': { output: 62150, inbound: 60120, outputYoY: '-18.66%', inboundYoY: '-17.42%' },
  '2025': { output: 57091, inbound: 54917, outputYoY: '-29.04%', inboundYoY: '-28.32%' }
}

// 厂区指标
const indicatorGroups = [
  [
    { label: '单吨可控成本（灰铁）', value: '6954.00' },
    { label: '单吨可控成本（蠕铁）', value: '8088.00' },
    { label: '质量PPM评价指数', value: '1.00' }
  ],
  [
    { label: '存货周转次数（主营业务成本）', value: '0.00' },
    { label: '人均产出（热加工）', value: '30.09' },
    { label: '毛坯供货及时率', value: '800%' }
  ]
]

// 质量中心
// 质量中心分组柱状图
const qualityCategories = ['铸件综合废品率', '外部废品率', '内部废品率']
const qualityFactories = ['安丘厂区', '寒亭厂区', '材料成型中心']
const qualityBarData = [
  [1.35, 1.25, 1.30],   // 安丘厂区
  [1.28, 1.25, 1.28],   // 寒亭厂区
  [1.32, 1.27, 1.30]    // 材料成型中心
]
const qualityBarColors = ['#4472c4', '#5ec4d4', '#70ad47']

function renderQuality() {
  charts.quality?.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const lines = [`${params[0].axisValue}<br/>`]
        params.forEach((p: any) => {
          lines.push(`${p.marker} ${p.seriesName}: ${p.value}%<br/>`)
        })
        return lines.join('')
      }
    },
    legend: {
      data: qualityFactories, top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 44, right: 14, top: 32, bottom: 28 },
    xAxis: {
      type: 'category', data: qualityCategories,
      ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 10 }
    },
    yAxis: {
      type: 'value', max: 1.5,
      ...baseAxis,
      axisLabel: { ...baseAxis.axisLabel, formatter: (v: number) => (v * 100).toFixed(0) + '%' },
      splitNumber: 5
    },
    series: qualityFactories.map((name, i) => ({
      name, type: 'bar', barWidth: 22, barGap: '10%',
      data: qualityBarData[i].map(v => v.toFixed(2)),
      itemStyle: { color: qualityBarColors[i] }
    }))
  }, { notMerge: true })
}

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

// 人力中心 - 各区域岗位分布数据
const hrPositionNames = ['熔炼工', '造型工', '清理工', '检验员', '维修工']
const hrPositions: Record<string, { name: string; value: number }[]> = {
  '车间人员': [
    { name: '熔炼工', value: 130 },
    { name: '造型工', value: 140 },
    { name: '清理工', value: 230 },
    { name: '检验员', value: 100 },
    { name: '维修工', value: 100 }
  ],
  '科室人员': [
    { name: '技术员', value: 100 },
    { name: '调度员', value: 135 },
    { name: '质检员', value: 225 },
    { name: '安全员', value: 105 },
    { name: '管理员', value: 90 }
  ]
}
// 各产线岗位分布（根据产线派生）
hrDonutData.forEach((line, li) => {
  hrPositions[line.name] = hrPositionNames.map((p, i) => ({
    name: p,
    value: 80 + ((li * 37 + i * 53) % 160)
  }))
})

// 点击饼图/环形图 → 打开岗位分布弹框
function openHrModal(name: string) {
  hrModalTitle.value = name
  hrModalVisible.value = true
}

// 弹框标题（避免"车间人员人员统计"这类重复）
const hrModalTitleText = computed(() =>
  hrModalTitle.value.endsWith('人员') ? `${hrModalTitle.value}统计` : `${hrModalTitle.value}人员统计`
)

watch(hrModalVisible, (v) => {
  if (v) {
    nextTick(() => {
      if (!hrModalChartRef.value) return
      if (hrModalChart) { hrModalChart.dispose() }
      hrModalChart = echarts.init(hrModalChartRef.value)
      const data = hrPositions[hrModalTitle.value] || hrPositions['车间人员']
      hrModalChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 70, right: 50, top: 20, bottom: 30 },
        xAxis: { type: 'value', max: 250, ...baseAxis },
        yAxis: {
          type: 'category',
          data: data.map(d => d.name),
          ...baseAxis,
          splitLine: { show: false },
          axisLabel: { ...baseAxis.axisLabel, fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        series: [{
          type: 'bar', barWidth: 18,
          data: data.map(d => d.value),
          itemStyle: { color: '#4472c4' },
          label: { show: true, position: 'right', color: '#666', fontSize: 11 }
        }]
      }, { notMerge: true })
    })
  }
})

// 设备中心
const deviceItems = [
  { label: '设备数量', unit: '台/套', value: '2430' },
  { label: '机器人数量', unit: '台/套', value: '2430' },
  { label: '净值/原值', unit: '亿元', value: '5.02/26.85' },
  { label: '设备可动率', unit: '%', value: '71.37' },
  { label: 'MTBF', unit: '小时', value: '7744.04' },
  { label: 'MTTR', unit: '小时', value: '33' }
]

// 产线出产情况数据
const lineOutputData = [
  { name: '造型一线大件', pour: 80, clean: 80 },
  { name: '造型一线中件', pour: 80, clean: 80 },
  { name: '造型二线大件', pour: 80, clean: 80 },
  { name: '造型二线中件', pour: 80, clean: 80 },
  { name: '造型三线KW', pour: 80, clean: 80 },
  { name: '造型三线HWS', pour: 80, clean: 80 },
  { name: '造型四线大件（安丘）', pour: 80, clean: 80 },
  { name: '造型四线中件（安丘）', pour: 80, clean: 80 }
]

// ========== 通用配置 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 10 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

// 动能消耗统计
const energyLine = ref('全部')
const energyLineOptions = ['造型一线大件', '造型一线中件', '造型二线大件', '造型二线中件', '造型三线KW', '造型三线HWS', '造型四线大件（安丘）', '造型四线中件（安丘）']
const energyX = ['04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12']
const energySeriesNames = ['电', '天然气', '压缩空气', '热量', '清水']
const energySeriesColors = ['#4472c4', '#5ec4d4', '#3ba8a0', '#ffc000', '#ed7d31']

type EnergyMap = Record<string, Record<string, number[]>>
const energySeriesData: EnergyMap = {
  '全部': {
    '电': [120, 130, 140, 135, 125, 145, 150],
    '天然气': [90, 100, 110, 105, 95, 100, 115],
    '压缩空气': [110, 120, 130, 115, 110, 125, 135],
    '热量': [130, 140, 150, 145, 135, 150, 160],
    '清水': [150, 160, 170, 165, 155, 170, 180]
  },
  '造型一线大件': {
    '电': [80, 90, 85, 88, 82, 87, 92], '天然气': [60, 65, 70, 68, 62, 66, 72],
    '压缩空气': [70, 75, 80, 78, 72, 76, 82], '热量': [80, 85, 90, 88, 82, 86, 92],
    '清水': [90, 95, 100, 98, 92, 96, 102]
  }
}
// 为其他产线也生成数据
energyLineOptions.forEach(l => {
  if (!energySeriesData[l]) {
    const s = 0.4 + Math.random() * 0.3
    energySeriesData[l] = {}
    energySeriesNames.forEach(k => {
      energySeriesData[l][k] = energySeriesData['全部'][k].map(v => Math.round(v * s))
    })
  }
})

function renderEnergy() {
  const lineData = energySeriesData[energyLine.value] || energySeriesData['全部']
  charts.energy?.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: energySeriesNames, top: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 44, right: 44, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: energyX, ...baseAxis, splitLine: { show: false } },
    yAxis: [
      { type: 'value', max: 1000, ...baseAxis },
      { type: 'value', max: 500, ...baseAxis, position: 'right', splitLine: { show: false } }
    ],
    series: [
      ...energySeriesNames.map((name, i) => ({
        name, type: 'bar', stack: 'energy', barWidth: 28,
        data: lineData[name] || energySeriesData['全部'][name],
        itemStyle: { color: energySeriesColors[i] }
      })),
      {
        name: '吨均动能费用', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [300, 350, 320, 360, 310, 340, 330],
        itemStyle: { color: '#c00000' }, lineStyle: { width: 2 },
        yAxisIndex: 1
      }
    ]
  }, { notMerge: true })
}
watch(energyLine, () => renderEnergy())

// 成本中心分组柱状图数据
const costYears = ['2024', '2025', '2026']
const costFactories = ['安丘厂区', '寒亭厂区', '材料成型中心']
const costBarData: Record<string, Record<string, number[]>> = {
  '安丘厂区':   { '2024': [185, 150, 105], '2025': [230, 150, 155], '2026': [190, 110, 155] },
  '寒亭厂区':   { '2024': [145, 145, 145], '2025': [225, 180, 100], '2026': [255, 255, 255] },
  '材料成型中心': { '2024': [180, 180, 180], '2025': [255, 265, 140], '2026': [205, 205, 205] }
}
const costBarColors = ['#4472c4', '#5ec4d4', '#70ad47']

// 成本吨均动能费用弹框数据（按厂区）
const costTrendCategories = ['原材料', '辅料', '动能', '废品损失', '设备维修', '工具工装', '外部加工费']
const costTrendColors = ['#4472c4', '#5ec4d4', '#3ba8a0', '#ffc000', '#ed7d31', '#c00000', '#70ad47']
const costTrendX = ['202501','202502','202503','202504','202505','202506','202507','202508','202509','202510','202511','202512']

function genCostTrend(seed: number) {
  const base = [
    [175, 198, 208, 230, 195, 220, 180, 200, 228, 210, 225, 205],
    [150, 130, 200, 210, 230, 190, 215, 225, 228, 220, 170, 180],
    [145, 100, 125, 100, 140, 105, 135, 120, 105, 115, 160, 145],
    [225, 195, 130, 195, 190, 178, 220, 110, 180, 230, 175, 130],
    [170, 160, 175, 155, 150, 150, 140, 115, 165, 185, 180, 145],
    [198, 140, 170, 175, 130, 220, 180, 110, 165, 230, 185, 228],
    [100, 175, 195, 118, 175, 105, 185, 128, 195, 158, 120, 182]
  ]
  return base.map(arr => arr.map((v, i) => Math.round(v + Math.sin(seed + i * 0.7) * 12)))
}

// 成本中心点击弹框
let costClickFactory = '安丘厂区'
let costClickYear = '2025'
function onCostChartClick() {
  costModalYear.value = costClickYear
  costModalFactory.value = costClickFactory
  costModalVisible.value = true
}

const costModalFactory = ref('安丘厂区')
const costTrendCategory = ref(costTrendCategories[0])

function renderCostTrend() {
  if (!costTrendChartRef.value) return
  if (costTrendChart) costTrendChart.dispose()
  costTrendChart = echarts.init(costTrendChartRef.value)
  const seed = costFactories.indexOf(costModalFactory.value) * 3 + parseInt(costModalYear.value) % 3
  const trendData = genCostTrend(seed)
  const idx = Math.max(0, costTrendCategories.indexOf(costTrendCategory.value))
  costTrendChart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + ' 元/吨' },
    legend: { show: false },
    grid: { left: 56, right: 34, top: 30, bottom: 40 },
    xAxis: {
      type: 'category', data: costTrendX, ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', max: 280, name: '元/吨', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
    series: [{
      name: costTrendCategory.value,
      type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: trendData[idx],
      itemStyle: { color: costTrendColors[idx] },
      lineStyle: { width: 2 },
      label: { show: true, color: '#666', fontSize: 10 }
    }]
  }, { notMerge: true })
}

watch(costModalVisible, (v) => {
  if (v) nextTick(renderCostTrend)
})

watch(costTrendCategory, () => {
  if (costModalVisible.value) renderCostTrend()
})

// 成本中心分组柱状图
function renderCost() {
  charts.cost?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: costYears, top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 40, right: 14, top: 32, bottom: 28 },
    xAxis: { type: 'category', data: costFactories, ...baseAxis, splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 10 } },
    yAxis: { type: 'value', max: 300, name: '元/吨', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
    series: costYears.map((year, yi) => ({
      name: year, type: 'bar', barWidth: 22, barGap: '10%',
      data: costFactories.map(factory => {
        const arr = costBarData[factory]?.[year]
        return arr ? arr[Math.min(yi, arr.length - 1)] : 0
      }),
      itemStyle: { color: costBarColors[yi] }
    }))
  }, { notMerge: true })
  // 记录点击的厂区和年份
  charts.cost?.on('click', (params: any) => {
    if (params.name) costClickFactory = params.name
    if (params.seriesName) costClickYear = params.seriesName
  })
}

// ========== 初始化 ==========
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
  charts.hrPie?.off('click')
  charts.hrPie?.on('click', (params: any) => openHrModal(params.name))
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
  charts.hrDonut?.off('click')
  charts.hrDonut?.on('click', (params: any) => openHrModal(params.name))
}

// 安防中心分组柱状图
const safetyMonths = ['202511', '202512', '202601', '202602', '202603', '202604']
const safetyBarColors = ['#4472c4', '#5ec4d4']
const safetyAlarmData = [230, 100, 130, 115, 110, 105]
const safetyHandleData = [178, 162, 118, 112, 183, 192]

function renderSafety() {
  charts.safety?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['报警数', '处理数'], top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9
    },
    grid: { left: 40, right: 14, top: 32, bottom: 28 },
    xAxis: {
      type: 'category', data: safetyMonths,
      ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 10 }
    },
    yAxis: { type: 'value', max: 250, ...baseAxis },
    series: [
      {
        name: '报警数', type: 'bar', barWidth: 22, barGap: '10%',
        data: safetyAlarmData,
        itemStyle: { color: safetyBarColors[0] }
      },
      {
        name: '处理数', type: 'bar', barWidth: 22,
        data: safetyHandleData,
        itemStyle: { color: safetyBarColors[1] }
      }
    ]
  }, { notMerge: true })
}

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderEnergy()
  renderCost()
  renderQuality()
  renderHrPie()
  renderHrDonut()
  renderSafety()
}

const handleResize = () => Object.values(charts).forEach(c => c.resize())

onMounted(async () => {
  await nextTick()
  initChart(energyChartRef.value, 'energy')
  initChart(costChartRef.value, 'cost')
  initChart(qualityChartRef.value, 'quality')
  initChart(hrPieChartRef.value, 'hrPie')
  initChart(hrDonutChartRef.value, 'hrDonut')
  initChart(safetyChartRef.value, 'safety')
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
  padding: 10px 12px;
  background: #f0f2f5;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}

.top-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 40px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.nav-btn {
  background: #fff;
  border: 1px solid #4472c4;
  color: #4472c4;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 28px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(68, 114, 196, 0.12);
}

.nav-btn:hover {
  background: #4472c4;
  color: #fff;
  box-shadow: 0 2px 8px rgba(68, 114, 196, 0.35);
  transform: translateY(-1px);
}

.plant-grid {
  display: grid;
  grid-template-columns: minmax(0, 28fr) minmax(0, 38fr) minmax(0, 34fr);
  gap: 10px;
  align-items: start;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.chart-card {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  min-width: 0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.chart-header {
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  border-left: 3px solid #4472c4;
  padding-left: 8px;
  line-height: 1.4;
}
.mini-tabs {
  flex-shrink: 0;
}
.mini-tabs button {
  font-size: 11px;
  padding: 2px 7px;
  white-space: nowrap;
}
.chart-body {
  height: 200px;
}

/* 产线出产情况表格 */
.line-output-table {
  padding: 0;
  max-height: 260px;
  overflow-y: auto;
}

.line-output-table::-webkit-scrollbar {
  width: 4px;
}

.line-output-table::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}

.lot-head,
.lot-row {
  display: flex;
  padding: 7px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.lot-head {
  background: #f7f9fc;
  font-weight: 600;
  color: #333;
  font-size: 12px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.lot-row {
  font-size: 12px;
  color: #444;
  transition: background 0.15s;
}

.lot-row:hover {
  background: #f7f9fc;
}

.lot-row:last-child {
  border-bottom: none;
}

.lot-col {
  flex: 1;
  text-align: center;
}

.lot-col-name {
  flex: 1.6;
  text-align: left;
  padding-left: 8px;
}

/* 动能消耗统计 */
.energy-summary {
  display: flex;
  gap: 8px;
  padding: 0 0 8px;
}

.energy-box {
  flex: 1;
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 8px 6px;
  text-align: center;
}

.energy-box-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.energy-box-value {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}

.energy-box-unit {
  font-size: 10px;
  font-weight: 400;
  color: #999;
}

.cost-body {
  height: 150px;
}

/* 成本吨均动能费用弹框 */
.cost-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cost-modal {
  background: #fff;
  border-radius: 6px;
  width: 820px;
  max-width: 92vw;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}

.cost-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid #e8e8e8;
}

.cost-modal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.cost-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.cost-modal-close {
  border: none;
  background: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}

.cost-modal-close:hover {
  color: #333;
}

.cost-modal-chart {
  height: 420px;
  padding: 8px;
}

.hr-modal-chart {
  height: 380px;
  padding: 12px;
}

/* 生产指标 */
.prod-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 4px 0 0;
}

.prod-summary {
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 10px 12px;
}

.ps-title {
  font-size: 11px;
  color: #888;
  margin-bottom: 8px;
  text-align: center;
}

.ps-row {
  display: flex;
  gap: 16px;
}

.ps-item {
  flex: 1;
  text-align: center;
}

.ps-num {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ps-label {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

.prod-side {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.ps-box {
  flex: 1;
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 8px 6px;
  text-align: center;
  min-width: 0;
}

.ps-value {
  font-size: 16px;
  font-weight: 700;
  color: #c00000;
  white-space: nowrap;
}

/* 厂区指标 */
.plant-indicators {
  padding: 4px 0 0;
}

.ind-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.ind-row:last-child {
  margin-bottom: 0;
}

.ind-box {
  flex: 1;
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 10px 6px;
  text-align: center;
  min-width: 0;
}

.ind-label {
  font-size: 10px;
  color: #888;
  margin-bottom: 6px;
  line-height: 1.3;
  min-height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ind-value {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 成本中心 */
.cost-body {
  height: 240px;
}

.cost-unit {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

.quality-chart {
  height: 240px;
}

/* 人力中心 */
.hr-panel {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 8px;
  padding: 4px 0 0;
  position: relative;
}

.hr-left, .hr-right {
  position: relative;
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
}

.hr-chart {
  height: 200px;
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
  gap: 10px;
  padding: 8px 0 0;
}

.device-box {
  text-align: center;
  background: #f7f9fc;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 12px 4px;
}

.device-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.device-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

/* 安防中心 */
.safety-chart {
  height: 240px;
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
