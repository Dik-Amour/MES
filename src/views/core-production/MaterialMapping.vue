<template>
  <div class="material-mapping">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="立库砂芯名称">
          <a-input
            v-model:value="searchForm.libCoreName"
            placeholder="请输入立库砂芯名称"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="立库砂芯编号">
          <a-input
            v-model:value="searchForm.libCoreCode"
            placeholder="请输入立库砂芯编号"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="标准物料编码">
          <a-input
            v-model:value="searchForm.materialCode"
            placeholder="请输入标准物料编码"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="砂芯类别">
          <a-select
            v-model:value="searchForm.coreCategory"
            placeholder="请选择类别"
            allow-clear
            style="width: 120px"
          >
            <a-select-option v-for="item in coreCategoryOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            allow-clear
            style="width: 120px"
          >
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">停用</a-select-option>
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

    <a-card :bordered="false" class="action-card">
      <div class="action-bar">
        <a-space :size="8">
          <a-button type="primary" @click="handleAdd">
            <PlusOutlined /> 新增映射
          </a-button>
          <a-button @click="handleExport">
            <ExportOutlined /> 导出
          </a-button>
        </a-space>
        <span class="action-tip">
          立库推送名称优先命中本表；未命中时走制芯任务兜底，仍失败则挂起「待映射」事后回填
        </span>
      </div>
    </a-card>

    <a-card :bordered="false" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">物料映射表</span>
        <span class="toolbar-tip">立库车间叫法 → MES 标准物料</span>
      </div>
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'libMaterial'">
            <div>{{ record.libCoreName }}</div>
            <div class="sub-text">{{ record.libCoreCode }}</div>
          </template>
          <template v-else-if="column.key === 'mesMaterial'">
            <div>{{ record.materialName }}</div>
            <div class="sub-text">{{ record.materialCode }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag v-if="record.status === 'enabled'" color="green">启用</a-tag>
            <a-tag v-else>停用</a-tag>
          </template>
          <template v-else-if="column.key === 'remark'">
            <a-tooltip :title="record.remark">
              <span class="remark-text">{{ record.remark || '—' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button type="link" size="small" @click="handleEdit(record as MaterialMappingRow)">
                <EditOutlined /> 编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 'enabled'"
                @click="handleToggleStatus(record as MaterialMappingRow)"
              >
                {{ record.status === 'enabled' ? '停用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record as MaterialMappingRow)">
                <DeleteOutlined /> 删除
              </a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <span>暂无物料映射数据</span>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑物料映射' : '新增物料映射'"
      :width="720"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="saving"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
        <a-form-item label="立库砂芯名称" required>
          <a-input
            v-model:value="formData.libCoreName"
            placeholder="车间叫法，如 K1大缸芯"
            :maxlength="50"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="立库砂芯编号">
          <a-input
            v-model:value="formData.libCoreCode"
            placeholder="立库系统砂芯编号，可选"
            :maxlength="50"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="标准物料编码" required>
          <a-input
            v-model:value="formData.materialCode"
            placeholder="MES/ERP 标准物料编码"
            :maxlength="50"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="标准物料名称" required>
          <a-input
            v-model:value="formData.materialName"
            placeholder="MES 标准物料名称"
            :maxlength="100"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="砂芯类别" required>
          <a-select
            v-model:value="formData.coreCategory"
            placeholder="请选择砂芯类别"
            style="width: 100%"
          >
            <a-select-option v-for="item in coreCategoryOptions" :key="item" :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="formData.remark"
            placeholder="请输入备注"
            :rows="2"
            :maxlength="200"
          />
        </a-form-item>
      </a-form>
      <div class="modal-tip">
        保存后，立库入库推送命中本映射时将直接使用标准物料，不再依赖当前制芯任务兜底。
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'
import { materialMappingRows, type MaterialMappingRow } from './mappingData'

type MappingStatus = 'enabled' | 'disabled'

const coreCategoryOptions = ['底芯', '盖芯', '底盘芯组', '机体芯', '其他']

const rows = ref<MaterialMappingRow[]>(materialMappingRows.map(item => ({ ...item })))

const searchForm = reactive({
  libCoreName: '',
  libCoreCode: '',
  materialCode: '',
  coreCategory: undefined as string | undefined,
  status: undefined as MappingStatus | undefined
})

const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const filteredData = computed(() => {
  let list = rows.value
  const libCoreName = searchForm.libCoreName.trim()
  const libCoreCode = searchForm.libCoreCode.trim().toLowerCase()
  const materialCode = searchForm.materialCode.trim().toLowerCase()
  if (libCoreName) list = list.filter(item => item.libCoreName.includes(libCoreName))
  if (libCoreCode) list = list.filter(item => item.libCoreCode.toLowerCase().includes(libCoreCode))
  if (materialCode) list = list.filter(item => item.materialCode.toLowerCase().includes(materialCode))
  if (searchForm.coreCategory) list = list.filter(item => item.coreCategory === searchForm.coreCategory)
  if (searchForm.status) list = list.filter(item => item.status === searchForm.status)
  pagination.total = list.length
  return list
})

const columns = [
  { title: '序号', key: 'index', width: 60, align: 'center' as const },
  { title: '立库物料（名称/编号）', key: 'libMaterial', width: 220 },
  { title: '标准物料（名称/编码）', key: 'mesMaterial', width: 260 },
  { title: '砂芯类别', dataIndex: 'coreCategory', key: 'coreCategory', width: 100, align: 'center' as const },
  { title: '状态', key: 'status', width: 80, align: 'center' as const },
  { title: '备注', key: 'remark', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160, align: 'center' as const },
  { title: '更新人', dataIndex: 'updater', key: 'updater', width: 100, align: 'center' as const },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const }
]

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.libCoreName = ''
  searchForm.libCoreCode = ''
  searchForm.materialCode = ''
  searchForm.coreCategory = undefined
  searchForm.status = undefined
  pagination.current = 1
}

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current ?? 1
  pagination.pageSize = pag.pageSize ?? pagination.pageSize
}

const handleExport = () => {
  const list = filteredData.value
  if (!list.length) {
    message.warning('当前筛选结果无数据可导出')
    return
  }
  const header = ['立库砂芯名称', '立库砂芯编号', '标准物料编码', '标准物料名称', '砂芯类别', '状态', '备注', '更新时间', '更新人']
  const exportRows = list.map(item => [
    item.libCoreName,
    item.libCoreCode,
    item.materialCode,
    item.materialName,
    item.coreCategory,
    item.status === 'enabled' ? '启用' : '停用',
    item.remark,
    item.updateTime,
    item.updater
  ])
  const ws = XLSX.utils.aoa_to_sheet([header, ...exportRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '物料映射')
  XLSX.writeFile(wb, `物料映射_${dayjs().format('YYYYMMDDHHmm')}.xlsx`)
  message.success(`导出成功，共 ${list.length} 条`)
}

const handleToggleStatus = (record: MaterialMappingRow) => {
  const next = record.status === 'enabled' ? 'disabled' : 'enabled'
  Modal.confirm({
    title: next === 'disabled' ? '确认停用' : '确认启用',
    content:
      next === 'disabled'
        ? `确定停用映射「${record.libCoreName}」吗？停用后立库推送将不再命中该标准物料。`
        : `确定启用映射「${record.libCoreName}」吗？`,
    onOk() {
      record.status = next
      record.updateTime = dayjs().format('YYYY-MM-DD HH:mm')
      record.updater = 'admin'
      message.success(next === 'disabled' ? '已停用' : '已启用')
    }
  })
}

const handleDelete = (record: MaterialMappingRow) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除映射「${record.libCoreName} → ${record.materialName}」吗？删除后立库推送将无法命中该标准物料。`,
    okButtonProps: { danger: true },
    onOk() {
      rows.value = rows.value.filter(item => item.id !== record.id)
      message.success('删除成功')
    }
  })
}

const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const saving = ref(false)

const formData = reactive({
  libCoreName: '',
  libCoreCode: '',
  materialCode: '',
  materialName: '',
  coreCategory: '' as string,
  remark: ''
})

const resetForm = () => {
  formData.libCoreName = ''
  formData.libCoreCode = ''
  formData.materialCode = ''
  formData.materialName = ''
  formData.coreCategory = ''
  formData.remark = ''
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = 0
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: MaterialMappingRow) => {
  isEdit.value = true
  editingId.value = record.id
  formData.libCoreName = record.libCoreName
  formData.libCoreCode = record.libCoreCode
  formData.materialCode = record.materialCode
  formData.materialName = record.materialName
  formData.coreCategory = record.coreCategory
  formData.remark = record.remark
  modalVisible.value = true
}

const handleModalCancel = () => {
  modalVisible.value = false
}

const handleModalOk = () => {
  const libCoreName = formData.libCoreName.trim()
  const materialCode = formData.materialCode.trim()
  const materialName = formData.materialName.trim()
  if (!libCoreName) {
    message.warning('请输入立库砂芯名称')
    return
  }
  if (!materialCode) {
    message.warning('请输入标准物料编码')
    return
  }
  if (!materialName) {
    message.warning('请输入标准物料名称')
    return
  }
  if (!formData.coreCategory) {
    message.warning('请选择砂芯类别')
    return
  }

  const duplicate = rows.value.find(
    item =>
      item.id !== editingId.value &&
      item.libCoreName.trim() === libCoreName &&
      (formData.libCoreCode.trim() ? item.libCoreCode.trim() === formData.libCoreCode.trim() : true)
  )
  if (duplicate) {
    message.warning(`立库砂芯「${libCoreName}」已存在映射，请勿重复维护`)
    return
  }

  saving.value = true
  setTimeout(() => {
    const payload = {
      libCoreName,
      libCoreCode: formData.libCoreCode.trim(),
      materialCode,
      materialName,
      coreCategory: formData.coreCategory,
      remark: formData.remark.trim(),
      updateTime: dayjs().format('YYYY-MM-DD HH:mm'),
      updater: 'admin'
    }
    if (isEdit.value) {
      const idx = rows.value.findIndex(item => item.id === editingId.value)
      if (idx !== -1) {
        rows.value[idx] = { ...rows.value[idx], ...payload }
      }
      message.success('保存成功')
    } else {
      rows.value.unshift({
        id: Date.now(),
        status: 'enabled',
        ...payload
      })
      message.success('新增成功')
      pagination.current = 1
    }
    saving.value = false
    modalVisible.value = false
  }, 400)
}
</script>

<style scoped>
.material-mapping {
  padding: 16px;
}

.filter-card,
.action-card,
.table-card {
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.action-tip {
  color: #888;
  font-size: 12px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.toolbar-tip {
  color: #888;
  font-size: 12px;
}

.sub-text {
  color: #888;
  font-size: 12px;
  margin-top: 2px;
}

.remark-text {
  display: inline-block;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
}

.modal-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  color: #389e0d;
  font-size: 12px;
  line-height: 1.6;
}
</style>
