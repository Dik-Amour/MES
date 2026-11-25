<template>
  <div class="plant-dashboard">
    <!-- 标题栏：时间日期 + 右侧导航（导航首页=本页） -->
    <DashboardHeader title="材料成型中心运营大屏" :show-weather="false" variant="fui" show-nav />

    <!-- 第一行：独立指标卡（两行） -->
    <div class="plant-metrics">
      <div class="plant-metric-card" v-for="m in topMetrics" :key="m.label">
        <div class="plant-metric-content">
          <div class="plant-metric-label">{{ m.label }}</div>
          <div class="plant-metric-value">
            {{ m.value }}<span v-if="m.unit" class="plant-metric-unit">{{ m.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="plant-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">生产分析</span>
            <select v-model="productionLine" class="series-select">
              <option v-for="name in lineOptions" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <div ref="productionChartRef" class="chart-body"></div>
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
          <div ref="energyChartRef" class="chart-body"></div>
        </div>
      </div>

      <!-- 中列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">成本中心</span>
            <div class="mini-tabs cost-tabs">
              <button
                v-for="t in costTabs"
                :key="t"
                :class="{ active: costTab === t }"
                @click="costTab = t"
              >{{ t }}</button>
            </div>
          </div>
          <div ref="costChartRef" class="chart-body cost-body"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">质量中心</span>
            <div class="mini-tabs">
              <button
                v-for="t in qualityTabs"
                :key="t"
                :class="{ active: qualityTab === t }"
                @click="qualityTab = t"
              >{{ t }}</button>
            </div>
          </div>
          <div ref="qualityChartRef" class="chart-body quality-chart"></div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="col">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">人力中心</span>
            <div class="mini-tabs">
              <button
                v-for="t in hrTabs"
                :key="t"
                :class="{ active: hrTab === t }"
                @click="hrTab = t"
              >{{ t }}</button>
            </div>
          </div>
          <div class="hr-panel">
            <div class="hr-donut-wrap">
              <div ref="hrDonutChartRef" class="hr-chart"></div>
              <div class="hr-total">{{ hrTotal }}人</div>
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
            <span class="chart-title">安防中心</span>
            <div class="mini-tabs">
              <button
                v-for="t in safetyTabs"
                :key="t"
                :class="{ active: safetyTab === t }"
                @click="safetyTab = t"
              >{{ t }}</button>
            </div>
          </div>
          <div ref="safetyChartRef" class="chart-body safety-chart"></div>
        </div>
      </div>
    </div>

    <!-- 成本吨均动能费用弹框（点击柱状图年份打开） -->
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

    <!-- 质量废品率弹框（点击年份柱：该年逐月折线） -->
    <div v-if="qualityModalVisible" class="cost-modal-mask" @click.self="qualityModalVisible = false">
      <div class="cost-modal">
        <div class="cost-modal-header">
          <span class="cost-modal-title">{{ qualityModalSite }}{{ qualityModalYear }}年废品率</span>
          <div class="cost-modal-actions">
            <select v-model="qualityScrapType" class="series-select">
              <option v-for="s in qualityScrapTypes" :key="s" :value="s">{{ s }}</option>
            </select>
            <button class="cost-modal-close" @click="qualityModalVisible = false">✕</button>
          </div>
        </div>
        <div ref="qualityTrendChartRef" class="cost-modal-chart"></div>
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
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 图表DOM与实例 ==========
const energyChartRef = ref<HTMLElement>()
const costChartRef = ref<HTMLElement>()
const costTrendChartRef = ref<HTMLElement>()
let costTrendChart: echarts.ECharts | null = null
const costModalVisible = ref(false)
const costModalYear = ref('2025')
const qualityTrendChartRef = ref<HTMLElement>()
let qualityTrendChart: echarts.ECharts | null = null
const qualityModalVisible = ref(false)
const qualityModalYear = ref('2025')
const qualityScrapTypes = ['内部废品率', '外部废品率', '综合废品率'] as const
type QualityScrapType = (typeof qualityScrapTypes)[number]
const qualityScrapType = ref<QualityScrapType>('综合废品率')
const hrDonutChartRef = ref<HTMLElement>()
const hrModalChartRef = ref<HTMLElement>()
let hrModalChart: echarts.ECharts | null = null
const hrModalVisible = ref(false)
const hrModalTitle = ref('')
const safetyChartRef = ref<HTMLElement>()
const productionChartRef = ref<HTMLElement>()
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
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

// 质量中心：Tab（材料成型 / 工业园区 / 安丘厂区）+ 近五年废品率堆叠柱
const qualityTabs = ['材料成型', '工业园区', '安丘厂区'] as const
type QualityTab = (typeof qualityTabs)[number]
const qualityTab = ref<QualityTab>('材料成型')
const qualityModalSite = ref<QualityTab>('材料成型')

/** 近五年年份标签 */
const qualityYears = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => String(y - 4 + i))
})()

