<template>
  <div class="safety-dashboard">
    <!-- 顶部标题栏 -->
    <DashboardHeader title="材料成型中心工业园区安全环保大屏" />
    <div class="run-bar">安全生产运行<span class="days">184</span>天</div>

    <div class="safety-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card carousel-card">
          <div class="chart-header">
            <span class="chart-title">冲天炉监测</span>
            <div class="carousel-dots">
              <span v-for="(_, i) in furnaceCarouselPages" :key="i"
                class="c-dot" :class="{ active: furnaceCarouselIdx === i }"
                @click="furnaceCarouselIdx = i"></span>
            </div>
          </div>
          <div class="sub-label">{{ furnaceCarouselPages[furnaceCarouselIdx] }}</div>
          <div class="ech-legend-note">
            <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>进出水流量</span>
            <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>温度</span>
          </div>
          <div ref="furnace1ChartRef" class="chart-body fade-chart" :key="furnaceCarouselIdx"></div>
        </div>

        <div class="chart-card carousel-card">
          <div class="chart-header">
            <span class="chart-title">电炉监控</span>
            <div class="carousel-dots">
              <span v-for="(_, i) in electricCarouselPages" :key="i"
                class="c-dot" :class="{ active: electricCarouselIdx === i }"
                @click="electricCarouselIdx = i"></span>
            </div>
          </div>
          <div class="sub-label">{{ electricCarouselPages[electricCarouselIdx] }}</div>
          <div class="ech-legend-note">
            <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>进出水流量</span>
            <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>温度</span>
          </div>
          <div ref="furnace2ChartRef" class="chart-body fade-chart" :key="electricCarouselIdx"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">危险作业数量统计</span>
            <div class="mini-tabs">
              <button :class="{ active: dangerMode === 'week' }" @click="dangerMode = 'week'">按周</button>
              <button :class="{ active: dangerMode === 'month' }" @click="dangerMode = 'month'">按月</button>
              <button :class="{ active: dangerMode === 'quarter' }" @click="dangerMode = 'quarter'">按季度</button>
            </div>
          </div>
          <div ref="dangerChartRef" class="chart-body"></div>
        </div>
      </div>

      <!-- 中列 -->
      <div class="col">
          <div class="plant-card">
            <div class="plant-header">
              <span class="chart-title">厂区图-重点监测点位分布</span>
              <div class="weather">
                <span>温度：17℃</span>
                <span>风向：东南风</span>
                <span>风速：2m/s</span>
              </div>
            </div>
            <div class="plant-viewport"
              ref="plantViewportRef"
              @mousedown="onDragStart"
              @mousemove="onDragMove"
              @mouseup="onDragEnd"
              @mouseleave="onDragEnd"
              @wheel.prevent="onZoom"
              @click="closeTip"
            >
              <img
                :src="plantImg"
                class="plant-img"
                :style="imgStyle"
                @load="onImgLoad"
                alt="厂区图"
                draggable="false"
              />
              <div
                v-for="(d, i) in plantDots"
                :key="i"
                class="p-dot"
                :class="{ active: activeDot === i }"
                :style="{ left: d.x + '%', top: d.y + '%', background: d.color }"
                @click.stop="toggleDot(i, $event)"
              />
              <div class="zoom-controls" @click.stop>
                <button title="放大" @click="zoomBy(0.2)">＋</button>
                <button title="缩小" @click="zoomBy(-0.2)">－</button>
                <button title="重置" @click="resetView">⟲</button>
              </div>

              <div v-if="activeDot !== null" class="plant-tip"
                :style="{ left: tipLeft + 'px', top: tipTop + 'px' }"
                @click.stop="activeDot = null"
              >
                <div class="tip-title">{{ plantDots[activeDot].label }}</div>
                <div class="tip-row">类型：{{ plantDots[activeDot].type }}</div>
                <div class="tip-row">状态：<span :style="{ color: plantDots[activeDot].color }">{{ plantDots[activeDot].status }}</span></div>
                <div class="tip-row">实时值：{{ plantDots[activeDot].value }}</div>
                <div class="tip-row">更新时间：{{ plantDots[activeDot].time }}</div>
              </div>
            </div>
          </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">实时报警</span>
          </div>
          <div class="table-wrapper alarm-table-wrap">
            <table class="alarm-table">
              <thead>
                <tr>
                  <th>序号</th><th>报警时间</th><th>所在区域</th><th>点位名称</th><th>报警类型</th><th>实测值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in alarmRows" :key="r.id">
                  <td>{{ r.id }}</td>
                  <td>{{ r.time }}</td>
                  <td>{{ r.area }}</td>
                  <td>{{ r.point }}</td>
                  <td>{{ r.type }}</td>
                  <td>{{ r.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="col">
        <div class="chart-card carousel-card">
          <div class="chart-header">
            <span class="chart-title">有组织排放</span>
            <div class="carousel-dots">
              <span v-for="(_, i) in emissionCarouselPages" :key="i"
                class="c-dot" :class="{ active: emissionCarouselIdx === i }"
                @click="emissionCarouselIdx = i"></span>
            </div>
          </div>
          <div class="sub-label">{{ emissionCarouselPages[emissionCarouselIdx] }}</div>
          <div class="ech-legend-note">
            <template v-if="emissionCarouselIdx < 2">
              <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>颗粒物</span>
              <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>二氧化硫</span>
              <span class="legend-item"><i class="line-dot" style="background:#70ad47"></i>氮氧化物</span>
            </template>
            <template v-else>
              <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>一期冲天炉</span>
              <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>二期冲天炉</span>
            </template>
          </div>
          <div ref="vocChartRef" class="chart-body fade-chart" :key="emissionCarouselIdx"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">用电监控</span>
            <span class="more-link">&gt;&gt;&gt;</span>
          </div>
          <div class="chart-header sub">
            <span class="sub-label"></span>
            <div class="ech-legend-note">
              <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>生产设备 XX</span>
              <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>治理设备 XX</span>
            </div>
          </div>
          <div ref="powerChartRef" class="chart-body"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">设备在线信息</span>
          </div>
          <div class="device-panel">
            <div class="device-top">
              <div class="device-ring">
                <svg viewBox="0 0 100 100" width="90" height="90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e8e8e8" stroke-width="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#4472c4" stroke-width="10"
                    stroke-dasharray="238 264" stroke-dashoffset="0" stroke-linecap="round"
                    transform="rotate(-90 50 50)" />
                </svg>
                <div class="ring-center">
                  <div class="ring-num">144</div>
                  <div class="ring-label">总设备数</div>
                </div>
              </div>
              <div class="device-stats">
                <div class="stat-row"><i class="p-dot sm" style="background:#70ad47"></i><span>在线设备</span><b>130台（90.3%）</b></div>
                <div class="stat-row"><i class="p-dot sm" style="background:#c00000"></i><span>离线设备</span><b>5台（3.5%）</b></div>
                <div class="stat-row"><i class="p-dot sm" style="background:#ffc000"></i><span>维护设备</span><b>9台（6.2%）</b></div>
              </div>
            </div>
            <div class="offline-list">
              <div class="ol-title">离线设备：</div>
              <div class="ol-row"><span>砂处理车间/3#传感器</span><span>2小时</span></div>
              <div class="ol-row"><span>压铸车间/3#摄像头</span><span>5小时</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'
import plantImg from '@/assets/image/寒亭厂区图.jpg'

// ========== 图表DOM与实例 ==========
const furnace1ChartRef = ref<HTMLElement>()
const furnace2ChartRef = ref<HTMLElement>()
const vocChartRef = ref<HTMLElement>()
const powerChartRef = ref<HTMLElement>()
const dangerChartRef = ref<HTMLElement>()
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const dangerMode = ref<'week' | 'month' | 'quarter'>('week')
const furnaceCarouselIdx = ref(0)
const furnaceCarouselPages = ['一期冲天炉', '二期冲天炉']
const emissionCarouselIdx = ref(0)
const emissionCarouselPages = ['一期冲天炉', '二期冲天炉', 'VOCs']
const electricCarouselIdx = ref(0)
const electricCarouselPages = ['保温电炉', '熔化电炉']

// 厂区图图片与拖拽状态
const plantViewportRef = ref<HTMLElement | null>(null)
const imgOffset = reactive({ x: 0, y: 0 })
const imgScale = ref(1)
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0, ox: 0, oy: 0 })
const imgStyle = computed(() => ({
  transform: `translate(${imgOffset.x}px, ${imgOffset.y}px) scale(${imgScale.value})`
}))

