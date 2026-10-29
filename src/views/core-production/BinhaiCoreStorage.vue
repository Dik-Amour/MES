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
        :scroll="{ x: 1800 }"
        :row-key="(record: any) => record.key"
      >
        <template #bodyCell="{ column, record }">
          <!-- 是否有货 -->
          <template v-if="column.dataIndex === 'hasStock'">
            <a-tag :color="record.hasStock ? 'green' : 'default'">
              {{ record.hasStock ? '有货' : '无货' }}
            </a-tag>
          </template>
          <!-- 锁定 -->
          <template v-else-if="column.dataIndex === 'locked'">
            <a-tag :color="record.locked ? 'red' : 'default'">
              {{ record.locked ? '锁定' : '未锁定' }}
            </a-tag>
          </template>
          <!-- 状态 -->
          <template v-else-if="column.dataIndex === 'status'">
            <a-tag :color="statusColorMap[record.status]">
              {{ record.status }}
            </a-tag>
          </template>
          <!-- 空值显示为 — -->
          <template v-else-if="emptyFallbackKeys.includes(column.dataIndex)">
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
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// 查询条件
const query = ref<{ coreName: string; status?: string }>({ coreName: '', status: undefined })

const statusOptions = [
  { value: '可用', label: '可用' },
  { value: '不可用', label: '不可用' },
  { value: '维护中', label: '维护中' }
]

const statusColorMap: Record<string, string> = {
  可用: 'green',
  不可用: 'red',
  维护中: 'orange'
}

// 空值显示为 — 的列
const emptyFallbackKeys = ['stockTime', 'palletId', 'pallet', 'coreCode', 'coreName', 'remark', 'palletTime']

// 统计数据
const stats = computed(() => [
  { label: '库位总数', value: storageData.value.length },
  { label: '有货库位', value: storageData.value.filter(d => d.hasStock).length },
  { label: '空闲库位', value: storageData.value.filter(d => !d.hasStock).length },
  { label: '锁定库位', value: storageData.value.filter(d => d.locked).length }
])

// 表格列
const columns = [
  { title: '库位id', dataIndex: 'locationId', key: 'locationId', width: 100, align: 'center' as const },
  { title: '库位号', dataIndex: 'locationNo', key: 'locationNo', width: 100, align: 'center' as const },
  { title: '是否有货', dataIndex: 'hasStock', key: 'hasStock', width: 90, align: 'center' as const },
  { title: '锁定', dataIndex: 'locked', key: 'locked', width: 90, align: 'center' as const },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const },
  { title: '执行', dataIndex: 'exec', key: 'exec', width: 100, align: 'center' as const },
  { title: '库存时间', dataIndex: 'stockTime', key: 'stockTime', width: 170 },
  { title: '托盘id', dataIndex: 'palletId', key: 'palletId', width: 110, align: 'center' as const },
  { title: '托盘', dataIndex: 'pallet', key: 'pallet', width: 130, align: 'center' as const },
  { title: '砂芯', dataIndex: 'coreCode', key: 'coreCode', width: 120, align: 'center' as const },
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 170 },
  { title: '备注详情', dataIndex: 'remark', key: 'remark', width: 160 },
  { title: '仓库', dataIndex: 'warehouse', key: 'warehouse', width: 130, align: 'center' as const },
  { title: '组盘时间', dataIndex: 'palletTime', key: 'palletTime', width: 170 }
]

interface StorageRow {
  key: number
  locationId: string
  locationNo: string
  hasStock: boolean
  locked: boolean
  status: string
  exec: string
  stockTime: string
  palletId: string
  pallet: string
  coreCode: string
  coreName: string
  remark: string
  warehouse: string
  palletTime: string
}

// 模拟数据
let rowKey = 0
const storageData = ref<StorageRow[]>([
  { key: ++rowKey, locationId: 'L001', locationNo: 'A-01-03', hasStock: true, locked: false, status: '可用', exec: '', stockTime: '2026-10-28 08:15:20', palletId: 'P10021', pallet: 'TP-A-10021', coreCode: 'SC-001', coreName: '缸盖内腔砂芯A', remark: '待发往造型一线', warehouse: '滨海砂芯立库', palletTime: '2026-10-28 08:10:05' },
  { key: ++rowKey, locationId: 'L002', locationNo: 'A-01-04', hasStock: true, locked: false, status: '可用', exec: '出库中', stockTime: '2026-10-28 08:42:11', palletId: 'P10022', pallet: 'TP-A-10022', coreCode: 'SC-002', coreName: '缸盖水道砂芯', remark: '', warehouse: '滨海砂芯立库', palletTime: '2026-10-28 08:36:40' },
  { key: ++rowKey, locationId: 'L003', locationNo: 'A-02-01', hasStock: false, locked: false, status: '可用', exec: '', stockTime: '', palletId: '', pallet: '', coreCode: '', coreName: '', remark: '', warehouse: '滨海砂芯立库', palletTime: '' },
  { key: ++rowKey, locationId: 'L004', locationNo: 'A-02-02', hasStock: true, locked: true, status: '不可用', exec: '', stockTime: '2026-10-27 15:05:48', palletId: 'P10024', pallet: 'TP-A-10024', coreCode: 'SC-005', coreName: '机体顶盖砂芯', remark: '盘点锁定', warehouse: '滨海砂芯立库', palletTime: '2026-10-27 14:58:12' },
  { key: ++rowKey, locationId: 'L005', locationNo: 'B-01-01', hasStock: true, locked: false, status: '可用', exec: '入库中', stockTime: '2026-10-28 09:30:02', palletId: 'P10025', pallet: 'TP-B-10025', coreCode: 'SC-006', coreName: '机体主油道砂芯', remark: '', warehouse: '滨海砂芯立库', palletTime: '2026-10-28 09:25:36' },
  { key: ++rowKey, locationId: 'L006', locationNo: 'B-01-02', hasStock: false, locked: true, status: '维护中', exec: '', stockTime: '', palletId: '', pallet: '', coreCode: '', coreName: '', remark: '货架维修，暂不可用', warehouse: '滨海砂芯立库', palletTime: '' },
  { key: ++rowKey, locationId: 'L007', locationNo: 'B-02-01', hasStock: true, locked: false, status: '可用', exec: '', stockTime: '2026-10-27 16:48:29', palletId: 'P10027', pallet: 'TP-B-10027', coreCode: 'SC-008', coreName: '缸盖内腔砂芯B', remark: '', warehouse: '滨海砂芯立库', palletTime: '2026-10-27 16:40:15' },
  { key: ++rowKey, locationId: 'L008', locationNo: 'B-02-02', hasStock: false, locked: false, status: '可用', exec: '', stockTime: '', palletId: '', pallet: '', coreCode: '', coreName: '', remark: '', warehouse: '滨海砂芯立库', palletTime: '' }
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
