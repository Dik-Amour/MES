<template>
  <div class="annealing-record">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产线">
          <a-select
            v-model:value="searchForm.productionLine"
            placeholder="请选择产线"
            allow-clear
            style="width: 160px"
          >
            <a-select-option v-for="line in productionLineOptions" :key="line" :value="line">
              {{ line }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="子工位">
          <a-input
            v-model:value="searchForm.subWorkstation"
            placeholder="请输入子工位"
            allow-clear
            style="width: 160px"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="设备名称">
          <a-input
            v-model:value="searchForm.equipmentName"
            placeholder="请输入设备名称"
            allow-clear
            style="width: 160px"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="日期区间">
          <a-range-picker v-model:value="searchForm.dateRange" format="YYYY-MM-DD" :placeholder="['开始日期', '结束日期']" style="width: 260px" />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 数据表格卡片 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :row-key="'id'"
        :scroll="{ x: 1400 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewCurve(record)">
              <LineChartOutlined />
              查看
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 温度曲线弹框 -->
    <a-modal
      v-model:open="curveModalVisible"
      title="温度曲线详情"
      :footer="null"
      :width="960"
      :body-style="{ padding: '16px 24px' }"
    >
      <div class="curve-info">
        <a-descriptions :column="3" bordered size="small" class="curve-descriptions">
          <a-descriptions-item label="炉次号">{{ curveRecord.furnaceNo }}</a-descriptions-item>
          <a-descriptions-item label="产线">{{ curveRecord.productionLine }}</a-descriptions-item>
          <a-descriptions-item label="设备名称">{{ curveRecord.equipmentName }}</a-descriptions-item>
          <a-descriptions-item label="工位">{{ curveRecord.workstation }}</a-descriptions-item>
          <a-descriptions-item label="进料时间">{{ curveRecord.feedTime }}</a-descriptions-item>
          <a-descriptions-item label="出料时间">{{ curveRecord.dischargeTime }}</a-descriptions-item>
          <a-descriptions-item label="保温温度">{{ curveRecord.preservationTempLow }} ~ {{ curveRecord.preservationTempHigh }}℃</a-descriptions-item>
          <a-descriptions-item label="保温时段">{{ curveRecord.preservationStart }} ~ {{ curveRecord.preservationEnd }}</a-descriptions-item>
          <a-descriptions-item label="温区数量">{{ curveRecord.zoneCount }} 个温区</a-descriptions-item>
        </a-descriptions>
        <div class="curve-chart-wrapper">
          <div ref="curveChartRef" class="curve-chart"></div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  LineChartOutlined
} from '@ant-design/icons-vue'
import * as echarts from 'echarts'

// 温度曲线图实例
const curveChartRef = ref<HTMLElement>()
let curveChart: echarts.ECharts | null = null

// 产线选项（产线名称 → 编号映射）
const productionLineOptions = [
  '造型三线HWS清理',
  '造型三线KW清理',
  '造型二线大件清理',
  '造型二线中件清理',
  '造型一线大件清理',
  '造型一线中件清理'
]
const lineCodeMap: Record<string, string> = {
  '造型三线HWS清理': 'GQN',
  '造型三线KW清理': 'GQE',
  '造型二线大件清理': 'GQC',
  '造型二线中件清理': 'GQB',
  '造型一线大件清理': 'GQD',
  '造型一线中件清理': 'GQZ'
}

// 搜索表单
const searchForm = reactive({
  productionLine: undefined as string | undefined,
  equipmentName: '',
  subWorkstation: '',
  dateRange: [dayjs(), dayjs()] as any
})

// 加载状态
const loading = ref(false)

