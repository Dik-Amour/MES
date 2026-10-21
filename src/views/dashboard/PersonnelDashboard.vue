<template>
  <div class="personnel-dashboard">
    <!-- 大屏标题 -->
    <DashboardHeader title="材料成型中心工业园区人员管理大屏" />

    <div class="personnel-grid">
      <!-- 第一行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">人员类别统计</span>
        </div>
        <div ref="categoryChartRef" class="chart-body donut-lg"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">人员信息指标</span>
        </div>
        <div class="indicator-panel">
          <div class="indicator-top">
            <div class="indicator-box">
              <div class="ind-label">人员合计</div>
              <div class="ind-value">2036</div>
            </div>
            <div class="indicator-box">
              <div class="ind-label">科室/产线</div>
              <div class="ind-value">453</div>
            </div>
          </div>
          <div class="indicator-row">
            <div class="ind-item" v-for="it in indicatorRow1" :key="it.label">
              <div class="ind-num">{{ it.value }} <span class="pct">{{ it.pct }}</span></div>
              <div class="ind-name">{{ it.label }}</div>
            </div>
          </div>
          <div class="indicator-row">
            <div class="ind-item" v-for="it in indicatorRow2" :key="it.label">
              <div class="ind-num">{{ it.value }} <span class="pct">{{ it.pct }}</span></div>
              <div class="ind-name">{{ it.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">人员科室分类</span>
        </div>
        <div ref="deptChartRef" class="chart-body donut-lg"></div>
      </div>

      <!-- 第二行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">性别&年龄统计</span>
        </div>
        <div ref="genderAgeChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">学历&政治面貌分析</span>
        </div>
        <div ref="educationChartRef" class="chart-body"></div>
      </div>

      <!-- 第三行 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">技术支持人员/梯队建设统计</span>
        </div>
        <div ref="skillChartRef" class="chart-body donut-lg"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">班组排班明细</span>
        </div>
        <div class="table-wrapper schedule-table-wrap">
          <table class="schedule-table">
            <thead>
              <tr>
                <th>产线</th><th>班组</th><th>子班组</th><th>人数</th><th>已排班</th><th>利用率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in scheduleRows" :key="r.id">
                <td>{{ r.line }}</td>
                <td>{{ r.group }}</td>
                <td>{{ r.subGroup }}</td>
                <td>{{ r.people }}</td>
                <td>{{ r.scheduled }}</td>
                <td>{{ r.usage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">人员职称级别统计</span>
        </div>
        <div ref="levelChartRef" class="chart-body"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 图表DOM与实例 ==========
const categoryChartRef = ref<HTMLElement>()
const deptChartRef = ref<HTMLElement>()
const genderAgeChartRef = ref<HTMLElement>()
const educationChartRef = ref<HTMLElement>()
const skillChartRef = ref<HTMLElement>()
const levelChartRef = ref<HTMLElement>()
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const indicatorRow1 = [
  { label: '领导干部', value: 19, pct: '0.9%' },
  { label: '管理人员', value: 31, pct: '1.5%' },
  { label: '工程技术', value: 108, pct: '5.3%' },
  { label: '见习大学生', value: 21, pct: '5.3%' }
]
const indicatorRow2 = [
  { label: '领导干部', value: 184, pct: '9%' },
  { label: '一线及生产支持', value: 1038, pct: '50.9%' },
  { label: '短期用工', value: 181, pct: '8.9%' },
  { label: '外包人员', value: 426, pct: '20.9%' },
  { label: '实习生', value: 28, pct: '1.4%' }
]

const scheduleRows = [
  { id: 1, line: '造型一线', group: '造型大件班', subGroup: '甲班', people: 42, scheduled: 38, usage: '90.5%' },
  { id: 2, line: '造型一线', group: '造型大件班', subGroup: '乙班', people: 40, scheduled: 36, usage: '90.0%' },
  { id: 3, line: '造型一线', group: '造型中件班', subGroup: '甲班', people: 38, scheduled: 33, usage: '86.8%' },
  { id: 4, line: '造型二线', group: '造型大件班', subGroup: '甲班', people: 36, scheduled: 32, usage: '88.9%' },
  { id: 5, line: '造型二线', group: '造型中件班', subGroup: '乙班', people: 34, scheduled: 30, usage: '88.2%' },
  { id: 6, line: '造型三线', group: 'KW制芯班', subGroup: '甲班', people: 30, scheduled: 27, usage: '90.0%' },
  { id: 7, line: '造型三线', group: 'HWS制芯班', subGroup: '乙班', people: 28, scheduled: 24, usage: '85.7%' },
  { id: 8, line: '造型三线', group: 'HWS造型班', subGroup: '甲班', people: 45, scheduled: 41, usage: '91.1%' },
  { id: 9, line: '熔炼一线', group: '熔炼班', subGroup: '甲班', people: 26, scheduled: 24, usage: '92.3%' },
  { id: 10, line: '熔炼二线', group: '熔炼班', subGroup: '乙班', people: 24, scheduled: 21, usage: '87.5%' },
  { id: 11, line: '清理一线', group: '大件清理班', subGroup: '甲班', people: 52, scheduled: 46, usage: '88.5%' },
  { id: 12, line: '清理二线', group: '细清班', subGroup: '乙班', people: 38, scheduled: 34, usage: '89.5%' }
]

// ========== 通用配置 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 10 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

// 人员类别统计（环形图 + 外部计数标签）
const categoryData = [
  { name: '资源人员', value: 60, color: '#4472c4' },
  { name: '采购人员', value: 20, color: '#3ba8a0' },
  { name: '质量人员', value: 184, color: '#70ad47' },
  { name: '管理人员', value: 174, color: '#ffc000' },
  { name: '安全人员', value: 14, color: '#ed7d31' },
  { name: '工艺人员', value: 207, color: '#843c0c' },
  { name: '生产人员', value: 1269, color: '#c00000' },
  { name: '其他', value: 100, color: '#a5a5a5' }
]
function renderCategory() {
  charts.category?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: {
      orient: 'vertical', right: 0, top: 'center',
      textStyle: { color: '#666', fontSize: 11 }, itemWidth: 12, itemHeight: 8,
      formatter: (name: string) => name
    },
    series: [{
      type: 'pie', radius: ['45%', '68%'], center: ['38%', '50%'],
      data: categoryData.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      label: { show: true, color: '#999', fontSize: 9, formatter: (p: any) => `${p.name}\n人${p.value}` },
      labelLine: { length: 6, length2: 6 }
    }]
  }, { notMerge: true })
}

// 人员科室分类（环形图）
const deptData = [
  { name: '生产', value: 1269, color: '#4472c4' },
  { name: '质量', value: 184, color: '#3ba8a0' },
  { name: '设备', value: 112, color: '#70ad47' },
  { name: '工艺', value: 207, color: '#ffc000' },
  { name: '安全', value: 14, color: '#ed7d31' },
  { name: '工艺质量', value: 0, color: '#843c0c' },
  { name: '工艺其他', value: 60, color: '#c00000' },
  { name: '其他', value: 190, color: '#a5a5a5' }
]
function renderDept() {
  charts.dept?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: {
      orient: 'vertical', right: 0, top: 'center',
      textStyle: { color: '#666', fontSize: 11 }, itemWidth: 12, itemHeight: 8,
      formatter: (name: string) => `${name}`
    },
    series: [{
      type: 'pie', radius: ['45%', '68%'], center: ['38%', '50%'],
      data: deptData.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      label: { show: true, color: '#999', fontSize: 9, formatter: (p: any) => `${p.name}\n${p.value}` },
      labelLine: { length: 6, length2: 6 }
    }]
  }, { notMerge: true })
}