const onImgLoad = () => { /* 首次加载后可自动居中，此处保持原位 */ }
const onDragStart = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.ox = imgOffset.x
  dragStart.oy = imgOffset.y
}
const onDragMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  imgOffset.x = dragStart.ox + (e.clientX - dragStart.x)
  imgOffset.y = dragStart.oy + (e.clientY - dragStart.y)
}
const onDragEnd = () => { isDragging.value = false }
const onZoom = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  imgScale.value = Math.min(4, Math.max(0.4, Number((imgScale.value + delta).toFixed(2))))
}
const zoomBy = (delta: number) => {
  imgScale.value = Math.min(4, Math.max(0.4, Number((imgScale.value + delta).toFixed(2))))
}
const resetView = () => {
  imgOffset.x = 0
  imgOffset.y = 0
  imgScale.value = 1
  activeDot.value = null
}

// 厂区监测点位（百分比坐标）
const plantDots = [
  { x: 78, y: 12, color: '#c00000', label: '冲天炉1# 排放口', type: '烟气排放', status: '超标', value: 'PM₂.₅: 42mg/m³（限值30）', time: '2026-09-15 08:30' },
  { x: 66, y: 16, color: '#70ad47', label: '造型车间 落砂区', type: '粉尘监测', status: '正常', value: 'PM₁₀: 18mg/m³', time: '2026-09-15 08:30' },
  { x: 84, y: 22, color: '#70ad47', label: '熔炼炉 耳部', type: '温度监测', status: '正常', value: '炉壁温度: 286℃', time: '2026-09-15 08:30' },
  { x: 58, y: 24, color: '#c00000', label: '冲天炉3# 熔融区', type: '温度监测', status: '报警', value: '熔温: 1560℃（限值1520℃）', time: '2026-09-15 08:30' },
  { x: 72, y: 30, color: '#70ad47', label: '浇注工位', type: '环境监测', status: '正常', value: '温度: 32℃ / 湿度: 45%', time: '2026-09-15 08:30' },
  { x: 88, y: 36, color: '#70ad47', label: '热处理车间', type: '温度监测', status: '正常', value: '炉温: 920℃', time: '2026-09-15 08:30' },
  { x: 62, y: 38, color: '#70ad47', label: '砂处理中心', type: '粉尘监测', status: '正常', value: 'PM₁₀: 15mg/m³', time: '2026-09-15 08:30' },
  { x: 50, y: 42, color: '#c00000', label: '污水处理站 进水口', type: '水质监测', status: '超标', value: 'COD: 156mg/L（限值120）', time: '2026-09-15 08:30' },
  { x: 78, y: 46, color: '#70ad47', label: '物流通道', type: '空气质量', status: '正常', value: 'VOCs: 0.8mg/m³', time: '2026-09-15 08:30' },
  { x: 42, y: 50, color: '#70ad47', label: '配电房', type: '电气安全', status: '正常', value: '温度: 28℃ / 湿度: 38%', time: '2026-09-15 08:30' },
  { x: 66, y: 54, color: '#70ad47', label: '空压站', type: '设备运行', status: '正常', value: '压力: 0.72MPa', time: '2026-09-15 08:30' },
  { x: 34, y: 58, color: '#c00000', label: '废水总排口', type: '水质监测', status: '超标', value: 'SS: 85mg/L（限值70）', time: '2026-09-15 08:30' },
  { x: 54, y: 62, color: '#70ad47', label: '成品仓库', type: '环境监测', status: '正常', value: '温度: 25℃ / 湿度: 52%', time: '2026-09-15 08:30' },
  { x: 26, y: 66, color: '#70ad47', label: '消防水池', type: '液位监测', status: '正常', value: '液位: 3.2m', time: '2026-09-15 08:30' },
  { x: 44, y: 70, color: '#70ad47', label: '办公区', type: '空气质量', status: '正常', value: 'PM₂.₅: 22mg/m³', time: '2026-09-15 08:30' }
]

