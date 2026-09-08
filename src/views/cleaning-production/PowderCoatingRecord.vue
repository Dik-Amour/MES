<template>
  <div class="powder-coating-record">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产线">
          <a-select v-model:value="searchForm.productionLine" placeholder="请选择产线" allow-clear style="width: 200px">
            <a-select-option v-for="line in productionLineOptions" :key="line" :value="line">{{ line }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="设备">
          <a-input v-model:value="searchForm.equipment" placeholder="请输入设备名称" allow-clear style="width: 160px" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="子工位">
          <a-input v-model:value="searchForm.subWorkstation" placeholder="请输入子工位" allow-clear style="width: 160px" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="日期区间">
          <a-range-picker v-model:value="searchForm.dateRange" format="YYYY-MM-DD" :placeholder="['开始日期', '结束日期']" style="width: 260px" />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch"><SearchOutlined /> 查询</a-button>
            <a-button @click="handleReset"><ReloadOutlined /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
    <a-card :bordered="false" class="table-card">
      <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" :row-key="'id'" :scroll="{ x: 1400 }" size="middle" @change="handleTableChange">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ (pagination.current - 1) * pagination.pageSize + index + 1 }}</template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewCurve(record)"><LineChartOutlined /> 查看</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 固化炉温度曲线弹框 -->
    <a-modal v-model:open="curveModalVisible" title="固化炉温度曲线" :footer="null" :width="960" :body-style="{ padding: '16px 24px' }">
      <div class="curve-info">
        <a-descriptions :column="3" bordered size="small" class="curve-descriptions">
          <a-descriptions-item label="产线">{{ curveRecord.productionLine }}</a-descriptions-item>
          <a-descriptions-item label="毛坯件号">{{ curveRecord.partNo }}</a-descriptions-item>
          <a-descriptions-item label="喷粉配方编号">{{ curveRecord.recipeNo }}</a-descriptions-item>
          <a-descriptions-item label="进固化炉">{{ curveRecord.ovenInTime }}</a-descriptions-item>
          <a-descriptions-item label="出固化炉">{{ curveRecord.ovenOutTime }}</a-descriptions-item>
          <a-descriptions-item label="设定温度">{{ curveRecord.设定TempLow }} ~ {{ curveRecord.设定TempHigh }}℃</a-descriptions-item>
        </a-descriptions>
        <div class="curve-chart-wrapper">
          <v-chart class="curve-chart" :option="curveChartOption" :autoresize="true" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, LineChartOutlined } from '@ant-design/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, MarkAreaComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, MarkAreaComponent, DataZoomComponent, CanvasRenderer])

