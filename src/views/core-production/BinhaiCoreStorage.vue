<template>
  <div class="binhai-core-storage">
    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="砂芯名称">
          <a-input
            v-model:value="query.coreName"
            placeholder="请输入砂芯名称"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="query.status"
            placeholder="请选择状态"
            allow-clear
            :options="statusOptions"
            style="width: 140px"
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

    <!-- 立库库存表格 -->
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
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === '在库' ? 'green' : 'orange'">
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
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// 查询条件
const query = ref<{ coreName: string; status?: string }>({ coreName: '', status: undefined })

const statusOptions = [
  { value: '在库', label: '在库' },
  { value: '已出库', label: '已出库' }
]

// 统计数据
const stats = computed(() => [
  { label: '在库总数', value: storageData.value.filter(d => d.status === '在库').reduce((s, d) => s + d.quantity, 0) },
  { label: '在库框数', value: storageData.value.filter(d => d.status === '在库').length },
  { label: '今日入库', value: 12 },
  { label: '今日出库', value: 9 }
])

// 表格列
const columns = [
  { title: '库位号', dataIndex: 'location', key: 'location', width: 100, align: 'center' as const },
  { title: '料框号', dataIndex: 'frameNo', key: 'frameNo', width: 120, align: 'center' as const },
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 180 },
  { title: '毛坯件号', dataIndex: 'partNo', key: 'partNo', width: 160 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' as const },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const },
  { title: '入库时间', dataIndex: 'inTime', key: 'inTime', width: 170 }
]

// 模拟数据
let rowKey = 0
const storageData = ref([
  { key: ++rowKey, location: 'A-01-03', frameNo: 'KJ-10021', coreName: '发动机缸体芯', partNo: 'WP12-001', quantity: 40, status: '在库', inTime: '2026-10-22 08:15:20' },
  { key: ++rowKey, location: 'A-01-04', frameNo: 'KJ-10022', coreName: '发动机缸盖芯', partNo: 'WP12-002', quantity: 36, status: '在库', inTime: '2026-10-22 08:42:11' },
  { key: ++rowKey, location: 'A-02-01', frameNo: 'KJ-10023', coreName: '变速箱壳体芯', partNo: 'WP13-001', quantity: 30, status: '已出库', inTime: '2026-10-21 14:20:36' },
  { key: ++rowKey, location: 'A-02-02', frameNo: 'KJ-10024', coreName: '离合器壳体芯', partNo: 'WP13-002', quantity: 28, status: '在库', inTime: '2026-10-21 15:05:48' },
  { key: ++rowKey, location: 'B-01-01', frameNo: 'KJ-10025', coreName: '液压阀体芯', partNo: 'WP14-001', quantity: 45, status: '在库', inTime: '2026-10-22 09:30:02' },
  { key: ++rowKey, location: 'B-01-02', frameNo: 'KJ-10026', coreName: '液压缸体芯', partNo: 'WP14-002', quantity: 42, status: '已出库', inTime: '2026-10-20 16:48:29' }
])

// 筛选
const filteredData = computed(() => {
  return storageData.value.filter(item => {
    const matchName = !query.value.coreName || item.coreName.includes(query.value.coreName)
    const matchStatus = !query.value.status || item.status === query.value.status
    return matchName && matchStatus
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
  query.value = { coreName: '', status: undefined }
  page.value = 1
  message.info('已重置')
}
</script>

<style scoped>
.binhai-core-storage {
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
