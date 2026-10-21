<template>
  <div class="safety-dashboard">
    <!-- 顶部标题栏 -->
    <DashboardHeader title="材料成型中心工业园区安全环保大屏" />

    <div class="safety-grid">
      <!-- 左列 -->
      <div class="col">
        <div class="chart-card carousel-card">
          <div class="chart-header">
            <span class="chart-title">冲天炉监测</span>
            <span class="more-link" title="查看全部" @click="openCupolaModal">全部</span>
          </div>
          <div class="sub-label">{{ cupolaCarouselPages[furnaceCarouselIdx] }}</div>
          <div class="ech-legend-note centered">
            <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>进出水流量</span>
            <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>温度</span>
          </div>
          <div ref="furnace1ChartRef" class="chart-body fade-chart" :key="furnaceCarouselIdx"></div>
          <div class="carousel-dots at-bottom">
            <span v-for="(_, i) in cupolaCarouselPages" :key="i"
              class="c-dot" :class="{ active: furnaceCarouselIdx === i }"
              @click="furnaceCarouselIdx = i"></span>
          </div>
        </div>

        <div class="chart-card carousel-card">
          <div class="chart-header">
            <span class="chart-title">电炉监控</span>
            <span class="more-link" title="查看全部" @click="openFurnaceModal">全部</span>
          </div>
          <div class="sub-label">{{ electricCarouselPages[electricCarouselIdx] }}</div>
          <div class="ech-legend-note centered">
            <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>进出水流量</span>
            <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>温度</span>
          </div>
          <div ref="furnace2ChartRef" class="chart-body fade-chart" :key="electricCarouselIdx"></div>
          <div class="carousel-dots at-bottom">
            <span v-for="(_, i) in electricCarouselPages" :key="i"
              class="c-dot" :class="{ active: electricCarouselIdx === i }"
              @click="electricCarouselIdx = i"></span>
          </div>
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
                  <th>序号</th><th>报警时间</th><th>所在区域</th><th>点位名称</th><th>异常类型</th><th>实测值</th>
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
            <span class="more-link" title="查看全部" @click="openEmissionModal">全部</span>
          </div>
          <div class="sub-label">{{ emissionCarouselPages[emissionCarouselIdx].name }}</div>
          <div class="ech-legend-note centered">
            <template v-if="emissionCarouselPages[emissionCarouselIdx].type === 'furnace'">
              <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>颗粒物</span>
              <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>二氧化硫</span>
              <span class="legend-item"><i class="line-dot" style="background:#70ad47"></i>氮氧化物</span>
            </template>
            <template v-else-if="emissionCarouselPages[emissionCarouselIdx].type === 'voc'">
              <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>VOCs</span>
            </template>
            <template v-else>
              <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>PM10</span>
              <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>TSP</span>
            </template>
          </div>
          <div ref="vocChartRef" class="chart-body fade-chart" :key="emissionCarouselIdx"></div>
          <div class="carousel-dots at-bottom">
            <span v-for="(_, i) in emissionCarouselPages" :key="i"
              class="c-dot" :class="{ active: emissionCarouselIdx === i }"
              @click="emissionCarouselIdx = i"></span>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">用电监控</span>
            <span class="more-link" title="查看全部" @click="openElectricModal">全部</span>
          </div>
          <div class="ech-legend-note centered">
            <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>生产设备 XX</span>
            <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>治理设备 XX</span>
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

    <!-- 危险作业类型详情弹框 -->
    <div v-if="dangerModalVisible" class="s-modal-mask" @click.self="closeDangerModal">
      <div class="s-modal">
        <div class="s-modal-header">
          <span class="s-modal-title">{{ dangerModalTitle }}</span>
          <button class="s-modal-close" @click="closeDangerModal">✕</button>
        </div>
        <div ref="dangerModalChartRef" class="s-modal-body"></div>
      </div>
    </div>

    <!-- 用电监控明细弹框（6 个折线图 + 分页） -->
    <div v-if="electricModalVisible" class="s-modal-mask" @click.self="closeElectricModal">
      <div class="s-modal s-modal-wide">
        <div class="s-modal-header">
          <span class="s-modal-title">用电监控明细</span>
          <button class="s-modal-close" @click="closeElectricModal">✕</button>
        </div>
        <div class="s-modal-body wide">
          <div class="em-grid">
            <div class="em-cell" v-for="(d, i) in electricPageDevices" :key="d.name">
              <div class="em-title">{{ d.name }}</div>
              <div class="em-legend">
                <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>生产设备 XX</span>
                <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>治理设备 XX</span>
              </div>
              <div class="em-chart" :ref="el => setElectricChartRef(el, i)"></div>
            </div>
          </div>
          <div class="em-pager">
            <a-pagination
              v-model:current="electricModalPage"
              :page-size="electricPageSize"
              :total="electricDevices.length"
              :show-size-changer="false"
              size="small"
              @change="onElectricPageChange"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- 有组织排放全部弹框（9 个统计图 + 分页） -->
    <div v-if="emissionModalVisible" class="s-modal-mask" @click.self="closeEmissionModal">
      <div class="s-modal s-modal-wide">
        <div class="s-modal-header">
          <span class="s-modal-title">有组织排放明细</span>
          <button class="s-modal-close" @click="closeEmissionModal">✕</button>
        </div>
        <div class="s-modal-body wide">
          <div class="em-grid">
            <div class="em-cell" v-for="(d, i) in emissionPageDevices" :key="d.name">
              <div class="em-title">{{ d.name }}</div>
              <div class="em-legend">
                <template v-if="d.type === 'furnace'">
                  <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>颗粒物</span>
                  <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>二氧化硫</span>
                  <span class="legend-item"><i class="line-dot" style="background:#70ad47"></i>氮氧化物</span>
                </template>
                <template v-else-if="d.type === 'voc'">
                  <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>VOCs</span>
                </template>
                <template v-else>
                  <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>PM10</span>
                  <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>TSP</span>
                </template>
              </div>
              <div class="em-chart" :ref="el => setEmissionChartRef(el, i)"></div>
            </div>
          </div>
          <div class="em-pager">
            <a-pagination
              v-model:current="emissionModalPage"
              :page-size="electricPageSize"
              :total="emissionCarouselPages.length"
              :show-size-changer="false"
              size="small"
              @change="onEmissionPageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 冲天炉监测全部弹框（4 个统计图） -->
    <div v-if="cupolaModalVisible" class="s-modal-mask" @click.self="closeCupolaModal">
      <div class="s-modal s-modal-wide">
        <div class="s-modal-header">
          <span class="s-modal-title">冲天炉监测明细</span>
          <button class="s-modal-close" @click="closeCupolaModal">✕</button>
        </div>
        <div class="s-modal-body wide">
          <div class="em-grid">
            <div class="em-cell" v-for="(d, i) in cupolaDevices" :key="d.name">
              <div class="em-title">{{ d.name }}</div>
              <div class="em-legend">
                <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>进出水流量</span>
                <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>温度</span>
              </div>
              <div class="em-chart" :ref="el => setCupolaChartRef(el, i)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 电炉监控全部弹框（6 个折线图 + 分页） -->
    <div v-if="furnaceModalVisible" class="s-modal-mask" @click.self="closeFurnaceModal">
      <div class="s-modal s-modal-wide">
        <div class="s-modal-header">
          <span class="s-modal-title">电炉监控明细</span>
          <button class="s-modal-close" @click="closeFurnaceModal">✕</button>
        </div>
        <div class="s-modal-body wide">
          <div class="em-grid">
            <div class="em-cell" v-for="(d, i) in furnacePageDevices" :key="d.name">
              <div class="em-title">{{ d.name }}</div>
              <div class="em-legend">
                <span class="legend-item"><i class="line-dot" style="background:#4472c4"></i>进出水流量</span>
                <span class="legend-item"><i class="line-dot" style="background:#3ba8a0"></i>温度</span>
              </div>
              <div class="em-chart" :ref="el => setFurnaceChartRef(el, i)"></div>
            </div>
          </div>
          <div class="em-pager">
            <a-pagination
              v-model:current="furnaceModalPage"
              :page-size="electricPageSize"
              :total="furnaceDevices.length"
              :show-size-changer="false"
              size="small"
              @change="onFurnacePageChange"
            />
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
const cupolaCarouselPages = ['一期1#冲天炉', '一期2#冲天炉', '二期1#冲天炉', '二期2#冲天炉']
const emissionCarouselIdx = ref(0)
const emissionCarouselPages = [
  { name: '一期冲天炉', type: 'furnace' },
  { name: '二期冲天炉', type: 'furnace' },
  { name: '造型一线大件', type: 'voc' },
  { name: '造型一线中件', type: 'voc' },
  { name: '造型二线大件', type: 'voc' },
  { name: '造型二线中件', type: 'voc' },
  { name: '造型三线KW', type: 'voc' },
  { name: '造型三线HWS', type: 'voc' },
  { name: '扬尘在线', type: 'dust' }
]
const electricCarouselIdx = ref(0)
const electricCarouselPages = ['1#保温电炉', '2#保温电炉', '3#保温电炉', '4#保温电炉', '1#熔化电炉', '2#熔化电炉', '3#熔化电炉', '4#熔化电炉', '1#精炼电炉', '2#精炼电炉', '3#精炼电炉', '4#精炼电炉']

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