const activeDot = ref<number | null>(null)
const tipLeft = ref(0)
const tipTop = ref(0)
const toggleDot = (i: number, e: MouseEvent) => {
  if (activeDot.value === i) { activeDot.value = null; return }
  // 必须在事件回调内同步读取 currentTarget（回调结束后会被置为 null）
  const dotEl = e.currentTarget as HTMLElement
  const dotRect = dotEl.getBoundingClientRect()
  const vp = plantViewportRef.value
  if (!vp) { activeDot.value = i; return }
  const vpRect = vp.getBoundingClientRect()
  const dotLeft = dotRect.left - vpRect.left
  const dotTop = dotRect.top - vpRect.top
  activeDot.value = i
  // 等待弹框渲染后再测量尺寸并定位
  nextTick(() => {
    const tipEl = vp.querySelector('.plant-tip') as HTMLElement | null
    const tipW = tipEl?.offsetWidth || 200
    const tipH = tipEl?.offsetHeight || 110
    let left = dotLeft + dotRect.width / 2 - tipW / 2
    let top = dotTop - tipH - 10
    left = Math.max(6, Math.min(left, vpRect.width - tipW - 6))
    if (top < 6) top = dotTop + dotRect.height + 10
    top = Math.max(6, Math.min(top, vpRect.height - tipH - 6))
    tipLeft.value = left
    tipTop.value = top
  })
}