// 模拟数据
const mockData = [
  { id: 1, productionLine: '造型三线HWS清理', furnaceNo: 'GQN-20260901-001', feedTime: '2026-09-01 08:30', dischargeTime: '2026-09-01 12:30', workstation: 'A工位', subWorkstation: 'A-01', scheduler: '周九', operator: '张三', equipmentName: '退火炉-01', zoneCount: 4, preservationTempLow: 835, preservationTempHigh: 865, preservationStart: '09:36', preservationEnd: '11:18' },
  { id: 2, productionLine: '造型三线KW清理', furnaceNo: 'GQE-20260901-001', feedTime: '2026-09-01 14:00', dischargeTime: '2026-09-01 18:00', workstation: 'A工位', subWorkstation: 'A-02', scheduler: '吴十', operator: '李四', equipmentName: '退火炉-02', zoneCount: 4, preservationTempLow: 830, preservationTempHigh: 860, preservationStart: '15:12', preservationEnd: '16:48' },
  { id: 3, productionLine: '造型二线大件清理', furnaceNo: 'GQC-20260902-001', feedTime: '2026-09-02 07:45', dischargeTime: '2026-09-02 11:45', workstation: 'B工位', subWorkstation: 'B-01', scheduler: '冯一', operator: '王五', equipmentName: '退火炉-03', zoneCount: 3, preservationTempLow: 840, preservationTempHigh: 870, preservationStart: '08:57', preservationEnd: '10:33' },
  { id: 4, productionLine: '造型二线中件清理', furnaceNo: 'GQB-20260902-001', feedTime: '2026-09-02 13:15', dischargeTime: '2026-09-02 17:15', workstation: 'B工位', subWorkstation: 'B-02', scheduler: '陈二', operator: '赵六', equipmentName: '退火炉-04', zoneCount: 3, preservationTempLow: 845, preservationTempHigh: 875, preservationStart: '14:27', preservationEnd: '16:03' },
  { id: 5, productionLine: '造型一线大件清理', furnaceNo: 'GQD-20260903-001', feedTime: '2026-09-03 08:00', dischargeTime: '2026-09-03 12:00', workstation: 'C工位', subWorkstation: 'C-01', scheduler: '林三', operator: '张三', equipmentName: '退火炉-05', zoneCount: 4, preservationTempLow: 850, preservationTempHigh: 880, preservationStart: '09:12', preservationEnd: '10:48' },
  { id: 6, productionLine: '造型一线中件清理', furnaceNo: 'GQZ-20260903-001', feedTime: '2026-09-03 14:30', dischargeTime: '2026-09-03 18:30', workstation: 'A工位', subWorkstation: 'A-03', scheduler: '郑四', operator: '钱七', equipmentName: '退火炉-06', zoneCount: 4, preservationTempLow: 835, preservationTempHigh: 865, preservationStart: '15:42', preservationEnd: '17:18' },
  { id: 7, productionLine: '造型三线HWS清理', furnaceNo: 'GQN-20260903-001', feedTime: '2026-09-03 20:00', dischargeTime: '2026-09-04 00:00', workstation: 'C工位', subWorkstation: 'C-02', scheduler: '黄五', operator: '孙八', equipmentName: '退火炉-01', zoneCount: 4, preservationTempLow: 840, preservationTempHigh: 870, preservationStart: '21:12', preservationEnd: '23:48' },
  { id: 8, productionLine: '造型二线大件清理', furnaceNo: 'GQC-20260904-001', feedTime: '2026-09-04 08:20', dischargeTime: '2026-09-04 12:20', workstation: 'B工位', subWorkstation: 'B-01', scheduler: '刘六', operator: '李四', equipmentName: '退火炉-03', zoneCount: 3, preservationTempLow: 835, preservationTempHigh: 865, preservationStart: '09:32', preservationEnd: '11:08' }
]

const dataSource = ref([...mockData])

// 筛选后的数据
const filteredData = computed(() => {
  let result = dataSource.value

  if (searchForm.productionLine) {
    result = result.filter(item => item.productionLine === searchForm.productionLine)
  }
  if (searchForm.subWorkstation) {
    const keyword = searchForm.subWorkstation.trim().toLowerCase()
    result = result.filter(item => item.subWorkstation.toLowerCase().includes(keyword))
  }
  if (searchForm.equipmentName) {
    const keyword = searchForm.equipmentName.trim().toLowerCase()
    result = result.filter(item => item.equipmentName.toLowerCase().includes(keyword))
  }
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const start = searchForm.dateRange[0].format('YYYY-MM-DD')
    const end = searchForm.dateRange[1].format('YYYY-MM-DD')
    result = result.filter(i => {
      const timeField = i.startTime || i.loadTime || i.coatingStartTime || i.time || ''
      return timeField >= start && timeField <= end + ' 23:59:59'
    })
  }

  return result
})

// 表格列定义
const columns = [
  { title: '序号', key: 'index', width: 70, fixed: 'left' as const },
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 100 },
  { title: '炉次号', dataIndex: 'furnaceNo', key: 'furnaceNo', width: 180 },
  { title: '进料时间', dataIndex: 'feedTime', key: 'feedTime', width: 170 },
  { title: '出料时间', dataIndex: 'dischargeTime', key: 'dischargeTime', width: 170 },
  { title: '工位', dataIndex: 'workstation', width: 90 },
  { title: '子工位', dataIndex: 'subWorkstation', width: 90 },
  { title: '排班人', dataIndex: 'scheduler', width: 100 },
  { title: '上机人', dataIndex: 'operator', key: 'operator', width: 100 },
  { title: '设备名称', dataIndex: 'equipmentName', key: 'equipmentName', width: 130 },
  { title: '温度曲线', key: 'action', width: 100, fixed: 'right' as const }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

