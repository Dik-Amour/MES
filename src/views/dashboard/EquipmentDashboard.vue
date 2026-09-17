<template>
  <div class="equipment-dashboard">
    <!-- 大屏标题 -->
    <DashboardHeader title="材料成型中心工业园区设备监控大屏" />

    <!-- 第一行：指标卡片 -->
    <div class="top-row">
      <div class="chart-card">
        <div class="chart-title">设备运维成本指标</div>
        <div class="stat-grid cols-3">
          <div class="stat-box">
            <div class="stat-label">吨均设备维修费用</div>
            <div class="stat-value">125.8<span class="unit">元/吨</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">大修费用</div>
            <div class="stat-value">1,850<span class="unit">万元</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">备件库存金额</div>
            <div class="stat-value">3,260<span class="unit">万元</span></div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">设备总览</div>
        <div class="stat-grid cols-3">
          <div class="stat-box">
            <div class="stat-label">设备数量</div>
            <div class="stat-value">1,248<span class="unit">台/套</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">主要生产设备</div>
            <div class="stat-value">856<span class="unit">台/套</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">净值/原值</div>
            <div class="stat-value">2.85/3.42<span class="unit">亿元</span></div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">设备运行指标</div>
        <div class="stat-grid cols-2">
          <div class="stat-box">
            <div class="stat-label">MTTR</div>
            <div class="stat-value">68.5<span class="unit">分钟</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">MTBF</div>
            <div class="stat-value">5,280<span class="unit">小时</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">可动率</div>
            <div class="stat-value">98.5<span class="unit">%</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">OEE</div>
            <div class="stat-value">65.2<span class="unit">%</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第二行：趋势图表 -->
    <div class="chart-row">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">吨均设备维修费用分析</span>
          <div class="mini-tabs">
            <button
              v-for="t in repairTrendTabs"
              :key="t.key"
              :class="{ active: repairTrendMode === t.key }"
              @click="repairTrendMode = t.key"
            >{{ t.label }}</button>
          </div>
        </div>
        <div ref="repairTrendChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">各产线备件库存资金</span>
        </div>
        <div ref="spareChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">设备可动率</span>
          <div class="mini-tabs">
            <button
              v-for="t in rateTabs"
              :key="t.key"
              :class="{ active: rateMode === t.key }"
              @click="rateMode = t.key"
            >{{ t.label }}</button>
          </div>
        </div>
        <div ref="rateChartRef" class="chart-body"></div>
      </div>
    </div>

    <!-- 第三行：重点设备概况 -->
    <div class="equipment-panel">
      <div class="chart-title">重点设备概况</div>
      <div class="equipment-box">
        <!-- 设备类型Tab -->
        <div class="eq-tabs">
          <button
            v-for="t in equipmentTypes"
            :key="t"
            :class="{ active: activeEquipmentType === t }"
            @click="activeEquipmentType = t"
          >{{ t }}</button>
        </div>

        <div class="eq-content">
          <!-- 左侧：产线统计表 -->
          <div class="table-wrapper left-table">
            <table class="eq-table">
              <thead>
                <tr>
                  <th rowspan="2" class="head-corner">
                    <span class="corner-label dim">视觉类型</span>
                    <span class="corner-label">产线/车间</span>
                  </th>
                  <th v-for="c in currentTypeColumns" :key="c">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in currentTypeRows" :key="row.name" :class="{ 'row-total': row.name === '合计' }">
                  <td>{{ row.name }}</td>
                  <td v-for="c in currentTypeColumns" :key="c" class="text-center">{{ row.values[c] ?? 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 右侧：品牌分布 -->
          <div class="brand-panel">
            <div class="brand-tabs">
              <button
                v-for="t in brandTabs"
                :key="t.key"
                :class="{ active: brandMode === t.key }"
                @click="brandMode = t.key"
              >{{ t.label }}</button>
            </div>
            <div class="table-wrapper">
              <table class="eq-table brand-table">
                <thead>
                  <tr>
                    <th class="w-40">{{ brandMode === 'type-brand' ? '应用设备类型' : '应用设备类型' }}</th>
                    <th class="w-30">{{ brandMode === 'type-brand' ? '品牌' : '品牌' }}</th>
                    <th class="w-20">数量</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="group in currentBrandGroups" :key="group.name">
                    <tr>
                      <!-- 应用设备类型单元格纵向合并整组（小计+明细行） -->
                      <td class="group-name" :rowspan="group.items.length + 1">{{ group.name }}</td>
                      <td class="text-center subtotal">小计</td>
                      <td class="text-center subtotal">{{ group.subtotal }}</td>
                    </tr>
                    <tr v-for="b in group.items" :key="group.name + b.name">
                      <td class="text-center">{{ b.name }}</td>
                      <td class="text-center">{{ b.value }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 图表DOM与实例 ==========
const repairTrendChartRef = ref<HTMLElement>()
const spareChartRef = ref<HTMLElement>()
const rateChartRef = ref<HTMLElement>()
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const repairTrendMode = ref('factory-year')
const rateMode = ref('factory-year')
const activeEquipmentType = ref('视觉')
const brandMode = ref('type-brand')

const repairTrendTabs = [
  { key: 'factory-year', label: '分厂年度趋势' },
  { key: 'factory-month', label: '分厂月度趋势' },
  { key: 'line-month', label: '产线月度趋势' }
]
const rateTabs = [
  { key: 'factory-year', label: '分厂年度' },
  { key: 'factory-month', label: '分厂月度' },
  { key: 'line-month', label: '各产线月度' }
]
const equipmentTypes = ['机器人', '熔炼设备', '三坐标', '叉车', '视觉', 'AGV和RGV', 'PLC']
const brandTabs = [
  { key: 'brand-visual', label: '品牌-视觉类型分布' },
  { key: 'brand-app', label: '品牌-应用设备类型分布' },
  { key: 'type-brand', label: '应用设备类型-品牌分布' }
]

// ========== 设备类型统计（产线 x 类型列） ==========
const typeColumnsMap: Record<string, string[]> = {
  '机器人': ['焊接', '搬运', '喷涂', '打磨', '其他', '合计'],
  '熔炼设备': ['中频炉', '冲天炉', '保温炉', '浇注机', '其他', '合计'],
  '三坐标': ['桥式', '龙门式', '关节臂', '其他', '合计'],
  '叉车': ['内燃', '电动', '堆高', '其他', '合计'],
  '视觉': ['相机', '光学', '红外', '激光', '其他', '合计'],
  'AGV和RGV': ['AGV小车', 'RGV小车', '其他', '合计'],
  'PLC': ['西门子', '三菱', '欧姆龙', '施耐德', '其他', '合计']
}

const workshopRows = [
  'ACM材料成型中心安丘造型车间中件制芯',
  'AHL材料成型中心安丘造型车间大件HWS线',
  'AHM材料成型中心安丘造型车间中件HWS线',
  'AQL材料成型中心安丘造型四线大件清理',
  'GGB材料成型制造中心（潍坊）造型二线中',
  'GGC材料成型制造中心（潍坊）造型二线大',
  'GGD材料成型制造中心（潍坊）造型一线大',
  'GGE材料成型制造中心（潍坊）造型三线KW',
  'GGM材料成型制造中心（潍坊）造型三线',
  'GGZ材料成型制造中心（潍坊）造型一线中'
]

// 每种设备类型的基础数量（按产线分配），视觉类型为截图中数据
const typeBaseCounts: Record<string, number[]> = {
  '视觉': [77, 1, 2, 3, 10, 11, 15, 13, 18, 1],
  '机器人': [12, 4, 6, 8, 5, 7, 9, 6, 11, 3],
  '熔炼设备': [8, 3, 5, 4, 6, 5, 7, 4, 8, 2],
  '三坐标': [2, 1, 1, 2, 1, 1, 2, 1, 2, 1],
  '叉车': [5, 3, 4, 6, 4, 5, 6, 4, 7, 2],
  'AGV和RGV': [10, 6, 8, 9, 7, 8, 10, 7, 12, 4],
  'PLC': [15, 9, 12, 14, 11, 12, 15, 11, 18, 6]
}

// 将基础数量分配到各类型列
const buildTypeRows = (type: string) => {
  const cols = typeColumnsMap[type].filter(c => c !== '合计')
  const totals = typeBaseCounts[type] || []
  const rows: { name: string; values: Record<string, number> }[] = []

  const allRows = [{ name: '合计', counts: totals }, ...workshopRows.map((n, i) => ({ name: n, counts: [totals[i]] }))]

  allRows.forEach(r => {
    const values: Record<string, number> = {}
    const sum = r.counts.reduce((s, v) => s + v, 0)
    if (r.name === '合计') {
      // 合计行：按比例分配到各列
      cols.forEach((c, ci) => {
        values[c] = Math.round(sum * [0.35, 0.2, 0.15, 0.12, 0.18][ci % 5] * 0.01) || 0
      })
      // 修正视觉类型的特殊分布
      if (type === '视觉') {
        values['相机'] = 77; values['光学'] = 0; values['红外'] = 0; values['激光'] = 0; values['其他'] = 0
      }
      let colSum = cols.reduce((s, c) => s + (values[c] || 0), 0)
      values[cols[0]] = (values[cols[0]] || 0) + (sum - colSum)
    } else {
      const base = r.counts[0] || 0
      cols.forEach((c, ci) => {
        if (type === '视觉') {
          values[c] = ci === 0 ? base : 0
        } else {
          values[c] = ci === 0 ? Math.max(0, base - Math.floor(base * 0.4)) : Math.floor(base * 0.4 / (cols.length - 1)) * (ci === 1 ? 1 : 0) + (ci === 1 ? 0 : 0)
          if (ci > 0) values[c] = Math.floor((base * 0.4) / (cols.length - 1))
          if (ci === cols.length - 1) {
            const assigned = cols.slice(0, -1).reduce((s, cc) => s + (values[cc] || 0), 0)
            values[c] = base - assigned
          }
        }
      })
    }
    values['合计'] = cols.reduce((s, c) => s + (values[c] || 0), 0)
    rows.push({ name: r.name, values })
  })
  return rows
}

const currentTypeColumns = computed(() => typeColumnsMap[activeEquipmentType.value] || [])
const currentTypeRows = computed(() => buildTypeRows(activeEquipmentType.value))

// ========== 品牌分布数据 ==========
interface BrandItem { name: string; value: number }
interface BrandGroup { name: string; subtotal: number; items: BrandItem[] }

const brandDataMap: Record<string, Record<string, BrandGroup[]>> = {
  '机器人': {
    'type-brand': [
      { name: '机器人', subtotal: 45, items: [
        { name: '美国-康耐视', value: 26 }, { name: '日本-发那科', value: 11 },
        { name: '中国-梅卡曼德', value: 3 }, { name: '德国-巴斯勒', value: 2 },
        { name: '斯洛伐克-', value: 1 }, { name: '中国-海康威视', value: 1 }, { name: '加拿大-乐姆迈', value: 1 }
      ]},
      { name: '清理设备', subtotal: 11, items: [
        { name: '美国-康耐视', value: 9 }, { name: '中国-海康威视', value: 2 }
      ]}
    ]
  },
  '熔炼设备': {
    'type-brand': [
      { name: '熔炼设备', subtotal: 52, items: [
        { name: '德国-应达', value: 18 }, { name: '美国-ABP', value: 14 },
        { name: '中国-新研', value: 10 }, { name: '日本-富士电机', value: 7 }, { name: '中国-中频', value: 3 }
      ]},
      { name: '清理设备', subtotal: 8, items: [{ name: '中国-纽威', value: 8 }] }
    ]
  },
  '三坐标': {
    'type-brand': [
      { name: '三坐标', subtotal: 14, items: [
        { name: '德国-蔡司', value: 8 }, { name: '英国-雷尼绍', value: 4 }, { name: '日本-三丰', value: 2 }
      ]}
    ]
  },
  '叉车': {
    'type-brand': [
      { name: '叉车', subtotal: 46, items: [
        { name: '中国-杭叉', value: 20 }, { name: '中国-合力', value: 16 },
        { name: '日本-丰田', value: 6 }, { name: '德国-林德', value: 4 }
      ]}
    ]
  },
  '视觉': {
    'type-brand': [
      { name: '机器人', subtotal: 45, items: [
        { name: '美国-康耐视', value: 26 }, { name: '日本-发那科', value: 11 },
        { name: '中国-梅卡曼德', value: 3 }, { name: '德国-巴斯勒', value: 2 },
        { name: '斯洛伐克-', value: 1 }, { name: '中国-海康威视', value: 1 }, { name: '加拿大-乐姆迈', value: 1 }
      ]},
      { name: '清理设备', subtotal: 11, items: [
        { name: '美国-康耐视', value: 9 }, { name: '中国-海康威视', value: 2 }
      ]}
    ]
  },
  'AGV和RGV': {
    'type-brand': [
      { name: 'AGV和RGV', subtotal: 91, items: [
        { name: '中国-新松', value: 32 }, { name: '中国-海康机器人', value: 28 },
        { name: '德国-德马泰克', value: 19 }, { name: '日本-大福', value: 12 }
      ]}
    ]
  },
  'PLC': {
    'type-brand': [
      { name: 'PLC', subtotal: 123, items: [
        { name: '德国-西门子', value: 68 }, { name: '日本-三菱', value: 32 },
        { name: '日本-欧姆龙', value: 15 }, { name: '法国-施耐德', value: 8 }
      ]}
    ]
  }
}

// 其余两个品牌Tab视图维度（数据同源，换分组标题）
const brandDataMap2: Record<string, Record<string, BrandGroup[]>> = {}
Object.keys(brandDataMap).forEach(type => {
  const groups = brandDataMap[type]['type-brand']
  // 品牌-XX分布：按品牌聚合
  const brandAgg: Record<string, number> = {}
  groups.forEach(g => g.items.forEach(i => { brandAgg[i.name] = (brandAgg[i.name] || 0) + i.value }))
  const brandGroups: BrandGroup[] = Object.entries(brandAgg).map(([name, value]) => ({
    name: name.split('-')[0] || name, subtotal: value, items: [{ name, value }]
  }))
  brandDataMap2[type] = { 'brand-visual': brandGroups, 'brand-app': brandGroups, 'type-brand': groups }
})

const currentBrandGroups = computed<BrandGroup[]>(() => {
  const type = activeEquipmentType.value
  const mode = brandMode.value
  const m = brandDataMap2[type] || brandDataMap2['视觉']
  return m[mode] || m['type-brand']
})

// ========== 趋势数据 ==========
const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027']
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const repairTrendData: Record<string, { x: string[]; y: number[] }> = {
  'factory-year': { x: years, y: [102, 140, 230, 101, 110, 129, 160, 222] },
  'factory-month': { x: months, y: [120, 135, 118, 142, 128, 155, 138, 126, 148, 132, 158, 144] }
}

// 产线月度趋势：多条折线，9条产线
const repairLineNames = [
  '熔炼一线', '熔炼二线', '熔炼三线',
  '造型一线大件', '造型一线中件',
  '造型二线大件', '造型二线中件',
  '造型三线HWS', '造型三线KW'
]
// 各产线基准值与波动幅度（模拟吨均维修费用）
const repairLineBase: Record<string, { base: number; amp: number; phase: number }> = {
  '熔炼一线': { base: 140, amp: 22, phase: 0.3 },
  '熔炼二线': { base: 125, amp: 18, phase: 1.1 },
  '熔炼三线': { base: 158, amp: 25, phase: 2.0 },
  '造型一线大件': { base: 110, amp: 16, phase: 2.8 },
  '造型一线中件': { base: 96, amp: 14, phase: 3.6 },
  '造型二线大件': { base: 132, amp: 20, phase: 4.4 },
  '造型二线中件': { base: 105, amp: 15, phase: 5.2 },
  '造型三线HWS': { base: 168, amp: 26, phase: 6.0 },
  '造型三线KW': { base: 148, amp: 22, phase: 6.8 }
}
const repairLineColors = [
  '#4472c4', '#3ba8a0', '#70ad47', '#ffc000', '#ed7d31',
  '#5b9bd5', '#a5a5a5', '#7030a0', '#c00000'
]

const buildRepairLineSeries = () => {
  return repairLineNames.map(name => {
    const { base, amp, phase } = repairLineBase[name]
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: months.map((_, i) => Math.round(base + Math.sin(phase + i * 0.9) * amp + (i % 3 === 0 ? amp * 0.3 : 0))),
      itemStyle: { color: repairLineColors[repairLineNames.indexOf(name)] },
      lineStyle: { width: 2 }
    }
  })
}

// 各产线备件库存资金（横轴：产线）
const spareLineNames = [
  '熔炼一线', '熔炼二线', '熔炼三线',
  '造型一线大件', '造型一线中件',
  '造型二线大件', '造型二线中件',
  '造型三线HWS', '造型三线KW'
]
const spareData: { x: string[]; y: number[] } = {
  x: spareLineNames,
  y: [105, 82, 138, 74, 96, 118, 132, 88, 110]
}

const rateData: Record<string, { x: string[]; y: number[] }> = {
  'factory-year': { x: years.slice(0, 7), y: [98.2, 98.6, 98.4, 98.8, 98.5, 98.7, 98.9] },
  'factory-month': { x: months, y: [98.3, 98.6, 98.4, 98.7, 98.5, 98.8, 98.6, 98.5, 98.9, 98.6, 98.7, 98.8] }
}

// 各产线月度：多条折线，每条曲线一条产线（百分比）
const buildRateLineSeries = () => {
  return repairLineNames.map(name => {
    const { base, amp, phase } = repairLineBase[name]
    const baseRate = 97.5 + (base % 5) * 0.3
    const waveAmp = 0.3 + amp * 0.01
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: months.map((_, i) => {
        const v = baseRate + Math.sin(phase + i * 0.9) * waveAmp + (i % 4 === 0 ? 0.3 : 0)
        return Math.min(99.8, Math.round(v * 10) / 10)
      }),
      itemStyle: { color: repairLineColors[repairLineNames.indexOf(name)] },
      lineStyle: { width: 2 }
    }
  })
}

// ========== 图表渲染 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 11 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

function renderRepairTrend() {
  if (repairTrendMode.value === 'line-month') {
    // 产线月度趋势：多条折线
    charts.repairTrend?.setOption({
      tooltip: { trigger: 'axis' },
      legend: {
        data: repairLineNames, top: 0, type: 'scroll',
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
      },
      grid: { left: 40, right: 16, top: 28, bottom: 24 },
      xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: { type: 'value', ...baseAxis },
      series: buildRepairLineSeries()
    }, { notMerge: true })
    return
  }
  const d = repairTrendData[repairTrendMode.value]
  charts.repairTrend?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { show: false, top: 0 },
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    xAxis: { type: 'category', data: d.x, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', ...baseAxis },
    series: [{
      type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: d.y, itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 },
      label: { show: true, color: '#4472c4', fontSize: 10, formatter: (p: any) => p.value ?? '' }
    }]
  }, { notMerge: true })
}