// 冲天炉监测轮播：基于轮播页列表生成数据（进出水流量 + 温度）
const furnaceCarouselData = cupolaCarouselPages.map((_, i) => ({
  flow: furnaceFlowWave(i * 0.55 + 1.2, 18 + (i % 3) * 6, 140),
  temp: furnaceTempWave(i * 0.7 + 0.8, 30 + (i % 4) * 7, 1520)
}))
function renderFurnace1() {
  const el = furnace1ChartRef.value
  if (!el) return
  if (charts.furnace1) { charts.furnace1.dispose(); charts.furnace1 = null as any }
  charts.furnace1 = echarts.init(el)
  const d = furnaceCarouselData[furnaceCarouselIdx.value] || furnaceCarouselData[0]
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
// 电炉监控轮播数据：基于设备列表生成（进出水流量 + 温度）
function furnaceFlowWave(seed: number, amp: number, offset: number): number[] {
  return timeX.map((_, i) => {
    const v = offset + Math.sin((i / 8) * Math.PI * 2 + seed) * amp + Math.cos(i * 1.1 + seed) * amp * 0.3
    return Math.max(0, Math.round(v))
  })
}
function furnaceTempWave(seed: number, amp: number, offset: number): number[] {
  return timeX.map((_, i) => {
    const v = offset + Math.sin((i / 8) * Math.PI * 2 + seed + 0.6) * amp
    return Math.round(v)
  })
}
const electricCarouselData = electricCarouselPages.map((name, i) => ({
  flow: furnaceFlowWave(i * 0.65 + 0.5, 22 + (i % 3) * 5, 145),
  temp: furnaceTempWave(i * 0.8 + 1.2, 35 + (i % 4) * 8, 1510)
}))
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

// 有组织排放轮播数据（9 项）
const emissionX = ['10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00']
const emissionDataMap: Record<string, { unit: string; max?: number; series: { name: string; color: string; data: number[] }[] }>= {
  furnace: {
    unit: 'mg/m³', max: 280,
    series: [
      { name: '颗粒物', color: '#4472c4', data: [180, 240, 200, 120, 100, 220, 130] },
      { name: '二氧化硫', color: '#3ba8a0', data: [120, 160, 140, 80, 90, 150, 110] },
      { name: '氮氧化物', color: '#70ad47', data: [90, 130, 120, 70, 80, 140, 100] }
    ]
  },
  voc: {
    unit: 'mg/m³', max: 280,
    series: [
      { name: 'VOCs', color: '#4472c4', data: [90, 180, 240, 150, 100, 230, 120] }
    ]
  },
  dust: {
    unit: 'μg/m³', max: 350,
    series: [
      { name: 'PM10', color: '#4472c4', data: [220, 280, 250, 180, 160, 260, 200] },
      { name: 'TSP', color: '#3ba8a0', data: [150, 200, 190, 130, 120, 210, 160] }
    ]
  }
}
// 根据轮播索引生成独立数据（避免同一类型共享数据）
function getEmissionData(idx: number) {
  const type = emissionCarouselPages[idx].type
  const base = emissionDataMap[type]
  return {
    unit: base.unit,
    max: base.max,
    series: base.series.map((s, si) => ({
      ...s,
      data: s.data.map((v, di) => Math.max(0, Math.round(v + Math.sin(idx * 2.3 + si * 1.7 + di * 0.9) * 25)))
    }))
  }
}
function renderEmission() {
  const el = vocChartRef.value
  if (!el) return
  if (charts.voc) { charts.voc.dispose(); charts.voc = null as any }
  charts.voc = echarts.init(el)
  const d = getEmissionData(emissionCarouselIdx.value)
  charts.voc?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 14, top: 14, bottom: 24 },
    xAxis: { type: 'category', data: emissionX, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', max: d.max, ...baseAxis, axisLabel: { ...baseAxis.axisLabel, formatter: '{value}' + d.unit } },
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
      { name: '危险作业数量', type: 'bar', data: d.bar, barWidth: 18, itemStyle: { color: '#4472c4' } }
    ]
  }, { notMerge: true })
  charts.danger?.off('click')
  charts.danger?.on('click', (params: any) => {
    if (params.seriesType !== 'bar' || typeof params.dataIndex !== 'number') return
    openDangerModal(d.x[params.dataIndex], params.dataIndex)
  })
}

