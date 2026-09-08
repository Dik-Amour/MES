<template>
  <div class="wip-initial-data">
    <!-- 搜索栏 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产品系列">
          <a-select
            v-model:value="searchForm.productSeries"
            placeholder="请选择产品系列"
            allow-clear
            style="width: 180px"
            @change="handleSearch"
          >
            <a-select-option v-for="s in seriesOptions" :key="s" :value="s">
              {{ s }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯件号">
          <a-select
            v-model:value="searchForm.blankPartNo"
            placeholder="请选择毛坯件号"
            allow-clear
            show-search
            :filter-option="filterOption"
            style="width: 180px"
            @change="handleSearch"
          >
            <a-select-option v-for="p in partNoOptions" :key="p" :value="p">
              {{ p }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯名称">
          <a-input
            v-model:value="searchForm.blankName"
            placeholder="请输入毛坯名称"
            allow-clear
            style="width: 180px"
            @pressEnter="handleSearch"
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

    <!-- 功能按钮区 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增
        </a-button>
        <a-button type="primary" ghost @click="handleImport">
          <UploadOutlined />
          导入
        </a-button>
        <a-button
          type="primary"
          danger
          ghost
          @click="handleBatchDelete"
          :disabled="selectedRowKeys.length === 0"
        >
          <DeleteOutlined />
          批量删除
        </a-button>
      </a-space>
    </a-card>

    <!-- 产线Tab + 数据列表 -->
    <a-card :bordered="false" class="table-card">
      <a-tabs v-model:activeKey="activeLine" @change="handleLineChange">
        <a-tab-pane
          v-for="line in lineOptions"
          :key="line.value"
          :tab="line.label"
        >
          <a-table
            :columns="columns"
            :data-source="dataSource"
            :loading="loading"
            :pagination="pagination"
            :row-key="rowKey"
            :row-selection="rowSelection"
            :scroll="{ x: 1500 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'initialWipQuantity'">
                <span>{{ formatNumber(record.initialWipQuantity) }}</span>
              </template>
              <template v-else-if="column.key === 'initialFinishedQuantity'">
                <span>{{ formatNumber(record.initialFinishedQuantity) }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                  <a-popconfirm
                    title="确定删除该条记录吗？"
                    @confirm="handleDelete(record)"
                  >
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="formModalVisible"
      :title="formModalTitle"
      :width="560"
      @ok="handleFormSubmit"
      @cancel="handleFormCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 7 }"
        :wrapper-col="{ span: 17 }"
      >
        <a-form-item label="产线" name="lineCode">
          <a-select v-model:value="formData.lineCode" placeholder="请选择产线">
            <a-select-option v-for="line in lineOptions" :key="line.value" :value="line.value">
              {{ line.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="系列名称" name="seriesName">
          <a-select
            v-model:value="formData.seriesName"
            placeholder="请选择系列名称"
            @change="handleFormSeriesChange"
          >
            <a-select-option v-for="s in seriesOptions" :key="s" :value="s">
              {{ s }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯件号" name="blankPartNo">
          <a-select
            v-model:value="formData.blankPartNo"
            placeholder="请选择毛坯件号"
            show-search
            :filter-option="filterOption"
            @change="handleFormPartNoChange"
          >
            <a-select-option v-for="p in formPartNoOptions" :key="p" :value="p">
              {{ p }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯名称" name="blankName">
          <a-input v-model:value="formData.blankName" placeholder="选择毛坯件号后自动回显" disabled />
        </a-form-item>
        <a-form-item label="初始在制品数量" name="initialWipQuantity">
          <a-input-number
            v-model:value="formData.initialWipQuantity"
            :min="0"
            :precision="0"
            placeholder="请输入初始在制品数量"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="初始成品数量" name="initialFinishedQuantity">
          <a-input-number
            v-model:value="formData.initialFinishedQuantity"
            :min="0"
            :precision="0"
            placeholder="请输入初始成品数量"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      title="Excel批量导入"
      :width="560"
      @ok="handleImportConfirm"
      @cancel="handleImportCancel"
    >
      <a-alert
        message="导入说明"
        description="导入文件将按当前产线覆盖在制品初始数据，请先下载模板按格式填写！"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="选择文件" required>
          <a-upload
            :file-list="fileList"
            :before-upload="beforeUpload"
            @remove="handleRemoveFile"
            :accept="'.xlsx,.xls'"
          >
            <a-button>
              <UploadOutlined />
              选择Excel文件
            </a-button>
          </a-upload>
          <div class="upload-tip">仅支持.xlsx、.xls格式文件</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

interface WipInitialData {
  key: string
  lineCode: string
  lineName: string
  seriesName: string
  blankPartNo: string
  blankName: string
  initialWipQuantity: number
  initialFinishedQuantity: number
  creator: string
  createTime: string
  modifier: string
  updateTime: string
}

// 产线Tab配置
const lineOptions = [
  { label: '造型一线大件清理', value: 'LINE-01' },
  { label: '造型三线KW清理', value: 'LINE-02' },
  { label: '造型三线HWS清理', value: 'LINE-03' }
]

const lineNameMap: Record<string, string> = Object.fromEntries(
  lineOptions.map(line => [line.value, line.label])
)

// 系列名称选项
const seriesOptions = ['A系列', 'B系列', 'C系列']

// 毛坯基础数据（件号-名称-系列映射）
interface BlankPart {
  partNo: string
  name: string
  series: string
}

const blankPartOptions: BlankPart[] = [
  { partNo: 'MP-001', name: '传动轴毛坯', series: 'A系列' },
  { partNo: 'MP-002', name: '齿轮毛坯', series: 'A系列' },
  { partNo: 'MP-003', name: '法兰盘毛坯', series: 'B系列' },
  { partNo: 'MP-004', name: '轴承座毛坯', series: 'B系列' },
  { partNo: 'MP-005', name: '壳体毛坯', series: 'C系列' },
  { partNo: 'MP-006', name: '泵体毛坯', series: 'C系列' },
  { partNo: 'MP-007', name: '阀体毛坯', series: 'A系列' }
]

// 毛坯件号选项（搜索栏用，全部）
const partNoOptions = blankPartOptions.map(item => item.partNo)

const activeLine = ref<string>('LINE-01')
const loading = ref(false)
const dataSource = ref<WipInitialData[]>([])
const selectedRowKeys = ref<Array<string | number>>([])

// 行唯一标识（产线+行号，避免不同产线重复 key 冲突）
const rowKey = (record: WipInitialData) => `${record.lineCode}::${record.key}`

// 表格勾选配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => {
    selectedRowKeys.value = keys
  }
}))

const searchForm = reactive({
  productSeries: '',
  blankPartNo: '',
  blankName: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const columns = [
  { title: '产线编码', dataIndex: 'lineCode', key: 'lineCode', width: 110, fixed: 'left' as const },
  { title: '产线名称', dataIndex: 'lineName', key: 'lineName', width: 170 },
  { title: '系列名称', dataIndex: 'seriesName', key: 'seriesName', width: 110 },
  { title: '毛坯件号', dataIndex: 'blankPartNo', key: 'blankPartNo', width: 130 },
  { title: '毛坯名称', dataIndex: 'blankName', key: 'blankName', width: 160 },
  { title: '初始在制品数量', dataIndex: 'initialWipQuantity', key: 'initialWipQuantity', width: 140 },
  { title: '初始成品数量', dataIndex: 'initialFinishedQuantity', key: 'initialFinishedQuantity', width: 140 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '修改人', dataIndex: 'modifier', key: 'modifier', width: 100 },
  { title: '修改时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
  { title: '操作', key: 'action', width: 130, fixed: 'right' as const }
]

// 模拟数据（按产线分组）
const mockDataByLine: Record<string, WipInitialData[]> = {
  'LINE-01': [
    {
      key: '1',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      seriesName: 'A系列',
      blankPartNo: 'MP-001',
      blankName: '传动轴毛坯',
      initialWipQuantity: 120,
      initialFinishedQuantity: 30,
      creator: '张工',
      createTime: '2026-01-01 08:00:00',
      modifier: '李工',
      updateTime: '2026-08-05 10:30:00'
    },
    {
      key: '2',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      seriesName: 'A系列',
      blankPartNo: 'MP-002',
      blankName: '齿轮毛坯',
      initialWipQuantity: 80,
      initialFinishedQuantity: 45,
      creator: '张工',
      createTime: '2026-01-01 08:05:00',
      modifier: '王工',
      updateTime: '2026-08-04 15:20:00'
    },
    {
      key: '3',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      seriesName: 'B系列',
      blankPartNo: 'MP-003',
      blankName: '法兰盘毛坯',
      initialWipQuantity: 150,
      initialFinishedQuantity: 60,
      creator: '赵工',
      createTime: '2026-01-02 09:10:00',
      modifier: '赵工',
      updateTime: '2026-08-03 11:00:00'
    }
  ],
  'LINE-02': [
    {
      key: '1',
      lineCode: 'LINE-02',
      lineName: '造型三线KW清理',
      seriesName: 'B系列',
      blankPartNo: 'MP-004',
      blankName: '轴承座毛坯',
      initialWipQuantity: 60,
      initialFinishedQuantity: 20,
      creator: '钱工',
      createTime: '2026-01-01 08:00:00',
      modifier: '孙工',
      updateTime: '2026-08-06 09:15:00'
    },
    {
      key: '2',
      lineCode: 'LINE-02',
      lineName: '造型三线KW清理',
      seriesName: 'C系列',
      blankPartNo: 'MP-005',
      blankName: '壳体毛坯',
      initialWipQuantity: 40,
      initialFinishedQuantity: 12,
      creator: '钱工',
      createTime: '2026-01-01 08:10:00',
      modifier: '',
      updateTime: '2026-08-02 14:40:00'
    }
  ],
  'LINE-03': [
    {
      key: '1',
      lineCode: 'LINE-03',
      lineName: '造型三线HWS清理',
      seriesName: 'C系列',
      blankPartNo: 'MP-006',
      blankName: '泵体毛坯',
      initialWipQuantity: 90,
      initialFinishedQuantity: 35,
      creator: '周工',
      createTime: '2026-01-02 10:00:00',
      modifier: '吴工',
      updateTime: '2026-08-06 10:00:00'
    },
    {
      key: '2',
      lineCode: 'LINE-03',
      lineName: '造型三线HWS清理',
      seriesName: 'A系列',
      blankPartNo: 'MP-007',
      blankName: '阀体毛坯',
      initialWipQuantity: 70,
      initialFinishedQuantity: 28,
      creator: '周工',
      createTime: '2026-01-02 10:05:00',
      modifier: '',
      updateTime: '2026-08-01 16:30:00'
    }
  ]
}

// 新增/编辑弹窗
const formRef = ref<FormInstance>()
const formModalVisible = ref(false)
const formModalTitle = ref('新增在制品初始数据')
const editingRecord = ref<WipInitialData | null>(null)
const formData = reactive({
  lineCode: 'LINE-01',
  seriesName: '',
  blankPartNo: '',
  blankName: '',
  initialWipQuantity: 0,
  initialFinishedQuantity: 0
})
const formRules = {
  seriesName: [{ required: true, message: '请选择系列名称', trigger: 'change' }],
  blankPartNo: [{ required: true, message: '请选择毛坯件号', trigger: 'change' }],
  blankName: [{ required: true, message: '请输入毛坯名称', trigger: 'blur' }]
}

// 弹窗内毛坯件号选项（按所选系列联动过滤，未选系列时展示全部）
const formPartNoOptions = computed(() => {
  if (!formData.seriesName) {
    return blankPartOptions.map(item => item.partNo)
  }
  return blankPartOptions
    .filter(item => item.series === formData.seriesName)
    .map(item => item.partNo)
})

// 导入弹窗
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

onMounted(() => {
  loadData()
})

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    const lineData = mockDataByLine[activeLine.value] || []
    const { productSeries, blankPartNo, blankName } = searchForm
    const filtered = lineData.filter(item => {
      const matchSeries = !productSeries || item.seriesName === productSeries
      const matchPartNo = !blankPartNo || item.blankPartNo === blankPartNo
      const matchName = !blankName || item.blankName.includes(blankName)
      return matchSeries && matchPartNo && matchName
    })
    dataSource.value = filtered
    pagination.total = filtered.length
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  selectedRowKeys.value = []
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.productSeries = ''
  searchForm.blankPartNo = ''
  searchForm.blankName = ''
  handleSearch()
}

const handleLineChange = () => {
  selectedRowKeys.value = []
  pagination.current = 1
  loadData()
}

const handleAdd = () => {
  editingRecord.value = null
  formModalTitle.value = '新增在制品初始数据'
  formData.lineCode = activeLine.value
  formData.seriesName = ''
  formData.blankPartNo = ''
  formData.blankName = ''
  formData.initialWipQuantity = 0
  formData.initialFinishedQuantity = 0
  formModalVisible.value = true
}

const handleEdit = (record: WipInitialData) => {
  editingRecord.value = record
  formModalTitle.value = '编辑在制品初始数据'
  formData.lineCode = record.lineCode
  formData.seriesName = record.seriesName
  formData.blankPartNo = record.blankPartNo
  formData.blankName = record.blankName
  formData.initialWipQuantity = record.initialWipQuantity
  formData.initialFinishedQuantity = record.initialFinishedQuantity
  // 与新增逻辑一致：按毛坯件号联动回显毛坯名称
  handleFormPartNoChange()
  formModalVisible.value = true
}

const handleFormSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const now = '2026-08-06 12:00:00'
  const currentUser = '当前用户'
  if (editingRecord.value) {
    const record = editingRecord.value
    record.lineCode = formData.lineCode
    record.lineName = lineNameMap[formData.lineCode] || formData.lineCode
    record.seriesName = formData.seriesName
    record.blankPartNo = formData.blankPartNo
    record.blankName = formData.blankName
    record.initialWipQuantity = formData.initialWipQuantity
    record.initialFinishedQuantity = formData.initialFinishedQuantity
    record.modifier = currentUser
    record.updateTime = now
    message.success('修改成功')
  } else {
    const lineData = mockDataByLine[formData.lineCode]
    if (lineData) {
      lineData.unshift({
        key: String(Date.now()),
        lineCode: formData.lineCode,
        lineName: lineNameMap[formData.lineCode] || formData.lineCode,
        seriesName: formData.seriesName,
        blankPartNo: formData.blankPartNo,
        blankName: formData.blankName,
        initialWipQuantity: formData.initialWipQuantity,
        initialFinishedQuantity: formData.initialFinishedQuantity,
        creator: currentUser,
        createTime: now,
        modifier: currentUser,
        updateTime: now
      })
    }
    message.success('新增成功')
  }
  formModalVisible.value = false
  loadData()
}

const handleFormCancel = () => {
  formModalVisible.value = false
}

// 系列变更时清空毛坯件号与名称
const handleFormSeriesChange = () => {
  formData.blankPartNo = ''
  formData.blankName = ''
}

// 毛坯件号变更时联动回显毛坯名称
const handleFormPartNoChange = () => {
  const part = blankPartOptions.find(item => item.partNo === formData.blankPartNo)
  formData.blankName = part ? part.name : ''
}

const handleDelete = (record: WipInitialData) => {
  const lineData = mockDataByLine[record.lineCode]
  if (lineData) {
    const index = lineData.findIndex(item => item.key === record.key)
    if (index !== -1) {
      lineData.splice(index, 1)
    }
  }
  dataSource.value = dataSource.value.filter(item => item.key !== record.key)
  selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== rowKey(record))
  pagination.total = dataSource.value.length
  message.success('删除成功')
}

// 批量删除
const handleBatchDelete = () => {
  const keys = selectedRowKeys.value
  if (keys.length === 0) {
    message.warning('请先勾选要删除的记录')
    return
  }
  Modal.confirm({
    title: '批量删除',
    content: `确定删除选中的 ${keys.length} 条记录吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      const keySet = new Set(keys)
      Object.values(mockDataByLine).forEach(lineData => {
        for (let i = lineData.length - 1; i >= 0; i--) {
          if (keySet.has(rowKey(lineData[i]))) {
            lineData.splice(i, 1)
          }
        }
      })
      dataSource.value = dataSource.value.filter(item => !keySet.has(rowKey(item)))
      pagination.total = dataSource.value.length
      selectedRowKeys.value = []
      message.success('批量删除成功')
    }
  })
}

const handleImport = () => {
  fileList.value = []
  importModalVisible.value = true
}

const handleImportConfirm = () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要导入的文件')
    return
  }
  message.success('导入成功')
  importModalVisible.value = false
  fileList.value = []
  loadData()
}

const handleImportCancel = () => {
  fileList.value = []
}

const beforeUpload = (file: any) => {
  fileList.value = [file]
  return false
}

const handleRemoveFile = () => {
  fileList.value = []
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const formatNumber = (value: number) => {
  return value.toLocaleString('zh-CN')
}

const filterOption = (input: string, option: any) => {
  return (option.value || '').toLowerCase().includes(input.toLowerCase())
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.action-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
</style>