/** 各厂区近五年 内部/外部废品率（%）；综合 = 内部 + 外部 */
const qualityScrapData: Record<QualityTab, { internal: number[]; external: number[] }> = {
  材料成型: {
    internal: [0.72, 0.68, 0.75, 0.70, 0.65],
    external: [0.58, 0.55, 0.62, 0.52, 0.50]
  },
  工业园区: {
    internal: [0.70, 0.66, 0.72, 0.68, 0.63],
    external: [0.55, 0.58, 0.56, 0.54, 0.51]
  },
  安丘厂区: {
    internal: [0.75, 0.71, 0.78, 0.73, 0.69],
    external: [0.60, 0.57, 0.64, 0.56, 0.53]
  }
}

function renderQuality() {
  const d = qualityScrapData[qualityTab.value]
  charts.quality?.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const lines = [`${params[0].axisValue}<br/>`]
        let sum = 0
        params.forEach((p: any) => {
          lines.push(`${p.marker} ${p.seriesName}: ${p.value}%<br/>`)
          if (p.seriesName === '内部废品率' || p.seriesName === '外部废品率') {
            sum += Number(p.value) || 0
          }
        })
        lines.push(`<b>综合废品率: ${Math.round(sum * 100) / 100}%</b>`)
        return lines.join('')
      }
    },
    legend: {
      data: ['内部废品率', '外部废品率'],
      top: 0,
      left: 'center',
      textStyle: { color: '#666', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 9
    },
    grid: { left: 44, right: 14, top: 34, bottom: 28 },
    xAxis: {
      type: 'category',
      data: qualityYears,
      ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      ...baseAxis,
      axisLabel: {
        ...baseAxis.axisLabel,
        formatter: (v: number) => `${v}%`
      },
      splitNumber: 5
    },
    series: [
      {
        name: '内部废品率',
        type: 'bar',
        stack: 'scrap',
        barWidth: 28,
        data: d.internal,
        itemStyle: { color: '#4472c4' },
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          fontSize: 9,
          formatter: '{c}%'
        }
      },
      {
        name: '外部废品率',
        type: 'bar',
        stack: 'scrap',
        barWidth: 28,
        data: d.external,
        itemStyle: { color: '#5ec4d4' },
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          fontSize: 9,
          formatter: '{c}%'
        }
      }
    ]
  }, { notMerge: true })

  charts.quality?.off('click')
  charts.quality?.on('click', (params: any) => {
    if (params.name) qualityModalYear.value = String(params.name)
    qualityModalSite.value = qualityTab.value
    qualityModalVisible.value = true
  })
}

/** 该年 12 个月废品率 mock（按厂区 + 年份 + 类型确定性生成） */
function buildMonthlyScrap(site: QualityTab, year: string, type: QualityScrapType): number[] {
  let seed = 0
  const key = `${site}|${year}|${type}`
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0
  const baseMap: Record<QualityScrapType, number> = {
    内部废品率: 0.7,
    外部废品率: 0.55,
    综合废品率: 1.25
  }
  const siteAdj: Record<QualityTab, number> = {
    材料成型: 0,
    工业园区: -0.05,
    安丘厂区: 0.08
  }
  const yearAdj = (parseInt(year, 10) % 5) * 0.02 - 0.04
  const base = baseMap[type] + siteAdj[site] + yearAdj
  return Array.from({ length: 12 }, (_, m) => {
    const wave = Math.sin((seed % 100) / 10 + m * 0.9) * 0.12
    const jitter = (((seed >> (m % 8)) % 20) - 10) / 100
    return Math.max(0.05, Math.round((base + wave + jitter) * 100) / 100)
  })
}

