<template>
  <div class="port-device-mapping">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="上料口编号">
          <a-input
            v-model:value="searchForm.portCode"
            placeholder="如 SL-01"
            allow-clear
            style="width: 140px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="上料口名称">
          <a-input
            v-model:value="searchForm.portName"
            placeholder="请输入上料口名称"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="制芯设备编号">
          <a-input
            v-model:value="searchForm.deviceCode"
            placeholder="如 CORE-M-01"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="制芯设备名称">
          <a-input
            v-model:value="searchForm.deviceName"
            placeholder="请输入设备名称"
            allow-clear
            style="width: 160px"
            @press-enter="handleSearch"
          />
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
          立库入库推送的上料口经本字典反查制芯设备，再向数采抓取该设备对应时段工艺参数
        </span>
      </div>
    </a-card>

    <a-card :bordered="false" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">上料口-设备字典</span>
        <span class="toolbar-tip">同一上料口仅允许绑定 1 台制芯设备</span>
      </div>
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'port'">
            <div>{{ record.portName }}</div>
            <div class="sub-text">{{ record.portCode }}</div>
          </template>
          <template v-else-if="column.key === 'device'">
            <div>{{ record.deviceName }}</div>
            <div class="sub-text">{{ record.deviceCode }}</div>
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
              <a-button type="link" size="small" @click="handleEdit(record as PortDeviceMappingRow)">
                <EditOutlined /> 编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 'enabled'"
                @click="handleToggleStatus(record as PortDeviceMappingRow)"
              >
                {{ record.status === 'enabled' ? '停用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record as PortDeviceMappingRow)">
                <DeleteOutlined /> 删除
              </a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <span>暂无上料口设备映射数据</span>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑上料口设备映射' : '新增上料口设备映射'"
      :width="680"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="saving"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
        <a-form-item label="上料口编号" required>
          <a-input
            v-model:value="formData.portCode"
            placeholder="如 SL-01"
            :maxlength="30"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="上料口名称" required>
          <a-input
            v-model:value="formData.portName"
            placeholder="如 1号上料口"
            :maxlength="50"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="制芯设备编号" required>
          <a-input
            v-model:value="formData.deviceCode"
            placeholder="如 CORE-M-01"
            :maxlength="30"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="制芯设备名称" required>
          <a-input
            v-model:value="formData.deviceName"
            placeholder="如 1号制芯机"
            :maxlength="50"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="所属产线">
          <a-input
            v-model:value="formData.lineName"
            placeholder="如 机体线"
            :maxlength="50"
            allow-clear
          />
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
        方案约定 4 个上料口各对应 1 台制芯机。保存时将校验上料口唯一绑定，避免设备反查歧义。
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
import { portDeviceMappingRows, type PortDeviceMappingRow } from './mappingData'

type MappingStatus = 'enabled' | 'disabled'

const rows = ref<PortDeviceMappingRow[]>(portDeviceMappingRows.map(item => ({ ...item })))

const searchForm = reactive({
  portCode: '',
  portName: '',
  deviceCode: '',
  deviceName: '',
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
  const portCode = searchForm.portCode.trim().toLowerCase()
  const portName = searchForm.portName.trim()
  const deviceCode = searchForm.deviceCode.trim().toLowerCase()
  const deviceName = searchForm.deviceName.trim()
  if (portCode) list = list.filter(item => item.portCode.toLowerCase().includes(portCode))
  if (portName) list = list.filter(item => item.portName.includes(portName))
  if (deviceCode) list = list.filter(item => item.deviceCode.toLowerCase().includes(deviceCode))
  if (deviceName) list = list.filter(item => item.deviceName.includes(deviceName))
  if (searchForm.status) list = list.filter(item => item.status === searchForm.status)
  pagination.total = list.length
  return list
})

const columns = [
  { title: '序号', key: 'index', width: 60, align: 'center' as const },
  { title: '上料口（名称/编号）', key: 'port', width: 200 },
  { title: '制芯设备（名称/编号）', key: 'device', width: 200 },
  { title: '所属产线', dataIndex: 'lineName', key: 'lineName', width: 120, align: 'center' as const },
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
  searchForm.portCode = ''
  searchForm.portName = ''
  searchForm.deviceCode = ''
  searchForm.deviceName = ''
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
  const header = ['上料口编号', '上料口名称', '制芯设备编号', '制芯设备名称', '所属产线', '状态', '备注', '更新时间', '更新人']
  const exportRows = list.map(item => [
    item.portCode,
    item.portName,
    item.deviceCode,
    item.deviceName,
    item.lineName,
    item.status === 'enabled' ? '启用' : '停用',
    item.remark,
    item.updateTime,
    item.updater
  ])
  const ws = XLSX.utils.aoa_to_sheet([header, ...exportRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '上料口设备映射')
  XLSX.writeFile(wb, `上料口设备映射_${dayjs().format('YYYYMMDDHHmm')}.xlsx`)
  message.success(`导出成功，共 ${list.length} 条`)
}

const handleToggleStatus = (record: PortDeviceMappingRow) => {
  const next = record.status === 'enabled' ? 'disabled' : 'enabled'
  Modal.confirm({
    title: next === 'disabled' ? '确认停用' : '确认启用',
    content:
      next === 'disabled'
        ? `确定停用映射「${record.portCode} → ${record.deviceCode}」吗？停用后该上料口无法反查制芯设备。`
        : `确定启用映射「${record.portCode} → ${record.deviceCode}」吗？`,
    onOk() {
      record.status = next
      record.updateTime = dayjs().format('YYYY-MM-DD HH:mm')
      record.updater = 'admin'
      message.success(next === 'disabled' ? '已停用' : '已启用')
    }
  })
}

const handleDelete = (record: PortDeviceMappingRow) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除映射「${record.portCode} → ${record.deviceCode}」吗？删除后该上料口推送将无法反查设备与工艺参数。`,
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
  portCode: '',
  portName: '',
  deviceCode: '',
  deviceName: '',
  lineName: '',
  remark: ''
})

const resetForm = () => {
  formData.portCode = ''
  formData.portName = ''
  formData.deviceCode = ''
  formData.deviceName = ''
  formData.lineName = '机体线'
  formData.remark = ''
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = 0
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: PortDeviceMappingRow) => {
  isEdit.value = true
  editingId.value = record.id
  formData.portCode = record.portCode
  formData.portName = record.portName
  formData.deviceCode = record.deviceCode
  formData.deviceName = record.deviceName
  formData.lineName = record.lineName
  formData.remark = record.remark
  modalVisible.value = true
}

const handleModalCancel = () => {
  modalVisible.value = false
}

const handleModalOk = () => {
  const portCode = formData.portCode.trim()
  const portName = formData.portName.trim()
  const deviceCode = formData.deviceCode.trim()
  const deviceName = formData.deviceName.trim()
  if (!portCode) {
    message.warning('请输入上料口编号')
    return
  }
  if (!portName) {
    message.warning('请输入上料口名称')
    return
  }
  if (!deviceCode) {
    message.warning('请输入制芯设备编号')
    return
  }
  if (!deviceName) {
    message.warning('请输入制芯设备名称')
    return
  }

  const duplicatePort = rows.value.find(
    item => item.id !== editingId.value && item.portCode.trim().toLowerCase() === portCode.toLowerCase()
  )
  if (duplicatePort) {
    message.warning(`上料口「${portCode}」已绑定设备「${duplicatePort.deviceCode}」，同一上料口仅允许 1 台制芯设备`)
    return
  }

  saving.value = true
  setTimeout(() => {
    const payload = {
      portCode,
      portName,
      deviceCode,
      deviceName,
      lineName: formData.lineName.trim() || '机体线',
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
.port-device-mapping {
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
