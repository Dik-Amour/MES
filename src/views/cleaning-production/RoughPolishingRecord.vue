<template>
  <div class="rough-polishing-record">
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
      <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" :row-key="'id'" :scroll="{ x: 1300 }" size="middle" @change="handleTableChange">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ (pagination.current - 1) * pagination.pageSize + index + 1 }}</template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

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
    r = r.filter(i => {
      const timeField = i.startTime || i.loadTime || i.coatingStartTime || i.time || ''
      return timeField >= start && timeField <= end + ' 23:59:59'
    })
  }
  return r
})
const columns = [
  { title: '序号', key: 'index', width: 70, fixed: 'left' as const },
  { title: '产线', dataIndex: 'productionLine', width: 160 },
  { title: '产品系列', dataIndex: 'productSeries', width: 110 },
  { title: '毛坯件号', dataIndex: 'partNo', width: 140 },
  { title: '工位', dataIndex: 'workstation', width: 100 },
  { title: '子工位', dataIndex: 'subWorkstation', width: 100 },
  { title: '设备', dataIndex: 'equipment', width: 120 },
  { title: '抛丸开始时间', dataIndex: 'startTime', width: 170 },
  { title: '抛丸结束时间', dataIndex: 'endTime', width: 170 },
  { title: '抛丸时长(s)', dataIndex: 'duration', width: 120 },
  { title: '上机人', dataIndex: 'operator', width: 100 }
]
const dataSource = ref([
  { id: 1, productionLine: '造型三线HWS清理', productSeries: 'WP12', partNo: 'WP12-3001', workstation: 'A工位', subWorkstation: 'A-01', equipment: '抛丸机-01', startTime: '2026-09-03 08:15', endTime: '2026-09-03 08:45', duration: 180, operator: '张三' },
  { id: 2, productionLine: '造型三线KW清理', productSeries: 'WP13', partNo: 'WP13-3010', workstation: 'A工位', subWorkstation: 'A-02', equipment: '抛丸机-01', startTime: '2026-09-03 09:00', endTime: '2026-09-03 09:40', duration: 240, operator: '李四' },
  { id: 3, productionLine: '造型二线大件清理', productSeries: 'WP13', partNo: 'WP13-2015', workstation: 'B工位', subWorkstation: 'B-01', equipment: '抛丸机-02', startTime: '2026-09-03 10:20', endTime: '2026-09-03 11:00', duration: 240, operator: '王五' },
  { id: 4, productionLine: '造型二线中件清理', productSeries: 'WP12', partNo: 'WP12-2012', workstation: 'C工位', subWorkstation: 'C-01', equipment: '抛丸机-03', startTime: '2026-09-03 13:10', endTime: '2026-09-03 13:35', duration: 150, operator: '赵六' },
  { id: 5, productionLine: '造型一线大件清理', productSeries: 'WP12', partNo: 'WP12-1008', workstation: 'D工位', subWorkstation: 'D-01', equipment: '抛丸机-04', startTime: '2026-09-03 14:00', endTime: '2026-09-03 14:30', duration: 180, operator: '钱七' },
  { id: 6, productionLine: '造型一线中件清理', productSeries: 'WP13', partNo: 'WP13-1005', workstation: 'E工位', subWorkstation: 'E-01', equipment: '抛丸机-05', startTime: '2026-09-03 15:00', endTime: '2026-09-03 15:25', duration: 150, operator: '孙八' }
])
const pagination = reactive({ current: 1, pageSize: 10, total: 2, showSizeChanger: true, showQuickJumper: true, showTotal: (t: number) => `共 ${t} 条` })
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize }
const handleSearch = () => { pagination.current = 1; pagination.total = filteredData.value.length; message.success('查询完成') }
const handleReset = () => { searchForm.productionLine = undefined; searchForm.equipment = ''; searchForm.subWorkstation = ''; searchForm.dateRange = null; pagination.current = 1; pagination.total = filteredData.value.length; message.success('已重置') }
</script>

<style scoped>
.rough-polishing-record { display: flex; flex-direction: column; gap: 16px; }
.filter-card :deep(.ant-form-item) { margin-bottom: 0; }
</style>