const productionLineOptions = ['造型三线HWS清理', '造型三线KW清理', '造型二线大件清理', '造型二线中件清理', '造型一线大件清理', '造型一线中件清理']
const searchForm = reactive({ productionLine: undefined as string | undefined, equipment: '', subWorkstation: '', dateRange: null as any })
const filteredData = computed(() => {
  let r = dataSource.value
  if (searchForm.productionLine) r = r.filter(i => i.productionLine === searchForm.productionLine)
  if (searchForm.equipment) { const k = searchForm.equipment.trim().toLowerCase(); r = r.filter(i => i.equipment.toLowerCase().includes(k)) }
  if (searchForm.subWorkstation) { const k = searchForm.subWorkstation.trim().toLowerCase(); r = r.filter(i => i.subWorkstation.toLowerCase().includes(k)) }
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const start = searchForm.dateRange[0].format('YYYY-MM-DD')
    const end = searchForm.dateRange[1].format('YYYY-MM-DD')
    r = r.filter((i: any) => {
      const timeField = i.startTime || i.loadTime || i.coatingStartTime || i.time || ''
      return timeField >= start && timeField <= end + ' 23:59:59'
    })
  }
  return r
})
const columns = [
  { title: '序号', key: 'index', width: 70, fixed: 'left' as const },
  { title: '产线', dataIndex: 'productionLine', width: 160 },
  { title: '产品系列', dataIndex: 'productSeries', width: 100 },
  { title: '毛坯件号', dataIndex: 'partNo', width: 130 },
  { title: '工位', dataIndex: 'workstation', width: 90 },
  { title: '子工位', dataIndex: 'subWorkstation', width: 90 },
  { title: '喷粉配方编号', dataIndex: 'recipeNo', width: 130 },
  { title: '喷粉开始时间', dataIndex: 'coatingStartTime', width: 160 },
  { title: '喷粉结束时间', dataIndex: 'coatingEndTime', width: 160 },
  { title: '实际喷粉时长(min)', dataIndex: 'actualCoatingDuration', width: 140 },
  { title: '设定喷粉时长(min)', dataIndex: 'setCoatingDuration', width: 140 },
  { title: '进固化炉时间', dataIndex: 'ovenInTime', width: 160 },
  { title: '出固化炉时间', dataIndex: 'ovenOutTime', width: 160 },
  { title: '实际固化时长(min)', dataIndex: 'actualCuringDuration', width: 140 },
  { title: '设定固化时长(min)', dataIndex: 'setCuringDuration', width: 140 },
  { title: '上机人', dataIndex: 'operator', width: 100 },
  { title: '固化炉温度曲线', key: 'action', width: 120, fixed: 'right' as const }
]
const dataSource = ref([
  { id: 1, productionLine: '造型三线HWS清理', productSeries: 'WP12', partNo: 'WP12-3001', workstation: 'A工位', subWorkstation: 'A-01', equipment: '喷粉线-01', recipeNo: 'PF-R01-01', coatingStartTime: '2026-09-03 08:00', coatingEndTime: '2026-09-03 08:18', actualCoatingDuration: 18, setCoatingDuration: 20, ovenInTime: '2026-09-03 08:20', ovenOutTime: '2026-09-03 09:20', actualCuringDuration: 60, setCuringDuration: 60, 设定TempLow: 180, 设定TempHigh: 200, operator: '张三' },
  { id: 2, productionLine: '造型三线KW清理', productSeries: 'WP13', partNo: 'WP13-3010', workstation: 'A工位', subWorkstation: 'A-02', equipment: '喷粉线-01', recipeNo: 'PF-R01-02', coatingStartTime: '2026-09-03 09:30', coatingEndTime: '2026-09-03 09:50', actualCoatingDuration: 20, setCoatingDuration: 20, ovenInTime: '2026-09-03 09:52', ovenOutTime: '2026-09-03 10:52', actualCuringDuration: 60, setCuringDuration: 60, 设定TempLow: 180, 设定TempHigh: 200, operator: '李四' },
  { id: 3, productionLine: '造型二线大件清理', productSeries: 'WP13', partNo: 'WP13-2015', workstation: 'B工位', subWorkstation: 'B-01', equipment: '喷粉线-02', recipeNo: 'PF-R02-01', coatingStartTime: '2026-09-03 10:10', coatingEndTime: '2026-09-03 10:30', actualCoatingDuration: 20, setCoatingDuration: 22, ovenInTime: '2026-09-03 10:32', ovenOutTime: '2026-09-03 11:35', actualCuringDuration: 63, setCuringDuration: 60, 设定TempLow: 185, 设定TempHigh: 205, operator: '王五' },
  { id: 4, productionLine: '造型二线中件清理', productSeries: 'WP12', partNo: 'WP12-2012', workstation: 'C工位', subWorkstation: 'C-01', equipment: '喷粉线-03', recipeNo: 'PF-R03-01', coatingStartTime: '2026-09-03 13:00', coatingEndTime: '2026-09-03 13:15', actualCoatingDuration: 15, setCoatingDuration: 18, ovenInTime: '2026-09-03 13:18', ovenOutTime: '2026-09-03 14:15', actualCuringDuration: 57, setCuringDuration: 60, 设定TempLow: 180, 设定TempHigh: 200, operator: '赵六' },
  { id: 5, productionLine: '造型一线大件清理', productSeries: 'WP12', partNo: 'WP12-1008', workstation: 'D工位', subWorkstation: 'D-01', equipment: '喷粉线-04', recipeNo: 'PF-R04-01', coatingStartTime: '2026-09-03 14:00', coatingEndTime: '2026-09-03 14:20', actualCoatingDuration: 20, setCoatingDuration: 20, ovenInTime: '2026-09-03 14:22', ovenOutTime: '2026-09-03 15:22', actualCuringDuration: 60, setCuringDuration: 60, 设定TempLow: 180, 设定TempHigh: 200, operator: '钱七' },
  { id: 6, productionLine: '造型一线中件清理', productSeries: 'WP13', partNo: 'WP13-1005', workstation: 'E工位', subWorkstation: 'E-01', equipment: '喷粉线-05', recipeNo: 'PF-R05-01', coatingStartTime: '2026-09-03 15:00', coatingEndTime: '2026-09-03 15:16', actualCoatingDuration: 16, setCoatingDuration: 18, ovenInTime: '2026-09-03 15:18', ovenOutTime: '2026-09-03 16:18', actualCuringDuration: 60, setCuringDuration: 60, 设定TempLow: 180, 设定TempHigh: 200, operator: '孙八' }
])
const pagination = reactive({ current: 1, pageSize: 10, total: 6, showSizeChanger: true, showQuickJumper: true, showTotal: (t: number) => `共 ${t} 条` })
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize }
const handleSearch = () => { pagination.current = 1; pagination.total = filteredData.value.length; message.success('查询完成') }
const handleReset = () => { searchForm.productionLine = undefined; searchForm.equipment = ''; searchForm.subWorkstation = ''; searchForm.dateRange = null; pagination.current = 1; pagination.total = filteredData.value.length; message.success('已重置') }

