<template>
  <div class="core-marking-record">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产线">
          <a-select v-model:value="searchForm.productionLine" placeholder="请选择" allow-clear style="width: 180px">
            <a-select-option v-for="l in productionLineOptions" :key="l" :value="l">{{ l }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="砂芯名称">
          <a-input v-model:value="searchForm.coreName" placeholder="请输入" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined /> 查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined /> 重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 数据表格卡片 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :row-key="record => record.id"
        :scroll="{ x: 1580 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// ---------- 类型定义 ----------
interface CoreMarkingRecordItem {
  id: number
  productionLine: string
  station: string
  palletCode: string
  coreName: string
  coreCode: string
  markingInfo: string
  markingTime: string
  rackCode: string
  operator: string
}

// ---------- 选项 ----------
const productionLineOptions = ['制芯一线', '制芯二线', '制芯三线']

// ---------- 筛选表单 ----------
const searchForm = reactive({
  productionLine: undefined as string | undefined,
  coreName: ''
})

// ---------- 表格 ----------
const loading = ref(false)

const columns = [
  { title: '序号', key: 'seq', width: 80 },
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 130 },
  { title: '上机位', dataIndex: 'station', key: 'station', width: 130 },
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 180 },
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 180 },
  { title: '砂芯编号', dataIndex: 'coreCode', key: 'coreCode', width: 140 },
  { title: '刻号信息', dataIndex: 'markingInfo', key: 'markingInfo', width: 200 },
  { title: '刻号时间', dataIndex: 'markingTime', key: 'markingTime', width: 180 },
  { title: '芯架码', dataIndex: 'rackCode', key: 'rackCode', width: 180 },
  { title: '作业人', dataIndex: 'operator', key: 'operator', width: 110 }
]

const dataSource = ref<CoreMarkingRecordItem[]>([
  { id: 1, productionLine: '制芯一线', station: '上机位1', palletCode: 'TP-20261026-0011', coreName: '缸盖内腔砂芯A', coreCode: 'SC-001', markingInfo: 'GA46Q-SC001-26102601', markingTime: '2026-10-26 08:15:32', rackCode: 'XJ-A-0032', operator: '张伟' },
  { id: 2, productionLine: '制芯一线', station: '上机位1', palletCode: 'TP-20261026-0012', coreName: '缸盖水道砂芯', coreCode: 'SC-002', markingInfo: 'GA46Q-SC002-26102602', markingTime: '2026-10-26 08:22:10', rackCode: 'XJ-A-0032', operator: '张伟' },
  { id: 3, productionLine: '制芯一线', station: '上机位2', palletCode: 'TP-20261026-0013', coreName: '缸盖气道砂芯', coreCode: 'SC-003', markingInfo: 'GA46Q-SC003-26102603', markingTime: '2026-10-26 08:41:05', rackCode: 'XJ-A-0033', operator: '李强' },
  { id: 4, productionLine: '制芯二线', station: '上机位1', palletCode: 'TP-20261026-0021', coreName: '机体顶盖砂芯', coreCode: 'SC-005', markingInfo: 'GA48T-SC005-26102604', markingTime: '2026-10-26 09:03:48', rackCode: 'XJ-B-0018', operator: '王磊' },
  { id: 5, productionLine: '制芯二线', station: '上机位2', palletCode: 'TP-20261026-0022', coreName: '机体主油道砂芯', coreCode: 'SC-006', markingInfo: 'GA48T-SC006-26102605', markingTime: '2026-10-26 09:18:27', rackCode: 'XJ-B-0018', operator: '王磊' },
  { id: 6, productionLine: '制芯二线', station: '上机位2', palletCode: 'TP-20261026-0023', coreName: '机体结合面砂芯', coreCode: 'SC-007', markingInfo: 'GA48T-SC007-26102606', markingTime: '2026-10-26 09:35:12', rackCode: 'XJ-B-0019', operator: '赵鹏' },
  { id: 7, productionLine: '制芯三线', station: '上机位1', palletCode: 'TP-20261026-0031', coreName: '缸盖内腔砂芯B', coreCode: 'SC-008', markingInfo: 'GA52C-SC008-26102607', markingTime: '2026-10-26 10:07:56', rackCode: 'XJ-C-0007', operator: '陈晨' }
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const filteredData = computed(() => {
  let list = dataSource.value
  if (searchForm.productionLine) list = list.filter(i => i.productionLine === searchForm.productionLine)
  if (searchForm.coreName) list = list.filter(i => i.coreName.includes(searchForm.coreName.trim()))
  pagination.total = list.length
  return list
})

// ---------- 操作 ----------
const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.productionLine = undefined
  searchForm.coreName = ''
  pagination.current = 1
}

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current ?? 1
  pagination.pageSize = pag.pageSize ?? pagination.pageSize
}
</script>

<style scoped>
.core-marking-record {
  padding: 16px;
}
</style>