// 八种危险作业类型（弹框横轴）
const dangerTypes = ['动火作业', '高处作业', '吊装作业', '临时用电作业', '动土作业', '有限空间作业', '盲板抽堵作业', '检维修作业']
const dangerTypeWeights = [0.22, 0.18, 0.14, 0.12, 0.08, 0.09, 0.05, 0.12]

// 把柱子的总量按权重拆到八个类型上，保证合计等于柱子数值
const splitDanger = (total: number, seed: number): number[] => {
  const raw = dangerTypeWeights.map((w, i) =>
    Math.max(0, Math.round(total * w + Math.sin(seed + i * 1.7) * total * 0.03))
  )
  const sum = raw.reduce((s, v) => s + v, 0)
  raw[0] = Math.max(0, raw[0] + (total - sum))
  return raw
}

// 危险作业详情弹框
const dangerModalVisible = ref(false)
const dangerModalTitle = ref('')
const dangerModalValues = ref<number[]>([])
const dangerModalChartRef = ref<HTMLElement>()
let dangerModalChart: echarts.ECharts | null = null

function openDangerModal(label: string, index: number) {
  const d = dangerData[dangerMode.value]
  dangerModalTitle.value = `${label}危险作业统计`
  dangerModalValues.value = splitDanger(d.bar[index] ?? 0, index * 3 + 1)
  dangerModalVisible.value = true
}

