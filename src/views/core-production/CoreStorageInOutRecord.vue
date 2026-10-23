<template>
  <div class="core-storage-inout-record">
    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="类型">
          <a-select
            v-model:value="query.type"
            placeholder="请选择类型"
            allow-clear
            :options="typeOptions"
            style="width: 140px"
          />
        </a-form-item>
        <a-form-item label="日期">
          <a-range-picker
            v-model:value="query.dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
          />
        </a-form-item>
        <a-form-item label="砂芯名称">
          <a-input
            v-model:value="query.coreName"
            placeholder="请输入砂芯名称"
            allow-clear
            style="width: 180px"
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

    <!-- 出入库记录表格 -->
    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :row-key="(record: any) => record.key"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'type'">
            <a-tag :color="record.type === '入库' ? 'green' : 'orange'">
              {{ record.type }}
            </a-tag>
          </template>
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === '成功' ? 'blue' : 'red'">
              {{ record.status }}
            </a-tag>
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
import type { Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// 查询条件
const query = ref<{ type?: string; dateRange: [Dayjs, Dayjs] | null; coreName: string }>({
  type: undefined,
  dateRange: null,
  coreName: ''
})

const typeOptions = [
  { value: '入库', label: '入库' },
  { value: '出库', label: '出库' }
]

// 表格列
const columns = [
  { title: '时间', dataIndex: 'time', key: 'time', width: 170 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80, align: 'center' as const },
  { title: '料框号', dataIndex: 'frameNo', key: 'frameNo', width: 120, align: 'center' as const },
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 180 },
  { title: '毛坯件号', dataIndex: 'partNo', key: 'partNo', width: 160 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' as const },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100, align: 'center' as const },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const }
]

// 模拟数据
let rowKey = 0
const recordData = ref([
  { key: ++rowKey, time: '2026-10-22 09:30:02', type: '入库', frameNo: 'KJ-10025', coreName: '液压阀体芯', partNo: 'WP14-001', quantity: 45, operator: '张三', status: '成功' },
  { key: ++rowKey, time: '2026-10-22 08:42:11', type: '入库', frameNo: 'KJ-10022', coreName: '发动机缸盖芯', partNo: 'WP12-002', quantity: 36, operator: '张三', status: '成功' },
  { key: ++rowKey, time: '2026-10-22 08:15:20', type: '入库', frameNo: 'KJ-10021', coreName: '发动机缸体芯', partNo: 'WP12-001', quantity: 40, operator: '李四', status: '成功' },
  { key: ++rowKey, time: '2026-10-21 16:10:35', type: '出库', frameNo: 'KJ-10018', coreName: '发动机缸体芯', partNo: 'WP12-001', quantity: 38, operator: '李四', status: '成功' },
  { key: ++rowKey, time: '2026-10-21 15:05:48', type: '入库', frameNo: 'KJ-10024', coreName: '离合器壳体芯', partNo: 'WP13-002', quantity: 28, operator: '王五', status: '成功' },
  { key: ++rowKey, time: '2026-10-21 10:22:07', type: '出库', frameNo: 'KJ-10019', coreName: '变速箱壳体芯', partNo: 'WP13-001', quantity: 30, operator: '王五', status: '失败' }
])

// 筛选
const filteredData = computed(() => {
  const [start, end] = query.value.dateRange ?? []
  const startStr = start ? start.format('YYYY-MM-DD') : ''
  const endStr = end ? end.format('YYYY-MM-DD') : ''
  return recordData.value.filter(item => {
    const matchType = !query.value.type || item.type === query.value.type
    const matchName = !query.value.coreName || item.coreName.includes(query.value.coreName)
    const day = item.time.slice(0, 10)
    const matchDate = (!startStr || day >= startStr) && (!endStr || day <= endStr)
    return matchType && matchName && matchDate
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
  query.value = { type: undefined, dateRange: null, coreName: '' }
  page.value = 1
  message.info('已重置')
}
</script>

<style scoped>
.core-storage-inout-record {
  padding: 0;
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