function renderQualityTrend() {
  if (!qualityTrendChartRef.value) return
  if (qualityTrendChart) qualityTrendChart.dispose()
  qualityTrendChart = echarts.init(qualityTrendChartRef.value)
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
  const data = buildMonthlyScrap(qualityModalSite.value, qualityModalYear.value, qualityScrapType.value)
  const colorMap: Record<QualityScrapType, string> = {
    内部废品率: '#4472c4',
    外部废品率: '#5ec4d4',
    综合废品率: '#70ad47'
  }
  const color = colorMap[qualityScrapType.value]
  qualityTrendChart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => `${v}%`
    },
    grid: { left: 48, right: 24, top: 30, bottom: 36 },
    xAxis: {
      type: 'category',
      data: months,
      ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      ...baseAxis,
      name: '%',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' }
    },
    series: [{
      name: qualityScrapType.value,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data,
      itemStyle: { color },
      lineStyle: { width: 2, color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '08' }
          ]
        }
      },
      label: {
        show: true,
        position: 'top',
        color: '#666',
        fontSize: 9,
        formatter: '{c}%'
      }
    }]
  }, { notMerge: true })
}

watch(qualityTab, () => renderQuality())

watch(qualityModalVisible, (v) => {
  if (v) nextTick(renderQualityTrend)
})

watch(qualityScrapType, () => {
  if (qualityModalVisible.value) renderQualityTrend()
})

// 人力中心：Tab（材料成型 / 工业园区 / 安丘园区）+ 仅环形图
const hrTabs = ['材料成型', '工业园区', '安丘园区'] as const
type HrTab = (typeof hrTabs)[number]
const hrTab = ref<HrTab>('材料成型')

const hrDonutColors = ['#4472c4', '#ed7d31', '#3ba8a0', '#ffc000', '#a5a5a5', '#70ad47', '#c00000']

/** 各园区产线人数分布 */
const hrDonutBySite: Record<HrTab, { name: string; value: number }[]> = {
  材料成型: [
    { name: '造型一线大件', value: 88 },
    { name: '造型一线中件', value: 434 },
    { name: '造型二线大件', value: 124 },
    { name: '造型二线中件', value: 100 },
    { name: '造型三线KW', value: 68 },
    { name: '造型三线HWS', value: 123 },
    { name: '清理工段', value: 656 }
  ],
  工业园区: [
    { name: '造型一线大件', value: 72 },
    { name: '造型一线中件', value: 380 },
    { name: '造型二线大件', value: 110 },
    { name: '造型二线中件', value: 95 },
    { name: '造型三线KW', value: 55 },
    { name: '造型三线HWS', value: 108 },
    { name: '清理工段', value: 540 }
  ],
  安丘园区: [
    { name: '造型一线大件', value: 65 },
    { name: '造型一线中件', value: 290 },
    { name: '造型二线大件', value: 88 },
    { name: '造型二线中件', value: 76 },
    { name: '造型三线KW', value: 42 },
    { name: '造型三线HWS', value: 90 },
    { name: '清理工段', value: 420 }
  ]
}

const hrDonutData = computed(() => hrDonutBySite[hrTab.value])
const hrDonutLegend = computed(() =>
  hrDonutData.value.map((d, i) => ({
    name: d.name,
    color: hrDonutColors[i % hrDonutColors.length]
  }))
)
const hrTotal = computed(() => hrDonutData.value.reduce((s, d) => s + d.value, 0))

// 各产线岗位分布（按当前园区产线派生）
const hrPositionNames = ['熔炼工', '造型工', '清理工', '检验员', '维修工']
const hrPositions = computed<Record<string, { name: string; value: number }[]>>(() => {
  const map: Record<string, { name: string; value: number }[]> = {
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
  hrDonutData.value.forEach((line, li) => {
    map[line.name] = hrPositionNames.map((p, i) => ({
      name: p,
      value: 80 + ((li * 37 + i * 53) % 160)
    }))
  })
  return map
})

// 点击环形图 → 打开岗位分布弹框
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
      const data = hrPositions.value[hrModalTitle.value] || hrPositions.value['车间人员']
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
  { label: 'MTTR', unit: '分钟', value: '33' }
]