// 点击空白处关闭弹窗
const closeTip = () => { activeDot.value = null }
// 实时报警数据
const alarmRows = [
  { id: 1, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '天然气/压强报警器', value: '23mg/m³' },
  { id: 2, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '天然气/压强报警器', value: '23mg/m³' },
  { id: 3, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '三乙/接车', value: '23mg/m³' },
  { id: 4, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '油烟/车', value: '23mg/m³' },
  { id: 5, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '三乙/接车', value: '23mg/m³' },
  { id: 6, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '冲天炉/炉压报警器', value: '23mg/m³' },
  { id: 7, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '冷却水/温度报警器', value: '23mg/m³' },
  { id: 8, time: '2026-9-22 14:23', area: '潍坊三线', point: '监测点1', type: '一氧化碳/浓度报警器', value: '23mg/m³' }
]

// ========== 通用配置 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 10 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

const timeX = ['10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45']

// 冲天炉监测轮播（进出水流量 + 温度，两条曲线）
const furnaceCarouselData = [
  { flow: [120, 145, 160, 180, 170, 155, 140, 130, 150], temp: [1500, 1520, 1545, 1560, 1555, 1530, 1510, 1500, 1515] },
  { flow: [100, 130, 155, 175, 165, 145, 135, 125, 140], temp: [1480, 1500, 1525, 1540, 1535, 1510, 1490, 1480, 1495] }
]
function renderFurnace1() {
  const el = furnace1ChartRef.value
  if (!el) return
  if (charts.furnace1) { charts.furnace1.dispose(); charts.furnace1 = null as any }
  charts.furnace1 = echarts.init(el)
  const d = furnaceCarouselData[furnaceCarouselIdx.value]
  charts.furnace1?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 48, top: 14, bottom: 24 },
    xAxis: { type: 'category', data: timeX, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: [
      { type: 'value', ...baseAxis, name: '流量', nameTextStyle: { fontSize: 10, color: '#999' } },
      { type: 'value', ...baseAxis, name: '℃', nameTextStyle: { fontSize: 10, color: '#999' }, position: 'right', splitLine: { show: false } }
    ],
    series: [
      {
        name: '进出水流量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: d.flow, itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 }, yAxisIndex: 0
      },
      {
        name: '温度', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: d.temp, itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 2 }, yAxisIndex: 1
      }
    ]
  }, { notMerge: true })
}
// 电炉监控轮播数据（进出水流量 + 温度）
const electricCarouselData = [
  // 保温电炉
  { flow: [140, 155, 170, 180, 165, 150, 140, 135, 145], temp: [1480, 1500, 1520, 1530, 1510, 1495, 1485, 1478, 1490] },
  // 熔化电炉
  { flow: [120, 140, 160, 175, 160, 145, 130, 125, 135], temp: [1500, 1525, 1545, 1555, 1540, 1518, 1502, 1495, 1510] }
]
function renderFurnace2() {
  const el = furnace2ChartRef.value
  if (!el) return
  if (charts.furnace2) { charts.furnace2.dispose(); charts.furnace2 = null as any }
  charts.furnace2 = echarts.init(el)
  const d = electricCarouselData[electricCarouselIdx.value]
  charts.furnace2?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 48, top: 14, bottom: 24 },
    xAxis: { type: 'category', data: timeX, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: [
      { type: 'value', ...baseAxis, name: '流量', nameTextStyle: { fontSize: 10, color: '#999' } },
      { type: 'value', ...baseAxis, name: '℃', nameTextStyle: { fontSize: 10, color: '#999' }, position: 'right', splitLine: { show: false } }
    ],
    series: [
      {
        name: '进出水流量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: d.flow, itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 }, yAxisIndex: 0
      },
      {
        name: '温度', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: d.temp, itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 2 }, yAxisIndex: 1
      }
    ]
  }, { notMerge: true })
}

