<template>
  <div class="core-storage-outbound-record">
    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="托盘码">
          <a-input
            v-model:value="query.palletCode"
            placeholder="请输入托盘码"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input
            v-model:value="query.materialName"
            placeholder="请输入物料名称"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="操作人">
          <a-input
            v-model:value="query.operator"
            placeholder="请输入操作人"
            allow-clear
            style="width: 140px"
          />
        </a-form-item>
        <a-form-item label="出库时间">
          <a-range-picker
            v-model:value="query.dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
          />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleQuery">
              <SearchOutlined /> 查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined /> 重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <div class="stat-value stat-blue">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 出库记录表格 -->
    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: 1500 }"
        :row-key="(record: any) => record.key"
      >
        <template #bodyCell="{ column, record }">
          <!-- 空值显示为 — -->
          <template v-if="emptyFallbackKeys.includes(column.dataIndex)">
            {{ record[column.dataIndex] || '—' }}
          </template>
        </template>
      </a-table>
      <div class="table-pagination">
        <a-pagination
          v-model:current="page"
          :page-size="pageSize"
          :total="filteredData.length"
          :show-size-changer="false"
          :show-total="(total: number) => `共 ${total} 条`"
          size="small"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// 查询条件
const query = ref<{
  palletCode: string
  materialName: string
  operator: string
  dateRange: [Dayjs, Dayjs] | null
}>({
  palletCode: '',
  materialName: '',
  operator: '',
  dateRange: null
})

// 空值显示为 — 的列
const emptyFallbackKeys = ['operator']

// 表格列
const columns = [
  { title: '事件id', dataIndex: 'eventId', key: 'eventId', width: 200, align: 'center' as const },
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
  { title: '出库时间', dataIndex: 'outTime', key: 'outTime', width: 170 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 110, align: 'center' as const },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
  { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 190 },
  { title: '立库物料编码', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 180, align: 'center' as const }
]

interface OutboundRow {
  key: number
  eventId: string
  palletCode: string
  outTime: string
  operator: string
  materialName: string
  materialCode: string
  wmsMaterialName: string
  wmsMaterialCode: string
}

// 模拟数据
let rowKey = 0
const recordData = ref<OutboundRow[]>([
  { key: ++rowKey, eventId: 'EVT20261102172755001', palletCode: 'TP20261102003', outTime: '2026-11-02 17:26:41', operator: '李强', materialName: '机体主油道砂芯', materialCode: '10002346', wmsMaterialName: '机体主油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002346' },
  { key: ++rowKey, eventId: 'EVT20261102080622001', palletCode: 'TP20261101006', outTime: '2026-11-02 08:05:10', operator: '王芳', materialName: '机体回油道砂芯', materialCode: '10002350', wmsMaterialName: '机体回油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002350' },
  { key: ++rowKey, eventId: 'EVT20261101164108001', palletCode: 'TP20261031008', outTime: '2026-11-01 16:40:25', operator: '张伟', materialName: '机体水套砂芯', materialCode: '10002345', wmsMaterialName: '机体水套砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002345' },
  { key: ++rowKey, eventId: 'EVT20261101143352001', palletCode: 'TP20261031007', outTime: '2026-11-01 14:32:47', operator: '赵敏', materialName: '机体顶盖砂芯', materialCode: '10002347', wmsMaterialName: '机体顶盖砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002347' },
  { key: ++rowKey, eventId: 'EVT20261101111219001', palletCode: 'TP20261031006', outTime: '2026-11-01 11:11:03', operator: '陈刚', materialName: '机体缸筒砂芯', materialCode: '10002348', wmsMaterialName: '机体缸筒砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002348' },
  { key: ++rowKey, eventId: 'EVT20261101093044001', palletCode: 'TP20261031005', outTime: '2026-11-01 09:29:38', operator: '李强', materialName: '机体主油道砂芯', materialCode: '10002346', wmsMaterialName: '机体主油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002346' },
  { key: ++rowKey, eventId: 'EVT20261031172506001', palletCode: 'TP20261031004', outTime: '2026-10-31 17:24:12', operator: '王芳', materialName: '机体正时罩壳砂芯', materialCode: '10002351', wmsMaterialName: '机体正时罩壳砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002351' },
  { key: ++rowKey, eventId: 'EVT20261031154733001', palletCode: 'TP20261031003', outTime: '2026-10-31 15:46:29', operator: '张伟', materialName: '机体挺柱室砂芯', materialCode: '10002352', wmsMaterialName: '机体挺柱室砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002352' },
  { key: ++rowKey, eventId: 'EVT20261031131857001', palletCode: 'TP20261031002', outTime: '2026-10-31 13:17:44', operator: '赵敏', materialName: '机体水套砂芯B', materialCode: '10002349', wmsMaterialName: '机体水套砂芯B(立库)', wmsMaterialCode: 'WMS-SC-10002349' },
  { key: ++rowKey, eventId: 'EVT20261031100521001', palletCode: 'TP20261031001', outTime: '2026-10-31 10:04:16', operator: '陈刚', materialName: '机体回油道砂芯', materialCode: '10002350', wmsMaterialName: '机体回油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002350' },
  { key: ++rowKey, eventId: 'EVT20261030165240001', palletCode: 'TP20261030009', outTime: '2026-10-30 16:51:35', operator: '李强', materialName: '机体顶盖砂芯', materialCode: '10002347', wmsMaterialName: '机体顶盖砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002347' },
  { key: ++rowKey, eventId: 'EVT20261030142318001', palletCode: 'TP20261030008', outTime: '2026-10-30 14:22:09', operator: '王芳', materialName: '机体缸筒砂芯', materialCode: '10002348', wmsMaterialName: '机体缸筒砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002348' }
])

// 统计数据
const stats = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return [
    { label: '记录总数', value: recordData.value.length },
    { label: '今日出库', value: recordData.value.filter(d => d.outTime.startsWith(today)).length },
    { label: '本周出库', value: recordData.value.filter(d => dayjs(d.outTime).isAfter(dayjs().subtract(7, 'day'))).length },
    { label: '出库托盘数', value: new Set(recordData.value.map(d => d.palletCode)).size }
  ]
})

// 筛选
const filteredData = computed(() => {
  const [start, end] = query.value.dateRange ?? []
  const startStr = start ? start.format('YYYY-MM-DD') : ''
  const endStr = end ? end.format('YYYY-MM-DD') : ''
  return recordData.value.filter(item => {
    const matchPallet = !query.value.palletCode || item.palletCode.includes(query.value.palletCode)
    const matchName = !query.value.materialName || item.materialName.includes(query.value.materialName)
    const matchOperator = !query.value.operator || item.operator.includes(query.value.operator)
    const day = item.outTime.slice(0, 10)
    const matchDate = (!startStr || day >= startStr) && (!endStr || day <= endStr)
    return matchPallet && matchName && matchOperator && matchDate
  })
})

// 分页
const page = ref(1)
const pageSize = 10
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

// 查询
const handleQuery = () => {
  page.value = 1
  message.success('查询成功')
}

// 重置
const handleReset = () => {
  query.value = {
    palletCode: '',
    materialName: '',
    operator: '',
    dateRange: null
  }
  page.value = 1
  message.info('已重置')
}
</script>

<style scoped>
.core-storage-outbound-record {
  padding: 0;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-blue {
  color: #1677ff;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: #888;
}

.data-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