/** 顶部两行指标卡：年度出产/入库 + 厂区指标 + 设备中心 */
const topMetrics = computed(() => {
  const prod = prodData[prodYear.value]
  const plant = indicatorGroups.flat().map(it => ({
    label: it.label,
    value: it.value,
    unit: ''
  }))
  const device = deviceItems.map(d => ({
    label: d.unit ? `${d.label}（${d.unit}）` : d.label,
    value: d.value,
    unit: ''
  }))
  return [
    { label: '年度出产', value: String(prod.output), unit: '吨' },
    { label: '年度入库', value: String(prod.inbound), unit: '吨' },
    ...plant,
    ...device
  ]
})

// 产线列表（下拉选项与原表格产线一致）
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
const lineOptions = lineOutputData.map(r => r.name)
const productionLine = ref(lineOptions[0])

/** 近六个月标签（含当月） */
const productionMonths = (() => {
  const now = new Date()
  const labels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return labels
})()

/** 按产线名生成确定性 mock：计划 / 出产 / 细清（近六个月） */
function buildProductionSeries(line: string) {
  let seed = 0
  for (let i = 0; i < line.length; i++) seed = (seed * 31 + line.charCodeAt(i)) >>> 0
  const plan: number[] = []
  const output: number[] = []
  const clean: number[] = []
  for (let m = 0; m < 6; m++) {
    const base = 70 + ((seed >> (m * 3)) % 40)
    const p = base + (m % 3) * 5
    const o = Math.round(p * (0.82 + ((seed + m * 17) % 18) / 100))
    const c = Math.round(o * (0.78 + ((seed + m * 11) % 15) / 100))
    plan.push(p)
    output.push(o)
    clean.push(c)
  }
  return { plan, output, clean }
}

function renderProduction() {
  const { plan, output, clean } = buildProductionSeries(productionLine.value)
  const rate = plan.map((p, i) => (p ? Math.round((output[i] / p) * 1000) / 10 : 0))
  charts.production?.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const lines = [`${params[0].axisValue}<br/>`]
        params.forEach((p: any) => {
          const unit = p.seriesName === '计划完成率' ? '%' : ''
          lines.push(`${p.marker} ${p.seriesName}: ${p.value}${unit}<br/>`)
        })
        return lines.join('')
      }
    },
    legend: {
      data: ['计划数', '出产数', '细清数', '计划完成率'],
      top: 0,
      textStyle: { color: '#666', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 9
    },
    grid: { left: 44, right: 44, top: 34, bottom: 28 },
    xAxis: {
      type: 'category',
      data: productionMonths,
      ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, fontSize: 10 }
    },
    yAxis: [
      { type: 'value', ...baseAxis, name: '数量', nameTextStyle: { color: '#999', fontSize: 10 } },
      {
        type: 'value',
        min: 0,
        max: 100,
        ...baseAxis,
        position: 'right',
        splitLine: { show: false },
        axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '计划数',
        type: 'bar',
        barWidth: 14,
        barGap: '30%',
        data: plan,
        itemStyle: { color: '#7ec8f5' }
      },
      {
        name: '出产数',
        type: 'bar',
        barWidth: 14,
        data: output,
        itemStyle: { color: '#18b6d8' }
      },
      {
        name: '细清数',
        type: 'bar',
        barWidth: 14,
        data: clean,
        itemStyle: { color: '#7ed99a' }
      },
      {
        name: '计划完成率',
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

watch(productionLine, () => renderProduction())

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

// 成本中心：Tab（与质量中心一致）+ 近五年 元/吨；点击柱打开动能费用弹框
const costTabs = ['材料成型', '工业园区', '安丘厂区'] as const
type CostTab = (typeof costTabs)[number]
const costTab = ref<CostTab>('材料成型')

const costYears = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => String(y - 4 + i))
})()

/** 各厂区近五年吨均成本（元/吨） */
const costBySite: Record<CostTab, number[]> = {
  材料成型: [248, 236, 252, 241, 229],
  工业园区: [232, 245, 238, 249, 236],
  安丘厂区: [255, 261, 247, 258, 244]
}

// 成本吨均动能费用弹框数据
const costTrendCategories = ['原材料', '辅料', '动能', '废品损失', '设备维修', '工具工装', '外部加工费']
const costTrendColors = ['#4472c4', '#5ec4d4', '#3ba8a0', '#ffc000', '#ed7d31', '#c00000', '#70ad47']
const costTrendX = ['202501','202502','202503','202504','202505','202506','202507','202508','202509','202510','202511','202512']
const costTrendCategory = ref(costTrendCategories[0])
const costModalFactory = ref(costTab.value)

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