// 有组织排放轮播数据
const emissionData = [
  // 一期冲天炉（颗粒物 / 二氧化硫 / 氮氧化物）
  {
    series: [
      { name: '颗粒物', color: '#4472c4', data: [180, 240, 200, 120, 100, 220, 130] },
      { name: '二氧化硫', color: '#3ba8a0', data: [120, 160, 140, 80, 90, 150, 110] },
      { name: '氮氧化物', color: '#70ad47', data: [90, 130, 120, 70, 80, 140, 100] }
    ]
  },
  // 二期冲天炉
  {
    series: [
      { name: '颗粒物', color: '#4472c4', data: [150, 200, 180, 110, 95, 190, 120] },
      { name: '二氧化硫', color: '#3ba8a0', data: [100, 140, 125, 75, 85, 135, 100] },
      { name: '氮氧化物', color: '#70ad47', data: [80, 115, 105, 65, 75, 125, 90] }
    ]
  },
  // VOCs（一期冲天炉 / 二期冲天炉）
  {
    series: [
      { name: '一期冲天炉', color: '#4472c4', data: [90, 180, 240, 150, 100, 230, 120] },
      { name: '二期冲天炉', color: '#3ba8a0', data: [120, 100, 160, 230, 250, 160, 130] }
    ]
  }
]
function renderEmission() {
  const el = vocChartRef.value
  if (!el) return
  if (charts.voc) { charts.voc.dispose(); charts.voc = null as any }
  charts.voc = echarts.init(el)
  const d = emissionData[emissionCarouselIdx.value]
  charts.voc?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 14, top: 14, bottom: 24 },
    xAxis: { type: 'category', data: ['10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00'], ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', max: 280, ...baseAxis, axisLabel: { ...baseAxis.axisLabel, formatter: '{value}mg/m³' } },
    series: d.series.map(s => ({
      name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
      data: s.data, itemStyle: { color: s.color }, lineStyle: { width: 2 }
    }))
  }, { notMerge: true })
}

// 用电监控（双曲线）
function renderPower() {
  charts.power?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 14, top: 14, bottom: 24 },
    xAxis: { type: 'category', data: ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00'], ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', ...baseAxis },
    series: [
      {
        name: '生产设备 XX', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [95, 160, 230, 155, 105, 175, 225, 150, 95],
        itemStyle: { color: '#4472c4' }, lineStyle: { width: 2 }
      },
      {
        name: '治理设备 XX', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: [130, 150, 130, 95, 150, 205, 175, 100, 140],
        itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 2 }
      }
    ]
  }, { notMerge: true })
}

// 危险作业数量统计（柱+折线组合）
const dangerData: Record<string, { x: string[]; bar: number[]; line: number[] }> = {
  week: {
    x: ['26年第6周', '26年第7周', '26年第8周', '26年第9周', '26年第10周', '26年第11周', '26年第12周', '26年第13周'],
    bar: [100, 140, 228, 100, 130, 112, 110, 108],
    line: [100, 140, 228, 100, 130, 112, 110, 108]
  },
  month: {
    x: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    bar: [420, 380, 460, 410, 440, 390, 430, 405, 445, 415, 425, 395],
    line: [405, 368, 452, 398, 435, 382, 425, 398, 438, 408, 418, 388]
  },
  quarter: {
    x: ['Q1', 'Q2', 'Q3', 'Q4'],
    bar: [1260, 1240, 1285, 1235],
    line: [1225, 1208, 1260, 1210]
  }
}
function renderDanger() {
  const d = dangerData[dangerMode.value]
  charts.danger?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 12, top: 14, bottom: 24 },
    xAxis: { type: 'category', data: d.x, ...baseAxis, splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 9 } },
    yAxis: { type: 'value', ...baseAxis },
    series: [
      { name: '危险作业数量', type: 'bar', data: d.bar, barWidth: 18, itemStyle: { color: '#4472c4' } },
      {
        name: '趋势', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        data: d.line, itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 1.5 }
      }
    ]
  }, { notMerge: true })
}

// ========== 初始化 ==========
const initChart = (el: HTMLElement | undefined, key: string) => {
  if (el) charts[key] = echarts.init(el)
}

const renderAll = () => {
  renderFurnace1()
  renderFurnace2()
  renderEmission()
  renderPower()
  renderDanger()
}

