<template>
  <div class="andon-record">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="异常类型">
          <a-select
            v-model:value="searchForm.exceptionType"
            placeholder="请选择异常类型"
            allow-clear
            style="width: 180px"
          >
            <a-select-option v-for="t in exceptionTypeOptions" :key="t" :value="t">
              {{ t }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="处理状态">
          <a-select
            v-model:value="searchForm.handleStatus"
            placeholder="请选择处理状态"
            allow-clear
            style="width: 150px"
          >
            <a-select-option v-for="s in handleStatusOptions" :key="s" :value="s">
              {{ s }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="发生日期">
          <a-range-picker
            v-model:value="searchForm.dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            style="width: 260px"
          />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增
        </a-button>
        <a-button type="primary" danger ghost :disabled="selectedRowKeys.length === 0">
          <DeleteOutlined />
          删除
        </a-button>
        <a-button type="primary" ghost :disabled="selectedRowKeys.length === 0">
          <ExportOutlined />
          导出
        </a-button>
      </a-space>
    </a-card>

    <!-- 数据表格卡片 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :row-key="'id'"
        :row-selection="rowSelection"
        :scroll="{ x: 1800 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'handleStatus'">
            <a-tag :color="statusColor[record.handleStatus]">
              {{ record.handleStatus }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button type="link" size="small" @click="handleViewDetail(record)">明细</a-button>
              <a-button type="link" size="small" @click="handleHandle(record)" :disabled="record.handleStatus === '已关闭'">处理</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/处理弹框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isHandle ? '处理异常' : '新增异常记录'"
      :width="700"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="异常类型" required>
          <a-select v-model:value="formData.exceptionType" placeholder="请选择异常类型" :disabled="isHandle">
            <a-select-option v-for="t in exceptionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="异常名称" required>
          <a-input v-model:value="formData.exceptionName" placeholder="请输入异常名称" :disabled="isHandle" />
        </a-form-item>
        <a-form-item label="发生区域" required>
          <a-input v-model:value="formData.area" placeholder="请输入发生区域" :disabled="isHandle" />
        </a-form-item>
        <a-form-item label="发生时间" required>
          <a-date-picker v-model:value="formData.occurTime" format="YYYY-MM-DD HH:mm" show-time style="width: 100%" :disabled="isHandle" />
        </a-form-item>
        <a-form-item label="异常描述">
          <a-textarea v-model:value="formData.description" placeholder="请输入异常描述" :rows="3" :disabled="isHandle" />
        </a-form-item>
        <template v-if="isHandle">
          <a-form-item label="处理结果" required>
            <a-textarea v-model:value="formData.handleResult" placeholder="请输入处理结果" :rows="3" />
          </a-form-item>
          <a-form-item label="处理状态">
            <a-select v-model:value="formData.handleStatus" placeholder="请选择处理状态">
              <a-select-option v-for="s in handleStatusOptions" :key="s" :value="s">{{ s }}</a-select-option>
            </a-select>
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'

interface AndonRecord {
  id: number
  exceptionType: string
  exceptionName: string
  area: string
  occurTime: string
  description: string
  reporter: string
  handleStatus: string
  handleResult: string
  handleTime: string
}

const exceptionTypeOptions = ['质量异常', '设备异常', '物料异常', '安全异常', '工艺异常', '环境异常']
const handleStatusOptions = ['待处理', '处理中', '已关闭']

const statusColor: Record<string, string> = {
  '待处理': 'orange',
  '处理中': 'blue',
  '已关闭': 'green'
}

const loading = ref(false)
const dataSource = ref<AndonRecord[]>([
  { id: 1, exceptionType: '质量异常', exceptionName: '尺寸超差', area: '机体线 - 机体班', occurTime: '2026-08-18 09:30', description: '产品尺寸超出公差范围', reporter: '冯永增', handleStatus: '已关闭', handleResult: '已调整工装夹具', handleTime: '2026-08-18 10:00' },
  { id: 2, exceptionType: '设备异常', exceptionName: '设备停机', area: '新产品线 - 新产品班', occurTime: '2026-08-18 10:15', description: '数控机床主轴异响停机', reporter: '高波', handleStatus: '处理中', handleResult: '已联系维修人员', handleTime: '' },
  { id: 3, exceptionType: '物料异常', exceptionName: '物料短缺', area: '制芯线 - 制芯班', occurTime: '2026-08-17 14:20', description: '砂芯原料库存不足', reporter: '常慧', handleStatus: '待处理', handleResult: '', handleTime: '' },
  { id: 4, exceptionType: '安全异常', exceptionName: '安全隐患', area: '机体线 - 机体班', occurTime: '2026-08-17 16:00', description: '车间消防通道被堵塞', reporter: '王辉', handleStatus: '已关闭', handleResult: '已清理通道', handleTime: '2026-08-17 16:30' },
  { id: 5, exceptionType: '工艺异常', exceptionName: '工艺参数偏差', area: '新产品线 - 新产品班', occurTime: '2026-08-16 08:45', description: '浇注温度超出工艺要求', reporter: '周克凡', handleStatus: '待处理', handleResult: '', handleTime: '' }
])

const selectedRowKeys = ref<Array<string | number>>([])
const searchForm = reactive({
  exceptionType: '',
  handleStatus: '',
  dateRange: [] as any[]
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => { selectedRowKeys.value = keys }
}))

const columns = [
  { title: '异常类型', dataIndex: 'exceptionType', key: 'exceptionType', width: 120 },
  { title: '异常名称', dataIndex: 'exceptionName', key: 'exceptionName', width: 140 },
  { title: '发生区域', dataIndex: 'area', key: 'area', width: 180 },
  { title: '发生时间', dataIndex: 'occurTime', key: 'occurTime', width: 160 },
  { title: '异常描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: true },
  { title: '上报人', dataIndex: 'reporter', key: 'reporter', width: 100 },
  { title: '处理状态', dataIndex: 'handleStatus', key: 'handleStatus', width: 100 },
  { title: '处理结果', dataIndex: 'handleResult', key: 'handleResult', width: 200, ellipsis: true },
  { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' as const }
]

const filteredData = computed(() => {
  let list = dataSource.value
  if (searchForm.exceptionType) list = list.filter(i => i.exceptionType === searchForm.exceptionType)
  if (searchForm.handleStatus) list = list.filter(i => i.handleStatus === searchForm.handleStatus)
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const start = searchForm.dateRange[0].format('YYYY-MM-DD')
    const end = searchForm.dateRange[1].format('YYYY-MM-DD')
    list = list.filter(i => i.occurTime.slice(0, 10) >= start && i.occurTime.slice(0, 10) <= end)
  }
  pagination.total = list.length
  return list
})

const modalVisible = ref(false)
const isHandle = ref(false)
const editingId = ref(0)
const formData = reactive({
  exceptionType: undefined as string | undefined,
  exceptionName: '',
  area: '',
  occurTime: null as Dayjs | null,
  description: '',
  handleResult: '',
  handleStatus: '待处理'
})

const handleSearch = () => { pagination.current = 1 }
const handleReset = () => {
  searchForm.exceptionType = ''
  searchForm.handleStatus = ''
  searchForm.dateRange = []
  pagination.current = 1
}
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize }

const resetForm = () => {
  Object.assign(formData, { exceptionType: undefined, exceptionName: '', area: '', occurTime: null, description: '', handleResult: '', handleStatus: '待处理' })
}

const handleAdd = () => {
  isHandle.value = false
  editingId.value = 0
  resetForm()
  modalVisible.value = true
}
const handleViewDetail = (record: AndonRecord) => {
  message.info(`查看「${record.exceptionName}」的明细`)
}
const handleHandle = (record: AndonRecord) => {
  isHandle.value = true
  editingId.value = record.id
  Object.assign(formData, { exceptionType: record.exceptionType, exceptionName: record.exceptionName, area: record.area, occurTime: null, description: record.description, handleResult: record.handleResult, handleStatus: record.handleStatus })
  modalVisible.value = true
}
const handleModalOk = () => {
  if (isHandle.value) {
    if (!formData.handleResult) { message.warning('请填写处理结果'); return }
    const idx = dataSource.value.findIndex(i => i.id === editingId.value)
    if (idx !== -1) {
      dataSource.value[idx].handleResult = formData.handleResult
      dataSource.value[idx].handleStatus = formData.handleStatus
      dataSource.value[idx].handleTime = dayjs().format('YYYY-MM-DD HH:mm')
    }
    message.success('处理成功')
  } else {
    if (!formData.exceptionType || !formData.exceptionName || !formData.area) { message.warning('请填写必填项'); return }
    dataSource.value.unshift({
      id: Date.now(),
      exceptionType: formData.exceptionType!,
      exceptionName: formData.exceptionName,
      area: formData.area,
      occurTime: formData.occurTime ? formData.occurTime.format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
      description: formData.description,
      reporter: 'admin',
      handleStatus: '待处理',
      handleResult: '',
      handleTime: ''
    })
    message.success('新增成功')
  }
  modalVisible.value = false
}
const handleModalCancel = () => { modalVisible.value = false }
</script>

<style scoped>
.filter-card, .action-card { margin-bottom: 16px; }
</style>