function closeDangerModal() {
  dangerModalVisible.value = false
}

function renderDangerModalChart() {
  const el = dangerModalChartRef.value
  if (!el) return
  if (!dangerModalChart || dangerModalChart.getDom() !== el) {
    dangerModalChart?.dispose()
    dangerModalChart = echarts.init(el)
  }
  dangerModalChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 44, right: 16, top: 24, bottom: 62 },
    xAxis: {
      type: 'category', data: dangerTypes, ...baseAxis,
      splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 10, rotate: 32 }
    },
    yAxis: { type: 'value', name: '数量', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
    series: [
      {
        name: '数量', type: 'bar', data: dangerModalValues.value, barWidth: 26,
        itemStyle: { color: '#4472c4' },
        label: { show: true, position: 'top', color: '#666', fontSize: 10 }
      }
    ]
  }, { notMerge: true })
  dangerModalChart.resize()
}

watch(dangerModalVisible, async v => {
  if (!v) return
  await nextTick()
  setTimeout(renderDangerModalChart, 60)
})

// ========== 用电监控明细弹框 ==========
const electricTimes = ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00']

// 生成某设备的电能曲线（生产设备 / 治理设备）
function powerWave(seed: number, amp: number, offset: number): number[] {
  return electricTimes.map((_, i) => {
    const v = offset + Math.sin((i / 8) * Math.PI * 2 + seed) * amp + Math.cos(i * 1.3 + seed) * amp * 0.25
    return Math.max(0, Math.round(v))
  })
}