function renderCostTrend() {
  if (!costTrendChartRef.value) return
  if (costTrendChart) costTrendChart.dispose()
  costTrendChart = echarts.init(costTrendChartRef.value)
  const siteIdx = costTabs.indexOf(costModalFactory.value as CostTab)
  const seed = Math.max(0, siteIdx) * 3 + (parseInt(costModalYear.value, 10) % 3)
  const trendData = genCostTrend(seed)
  const idx = Math.max(0, costTrendCategories.indexOf(costTrendCategory.value))
  costTrendChart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => v + ' 元/吨' },
    legend: { show: false },
    grid: { left: 56, right: 34, top: 30, bottom: 40 },
    xAxis: {
      type: 'category', data: costTrendX, ...baseAxis, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, rotate: 45, fontSize: 10 }
    },
    yAxis: {
      type: 'value', max: 280, name: '元/吨',
      nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis
    },
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

/** 点击柱子（年份）打开弹框；厂区取当前 Tab */
function onCostChartClick() {
  costModalFactory.value = costTab.value
  costModalVisible.value = true
}

watch(costModalVisible, (v) => {
  if (v) nextTick(renderCostTrend)
})

watch(costTrendCategory, () => {
  if (costModalVisible.value) renderCostTrend()
})

function renderCost() {
  charts.cost?.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v: number) => `${v} 元/吨`
    },
    grid: { left: 48, right: 14, top: 30, bottom: 28 },
    xAxis: {
      type: 'category',
      data: costYears,
      ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      ...baseAxis,
      name: '元/吨',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLabel: { ...baseAxis.axisLabel, formatter: '{value}' }
    },
    series: [
      {
        name: costTab.value,
        type: 'bar',
        barWidth: 28,
        data: costBySite[costTab.value],
        itemStyle: {
          color: '#4472c4',
          borderRadius: [3, 3, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#4472c4',
          fontSize: 10,
          formatter: '{c}'
        }
      }
    ]
  }, { notMerge: true })

  charts.cost?.off('click')
  charts.cost?.on('click', (params: any) => {
    if (params.name) costModalYear.value = String(params.name)
    onCostChartClick()
  })
}

watch(costTab, () => renderCost())

// ========== 初始化 ==========
// 人力中心 - 产线分布环形图（仅环形）
function renderHrDonut() {
  const data = hrDonutData.value
  charts.hrDonut?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '44%'],
      data: data.map((d, i) => ({
        ...d,
        itemStyle: { color: hrDonutColors[i % hrDonutColors.length] }
      })),
      label: {
        show: true,
        color: '#666',
        fontSize: 9,
        formatter: '{b}\n{c}'
      },
      labelLine: { length: 4, length2: 6 },
      itemStyle: { borderColor: '#fff', borderWidth: 1 }
    }]
  }, { notMerge: true })
  charts.hrDonut?.off('click')
  charts.hrDonut?.on('click', (params: any) => openHrModal(params.name))
}

watch(hrTab, () => renderHrDonut())

// 安防中心：Tab（与质量/成本一致）+ 近六月报警/处理分组柱
const safetyTabs = ['材料成型', '工业园区', '安丘厂区'] as const
type SafetyTab = (typeof safetyTabs)[number]
const safetyTab = ref<SafetyTab>('材料成型')

const safetyMonths = ['202511', '202512', '202601', '202602', '202603', '202604']
const safetyBarColors = ['#4472c4', '#5ec4d4']

/** 各厂区近六月 报警 / 处理 */
const safetyBySite: Record<SafetyTab, { alarm: number[]; handle: number[] }> = {
  材料成型: {
    alarm: [230, 100, 130, 115, 110, 105],
    handle: [178, 162, 118, 112, 183, 192]
  },
  工业园区: {
    alarm: [198, 124, 145, 98, 132, 117],
    handle: [165, 110, 128, 90, 118, 105]
  },
  安丘厂区: {
    alarm: [210, 88, 156, 130, 96, 142],
    handle: [172, 82, 140, 121, 88, 130]
  }
}