// 固化炉温度曲线弹框
const curveModalVisible = ref(false)
const curveRecord = ref<any>({})
const handleViewCurve = (record: any) => { curveRecord.value = { ...record }; curveModalVisible.value = true }

// 生成模拟温度数据
function genTempData(record: any) {
  const inTime = new Date(record.ovenInTime.replace(' ', 'T'))
  const outTime = new Date(record.ovenOutTime.replace(' ', 'T'))
  const totalMs = outTime.getTime() - inTime.getTime()
  const targetTemp = (record.设定TempLow + record.设定TempHigh) / 2
  const points: string[] = []
  const temps: number[] = []
  const step = 60
  for (let i = 0; i <= step; i++) {
    const t = inTime.getTime() + (totalMs * i) / step
    const d = new Date(t)
    points.push(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    const progress = i / step
    let temp: number
    if (progress < 0.15) temp = 25 + (targetTemp - 25) * (progress / 0.15) + (Math.random() - 0.5) * 4
    else if (progress < 0.85) temp = targetTemp + Math.sin(progress * 18) * 3 + (Math.random() - 0.5) * 3
    else temp = targetTemp - (targetTemp - 60) * ((progress - 0.85) / 0.15) + (Math.random() - 0.5) * 3
    temps.push(Math.round(temp * 10) / 10)
  }
  return { points, temps }
}

const curveChartOption = computed(() => {
  const r = curveRecord.value
  if (!r.id) return {}
  const { points, temps } = genTempData(r)
  return {
    backgroundColor: '#fff',
    tooltip: { trigger: 'axis', formatter: (p: any[]) => `${p[0]?.axisValue || ''}<br/>${p[0]?.marker} ${p[0]?.seriesName}: <b>${p[0]?.value}℃</b>` },
    legend: { top: 8, itemWidth: 16, itemHeight: 3 },
    grid: { left: 60, right: 30, top: 50, bottom: 60 },
    xAxis: { type: 'category', data: points, name: '时间', nameLocation: 'center', nameGap: 30, axisLabel: { fontSize: 11, rotate: 30 }, splitLine: { show: false } },
    yAxis: { type: 'value', name: '温度（℃）', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
    dataZoom: [{ type: 'inside' }],
    series: [{
      name: '固化炉温度', type: 'line', data: temps, smooth: true, symbol: 'none',
      lineStyle: { width: 2, color: '#e67e22' }, itemStyle: { color: '#e67e22' },
      markLine: {
        silent: true, symbol: 'none', lineStyle: { type: 'dashed', width: 1.5, color: '#999' },
        label: { show: true, position: 'insideEndTop', formatter: '{b}: {c}℃', fontSize: 11, color: '#999' },
        data: [
          { name: '设定上限', yAxis: r.设定TempHigh },
          { name: '设定下限', yAxis: r.设定TempLow }
        ]
      },
      markArea: {
        silent: true, itemStyle: { color: 'rgba(24,144,255,0.06)' },
        data: [[{ xAxis: points[Math.floor(step * 0.15)] }, { xAxis: points[Math.floor(step * 0.85)] }]]
      }
    }]
  }
})
const step = 60
</script>

<style scoped>
.powder-coating-record { display: flex; flex-direction: column; gap: 16px; }
.filter-card :deep(.ant-form-item) { margin-bottom: 0; }
.curve-info { display: flex; flex-direction: column; gap: 16px; }
.curve-descriptions { font-size: 13px; }
.curve-chart-wrapper { width: 100%; height: 420px; border: 1px solid #f0f0f0; border-radius: 6px; background: #fff; }
.curve-chart { width: 100%; height: 100%; }
</style>
