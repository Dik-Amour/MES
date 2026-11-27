<template>
  <div class="tooling-inspection-record">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="记录编号">
          <a-input
            v-model:value="searchForm.recordId"
            placeholder="请输入记录编号"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="工装型号">
          <a-input
            v-model:value="searchForm.toolingModel"
            placeholder="请输入工装型号"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="工装名称">
          <a-input
            v-model:value="searchForm.toolingName"
            placeholder="请输入工装名称"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="点检模板">
          <a-select
            v-model:value="searchForm.templateId"
            placeholder="请选择模板"
            allow-clear
            style="width: 200px"
          >
            <a-select-option v-for="t in toolingStore.templates" :key="t.id" :value="t.id">
              {{ t.templateName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="点检结果">
          <a-select
            v-model:value="searchForm.inspectResult"
            placeholder="请选择结果"
            allow-clear
            style="width: 130px"
          >
            <a-select-option value="pass">合格</a-select-option>
            <a-select-option value="fail">不合格</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item class="search-actions">
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

    <!-- 数据表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        :row-selection="{
          selectedRowKeys: selectedRowKeys,
          onChange: onSelectChange
        }"
        row-key="recordId"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'inspectResult'">
            <a-tag
              :color="(record as InspectRecord).inspectResult === 'pass' ? 'green' : 'red'"
            >
              {{ (record as InspectRecord).inspectResult === 'pass' ? '合格' : '不合格' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'resultSummary'">
            <span>
              合格 {{ (record as InspectRecord).passCount }} /
              不合格 {{ (record as InspectRecord).failCount }} /
              不适用 {{ (record as InspectRecord).naCount }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="8">
              <a-button type="link" size="small" @click="handleView(record)">
                详情
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 点检详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="工装点检记录详情"
      :footer="null"
      width="900px"
      @cancel="detailVisible = false"
    >
      <div v-if="detailRecord" class="detail-body">
        <a-descriptions :column="3" size="small" bordered class="detail-meta">
          <a-descriptions-item label="记录编号">{{ detailRecord.recordId }}</a-descriptions-item>
          <a-descriptions-item label="点检时间">{{ detailRecord.inspectTime }}</a-descriptions-item>
          <a-descriptions-item label="点检人">{{ detailRecord.inspector }}</a-descriptions-item>
          <a-descriptions-item label="点检模板">
            {{ detailRecord.templateCode }} {{ detailRecord.templateName }}
          </a-descriptions-item>
          <a-descriptions-item label="工装">
            {{ detailRecord.toolingModel }} {{ detailRecord.toolingName }}
          </a-descriptions-item>
          <a-descriptions-item label="工装类型">{{ detailRecord.toolingType }}</a-descriptions-item>
          <a-descriptions-item label="产线">{{ detailRecord.line }}</a-descriptions-item>
          <a-descriptions-item label="上机设备">{{ detailRecord.equipment }}</a-descriptions-item>
          <a-descriptions-item label="点检结果">
            <a-tag
              :color="detailRecord.inspectResult === 'pass' ? 'green' : 'red'"
            >
              {{ detailRecord.inspectResult === 'pass' ? '合格' : '不合格' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="备注" :span="3">
            {{ detailRecord.remark || '—' }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="detail-section-title">点检项明细</div>
        <a-table
          :columns="detailColumns"
          :data-source="detailRecord.items"
          :pagination="false"
          :scroll="{ x: 860 }"
          row-key="itemId"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'seq'">
              {{ detailRecord!.items.findIndex(i => i.itemId === (record as InspectRecordItem).itemId) + 1 }}
            </template>
            <template v-else-if="column.key === 'result'">
              <a-tag
                :color="
                  (record as InspectRecordItem).result === 'pass'
                    ? 'green'
                    : (record as InspectRecordItem).result === 'fail'
                      ? 'red'
                      : 'default'
                "
              >
                {{
                  (record as InspectRecordItem).result === 'pass'
                    ? '合格'
                    : (record as InspectRecordItem).result === 'fail'
                      ? '不合格'
                      : '不适用'
                }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { useToolingStore, type InspectRecord, type InspectRecordItem } from '@/stores/tooling'

const toolingStore = useToolingStore()

const selectedRowKeys = ref<string[]>([])

const searchForm = reactive({
  recordId: '',
  toolingModel: '',
  toolingName: '',
  templateId: undefined as string | undefined,
  inspectResult: undefined as string | undefined
})

const columns = [
  { title: '记录编号', dataIndex: 'recordId', key: 'recordId', width: 160 },
  { title: '点检时间', dataIndex: 'inspectTime', key: 'inspectTime', width: 170 },
  { title: '点检模板', dataIndex: 'templateName', key: 'templateName', width: 200 },
  { title: '工装型号', dataIndex: 'toolingModel', key: 'toolingModel', width: 130 },
  { title: '工装名称', dataIndex: 'toolingName', key: 'toolingName', width: 160 },
  { title: '工装类型', dataIndex: 'toolingType', key: 'toolingType', width: 100 },
  { title: '产线', dataIndex: 'line', key: 'line', width: 120 },
  { title: '上机设备', dataIndex: 'equipment', key: 'equipment', width: 140 },
  { title: '结果汇总', key: 'resultSummary', width: 180 },
  { title: '点检结果', key: 'inspectResult', width: 100 },
  { title: '点检人', dataIndex: 'inspector', key: 'inspector', width: 100 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' as const }
]

const detailColumns = [
  { title: '序号', key: 'seq', width: 60 },
  { title: '标准号', dataIndex: 'standardNo', key: 'standardNo', width: 130 },
  { title: '点检部位', dataIndex: 'checkPart', key: 'checkPart', width: 140 },
  { title: '点检内容', dataIndex: 'checkContent', key: 'checkContent', width: 170 },
  { title: '点检标准', dataIndex: 'checkStandard', key: 'checkStandard', width: 220 },
  { title: '点检方式', dataIndex: 'checkMethod', key: 'checkMethod', width: 100 },
  { title: '判定结果', key: 'result', width: 100 }
]

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const filteredData = computed(() => {
  let rows = toolingStore.inspectRecords
  if (searchForm.recordId) {
    rows = rows.filter(r => r.recordId.includes(searchForm.recordId.trim()))
  }
  if (searchForm.toolingModel) {
    rows = rows.filter(r => r.toolingModel.toLowerCase().includes(searchForm.toolingModel.toLowerCase()))
  }
  if (searchForm.toolingName) {
    rows = rows.filter(r => r.toolingName.includes(searchForm.toolingName.trim()))
  }
  if (searchForm.templateId) {
    rows = rows.filter(r => r.templateId === searchForm.templateId)
  }
  if (searchForm.inspectResult) {
    rows = rows.filter(r => r.inspectResult === searchForm.inspectResult)
  }
  pagination.total = rows.length
  return rows
})

const detailVisible = ref(false)
const detailRecord = ref<InspectRecord | null>(null)

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.recordId = ''
  searchForm.toolingModel = ''
  searchForm.toolingName = ''
  searchForm.templateId = undefined
  searchForm.inspectResult = undefined
  handleSearch()
}

const onSelectChange = (keys: (string | number)[]) => {
  selectedRowKeys.value = keys as string[]
}

const handleTableChange = (
  pag: { current?: number; pageSize?: number },
  _filters: unknown,
  _sorter: unknown
) => {
  if (pag.current) pagination.current = pag.current
  if (pag.pageSize) pagination.pageSize = pag.pageSize
}

const handleView = (record: InspectRecord) => {
  detailRecord.value = record
  detailVisible.value = true
}
</script>

<style scoped>
.tooling-inspection-record {
  padding: 16px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.search-actions) {
  margin-left: auto;
  margin-right: 0;
}

.table-card {
  margin-bottom: 16px;
}

.detail-meta {
  margin-bottom: 16px;
}

.detail-section-title {
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}
</style>