function renderSafety() {
  const d = safetyBySite[safetyTab.value]
  charts.safety?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['报警数', '处理数'],
      top: 0,
      left: 'center',
      textStyle: { color: '#666', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 9
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
        data: d.alarm,
        itemStyle: { color: safetyBarColors[0] }
      },
      {
        name: '处理数', type: 'bar', barWidth: 22,
        data: d.handle,
        itemStyle: { color: safetyBarColors[1] }
      }
    ]
  }, { notMerge: true })
}

watch(safetyTab, () => renderSafety())

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderProduction()
  renderEnergy()
  renderCost()
  renderQuality()
  renderHrDonut()
  renderSafety()
}

const handleResize = () => Object.values(charts).forEach(c => c.resize())

onMounted(async () => {
  await nextTick()
  initChart(productionChartRef.value, 'production')
  initChart(energyChartRef.value, 'energy')
  initChart(costChartRef.value, 'cost')
  initChart(qualityChartRef.value, 'quality')
  initChart(hrDonutChartRef.value, 'hrDonut')
  initChart(safetyChartRef.value, 'safety')
  renderAll()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
  if (costTrendChart) costTrendChart.dispose()
  if (qualityTrendChart) qualityTrendChart.dispose()
  if (hrModalChart) hrModalChart.dispose()
})
</script>

<style src="./dashboard-common.css"></style>

<style scoped>
.plant-dashboard {
  padding: 8px;
  background: #f0f2f5;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}

/* 顶部两行指标卡（寒亭独立类名 plant-metric-*，白底） */
.plant-metrics {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.plant-metric-card {
  position: relative;
  width: 100%;
  height: 120px;
  min-height: 120px;
  max-height: 120px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 12px 14px;
  /* 寒亭指标卡：白底（独立类名，避免被滨海 top-indicator-* 全局规则覆盖） */
  background: #fff !important;
  background-color: #fff !important;
  background-image: none !important;
  color: #1a1a1a !important;
  border: 1px solid #e8ecf0 !important;
  border-left: 3px solid #4472c4 !important;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
}

.plant-metric-content {
  position: relative;
  z-index: 1;
  min-width: 0;
  width: 100%;
}

.plant-metric-label {
  margin-bottom: 6px;
  color: #888;
  font-size: 12px;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-metric-value {
  color: #1a1a1a;
  font-family: 'DIN Alternate', 'Bahnschrift', 'Segoe UI', sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-metric-unit {
  margin-left: 4px;
  color: #888;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 1400px) {
  .plant-metrics {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .plant-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.plant-grid {
  display: grid;
  /* 三列等宽；模块间距保持 10px 不变 */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

/* 下方模块卡片固定高度 360px */
.plant-grid .chart-card {
  height: 360px;
  min-height: 360px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.plant-grid .chart-card .chart-header {
  flex-shrink: 0;
}

.plant-grid .chart-card .chart-body,
.plant-grid .chart-card .hr-panel {
  flex: 1;
  min-height: 0;
  height: auto;
}

.plant-grid .chart-card .energy-summary {
  flex-shrink: 0;
  height: auto;
}

.plant-grid .chart-card .chart-body {
  height: auto;
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
  height: auto;
}

/* 动能消耗统计 */
.energy-summary {
  display: flex;
  gap: 8px;
  padding: 0 0 8px;
}

.energy-box {
  flex: 1;
  background: #fff;
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

/* 成本中心（高度由 .plant-grid .chart-card 统一控制） */
.cost-body {
  height: auto;
  cursor: pointer;
}

/* Tab 靠右 */
.cost-tabs {
  margin-left: auto;
}

.quality-chart {
  height: auto;
}

/* 人力中心：仅环形图 */
.hr-panel {
  display: flex;
  flex-direction: column;
  padding: 4px 0 0;
  position: relative;
  height: 100%;
  min-height: 0;
}

.hr-donut-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 4px;
  padding: 6px;
  overflow: hidden;
}

.hr-chart {
  flex: 1;
  min-height: 0;
  height: auto;
}

.hr-donut-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 2px;
  max-height: 52px;
  overflow-y: auto;
  flex-shrink: 0;
}

.hr-total {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 700;
  color: #333;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
}

/* 安防中心（高度由卡片统一控制） */
.safety-chart {
  height: auto;
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