function renderSpare() {
  charts.spare?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + ' 万元' },
    grid: { left: 46, right: 16, top: 24, bottom: 58 },
    xAxis: {
      type: 'category', data: spareData.x, ...baseAxis, splitLine: { show: false },
      axisLabel: {
        ...baseAxis.axisLabel, interval: 0, fontSize: 9, rotate: 45,
        margin: 4
      }
    },
    yAxis: { type: 'value', name: '万元', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
    series: [{
      type: 'bar', data: spareData.y, itemStyle: { color: '#4472c4' }, barWidth: 20,
      label: { show: true, position: 'top', color: '#4472c4', fontSize: 10 }
    }]
  }, { notMerge: true })
}

function renderRate() {
  if (rateMode.value === 'line-month') {
    // 各产线月度：多条折线，纵坐标百分数
    charts.rate?.setOption({
      tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + '%' },
      legend: {
        data: repairLineNames, top: 0, type: 'scroll',
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
      },
      grid: { left: 40, right: 16, top: 28, bottom: 24 },
      xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: {
        type: 'value', min: 95, max: 100, ...baseAxis,
        axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' }
      },
      series: buildRateLineSeries()
    }, { notMerge: true })
    return
  }
  const d = rateData[rateMode.value]
  charts.rate?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + '%' },
    legend: { show: false, top: 0 },
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    xAxis: { type: 'category', data: d.x, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: {
      type: 'value', min: (v: any) => Math.floor((v.min - 2) / 10) * 10, max: 100, ...baseAxis,
      axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' }
    },
    series: [{
      type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
      data: d.y, itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 },
      label: { show: true, color: '#999', fontSize: 9, formatter: (p: any) => p.value ?? '' }
    }]
  }, { notMerge: true })
}