const electricDeviceNames = [
  '造型一线 混砂机', '造型一线 造型机', '造型一线 浇注机',
  '造型二线 造型机', '造型二线 落砂机', '造型二线 抛丸机',
  '熔炼车间 保温电炉', '熔炼车间 熔化电炉', '熔炼车间 冲天炉',
  '清理车间 抛丸机', '清理车间 打磨机', '清理车间 除尘风机',
  '热处理 淬火炉', '热处理 回火炉', '热处理 冷却塔',
  '砂处理 混砂机', '砂处理 输送机', '砂处理 除尘设备'
]

const electricDevices = electricDeviceNames.map((name, i) => ({
  name,
  prod: powerWave(i * 0.7 + 0.4, 60 + (i % 3) * 10, 165),
  treat: powerWave(i * 0.9 + 2.1, 45 + (i % 4) * 8, 140)
}))

const electricModalVisible = ref(false)
const electricModalPage = ref(1)
const electricPageSize = 6
const electricChartEls: (HTMLElement | null)[] = []
let electricCharts: echarts.ECharts[] = []

const setElectricChartRef = (el: any, i: number) => {
  electricChartEls[i] = (el as HTMLElement) || null
}

// 当前页的设备（每页 6 个）
const electricPageDevices = computed(() => {
  const start = (electricModalPage.value - 1) * electricPageSize
  return electricDevices.slice(start, start + electricPageSize)
})

function renderElectricModalCharts() {
  electricCharts.forEach(c => c.dispose())
  electricCharts = []
  electricPageDevices.value.forEach((d, i) => {
    const el = electricChartEls[i]
    if (!el) return
    const c = echarts.init(el)
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 34, right: 12, top: 12, bottom: 22 },
      xAxis: { type: 'category', data: electricTimes, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: { type: 'value', ...baseAxis },
      series: [
        {
          name: '生产设备 XX', type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
          data: d.prod, itemStyle: { color: '#4472c4' }, lineStyle: { width: 1.6 }
        },
        {
          name: '治理设备 XX', type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
          data: d.treat, itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 1.6 }
        }
      ]
    }, { notMerge: true })
    c.resize()
    electricCharts.push(c)
  })
}

function openElectricModal() {
  electricModalPage.value = 1
  electricModalVisible.value = true
}

function closeElectricModal() {
  electricModalVisible.value = false
}

function onElectricPageChange() {
  nextTick(() => setTimeout(renderElectricModalCharts, 40))
}

watch(electricModalVisible, async v => {
  if (!v) {
    electricCharts.forEach(c => c.dispose())
    electricCharts = []
    return
  }
  await nextTick()
  setTimeout(renderElectricModalCharts, 60)
})

// ========== 电炉监控全部弹框 ==========

const furnaceDeviceNames = [
  '1#保温电炉', '2#保温电炉', '3#保温电炉', '4#保温电炉',
  '1#熔化电炉', '2#熔化电炉', '3#熔化电炉', '4#熔化电炉',
  '1#精炼电炉', '2#精炼电炉', '3#精炼电炉', '4#精炼电炉'
]

const furnaceDevices = furnaceDeviceNames.map((name, i) => ({
  name,
  flow: furnaceFlowWave(i * 0.65 + 0.5, 22 + (i % 3) * 5, 145),
  temp: furnaceTempWave(i * 0.8 + 1.2, 35 + (i % 4) * 8, 1510)
}))

const furnaceModalVisible = ref(false)
const furnaceModalPage = ref(1)
const furnaceChartEls: (HTMLElement | null)[] = []
let furnaceCharts: echarts.ECharts[] = []

const setFurnaceChartRef = (el: any, i: number) => {
  furnaceChartEls[i] = (el as HTMLElement) || null
}

const furnacePageDevices = computed(() => {
  const start = (furnaceModalPage.value - 1) * electricPageSize
  return furnaceDevices.slice(start, start + electricPageSize)
})