// 性别&年龄统计（堆叠柱状图）
const ageX = ['18-28', '29-40', '41-50', '51岁以上']
const genderData = {
  male: [95, 140, 230, 100],
  female: [160, 110, 190, 148]
}
function renderGenderAge() {
  charts.genderAge?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['男性', '女性'], top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 44, right: 10, top: 30, bottom: 26 },
    xAxis: { type: 'category', data: ageX, ...baseAxis, splitLine: { show: false } },
    yAxis: { type: 'value', max: 500, ...baseAxis },
    series: [
      { name: '男性', type: 'bar', stack: 'total', data: genderData.male, barWidth: 40, itemStyle: { color: '#4472c4' } },
      { name: '女性', type: 'bar', stack: 'total', data: genderData.female, itemStyle: { color: '#3ba8a0' } }
    ]
  }, { notMerge: true })
}

// 学历&政治面貌（横向分组条形图）
const eduX = ['博士', '硕士', '本科', '大专', '高中/中专', '初中及以下']
const eduData = {
  party: [150, 120, 90, 230, 110, 90],
  candidate: [180, 130, 130, 170, 150, 60],
  mass: [170, 155, 145, 180, 150, 230]
}
function renderEducation() {
  charts.education?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['党员', '预备党员', '群众'], top: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 9 },
    grid: { left: 70, right: 20, top: 30, bottom: 26 },
    xAxis: { type: 'value', max: 250, ...baseAxis },
    yAxis: { type: 'category', data: eduX, ...baseAxis, splitLine: { show: false } },
    series: [
      { name: '党员', type: 'bar', data: eduData.party, barWidth: 8, itemStyle: { color: '#4472c4' } },
      { name: '预备党员', type: 'bar', data: eduData.candidate, barWidth: 8, itemStyle: { color: '#3ba8a0' } },
      { name: '群众', type: 'bar', data: eduData.mass, barWidth: 8, itemStyle: { color: '#70ad47' } }
    ]
  }, { notMerge: true })
}

