<template>
  <div class="sand-core-takt">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="件号">
          <a-input v-model:value="searchForm.partNo" placeholder="请输入" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="砂芯名称">
          <a-input v-model:value="searchForm.coreName" placeholder="请输入" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="砂芯类型">
          <a-select v-model:value="searchForm.coreType" placeholder="请选择" allow-clear style="width: 180px">
            <a-select-option v-for="t in coreTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
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

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined /> 新增
        </a-button>
        <a-button type="primary" ghost @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
          <EditOutlined /> 修改
        </a-button>
        <a-button type="primary" danger ghost :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
          <DeleteOutlined /> 删除
        </a-button>
        <a-button @click="handleDownloadTemplate">
          <DownloadOutlined /> 模板下载
        </a-button>
        <a-button type="primary" ghost @click="handleImport">
          <UploadOutlined /> 导入
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
        :row-key="record => record.id"
        :row-selection="rowSelection"
        :scroll="{ x: 1200 }"
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

    <!-- 新增/编辑弹框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '修改砂芯生产节拍' : '新增砂芯生产节拍'"
      :width="640"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :label-col="{ span: 8 }" :wrapper-col="{ span: 14 }">
        <a-form-item label="件号" required>
          <a-select
            v-model:value="formData.partNo"
            placeholder="请选择件号"
            allow-clear
            style="width: 100%"
          >
            <a-select-option v-for="p in partOptions" :key="p" :value="p">{{ p }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="砂芯名称" required>
          <a-auto-complete
            v-model:value="formData.coreName"
            :options="coreNameOptions"
            placeholder="请输入关键词检索选择"
            allow-clear
            style="width: 100%"
            @select="handleNameSelect"
          />
        </a-form-item>
        <a-form-item label="砂芯编号" required>
          <a-select
            v-model:value="formData.coreCode"
            :options="coreCodeOptions.map(c => ({ value: c }))"
            placeholder="请选择砂芯编号"
            show-search
            allow-clear
            style="width: 100%"
            @change="handleCodeChange"
          />
        </a-form-item>
        <a-form-item label="砂芯类型" required>
          <a-select v-model:value="formData.coreType" placeholder="请选择砂芯类型" allow-clear>
            <a-select-option v-for="t in coreTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="单颗砂芯制芯时长（分钟）" required>
          <a-input-number
            v-model:value="formData.cycleTimeMin"
            placeholder="请输入"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="芯盒换型时长（分钟）" required>
          <a-input-number
            v-model:value="formData.changeoverTimeMin"
            placeholder="请输入"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入弹框 -->
    <a-modal
      v-model:open="importModalVisible"
      title="导入砂芯生产节拍"
      :width="600"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleImportConfirm"
      @cancel="handleImportCancel"
    >
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
          <div class="upload-tip">仅支持.xlsx、.xls格式文件，可先点击"模板下载"获取导入模板</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import * as XLSX from 'xlsx'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue'

// ---------- 类型定义 ----------
interface SandCoreTaktRecord {
  id: number
  partNo: string
  coreCode: string
  coreName: string
  coreType: string
  cycleTimeMin: number
  changeoverTimeMin: number
}

interface TaktFormData {
  partNo: string | undefined
  coreCode: string | undefined
  coreName: string
  coreType: string | undefined
  cycleTimeMin: number | null
  changeoverTimeMin: number | null
}

// 砂芯基础数据（砂芯编号/砂芯名称的关联来源）
interface SandCoreMaster {
  partNo: string
  coreCode: string
  coreName: string
  coreType: string
}

// ---------- 选项 ----------
const coreTypeOptions = ['冷芯', '热芯', '手工砂芯']

// 砂芯基础数据（砂芯名称/砂芯编号联动与互校的来源，件号独立选择不与之关联）
const coreMasterData: SandCoreMaster[] = [
  { partNo: 'BJH46Q-1002010', coreCode: 'SC-001', coreName: '缸盖内腔砂芯A', coreType: '冷芯' },
  { partNo: 'BJH46Q-1002010', coreCode: 'SC-002', coreName: '缸盖水道砂芯', coreType: '冷芯' },
  { partNo: 'BJH46Q-1002010', coreCode: 'SC-003', coreName: '缸盖气道砂芯', coreType: '热芯' },
  { partNo: 'BJH46Q-1002010', coreCode: 'SC-004', coreName: '缸盖排气道砂芯', coreType: '热芯' },
  { partNo: 'BJH48T-1003012', coreCode: 'SC-005', coreName: '机体顶盖砂芯', coreType: '手工砂芯' },
  { partNo: 'BJH48T-1003012', coreCode: 'SC-006', coreName: '机体主油道砂芯', coreType: '热芯' },
  { partNo: 'BJH48T-1003012', coreCode: 'SC-007', coreName: '机体结合面砂芯', coreType: '手工砂芯' },
  { partNo: 'BJH52C-2001015', coreCode: 'SC-008', coreName: '缸盖内腔砂芯B', coreType: '冷芯' },
  { partNo: 'BJH52C-2001015', coreCode: 'SC-009', coreName: '缸盖进气道砂芯', coreType: '手工砂芯' },
  { partNo: 'BJH52C-2001015', coreCode: 'SC-010', coreName: '缸盖水道砂芯B', coreType: '冷芯' }
]

// 导入模板表头
const IMPORT_TEMPLATE_HEADERS = ['件号', '砂芯编号', '砂芯名称', '砂芯类型', '单颗砂芯制芯时长（分钟）', '芯盒换型时长（分钟）']

// ---------- 筛选表单 ----------
const searchForm = reactive({
  partNo: '',
  coreName: '',
  coreType: undefined as string | undefined
})

// ---------- 表格 ----------
const loading = ref(false)
const selectedRowKeys = ref<number[]>([])

const columns = [
  { title: '序号', key: 'seq', width: 80 },
  { title: '件号', dataIndex: 'partNo', key: 'partNo', width: 160 },
  { title: '砂芯编号', dataIndex: 'coreCode', key: 'coreCode', width: 160 },
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 180 },
  { title: '砂芯类型', dataIndex: 'coreType', key: 'coreType', width: 130 },
  { title: '单颗砂芯制芯时长（分钟）', dataIndex: 'cycleTimeMin', key: 'cycleTimeMin', width: 220 },
  { title: '芯盒换型时长（分钟）', dataIndex: 'changeoverTimeMin', key: 'changeoverTimeMin', width: 200 }
]