function renderFurnaceModalCharts() {
  furnaceCharts.forEach(c => c.dispose())
  furnaceCharts = []
  furnacePageDevices.value.forEach((d, i) => {
    const el = furnaceChartEls[i]
    if (!el) return
    const c = echarts.init(el)
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 34, right: 42, top: 12, bottom: 22 },
      xAxis: { type: 'category', data: electricTimes, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: [
        { type: 'value', ...baseAxis, name: '流量', nameTextStyle: { fontSize: 10, color: '#999' } },
        { type: 'value', ...baseAxis, name: '℃', nameTextStyle: { fontSize: 10, color: '#999' }, position: 'right', splitLine: { show: false } }
      ],
      series: [
        {
          name: '进出水流量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
          data: d.flow, itemStyle: { color: '#4472c4' }, lineStyle: { width: 1.6 }, yAxisIndex: 0
        },
        {
          name: '温度', type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
          data: d.temp, itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 1.6 }, yAxisIndex: 1
        }
      ]
    }, { notMerge: true })
    c.resize()
    furnaceCharts.push(c)
  })
}

// ========== 有组织排放全部弹框 ==========
const emissionModalVisible = ref(false)
const emissionModalPage = ref(1)
const emissionChartEls: (HTMLElement | null)[] = []
let emissionModalCharts: echarts.ECharts[] = []

const setEmissionChartRef = (el: any, i: number) => {
  emissionChartEls[i] = (el as HTMLElement) || null
}

const emissionPageDevices = computed(() => {
  const start = (emissionModalPage.value - 1) * electricPageSize
  return emissionCarouselPages.slice(start, start + electricPageSize)
})

function renderEmissionModalCharts() {
  emissionModalCharts.forEach(c => c.dispose())
  emissionModalCharts = []
  emissionPageDevices.value.forEach((item, i) => {
    const el = emissionChartEls[i]
    if (!el) return
    const c = echarts.init(el)
    const d = getEmissionData(emissionCarouselPages.indexOf(item))
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 14, top: 12, bottom: 22 },
      xAxis: { type: 'category', data: emissionX, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: { type: 'value', max: d.max, ...baseAxis, axisLabel: { ...baseAxis.axisLabel, formatter: '{value}' + d.unit } },
      series: d.series.map(s => ({
        name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
        data: s.data, itemStyle: { color: s.color }, lineStyle: { width: 1.6 }
      }))
    }, { notMerge: true })
    c.resize()
    emissionModalCharts.push(c)
  })
}

function openEmissionModal() {
  emissionModalPage.value = 1
  emissionModalVisible.value = true
}

function closeEmissionModal() {
  emissionModalVisible.value = false
}

function onEmissionPageChange() {
  nextTick(() => setTimeout(renderEmissionModalCharts, 40))
}

watch(emissionModalVisible, async v => {
  if (!v) {
    emissionModalCharts.forEach(c => c.dispose())
    emissionModalCharts = []
    return
  }
  await nextTick()
  setTimeout(renderEmissionModalCharts, 60)
})

// ========== 冲天炉监测全部弹框 ==========
const cupolaModalVisible = ref(false)
const cupolaChartEls: (HTMLElement | null)[] = []
let cupolaCharts: echarts.ECharts[] = []

const cupolaDevices = cupolaCarouselPages.map((name, i) => ({
  name,
  flow: furnaceFlowWave(i * 0.55 + 1.2, 18 + (i % 3) * 6, 140),
  temp: furnaceTempWave(i * 0.7 + 0.8, 30 + (i % 4) * 7, 1520)
}))

const setCupolaChartRef = (el: any, i: number) => {
  cupolaChartEls[i] = (el as HTMLElement) || null
}

function renderCupolaModalCharts() {
  cupolaCharts.forEach(c => c.dispose())
  cupolaCharts = []
  cupolaDevices.forEach((d, i) => {
    const el = cupolaChartEls[i]
    if (!el) return
    const c = echarts.init(el)
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 34, right: 42, top: 12, bottom: 22 },
      xAxis: { type: 'category', data: timeX, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: [
        { type: 'value', ...baseAxis, name: '流量', nameTextStyle: { fontSize: 10, color: '#999' } },
        { type: 'value', ...baseAxis, name: '℃', nameTextStyle: { fontSize: 10, color: '#999' }, position: 'right', splitLine: { show: false } }
      ],
      series: [
        { name: '进出水流量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
          data: d.flow, itemStyle: { color: '#4472c4' }, lineStyle: { width: 1.6 }, yAxisIndex: 0 },
        { name: '温度', type: 'line', smooth: true, symbol: 'circle', symbolSize: 3,
          data: d.temp, itemStyle: { color: '#3ba8a0' }, lineStyle: { width: 1.6 }, yAxisIndex: 1 }
      ]
    }, { notMerge: true })
    c.resize()
    cupolaCharts.push(c)
  })
}