// 技术支持人员/梯队建设（双环形图 + 下方图例）
const skillLeft = [
  { name: '初级工', value: 167, color: '#4472c4' },
  { name: '中级工', value: 130, color: '#3ba8a0' },
  { name: '高级工', value: 0, color: '#70ad47' },
  { name: '技师', value: 209, color: '#ffc000' },
  { name: '高级技师', value: 154, color: '#ed7d31' }
]
const skillRight = [
  { name: '山东省技术能手', value: 145, color: '#4472c4' },
  { name: '齐鲁首席', value: 101, color: '#3ba8a0' },
  { name: '泰山领军', value: 50, color: '#70ad47' }
]
function renderSkill() {
  const mkPie = (data: any[], cx: string) => ({
    type: 'pie', radius: ['42%', '65%'], center: [cx, '48%'],
    data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
    label: { show: true, color: '#999', fontSize: 9, formatter: (p: any) => `${p.name}\n${p.value}` },
    labelLine: { length: 5, length2: 5 }
  })
  charts.skill?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    legend: [
      {
        data: skillLeft.filter(d => d.value > 0).map(d => d.name), bottom: 0, left: 10,
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 12, itemHeight: 8
      },
      {
        data: skillRight.filter(d => d.value > 0).map(d => d.name), bottom: 0, right: 10,
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 12, itemHeight: 8
      }
    ],
    series: [mkPie(skillLeft, '26%'), mkPie(skillRight, '74%')]
  }, { notMerge: true })
}

// 人员职级别统计（横向条形图）
const levelData = [
  { name: '职级5', value: 140 },
  { name: '职级4', value: 98 },
  { name: '职级3', value: 240 },
  { name: '职级2', value: 150 },
  { name: '职级1', value: 98 }
]
function renderLevel() {
  charts.level?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 24, top: 14, bottom: 26 },
    xAxis: { type: 'value', max: 250, ...baseAxis, splitLine: { show: true } },
    yAxis: {
      type: 'category',
      data: levelData.map(d => d.name).reverse(),
      ...baseAxis, splitLine: { show: false }
    },
    series: [{
      type: 'bar',
      data: levelData.map(d => d.value).reverse(),
      barWidth: 18, itemStyle: { color: '#4472c4' }
    }]
  }, { notMerge: true })
}

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderCategory()
  renderDept()
  renderGenderAge()
  renderEducation()
  renderSkill()
  renderLevel()
}

const handleResize = () => Object.values(charts).forEach(c => c.resize())

onMounted(async () => {
  await nextTick()
  initChart(categoryChartRef.value, 'category')
  initChart(deptChartRef.value, 'dept')
  initChart(genderAgeChartRef.value, 'genderAge')
  initChart(educationChartRef.value, 'education')
  initChart(skillChartRef.value, 'skill')
  initChart(levelChartRef.value, 'level')
  renderAll()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.personnel-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
}


.personnel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.chart-header {
  margin-bottom: 4px;
}
.chart-body {
  height: 205px;
}

.donut-lg {
  height: 230px;
}

/* 人员信息指标 */
.indicator-panel {
  padding: 8px;
}

.indicator-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.indicator-box {
  background: #fff;
  border: 1px solid #e8e8e8;
  text-align: center;
  padding: 10px 6px;
}

.ind-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.ind-value {
  font-size: 22px;
  font-weight: 700;
  color: #222;
}

.indicator-row {
  display: flex;
  background: #fff;
  border: 1px solid #e8e8e8;
  margin-bottom: 8px;
}

.ind-item {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-right: 1px solid #f0f0f0;
}

.ind-item:last-child { border-right: none; }

.ind-num {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.ind-num .pct {
  font-size: 10px;
  font-weight: 400;
  color: #999;
  margin-left: 2px;
}

.ind-name {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

/* 班组排班明细 */
.schedule-table-wrap {
  height: 230px;
  overflow-y: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.schedule-table th, .schedule-table td {
  border: 1px solid #e8e8e8;
  padding: 5px 6px;
  text-align: center;
  white-space: nowrap;
}

.schedule-table th {
  background: #fafafa;
  font-weight: 500;
  color: #333;
}
</style>