// 轮播自动播放
let furnaceTimer: ReturnType<typeof setInterval> | null = null
let emissionTimer: ReturnType<typeof setInterval> | null = null
let electricTimer: ReturnType<typeof setInterval> | null = null
function startTimers() {
  furnaceTimer = setInterval(() => {
    furnaceCarouselIdx.value = (furnaceCarouselIdx.value + 1) % furnaceCarouselPages.length
  }, 4000)
  emissionTimer = setInterval(() => {
    emissionCarouselIdx.value = (emissionCarouselIdx.value + 1) % emissionCarouselPages.length
  }, 5000)
  electricTimer = setInterval(() => {
    electricCarouselIdx.value = (electricCarouselIdx.value + 1) % electricCarouselPages.length
  }, 4500)
}
function stopTimers() {
  if (furnaceTimer) clearInterval(furnaceTimer)
  if (emissionTimer) clearInterval(emissionTimer)
  if (electricTimer) clearInterval(electricTimer)
}

const handleResize = () => Object.values(charts).forEach(c => c.resize())

onMounted(async () => {
  await nextTick()
  initChart(dangerChartRef.value, 'danger')
  initChart(powerChartRef.value, 'power')
  renderAll()
  startTimers()
  window.addEventListener('resize', handleResize)
})

watch([dangerMode], renderDanger)
watch([furnaceCarouselIdx], () => nextTick(renderFurnace1))
watch([emissionCarouselIdx], () => nextTick(renderEmission))
watch([electricCarouselIdx], () => nextTick(renderFurnace2))

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopTimers()
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.safety-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
  overflow-x: auto;
}

.run-bar {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.run-bar .days {
  color: #52c41a;
  font-size: 20px;
  margin: 0 2px;
}

.safety-grid {
  display: grid;
  grid-template-columns: 28% 44% 28%;
  gap: 8px;
  min-width: 0;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.chart-header.sub {
  margin-top: 0;
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

.sub-label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.ech-legend-note {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.line-dot {
  width: 10px;
  height: 3px;
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
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 2px;
}

.mini-tabs button.active {
  background: #4472c4;
  color: #fff;
}

.more-link {
  color: #4472c4;
  font-size: 13px;
  cursor: pointer;
}

.weather {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #333;
  background: #fff;
  padding: 2px 10px;
  border-radius: 2px;
}

.chart-body {
  height: 185px;
}

/* 轮播卡片 */
.carousel-card {
  position: relative;
}

.carousel-dots {
  display: flex;
  gap: 6px;
}

.c-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d9d9d9;
  cursor: pointer;
  transition: background 0.25s;
}

.c-dot.active {
  background: #4472c4;
}

/* 轮播淡入动画 */
.fade-chart {
  animation: fadeSlide 0.45s ease-out;
}

@keyframes fadeSlide {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* 厂区图 */
.plant-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.plant-viewport {
  position: relative;
  flex: 1;
  min-height: 320px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.plant-viewport:active {
  cursor: grabbing;
}

.plant-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: 0 0;
  pointer-events: none;
}

.zoom-controls {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 5;
}

.zoom-controls button {
  width: 26px;
  height: 26px;
  border: 1px solid #4472c4;
  background: rgba(255, 255, 255, 0.92);
  color: #4472c4;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.zoom-controls button:hover {
  background: #4472c4;
  color: #fff;
}

.p-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  z-index: 2;
  transition: transform 0.15s;
  transform: translate(-50%, -50%);
}

.p-dot:hover {
  transform: translate(-50%, -50%) scale(1.35);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.p-dot.active {
  transform: translate(-50%, -50%) scale(1.4);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
}

.plant-tip {
  position: absolute;
  z-index: 20;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 11px;
  line-height: 1.6;
  min-width: 170px;
  max-width: 230px;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.plant-tip .tip-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 3px;
}

.plant-tip .tip-row {
  font-size: 11px;
  color: #ddd;
}

.plant-tip .tip-row span {
  font-weight: 600;
}

.weather {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #333;
  background: #fff;
  padding: 2px 10px;
  border-radius: 2px;
}

.alarm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.alarm-table th, .alarm-table td {
  border: 1px solid #e8e8e8;
  padding: 4px 6px;
  text-align: center;
  white-space: nowrap;
}

.alarm-table th {
  background: #fafafa;
  font-weight: 500;
  color: #333;
}

/* 设备在线信息 */
.device-panel {
  padding: 8px;
}

.device-top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.device-ring {
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-num {
  font-size: 20px;
  font-weight: 700;
  color: #222;
  line-height: 1.1;
}

.ring-label {
  font-size: 11px;
  color: #666;
}

.device-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #333;
}

.stat-row b {
  margin-left: auto;
  font-weight: 600;
}

.offline-list {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 8px 10px;
}

.ol-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.ol-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
  padding: 3px 0;
}
</style>