function openCupolaModal() {
  cupolaModalVisible.value = true
}

function closeCupolaModal() {
  cupolaModalVisible.value = false
}

watch(cupolaModalVisible, async v => {
  if (!v) {
    cupolaCharts.forEach(c => c.dispose())
    cupolaCharts = []
    return
  }
  await nextTick()
  setTimeout(renderCupolaModalCharts, 60)
})

function openFurnaceModal() {
  furnaceModalPage.value = 1
  furnaceModalVisible.value = true
}

function closeFurnaceModal() {
  furnaceModalVisible.value = false
}

function onFurnacePageChange() {
  nextTick(() => setTimeout(renderFurnaceModalCharts, 40))
}

watch(furnaceModalVisible, async v => {
  if (!v) {
    furnaceCharts.forEach(c => c.dispose())
    furnaceCharts = []
    return
  }
  await nextTick()
  setTimeout(renderFurnaceModalCharts, 60)
})

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
    furnaceCarouselIdx.value = (furnaceCarouselIdx.value + 1) % cupolaCarouselPages.length
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

const handleResize = () => {
  Object.values(charts).forEach(c => c.resize())
  electricCharts.forEach(c => c.resize())
  furnaceCharts.forEach(c => c.resize())
  emissionModalCharts.forEach(c => c.resize())
  cupolaCharts.forEach(c => c.resize())
}

onMounted(async () => {
  await nextTick()
  initChart(dangerChartRef.value, 'danger')
  initChart(powerChartRef.value, 'power')
  renderAll()
  startTimers()
  window.addEventListener('resize', handleResize)
})

watch([dangerMode], renderDanger)
watch(furnaceCarouselIdx, () => nextTick(renderFurnace1))
watch([emissionCarouselIdx], () => nextTick(renderEmission))
watch([electricCarouselIdx], () => nextTick(renderFurnace2))

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopTimers()
  Object.values(charts).forEach(c => c.dispose())
  dangerModalChart?.dispose()
  dangerModalChart = null
  electricCharts.forEach(c => c.dispose())
  electricCharts = []
  furnaceCharts.forEach(c => c.dispose())
  furnaceCharts = []
  emissionModalCharts.forEach(c => c.dispose())
  emissionModalCharts = []
  cupolaCharts.forEach(c => c.dispose())
  cupolaCharts = []
})
</script>

<style scoped>
.safety-dashboard {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
  overflow-x: auto;
}

/* 危险作业类型弹框 */
.s-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.s-modal {
  background: #fff;
  border-radius: 6px;
  width: 880px;
  max-width: 94vw;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.s-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #e8e8e8;
}

.s-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.s-modal-close {
  border: none;
  background: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
}

.s-modal-close:hover {
  color: #333;
}

.s-modal-body {
  height: 360px;
  padding: 8px;
  box-sizing: border-box;
}

/* 用电监控明细弹框 */
.s-modal-wide {
  width: 1180px;
  max-width: 96vw;
}

.s-modal-body.wide {
  height: auto;
  max-height: 78vh;
  overflow-y: auto;
  padding: 14px 18px 6px;
}

.em-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
}

.em-cell {
  min-width: 0;
}

.em-title {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.em-legend {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 2px;
}

.em-chart {
  height: 200px;
}

.em-pager {
  display: flex;
  justify-content: center;
  padding: 12px 0 6px;
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
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.chart-header.sub {
  margin-top: 0;
}
.sub-label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.sub-label.center {
  text-align: center;
}

.ech-legend-note {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ech-legend-note.centered {
  justify-content: center;
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
  padding: 2px 8px;
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
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.carousel-dots.at-bottom {
  justify-content: center;
  margin-top: 6px;
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