// ========== 初始化 ==========
onMounted(async () => {
  await nextTick()
  if (repairTrendChartRef.value) charts.repairTrend = echarts.init(repairTrendChartRef.value)
  if (spareChartRef.value) charts.spare = echarts.init(spareChartRef.value)
  if (rateChartRef.value) charts.rate = echarts.init(rateChartRef.value)
  renderAll()
  window.addEventListener('resize', handleResize)
})

const renderAll = () => {
  renderRepairTrend()
  renderSpare()
  renderRate()
}

const handleResize = () => {
  Object.values(charts).forEach(c => c.resize())
}

watch([repairTrendMode], renderRepairTrend)
watch([rateMode], renderRate)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.equipment-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}

.chart-card {
  background: #f2f2f2;
  border-radius: 4px;
  padding: 8px;
}

.chart-title {
  background: #fff;
  display: inline-block;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  border-radius: 2px;
  margin-bottom: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header .chart-title {
  margin-bottom: 0;
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

/* 第一行指标 */
.top-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.stat-grid {
  display: grid;
  gap: 8px;
  padding: 8px 4px 4px;
}

.stat-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
.stat-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }

.stat-box {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  text-align: center;
  padding: 14px 6px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #222;
}

.stat-value .unit {
  font-size: 11px;
  font-weight: 400;
  color: #999;
  margin-left: 2px;
}

/* 第二行图表 */
.chart-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.chart-body {
  height: 190px;
}

/* 第三行重点设备概况 */
.equipment-panel {
  background: #f2f2f2;
  border-radius: 4px;
  padding: 8px;
}

.equipment-box {
  background: #fff;
  border: 2px solid #4472c4;
  border-radius: 6px;
  padding: 8px;
  margin-top: 4px;
}

.eq-tabs {
  display: flex;
  justify-content: space-around;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.eq-tabs button {
  border: none;
  background: none;
  color: #4472c4;
  font-size: 15px;
  font-weight: 600;
  padding: 8px 20px;
  cursor: pointer;
}

.eq-tabs button.active {
  color: #4472c4;
  text-decoration: underline;
  text-underline-offset: 6px;
}

.eq-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.table-wrapper {
  overflow-x: auto;
}

.eq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.eq-table th, .eq-table td {
  border: 1px solid #333;
  padding: 3px 6px;
  white-space: nowrap;
}

.eq-table th {
  background: #fff;
  font-weight: 500;
  text-align: center;
}

.eq-table td {
  text-align: left;
}

.row-total td {
  font-weight: 600;
  background: #f5f7fa;
}

.head-corner {
  position: relative;
  width: 140px;
}

.corner-label {
  display: block;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.4;
}

.corner-label.dim {
  color: #bbb;
  position: absolute;
  top: 3px;
  right: 6px;
}

.corner-label:not(.dim) {
  color: #333;
  text-align: left;
  padding-top: 16px;
}

.text-center { text-align: center; }
.invisible-cell { border-top: none !important; }
.subtotal { font-weight: 600; }

.brand-panel {
  display: flex;
  flex-direction: column;
}

.brand-tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.brand-tabs button {
  border: 1px solid #4472c4;
  background: #fff;
  color: #4472c4;
  font-size: 12px;
  padding: 3px 14px;
  cursor: pointer;
  border-radius: 2px;
}

.brand-tabs button.active {
  background: #4472c4;
  color: #fff;
}

.brand-table .w-40 { width: 40%; }
.brand-table .w-30 { width: 30%; }
.brand-table .w-20 { width: 20%; }

.brand-table td {
  text-align: center;
}

.brand-table .group-name {
  text-align: center;
  font-size: 13px;
  background: #fff;
}
</style>
