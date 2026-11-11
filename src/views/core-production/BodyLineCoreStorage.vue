<template>
  <div class="body-line-core-storage">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="托盘码">
          <a-input v-model:value="query.palletCode" placeholder="请输入托盘码" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="制芯设备编号">
          <a-input v-model:value="query.deviceCode" placeholder="请输入制芯设备编号" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input v-model:value="query.materialName" placeholder="请输入物料名称" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="入库时间">
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
      <div class="table-toolbar">
        <span class="toolbar-title">在库托盘</span>
        <span class="toolbar-tip">仅展示当前仍在库的托盘</span>
      </div>

      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: 1500 }"
        :row-key="(record: any) => record.palletCode"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="emptyFallbackKeys.includes(column.dataIndex)">
            {{ record[column.dataIndex] || '—' }}
          </template>
        </template>
        <template #expandedRowRender="{ record }">
          <a-descriptions size="small" bordered :column="3">
            <a-descriptions-item label="上料口编号">{{ record.feedPortNo || '—' }}</a-descriptions-item>
            <a-descriptions-item label="制芯设备">{{ record.deviceName || '—' }}</a-descriptions-item>
            <a-descriptions-item label="设备编号">{{ record.deviceCode || '—' }}</a-descriptions-item>
            <a-descriptions-item label="工艺参数" :span="3">{{ record.processParam || '—' }}</a-descriptions-item>
            <a-descriptions-item label="入库事件ID">{{ record.inboundEventId || '—' }}</a-descriptions-item>
            <a-descriptions-item label="入库操作人">{{ record.inboundOperator || '—' }}</a-descriptions-item>
          </a-descriptions>
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
import { coreStorageRows } from './coreStorageData'

const query = ref<{
  palletCode: string
  deviceCode: string
  materialName: string
  dateRange: [Dayjs, Dayjs] | null
}>({
  palletCode: '',
  deviceCode: '',
  materialName: '',
  dateRange: null
})

const emptyFallbackKeys = ['inDuration']

const columns = [
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
  { title: '立库物料编号', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 170, align: 'center' as const },
  { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 180 },
  { title: '砂芯数量', dataIndex: 'coreQty', key: 'coreQty', width: 90, align: 'center' as const },
  { title: '入库时间', dataIndex: 'inTime', key: 'inTime', width: 170 },
  { title: '在库时长', dataIndex: 'inDuration', key: 'inDuration', width: 120, align: 'center' as const }
]

const formatDuration = (inTime: string) => {
  if (!inTime) return ''
  const start = dayjs(inTime)
  const end = dayjs()
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return ''
  const diff = end.diff(start)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分`
}

const rows = computed(() =>
  coreStorageRows
    .filter(item => !item.outTime && item.virtualStatus !== '已出库')
    .map(item => ({
      ...item,
      inDuration: formatDuration(item.inTime)
    }))
)

const stats = computed(() => {
  const totalDuration = rows.value.reduce((sum, item) => {
    const value = item.inDuration
    if (!value) return sum
    const days = Number(value.match(/(\d+)天/)?.[1] || 0)
    const hours = Number(value.match(/(\d+)小时/)?.[1] || 0)
    return sum + days * 24 + hours
  }, 0)
  return [
    { label: '在库托盘数', value: rows.value.length },
    { label: '在库砂芯总数', value: rows.value.reduce((sum, item) => sum + item.coreQty, 0) },
    { label: '待映射', value: rows.value.filter(item => item.virtualStatus === '待映射').length },
    { label: '平均在库时长', value: rows.value.length ? `${Math.round(totalDuration / rows.value.length)}小时` : '0小时' }
  ]
})

const filteredData = computed(() => {
  const [start, end] = query.value.dateRange ?? []
  const startStr = start ? start.format('YYYY-MM-DD') : ''
  const endStr = end ? end.format('YYYY-MM-DD') : ''
  return rows.value
    .filter(item => {
      const matchPallet = !query.value.palletCode || item.palletCode.includes(query.value.palletCode)
      const matchDevice = !query.value.deviceCode || item.deviceCode.includes(query.value.deviceCode)
      const matchName = !query.value.materialName || item.materialName.includes(query.value.materialName)
      const eventDay = item.inTime.slice(0, 10)
      const matchDate = (!startStr || eventDay >= startStr) && (!endStr || eventDay <= endStr)
      return matchPallet && matchDevice && matchName && matchDate
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
    deviceCode: '',
    materialName: '',
    dateRange: null
  }
  page.value = 1
  message.info('已重置')
}
</script>

<style scoped>
.body-line-core-storage {
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

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.toolbar-tip {
  color: #888;
  font-size: 12px;
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