// 更新分页总数
const updateTotal = () => {
  pagination.total = filteredData.value.length
}
updateTotal()

// 表格分页变更
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

// 查询
const handleSearch = () => {
  pagination.current = 1
  updateTotal()
  message.success('查询完成')
}

// 重置
const handleReset = () => {
  searchForm.productionLine = undefined
  searchForm.equipmentName = ''
  searchForm.subWorkstation = ''
  searchForm.dateRange = null
  pagination.current = 1
  updateTotal()
  message.success('已重置')
}

// 温度曲线弹框
const curveModalVisible = ref(false)
const curveRecord = ref<any>({})

// 温区颜色配置
const zoneColors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c']

// 生成模拟温度曲线数据
function generateCurveData(record: any) {
  const feedTime = new Date(record.feedTime.replace(' ', 'T'))
  const dischargeTime = new Date(record.dischargeTime.replace(' ', 'T'))
  const totalMs = dischargeTime.getTime() - feedTime.getTime()
  const zoneCount = record.zoneCount || 4
  const preservationLow = record.preservationTempLow || 835
  const preservationHigh = record.preservationTempHigh || 865
  const preservationTarget = (preservationLow + preservationHigh) / 2

  // 保温时段（约 40%~70% 的总时间）
  const presStartMs = feedTime.getTime() + totalMs * 0.3
  const presEndMs = feedTime.getTime() + totalMs * 0.7

  const timePoints: string[] = []
  const zoneData: number[][] = Array.from({ length: zoneCount }, () => [])
  const stepCount = 120 // 120 个采样点

  for (let i = 0; i <= stepCount; i++) {
    const t = feedTime.getTime() + (totalMs * i) / stepCount
    const date = new Date(t)
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    timePoints.push(`${h}:${m}`)

    const progress = i / stepCount
    for (let z = 0; z < zoneCount; z++) {
      let temp: number
      const zoneOffset = (z - (zoneCount - 1) / 2) * 5 // 温区间差异 ±5~15℃
      const noise = (Math.random() - 0.5) * 6 // 随机波动 ±3℃

      if (progress < 0.15) {
        // 升温阶段：室温 → 目标温度
        temp = 25 + (preservationTarget - 25) * (progress / 0.15) + noise + zoneOffset
      } else if (progress < 0.3) {
        // 过渡到保温：轻微过冲后稳定
        const overshoot = Math.sin((progress - 0.15) / 0.15 * Math.PI) * 15
        temp = preservationTarget + overshoot + noise + zoneOffset
      } else if (progress < 0.7) {
        // 保温阶段：围绕目标温度小幅波动
        temp = preservationTarget + Math.sin(progress * 20) * 4 + noise * 0.6 + zoneOffset
      } else if (progress < 0.85) {
        // 降温阶段
        const coolProgress = (progress - 0.7) / 0.15
        temp = preservationTarget - (preservationTarget - 200) * coolProgress + noise + zoneOffset
      } else {
        // 缓降阶段
        const coolProgress2 = (progress - 0.85) / 0.15
        temp = 200 - (200 - 50) * coolProgress2 + noise * 0.5 + zoneOffset
      }

      zoneData[z].push(Math.round(temp * 10) / 10)
    }
  }

  return { timePoints, zoneData, zoneCount, preservationLow, preservationHigh, presStartMs, presEndMs, feedTime, dischargeTime }
}