const dataSource = ref<SandCoreTaktRecord[]>([
  { id: 1, partNo: 'BJH46Q-1002010', coreCode: 'SC-001', coreName: '缸盖内腔砂芯A', coreType: '冷芯', cycleTimeMin: 3.5, changeoverTimeMin: 45 },
  { id: 2, partNo: 'BJH46Q-1002010', coreCode: 'SC-002', coreName: '缸盖水道砂芯', coreType: '冷芯', cycleTimeMin: 2.8, changeoverTimeMin: 40 },
  { id: 3, partNo: 'BJH46Q-1002010', coreCode: 'SC-003', coreName: '缸盖气道砂芯', coreType: '热芯', cycleTimeMin: 3.2, changeoverTimeMin: 35 },
  { id: 4, partNo: 'BJH48T-1003012', coreCode: 'SC-005', coreName: '机体顶盖砂芯', coreType: '手工砂芯', cycleTimeMin: 4.0, changeoverTimeMin: 50 },
  { id: 5, partNo: 'BJH48T-1003012', coreCode: 'SC-006', coreName: '机体主油道砂芯', coreType: '热芯', cycleTimeMin: 5.2, changeoverTimeMin: 60 },
  { id: 6, partNo: 'BJH52C-2001015', coreCode: 'SC-008', coreName: '缸盖内腔砂芯B', coreType: '冷芯', cycleTimeMin: 3.8, changeoverTimeMin: 45 },
  { id: 7, partNo: 'BJH52C-2001015', coreCode: 'SC-009', coreName: '缸盖进气道砂芯', coreType: '手工砂芯', cycleTimeMin: 2.6, changeoverTimeMin: 30 }
])

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
  onChange: (keys: Array<string | number>) => { selectedRowKeys.value = keys as number[] }
}))

const filteredData = computed(() => {
  let list = dataSource.value
  if (searchForm.partNo) list = list.filter(i => i.partNo.includes(searchForm.partNo.trim()))
  if (searchForm.coreName) list = list.filter(i => i.coreName.includes(searchForm.coreName.trim()))
  if (searchForm.coreType) list = list.filter(i => i.coreType === searchForm.coreType)
  pagination.total = list.length
  return list
})

// ---------- 操作 ----------
const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.partNo = ''
  searchForm.coreName = ''
  searchForm.coreType = undefined
  pagination.current = 1
}

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current ?? 1
  pagination.pageSize = pag.pageSize ?? pagination.pageSize
}

// ---------- 新增/编辑 ----------
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const formData = reactive<TaktFormData>({
  partNo: undefined,
  coreCode: undefined,
  coreName: '',
  coreType: undefined,
  cycleTimeMin: null,
  changeoverTimeMin: null
})

