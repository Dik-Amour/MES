<template>
  <div class="core-storage-inbound-record">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="托盘码">
          <a-input v-model:value="query.palletCode" placeholder="请输入托盘码" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input v-model:value="query.materialName" placeholder="请输入物料名称" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="上料口">
          <a-input v-model:value="query.feedPortNo" placeholder="请输入上料口" allow-clear style="width: 160px" />
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
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: 2050 }"
        :row-key="(record: any) => record.eventId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="emptyFallbackKeys.includes(column.dataIndex)">
            {{ record[column.dataIndex] || '—' }}
          </template>
          <template v-else-if="column.dataIndex === 'processParam'">
            <a-button type="link" size="small" @click="openDetail('工艺参数', record.processParam)">查看</a-button>
          </template>
          <template v-else-if="column.dataIndex === 'mixingInfo'">
            <a-button type="link" size="small" @click="openDetail('混砂信息', record.mixingInfo)">查看</a-button>
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

    <a-modal v-model:open="detailVisible" :title="detailTitle" :footer="null" width="520px">
      <div class="detail-content">{{ detailContent }}</div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { inboundRecordRows, type InboundRecordRow } from './coreStorageData'

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

const emptyFallbackKeys = ['operator', 'deviceName', 'coreMakingTime']

const columns = [
  { title: '事件ID', dataIndex: 'eventId', key: 'eventId', width: 200, align: 'center' as const },
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
  { title: '上料口编号', dataIndex: 'feedPortNo', key: 'feedPortNo', width: 110, align: 'center' as const },
  { title: '制芯设备', dataIndex: 'deviceName', key: 'deviceName', width: 130, align: 'center' as const },
  { title: '制芯时间', dataIndex: 'coreMakingTime', key: 'coreMakingTime', width: 170, align: 'center' as const },
  { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 190 },
  { title: '立库物料编号', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 180, align: 'center' as const },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
  { title: '物料编号', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
  { title: '砂芯数量', dataIndex: 'coreQty', key: 'coreQty', width: 90, align: 'center' as const },
  { title: '工艺参数', dataIndex: 'processParam', key: 'processParam', width: 110, align: 'center' as const },
  { title: '混砂信息', dataIndex: 'mixingInfo', key: 'mixingInfo', width: 110, align: 'center' as const },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 110, align: 'center' as const },
  { title: '入库时间', dataIndex: 'inTime', key: 'inTime', width: 170 }
]

const detailVisible = ref(false)
const detailTitle = ref('')
const detailContent = ref('')

const openDetail = (title: string, content: string) => {
  detailTitle.value = title
  detailContent.value = content || '暂无数据'
  detailVisible.value = true
}

const recordData = ref<InboundRecordRow[]>(inboundRecordRows)

const stats = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const todayRows = recordData.value.filter(d => d.inTime.startsWith(today))
  return [
    { label: '今日入库托盘', value: todayRows.length },
    { label: '今日入库砂芯', value: todayRows.reduce((sum, d) => sum + d.coreQty, 0) },
    { label: '累计入库托盘', value: recordData.value.length },
    { label: '累计入库砂芯', value: recordData.value.reduce((sum, d) => sum + d.coreQty, 0) }
  ]
})

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

.detail-content {
  line-height: 1.8;
  color: #333;
  word-break: break-all;
}
</style>