// ECharts 配置
const curveChartOption = computed(() => {
  const record = curveRecord.value
  if (!record.id) return {}

  const { timePoints, zoneData, zoneCount, preservationLow, preservationHigh, presStartMs, presEndMs } = generateCurveData(record)

  const presStartIdx = Math.round(((presStartMs - new Date(record.feedTime.replace(' ', 'T')).getTime()) / (new Date(record.dischargeTime.replace(' ', 'T')).getTime() - new Date(record.feedTime.replace(' ', 'T')).getTime())) * 120)
  const presEndIdx = Math.round(((presEndMs - new Date(record.feedTime.replace(' ', 'T')).getTime()) / (new Date(record.dischargeTime.replace(' ', 'T')).getTime() - new Date(record.feedTime.replace(' ', 'T')).getTime())) * 120)

  const series: any[] = []

  // 各温区温度曲线
  for (let z = 0; z < zoneCount; z++) {
    series.push({
      name: `${z + 1}区温度`,
      type: 'line',
      data: zoneData[z],
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2 },
      itemStyle: { color: zoneColors[z % zoneColors.length] },
      emphasis: { lineStyle: { width: 3 } }
    })
  }

  // 工艺上限参考线（用第一组 series 附加 markLine）
  series[0].markLine = {
    silent: true,
    symbol: 'none',
    lineStyle: { type: 'dashed', width: 1.5, color: '#999' },
    label: {
      show: true,
      position: 'insideEndTop',
      formatter: '{b}: {c}℃',
      fontSize: 11,
      color: '#999'
    },
    data: [
      { name: '工艺上限', yAxis: preservationHigh },
      { name: '工艺下限', yAxis: preservationLow }
    ]
  }

  // 保温时段标记线
  series[0].markArea = {
    silent: true,
    itemStyle: { color: 'rgba(24, 144, 255, 0.06)' },
    label: { show: false },
    data: [
      [
        { xAxis: timePoints[Math.min(presStartIdx, timePoints.length - 1)] },
        { xAxis: timePoints[Math.min(presEndIdx, timePoints.length - 1)] }
      ]
    ]
  }

  // 保温开始/结束竖线
  const presStartLabel = timePoints[Math.min(presStartIdx, timePoints.length - 1)]
  const presEndLabel = timePoints[Math.min(presEndIdx, timePoints.length - 1)]
  for (let z = 0; z < zoneCount; z++) {
    if (z === 0) {
      series[z].markLine.data.push(
        { name: '保温开始', xAxis: presStartLabel, lineStyle: { type: 'solid', width: 1.5, color: '#1890ff' }, label: { show: true, position: 'start', formatter: '保温开始', fontSize: 10, color: '#1890ff' } },
        { name: '保温结束', xAxis: presEndLabel, lineStyle: { type: 'solid', width: 1.5, color: '#1890ff' }, label: { show: true, position: 'start', formatter: '保温结束', fontSize: 10, color: '#1890ff' } }
      )
    }
  }

  return {
    backgroundColor: '#fff',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const time = params[0]?.axisValue || ''
        let html = `<div style="font-weight:600;margin-bottom:4px">${time}</div>`
        params.forEach((p: any) => {
          if (p.seriesName && !p.seriesName.includes('工艺')) {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};"></span>
              <span>${p.seriesName}:</span>
              <span style="font-weight:600">${p.value}℃</span>
            </div>`
          }
        })
        return html
      }
    },
    legend: {
      top: 8,
      itemWidth: 16,
      itemHeight: 3,
      textStyle: { fontSize: 12, color: '#666' }
    },
    grid: {
      left: 60,
      right: 30,
      top: 50,
      bottom: 60
    },
    xAxis: {
      type: 'category',
      data: timePoints,
      name: '时间',
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { fontSize: 12, color: '#666' },
      axisLabel: { fontSize: 11, color: '#999', rotate: 30 },
      axisTick: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '温度（℃）',
      nameTextStyle: { fontSize: 12, color: '#666' },
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 }
    ],
    series
  }
})

const handleViewCurve = (record: any) => {
  curveRecord.value = { ...record }
  curveModalVisible.value = true
}

// 渲染温度曲线
const renderCurve = () => {
  if (!curveChartRef.value) return
  if (!curveChart) {
    curveChart = echarts.init(curveChartRef.value)
  }
  curveChart.setOption(curveChartOption.value as any, { notMerge: true })
  curveChart.resize()
}

watch(curveModalVisible, async (v) => {
  if (!v) return
  await nextTick()
  renderCurve()
  // 弹框挂载可能存在延迟，补渲染一次以确保尺寸正确
  setTimeout(renderCurve, 60)
})

watch(curveChartOption, () => {
  if (curveModalVisible.value) renderCurve()
})

const handleResize = () => curveChart?.resize()

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  curveChart?.dispose()
  curveChart = null
})
</script>

<style scoped>
.annealing-record {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card :deep(.ant-form-item) {
  margin-bottom: 0;
}

.curve-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.curve-descriptions {
  font-size: 13px;
}

.curve-chart-wrapper {
  width: 100%;
  height: 420px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fff;
}

.curve-chart {
  width: 100%;
  height: 100%;
}
</style>