// 件号选项（独立选择，不与砂芯名称/编号联动）
const partOptions = computed(() => [...new Set(coreMasterData.map(i => i.partNo))])

// 砂芯编号选项（全部砂芯，与件号无关）
const coreCodeOptions = computed(() => coreMasterData.map(i => i.coreCode))

// 砂芯名称检索选项（全部砂芯，与件号无关）
const coreNameOptions = computed(() =>
  coreMasterData.map(i => ({ value: i.coreName }))
)

// 选择/清空砂芯编号：反向带出砂芯名称、类型
const handleCodeChange = (code?: string) => {
  if (!code) {
    formData.coreName = ''
    formData.coreType = undefined
    return
  }
  const entry = coreMasterData.find(i => i.coreCode === code)
  if (entry) {
    formData.coreName = entry.coreName
    formData.coreType = entry.coreType
  }
}

// 检索选择砂芯名称：正向带出砂芯编号、类型
const handleNameSelect = (name: string) => {
  const entry = coreMasterData.find(i => i.coreName === name)
  if (entry) {
    formData.coreCode = entry.coreCode
    formData.coreType = entry.coreType
  }
}

const resetFormData = () => {
  formData.partNo = undefined
  formData.coreCode = undefined
  formData.coreName = ''
  formData.coreType = undefined
  formData.cycleTimeMin = null
  formData.changeoverTimeMin = null
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = 0
  resetFormData()
  modalVisible.value = true
}

const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) return
  const record = dataSource.value.find(i => i.id === selectedRowKeys.value[0])
  if (!record) return
  isEdit.value = true
  editingId.value = record.id
  formData.partNo = record.partNo
  formData.coreCode = record.coreCode
  formData.coreName = record.coreName
  formData.coreType = record.coreType
  formData.cycleTimeMin = record.cycleTimeMin
  formData.changeoverTimeMin = record.changeoverTimeMin
  modalVisible.value = true
}

const handleModalOk = () => {
  const partNo = formData.partNo?.trim()
  const coreCode = formData.coreCode?.trim()
  const coreName = formData.coreName.trim()

  if (!partNo) {
    message.error('请选择件号')
    return
  }
  if (!coreName) {
    message.error('请输入并选择砂芯名称')
    return
  }
  if (!coreCode) {
    message.error('请选择砂芯编号')
    return
  }
  // 砂芯名称与砂芯编号互校：必须为基础数据中同一条砂芯（不校验件号）
  const masterEntry = coreMasterData.find(
    i => i.coreCode === coreCode && i.coreName === coreName
  )
  if (!masterEntry) {
    const codeExists = coreMasterData.some(i => i.coreCode === coreCode)
    const nameExists = coreMasterData.some(i => i.coreName === coreName)
    if (codeExists && nameExists) {
      message.error('砂芯编号与砂芯名称不匹配，请重新选择')
    } else {
      message.error('不存在该砂芯编号/名称，请重新选择')
    }
    return
  }
  const duplicated = dataSource.value.some(
    i => i.coreCode === coreCode && i.id !== editingId.value
  )
  if (duplicated) {
    message.error(`砂芯编号 ${coreCode} 已存在，请勿重复添加`)
    return
  }
  if (!formData.coreType) {
    message.error('请选择砂芯类型')
    return
  }
  if (formData.cycleTimeMin === null || formData.cycleTimeMin <= 0) {
    message.error('请输入有效的单颗砂芯制芯时长（分钟）')
    return
  }
  if (formData.changeoverTimeMin === null || formData.changeoverTimeMin < 0) {
    message.error('请输入有效的芯盒换型时长（分钟）')
    return
  }

  if (isEdit.value) {
    const record = dataSource.value.find(i => i.id === editingId.value)
    if (record) {
      record.partNo = partNo
      record.coreCode = coreCode
      record.coreName = coreName
      record.coreType = formData.coreType
      record.cycleTimeMin = formData.cycleTimeMin
      record.changeoverTimeMin = formData.changeoverTimeMin
    }
    message.success('修改成功')
  } else {
    const newId = dataSource.value.reduce((max, i) => Math.max(max, i.id), 0) + 1
    dataSource.value.push({
      id: newId,
      partNo,
      coreCode,
      coreName,
      coreType: formData.coreType,
      cycleTimeMin: formData.cycleTimeMin,
      changeoverTimeMin: formData.changeoverTimeMin
    })
    message.success('新增成功')
  }
  modalVisible.value = false
}

