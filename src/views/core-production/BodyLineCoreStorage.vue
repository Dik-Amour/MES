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
        <a-form-item label="虚拟库状态">
          <a-select v-model:value="query.virtualStatus" placeholder="请选择状态" allow-clear :options="statusOptions" style="width: 140px" />
        </a-form-item>
        <a-form-item :label="viewMode === 'current' ? '入库时间' : '事件时间'">
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
        <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
          <a-radio-button value="current">在库托盘</a-radio-button>
          <a-radio-button value="history">历史记录</a-radio-button>
        </a-radio-group>
        <span class="toolbar-tip">{{ viewMode === 'current' ? '默认只展示当前仍在库的托盘' : '展示已出库及历史库存记录' }}</span>
      </div>

      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: viewMode === 'history' ? 1800 : 1500 }"
        :row-key="(record: any) => record.palletCode"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'virtualStatus'">
            <a-tag :color="statusColorMap[record.virtualStatus]">{{ record.virtualStatus }}</a-tag>
          </template>
          <template v-else-if="emptyFallbackKeys.includes(column.dataIndex)">
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
            <a-descriptions-item label="出库事件ID">{{ record.outboundEventId || '—' }}</a-descriptions-item>
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
import { ref, computed, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { coreStorageRows } from './coreStorageData'

const query = ref<{
  palletCode: string
  deviceCode: string
  materialName: string
  virtualStatus?: string
  dateRange: [Dayjs, Dayjs] | null
}>({
  palletCode: '',
  deviceCode: '',
  materialName: '',
  virtualStatus: undefined,
  dateRange: null
})

const viewMode = ref<'current' | 'history'>('current')

const statusOptions = [
  { value: '已入库', label: '已入库' },
  { value: '待映射', label: '待映射' },
  { value: '已组芯', label: '已组芯' },
  { value: '已出库', label: '已出库' }
]

const statusColorMap: Record<string, string> = {
  已入库: 'green',
  待映射: 'orange',
  已组芯: 'purple',
  已出库: 'blue'
}

const emptyFallbackKeys = ['outTime', 'inDuration']

const columns = computed(() => {
  const base = [
    { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
    { title: '立库物料编号', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 170, align: 'center' as const },
    { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 180 },
    { title: '砂芯数量', dataIndex: 'coreQty', key: 'coreQty', width: 90, align: 'center' as const },
    { title: '虚拟库状态', dataIndex: 'virtualStatus', key: 'virtualStatus', width: 110, align: 'center' as const },
    { title: '入库时间', dataIndex: 'inTime', key: 'inTime', width: 170 },
    { title: '在库时长', dataIndex: 'inDuration', key: 'inDuration', width: 120, align: 'center' as const }
  ]
  return viewMode.value === 'history'
    ? [...base, { title: '出库时间', dataIndex: 'outTime', key: 'outTime', width: 170 }]
    : base
})

const formatDuration = (inTime: string, outTime: string) => {
  if (!inTime) return ''
  const start = dayjs(inTime)
  const end = outTime ? dayjs(outTime) : dayjs()
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
  coreStorageRows.map(item => ({
    ...item,
    inDuration: formatDuration(item.inTime, item.outTime)
  }))
)

const currentRows = computed(() => rows.value.filter(item => !item.outTime && item.virtualStatus !== '已出库'))

const stats = computed(() => {
  const targetRows = viewMode.value === 'current' ? currentRows.value : rows.value
  const totalDuration = currentRows.value.reduce((sum, item) => {
    const value = item.inDuration
    if (!value) return sum
    const days = Number(value.match(/(\d+)天/)?.[1] || 0)
    const hours = Number(value.match(/(\d+)小时/)?.[1] || 0)
    return sum + days * 24 + hours
  }, 0)
  return [
    { label: '在库托盘数', value: currentRows.value.length },
    { label: '在库砂芯总数', value: currentRows.value.reduce((sum, item) => sum + item.coreQty, 0) },
    { label: '待映射', value: currentRows.value.filter(item => item.virtualStatus === '待映射').length },
    { label: viewMode.value === 'current' ? '平均在库时长' : '历史记录数', value: viewMode.value === 'current' ? (currentRows.value.length ? `${Math.round(totalDuration / currentRows.value.length)}小时` : '0小时') : targetRows.length }
  ]
})

const filteredData = computed(() => {
  const [start, end] = query.value.dateRange ?? []
  const startStr = start ? start.format('YYYY-MM-DD') : ''
  const endStr = end ? end.format('YYYY-MM-DD') : ''
  return rows.value
    .filter(item => viewMode.value === 'current' ? !item.outTime && item.virtualStatus !== '已出库' : true)
    .filter(item => {
      const matchPallet = !query.value.palletCode || item.palletCode.includes(query.value.palletCode)
      const matchDevice = !query.value.deviceCode || item.deviceCode.includes(query.value.deviceCode)
      const matchName = !query.value.materialName || item.materialName.includes(query.value.materialName)
      const matchStatus = !query.value.virtualStatus || item.virtualStatus === query.value.virtualStatus
      const eventDay = item.inTime.slice(0, 10) || item.outTime.slice(0, 10)
      const matchDate = (!startStr || eventDay >= startStr) && (!endStr || eventDay <= endStr)
      return matchPallet && matchDevice && matchName && matchStatus && matchDate
    })
})

const page = ref(1)
const pageSize = 10
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

watch(viewMode, () => {
  page.value = 1
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
    virtualStatus: undefined,
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
