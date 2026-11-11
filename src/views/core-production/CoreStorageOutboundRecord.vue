<template>
  <div class="core-storage-outbound-record">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="托盘码">
          <a-input v-model:value="query.palletCode" placeholder="请输入托盘码" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input v-model:value="query.materialName" placeholder="请输入物料名称" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="操作人">
          <a-input v-model:value="query.operator" placeholder="请输入操作人" allow-clear style="width: 140px" />
        </a-form-item>
        <a-form-item label="出库类型">
          <a-select
            v-model:value="query.outboundType"
            placeholder="请选择类型"
            allow-clear
            :options="outboundTypeOptions"
            style="width: 150px"
          />
        </a-form-item>
        <a-form-item label="出库时间">
          <a-range-picker v-model:value="query.dateRange" format="YYYY-MM-DD" :placeholder="['开始日期', '结束日期']" />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleQuery"><SearchOutlined /> 查询</a-button>
            <a-button @click="handleReset"><ReloadOutlined /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="stats-row">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <div class="stat-value stat-blue">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: 1200 }"
        :row-key="(record: any) => record.eventId"
      >
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
import { outboundRecordRows, type OutboundRecordRow } from './coreStorageData'

const query = ref<{
  palletCode: string
  materialName: string
  operator: string
  outboundType?: string
  dateRange: [Dayjs, Dayjs] | null
}>({
  palletCode: '',
  materialName: '',
  operator: '',
  outboundType: undefined,
  dateRange: null
})

const outboundTypeOptions = [
  { value: '生产线消耗', label: '生产线消耗' },
  { value: '返修出库', label: '返修出库' },
  { value: '报废出库', label: '报废出库' },
  { value: '调拨出库', label: '调拨出库' }
]

const columns = [
  { title: '事件ID', dataIndex: 'eventId', key: 'eventId', width: 200, align: 'center' as const },
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
  { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 190 },
  { title: '立库物料编码', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 180, align: 'center' as const },
  { title: '出库时间', dataIndex: 'outTime', key: 'outTime', width: 170 }
]

const recordData = ref<OutboundRecordRow[]>(outboundRecordRows)

const stats = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const todayRows = recordData.value.filter(d => d.outTime.startsWith(today))
  const weekRows = recordData.value.filter(d => dayjs(d.outTime).isAfter(dayjs().subtract(7, 'day')))
  return [
    { label: '今日出库托盘', value: todayRows.length },
    { label: '今日出库砂芯', value: todayRows.reduce((sum, d) => sum + d.coreQty, 0) },
    { label: '本周出库托盘', value: weekRows.length },
    { label: '累计出库砂芯', value: recordData.value.reduce((sum, d) => sum + d.coreQty, 0) }
  ]
})

const filteredData = computed(() => {
  const [start, end] = query.value.dateRange ?? []
  const startStr = start ? start.format('YYYY-MM-DD') : ''
  const endStr = end ? end.format('YYYY-MM-DD') : ''
  return recordData.value.filter(item => {
    const matchPallet = !query.value.palletCode || item.palletCode.includes(query.value.palletCode)
    const matchName = !query.value.materialName || item.materialName.includes(query.value.materialName)
    const matchOperator = !query.value.operator || item.operator.includes(query.value.operator)
    const matchType = !query.value.outboundType || item.outboundType === query.value.outboundType
    const day = item.outTime.slice(0, 10)
    const matchDate = (!startStr || day >= startStr) && (!endStr || day <= endStr)
    return matchPallet && matchName && matchOperator && matchType && matchDate
  })
})

const page = ref(1)
const pageSize = 10
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

const handleQuery = () => {
  page.value = 1
  message.success('查询成功')
}

const handleReset = () => {
  query.value = {
    palletCode: '',
    materialName: '',
    operator: '',
    outboundType: undefined,
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