const handleModalCancel = () => {
  modalVisible.value = false
}

// ---------- 删除 ----------
const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) return
  Modal.confirm({
    title: '删除确认',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 条砂芯生产节拍数据吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      const ids = new Set(selectedRowKeys.value)
      dataSource.value = dataSource.value.filter(i => !ids.has(i.id))
      selectedRowKeys.value = []
      message.success('删除成功')
    }
  })
}

// ---------- 模板下载/导入 ----------
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

const handleDownloadTemplate = () => {
  const worksheet = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_HEADERS])
  worksheet['!cols'] = IMPORT_TEMPLATE_HEADERS.map(title => ({ wch: title.length + 4 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '砂芯生产节拍')
  XLSX.writeFile(workbook, '砂芯生产节拍导入模板.xlsx')
  message.success('模板下载成功')
}

const handleImport = () => {
  fileList.value = []
  importModalVisible.value = true
}

const beforeUpload = (file: any) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    message.error('只能上传Excel文件')
    return false
  }
  fileList.value = [file]
  return false
}

const handleRemoveFile = () => {
  fileList.value = []
}

const handleImportCancel = () => {
  importModalVisible.value = false
  fileList.value = []
}

const handleImportConfirm = () => {
  if (fileList.value.length === 0) {
    message.error('请选择要导入的文件')
    return
  }

  loading.value = true
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target?.result, { type: 'array', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      if (rows.length === 0) {
        message.error('导入文件内容为空')
        return
      }

      const newRecords: SandCoreTaktRecord[] = []
      const errorRows: string[] = []
      const existingCodes = new Set(dataSource.value.map(i => i.coreCode))
      const fileCodes = new Set<string>()
      let nextId = dataSource.value.reduce((max, i) => Math.max(max, i.id), 0) + 1

      rows.forEach((row, index) => {
        const line = index + 2 // 第 1 行为表头
        const partNo = String(row['件号'] ?? '').trim()
        const coreCode = String(row['砂芯编号'] ?? '').trim()
        const coreName = String(row['砂芯名称'] ?? '').trim()
        const coreType = String(row['砂芯类型'] ?? '').trim()
        const cycleTimeMin = Number(row['单颗砂芯制芯时长（分钟）'])
        const changeoverTimeMin = Number(row['芯盒换型时长（分钟）'])

        if (!partNo) {
          errorRows.push(`第${line}行：件号不能为空`)
          return
        }
        if (!coreCode) {
          errorRows.push(`第${line}行：砂芯编号不能为空`)
          return
        }
        if (existingCodes.has(coreCode) || fileCodes.has(coreCode)) {
          errorRows.push(`第${line}行：砂芯编号 ${coreCode} 已存在`)
          return
        }
        if (!coreName) {
          errorRows.push(`第${line}行：砂芯名称不能为空`)
          return
        }
        if (!coreType || !coreTypeOptions.includes(coreType)) {
          errorRows.push(`第${line}行：砂芯类型无效（应为冷芯/热芯/手工砂芯）`)
          return
        }
        if (!cycleTimeMin || cycleTimeMin <= 0 || Number.isNaN(cycleTimeMin)) {
          errorRows.push(`第${line}行：单颗砂芯制芯时长无效`)
          return
        }
        if (Number.isNaN(changeoverTimeMin) || changeoverTimeMin < 0) {
          errorRows.push(`第${line}行：芯盒换型时长无效`)
          return
        }

        fileCodes.add(coreCode)
        newRecords.push({
          id: nextId++,
          partNo,
          coreCode,
          coreName,
          coreType,
          cycleTimeMin,
          changeoverTimeMin
        })
      })

      if (newRecords.length === 0) {
        message.error(`导入失败：${errorRows.slice(0, 3).join('；')}`)
        return
      }

      dataSource.value = [...newRecords, ...dataSource.value]
      importModalVisible.value = false
      fileList.value = []

      if (errorRows.length > 0) {
        message.warning(`已导入 ${newRecords.length} 条，跳过 ${errorRows.length} 条错误数据：${errorRows.slice(0, 3).join('；')}`)
      } else {
        message.success(`导入成功，共导入 ${newRecords.length} 条数据`)
      }
    } catch (error) {
      message.error('文件解析失败，请检查导入模板格式')
    } finally {
      loading.value = false
    }
  }
  reader.readAsArrayBuffer(fileList.value[0])
}
</script>

<style scoped>
.sand-core-takt {
  padding: 16px;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  line-height: 1.6;
  margin-top: 4px;
}
</style>
