<template>
  <div class="core-storage-inbound-record">
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
        <a-form-item label="上料口">
          <a-input
            v-model:value="query.feedPortNo"
            placeholder="请输入上料口"
            allow-clear
            style="width: 160px"
          />
        </a-form-item>
        <a-form-item label="入库时间">
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

    <!-- 入库记录表格 -->
    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: 1700 }"
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
  feedPortNo: string
  dateRange: [Dayjs, Dayjs] | null
}>({
  palletCode: '',
  materialName: '',
  feedPortNo: '',
  dateRange: null
})

// 空值显示为 — 的列
const emptyFallbackKeys = ['operator']

// 表格列
const columns = [
  { title: '事件id', dataIndex: 'eventId', key: 'eventId', width: 200, align: 'center' as const },
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
  { title: '上料口编号', dataIndex: 'feedPortNo', key: 'feedPortNo', width: 110, align: 'center' as const },
  { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 190 },
  { title: '立库物料编号', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 180, align: 'center' as const },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
  { title: '物料编号', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
  { title: '砂芯数量', dataIndex: 'coreQty', key: 'coreQty', width: 90, align: 'center' as const },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 110, align: 'center' as const },
  { title: '入库时间', dataIndex: 'inTime', key: 'inTime', width: 170 }
]

interface InboundRow {
  key: number
  eventId: string
  palletCode: string
  feedPortNo: string
  wmsMaterialName: string
  wmsMaterialCode: string
  materialName: string
  materialCode: string
  coreQty: number
  operator: string
  inTime: string
}

// 模拟数据
let rowKey = 0
const recordData = ref<InboundRow[]>([
  { key: ++rowKey, eventId: 'EVT20261103091532001', palletCode: 'TP20261103001', feedPortNo: 'SL-01', wmsMaterialName: '机体顶盖砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002347', materialName: '机体顶盖砂芯', materialCode: '10002347', coreQty: 8, operator: '张伟', inTime: '2026-11-03 08:10:26' },
  { key: ++rowKey, eventId: 'EVT20261103091532002', palletCode: 'TP20261103002', feedPortNo: 'SL-02', wmsMaterialName: '机体缸筒砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002348', materialName: '机体缸筒砂芯', materialCode: '10002348', coreQty: 6, operator: '李强', inTime: '2026-11-03 09:58:14' },
  { key: ++rowKey, eventId: 'EVT20261103083341001', palletCode: 'TP20261102004', feedPortNo: 'SL-03', wmsMaterialName: '机体挺柱室砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002352', materialName: '机体挺柱室砂芯', materialCode: '10002352', coreQty: 11, operator: '王芳', inTime: '2026-11-02 14:05:39' },
  { key: ++rowKey, eventId: 'EVT20261102110705001', palletCode: 'TP20261102003', feedPortNo: 'SL-02', wmsMaterialName: '机体主油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002346', materialName: '机体主油道砂芯', materialCode: '10002346', coreQty: 10, operator: '李强', inTime: '2026-11-02 11:12:08' },
  { key: ++rowKey, eventId: 'EVT20261102094912001', palletCode: 'TP20261102002', feedPortNo: 'SL-02', wmsMaterialName: '机体正时罩壳砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002351', materialName: '机体正时罩壳砂芯', materialCode: '10002351', coreQty: 7, operator: '赵敏', inTime: '2026-11-02 09:47:53' },
  { key: ++rowKey, eventId: 'EVT20261102083420001', palletCode: 'TP20261102001', feedPortNo: 'SL-01', wmsMaterialName: '机体水套砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002345', materialName: '机体水套砂芯', materialCode: '10002345', coreQty: 12, operator: '张伟', inTime: '2026-11-02 08:32:15' },
  { key: ++rowKey, eventId: 'EVT20261101161933001', palletCode: 'TP20261101006', feedPortNo: 'SL-03', wmsMaterialName: '机体回油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002350', materialName: '机体回油道砂芯', materialCode: '10002350', coreQty: 9, operator: '王芳', inTime: '2026-11-01 16:18:27' },
  { key: ++rowKey, eventId: 'EVT20261101150351001', palletCode: 'TP20261101005', feedPortNo: 'SL-03', wmsMaterialName: '机体水套砂芯B(立库)', wmsMaterialCode: 'WMS-SC-10002349', materialName: '机体水套砂芯B', materialCode: '10002349', coreQty: 12, operator: '陈刚', inTime: '2026-11-01 15:02:44' },
  { key: ++rowKey, eventId: 'EVT20261101132118001', palletCode: 'TP20261101004', feedPortNo: 'SL-02', wmsMaterialName: '机体缸筒砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002348', materialName: '机体缸筒砂芯', materialCode: '10002348', coreQty: 6, operator: '李强', inTime: '2026-11-01 13:20:05' },
  { key: ++rowKey, eventId: 'EVT20261101104640001', palletCode: 'TP20261101003', feedPortNo: 'SL-02', wmsMaterialName: '机体顶盖砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002347', materialName: '机体顶盖砂芯', materialCode: '10002347', coreQty: 8, operator: '赵敏', inTime: '2026-11-01 10:45:36' },
  { key: ++rowKey, eventId: 'EVT20261101093125001', palletCode: 'TP20261101002', feedPortNo: 'SL-01', wmsMaterialName: '机体主油道砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002346', materialName: '机体主油道砂芯', materialCode: '10002346', coreQty: 10, operator: '张伟', inTime: '2026-11-01 09:30:12' },
  { key: ++rowKey, eventId: 'EVT20261101081630001', palletCode: 'TP20261101001', feedPortNo: 'SL-01', wmsMaterialName: '机体水套砂芯(立库)', wmsMaterialCode: 'WMS-SC-10002345', materialName: '机体水套砂芯', materialCode: '10002345', coreQty: 12, operator: '陈刚', inTime: '2026-11-01 08:15:20' }
])

// 统计数据
const stats = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return [
    { label: '记录总数', value: recordData.value.length },
    { label: '今日入库', value: recordData.value.filter(d => d.inTime.startsWith(today)).length },
    { label: '今日砂芯数', value: recordData.value.filter(d => d.inTime.startsWith(today)).reduce((sum, d) => sum + d.coreQty, 0) },
    { label: '累计砂芯数', value: recordData.value.reduce((sum, d) => sum + d.coreQty, 0) }
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
    const matchPort = !query.value.feedPortNo || item.feedPortNo.includes(query.value.feedPortNo)
    const day = item.inTime.slice(0, 10)
    const matchDate = (!startStr || day >= startStr) && (!endStr || day <= endStr)
    return matchPallet && matchName && matchPort && matchDate
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
    feedPortNo: '',
    dateRange: null
  }
  page.value = 1
  message.info('已重置')
}
</script>

<style scoped>
.core-storage-inbound-record {
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
