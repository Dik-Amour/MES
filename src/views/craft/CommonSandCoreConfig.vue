<template>
  <div class="common-sand-core-config">
    <!-- 顶部查询栏 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="共用组名称">
          <a-input
            v-model:value="searchForm.groupName"
            placeholder="请输入共用组名称"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="砂芯物料编码">
          <a-input
            v-model:value="searchForm.coreCode"
            placeholder="请输入砂芯物料编码"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            allow-clear
            style="width: 140px"
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

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8">
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined /> 新增共用组
        </a-button>
        <a-button @click="handleExport">
          <ExportOutlined /> 导出
        </a-button>
      </a-space>
    </a-card>

    <!-- 主表格：共用组列表 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1100 }"
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'coreCodes'">
            <a-tooltip placement="topLeft">
              <template #title>
                <div v-for="code in (record as SandCoreGroup).coreCodes" :key="code">{{ code }}</div>
              </template>
              <span class="core-codes">{{ (record as SandCoreGroup).coreCodes.join('，') }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'count'">
            {{ (record as SandCoreGroup).coreCodes.length }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag v-if="record.status === 'enabled'" color="green">启用</a-tag>
            <a-tag v-else>停用</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button type="link" size="small" @click="handleEdit(record as SandCoreGroup)">
                <EditOutlined /> 编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status === 'enabled'"
                @click="handleToggleStatus(record as SandCoreGroup)"
              >
                {{ record.status === 'enabled' ? '停用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record as SandCoreGroup)">
                <DeleteOutlined /> 删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑共用组弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑共用组' : '新增共用组'"
      :width="900"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="saving"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="共用组名称" required>
          <a-input
            v-model:value="formData.name"
            placeholder="请输入共用组名称"
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

      <a-divider orientation="left" style="margin: 12px 0">砂芯物料多选（组内砂芯互相等效共用）</a-divider>

      <div class="core-search">
        <a-input
          v-model:value="coreSearch.code"
          placeholder="搜索砂芯物料编码"
          allow-clear
          style="width: 200px"
        />
        <a-input
          v-model:value="coreSearch.name"
          placeholder="搜索砂芯名称"
          allow-clear
          style="width: 180px"
        />
        <a-input
          v-model:value="coreSearch.productNo"
          placeholder="搜索产品件号"
          allow-clear
          style="width: 180px"
        />
        <span class="core-tip">同一砂芯物料只能归属一个共用组，已归属的置灰不可勾选</span>
      </div>

      <div v-if="selectedCoreCodes.length" class="selected-bar">
        <span class="selected-count">已选 {{ selectedCoreCodes.length }} 个砂芯</span>
        <a-tag
          v-for="code in selectedCoreCodes"
          :key="code"
          closable
          @close="handleRemoveSelected(code)"
        >
          {{ code }}
        </a-tag>
      </div>

      <a-table
        :columns="coreColumns"
        :data-source="modalMaterials"
        :row-selection="modalRowSelection"
        :pagination="false"
        :scroll="{ y: 280 }"
        row-key="code"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'owner'">
            <span v-if="ownerOf((record as SandCoreMaterial).code) === editingId" class="owner-self">本组</span>
            <span v-else-if="ownerOf((record as SandCoreMaterial).code)">
              {{ groupNameById(ownerOf((record as SandCoreMaterial).code)!) }}
            </span>
            <span v-else class="owner-none">未归属</span>
          </template>
        </template>
        <template #emptyText>
          <span>暂无可选砂芯物料</span>
        </template>
      </a-table>
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

// ---------- 类型定义 ----------
interface SandCoreMaterial {
  code: string
  name: string
  productNo: string
}

interface SandCoreGroup {
  id: number
  code: string
  name: string
  remark: string
  coreCodes: string[]
  status: 'enabled' | 'disabled'
  createTime: string
  creator: string
}

type GroupStatus = 'enabled' | 'disabled'

// ---------- 砂芯物料主数据（mock） ----------
const coreMaterials: SandCoreMaterial[] = [
  { code: 'SX2601001', name: '机体水套砂芯A', productNo: '615A010101' },
  { code: 'SX2601002', name: '机体水套砂芯B', productNo: '615A010101' },
  { code: 'SX2601003', name: '机体油道砂芯A', productNo: '615A010201' },
  { code: 'SX2601004', name: '机体油道砂芯B', productNo: '615A010201' },
  { code: 'SX2601005', name: '机体缸孔砂芯', productNo: '615A010301' },
  { code: 'SX2601006', name: '机体冒口砂芯', productNo: '615A010401' },
  { code: 'SX2602001', name: '曲轴油道砂芯A', productNo: '618A020101' },
  { code: 'SX2602002', name: '曲轴油道砂芯B', productNo: '618A020101' },
  { code: 'SX2602003', name: '曲轴平衡块砂芯', productNo: '618A020201' },
  { code: 'SX2602004', name: '曲轴斜油孔砂芯', productNo: '618A020301' },
  { code: 'SX2603001', name: '缸盖导管砂芯A', productNo: '620A030101' },
  { code: 'SX2603002', name: '缸盖导管砂芯B', productNo: '620A030101' },
  { code: 'SX2603003', name: '缸盖水道砂芯A', productNo: '620A030201' },
  { code: 'SX2603004', name: '缸盖水道砂芯B', productNo: '620A030201' },
  { code: 'SX2603005', name: '缸盖排气道砂芯', productNo: '620A030301' },
  { code: 'SX2604001', name: '进气歧管砂芯A', productNo: '630A040101' },
  { code: 'SX2604002', name: '进气歧管砂芯B', productNo: '630A040101' },
  { code: 'SX2604003', name: '排气歧管砂芯', productNo: '630A040201' },
  { code: 'SX2605001', name: '涡壳砂芯', productNo: '640A050101' },
  { code: 'SX2605002', name: '泵体流道砂芯', productNo: '640A050201' },
  { code: 'SX2605003', name: '泵体隔板砂芯', productNo: '640A050201' },
  { code: 'SX2606001', name: '飞轮壳砂芯', productNo: '650A060101' },
  { code: 'SX2606002', name: '变速箱壳砂芯', productNo: '650A060201' },
  { code: 'SX2606003', name: '后端盖砂芯', productNo: '650A060301' }
]

// ---------- 共用组 mock 数据 ----------
const groups = ref<SandCoreGroup[]>([
  {
    id: 1,
    code: 'GY2026001',
    name: '机体水套通用组',
    remark: '机体水套 A/B 芯互相等效共用',
    coreCodes: ['SX2601001', 'SX2601002', 'SX2601006'],
    status: 'enabled',
    createTime: '2026-11-01 09:20',
    creator: 'admin'
  },
  {
    id: 2,
    code: 'GY2026002',
    name: '机体油道通用组',
    remark: '',
    coreCodes: ['SX2601003', 'SX2601004', 'SX2601005'],
    status: 'enabled',
    createTime: '2026-11-03 14:05',
    creator: 'admin'
  },
  {
    id: 3,
    code: 'GY2026003',
    name: '曲轴油道通用组',
    remark: '曲轴线体共用',
    coreCodes: ['SX2602001', 'SX2602002', 'SX2602003', 'SX2602004'],
    status: 'enabled',
    createTime: '2026-11-05 10:32',
    creator: 'admin'
  },
  {
    id: 4,
    code: 'GY2026004',
    name: '缸盖水道通用组',
    remark: '临时停用，待工艺验证',
    coreCodes: ['SX2603001', 'SX2603002', 'SX2603003', 'SX2603004', 'SX2603005'],
    status: 'disabled',
    createTime: '2026-11-08 16:40',
    creator: 'admin'
  },
  {
    id: 5,
    code: 'GY2026005',
    name: '泵壳类通用组',
    remark: '',
    coreCodes: ['SX2605001', 'SX2605002', 'SX2605003', 'SX2606001', 'SX2606002', 'SX2606003'],
    status: 'enabled',
    createTime: '2026-11-12 08:15',
    creator: 'admin'
  }
])

// 砂芯编码 → 归属共用组 id
const ownerMap = computed(() => {
  const map = new Map<string, number>()
  groups.value.forEach(g => g.coreCodes.forEach(c => map.set(c, g.id)))
  return map
})

const ownerOf = (code: string): number | undefined => ownerMap.value.get(code)

const groupNameById = (id: number) => groups.value.find(g => g.id === id)?.name ?? ''

// ---------- 顶部查询 ----------
const searchForm = reactive({
  groupName: '',
  coreCode: '',
  status: undefined as GroupStatus | undefined
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
  let list = groups.value
  const groupName = searchForm.groupName.trim()
  const coreCode = searchForm.coreCode.trim().toLowerCase()
  if (groupName) list = list.filter(g => g.name.includes(groupName))
  if (coreCode) list = list.filter(g => g.coreCodes.some(c => c.toLowerCase().includes(coreCode)))
  if (searchForm.status) list = list.filter(g => g.status === searchForm.status)
  pagination.total = list.length
  return list
})

const columns = [
  { title: '共用组编号', dataIndex: 'code', key: 'code', width: 130 },
  { title: '共用组名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '组内砂芯编码', key: 'coreCodes', width: 300 },
  { title: '砂芯数量', key: 'count', width: 90 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 165 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const }
]

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.groupName = ''
  searchForm.coreCode = ''
  searchForm.status = undefined
  pagination.current = 1
}

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current ?? 1
  pagination.pageSize = pag.pageSize ?? pagination.pageSize
}

// ---------- 导出 ----------
const handleExport = () => {
  const list = filteredData.value
  if (!list.length) {
    message.warning('当前筛选结果无数据可导出')
    return
  }
  const header = ['共用组编号', '共用组名称', '组内砂芯编码', '砂芯数量', '状态', '创建时间']
  const rows = list.map(g => [
    g.code,
    g.name,
    g.coreCodes.join(','),
    g.coreCodes.length,
    g.status === 'enabled' ? '启用' : '停用',
    g.createTime
  ])
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '通用砂芯配置')
  XLSX.writeFile(wb, `通用砂芯配置_${dayjs().format('YYYYMMDDHHmm')}.xlsx`)
  message.success(`导出成功，共 ${list.length} 条`)
}

// ---------- 行操作：编辑 / 启用停用 / 删除 ----------
const handleToggleStatus = (record: SandCoreGroup) => {
  const next = record.status === 'enabled' ? 'disabled' : 'enabled'
  Modal.confirm({
    title: next === 'disabled' ? '确认停用' : '确认启用',
    content:
      next === 'disabled'
        ? `确定停用共用组「${record.name}」吗？停用后该组不再参与等效共用。`
        : `确定启用共用组「${record.name}」吗？`,
    onOk() {
      record.status = next
      message.success(next === 'disabled' ? '已停用' : '已启用')
    }
  })
}

const handleDelete = (record: SandCoreGroup) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除共用组「${record.name}」吗？组内 ${record.coreCodes.length} 个砂芯物料将释放为未归属状态，可重新加入其他共用组。`,
    okButtonProps: { danger: true },
    onOk() {
      groups.value = groups.value.filter(g => g.id !== record.id)
      message.success('删除成功')
    }
  })
}

// ---------- 新增/编辑弹窗 ----------
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const saving = ref(false)

const formData = reactive({ name: '', remark: '' })
const selectedCoreCodes = ref<string[]>([])
const coreSearch = reactive({ code: '', name: '', productNo: '' })

const nextGroupCode = () => {
  const nums = groups.value
    .map(g => parseInt(g.code.replace(/\D/g, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `GY${String(next).padStart(7, '0')}`
}

const modalMaterials = computed(() => {
  const codeKw = coreSearch.code.trim().toLowerCase()
  const nameKw = coreSearch.name.trim().toLowerCase()
  const productKw = coreSearch.productNo.trim().toLowerCase()
  return coreMaterials.filter(
    m =>
      (!codeKw || m.code.toLowerCase().includes(codeKw)) &&
      (!nameKw || m.name.toLowerCase().includes(nameKw)) &&
      (!productKw || m.productNo.toLowerCase().includes(productKw))
  )
})

const modalRowSelection = computed(() => ({
  selectedRowKeys: selectedCoreCodes.value,
  onChange: (keys: Array<string | number>) => {
    // 搜索过滤后，保留未在当前可见列表中的已选项，避免被过滤条件误清除
    const visible = new Set(modalMaterials.value.map(m => m.code))
    const hidden = selectedCoreCodes.value.filter(c => !visible.has(c))
    selectedCoreCodes.value = [...hidden, ...(keys as string[])]
  },
  getCheckboxProps: (record: SandCoreMaterial) => {
    const owner = ownerOf(record.code)
    // 已归属其他共用组的砂芯置灰不可勾选；归属本组的可取消勾选
    return { disabled: owner !== undefined && owner !== editingId.value }
  }
}))

const handleRemoveSelected = (code: string) => {
  selectedCoreCodes.value = selectedCoreCodes.value.filter(c => c !== code)
}

const coreColumns = [
  { title: '砂芯物料编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '砂芯名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '产品件号', dataIndex: 'productNo', key: 'productNo', width: 150 },
  { title: '归属共用组', key: 'owner', width: 180 }
]

const handleAdd = () => {
  isEdit.value = false
  editingId.value = 0
  formData.name = ''
  formData.remark = ''
  selectedCoreCodes.value = []
  coreSearch.code = ''
  coreSearch.name = ''
  coreSearch.productNo = ''
  modalVisible.value = true
}

const handleEdit = (record: SandCoreGroup) => {
  isEdit.value = true
  editingId.value = record.id
  formData.name = record.name
  formData.remark = record.remark
  selectedCoreCodes.value = [...record.coreCodes]
  coreSearch.code = ''
  coreSearch.name = ''
  coreSearch.productNo = ''
  modalVisible.value = true
}

const handleModalCancel = () => {
  modalVisible.value = false
}

const handleModalOk = () => {
  const name = formData.name.trim()
  if (!name) {
    message.warning('请输入共用组名称')
    return
  }
  if (!selectedCoreCodes.value.length) {
    message.warning('请至少勾选一个砂芯物料')
    return
  }
  // 模拟后端保存校验：同一砂芯物料只能归属一个共用组，防重复提交
  saving.value = true
  setTimeout(() => {
    const conflicts = selectedCoreCodes.value.filter(code => {
      const owner = ownerOf(code)
      return owner !== undefined && owner !== editingId.value
    })
    if (conflicts.length) {
      saving.value = false
      message.error(`保存失败：砂芯 ${conflicts.join('、')} 已归属其他共用组，请刷新后重试`)
      return
    }
    const coreCodes = [...selectedCoreCodes.value]
    if (isEdit.value) {
      const idx = groups.value.findIndex(g => g.id === editingId.value)
      if (idx !== -1) {
        groups.value[idx] = {
          ...groups.value[idx],
          name,
          remark: formData.remark.trim(),
          coreCodes
        }
      }
      message.success('保存成功')
    } else {
      groups.value.unshift({
        id: Date.now(),
        code: nextGroupCode(),
        name,
        remark: formData.remark.trim(),
        coreCodes,
        status: 'enabled',
        createTime: dayjs().format('YYYY-MM-DD HH:mm'),
        creator: 'admin'
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
.common-sand-core-config {
  padding: 16px;
}

.filter-card {
  margin-bottom: 16px;
}

.action-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.core-codes {
  display: inline-block;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  cursor: default;
}

.core-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.core-tip {
  font-size: 12px;
  color: #999;
}

.selected-bar {
  max-height: 72px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 6px 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.selected-count {
  font-size: 12px;
  color: #666;
  margin-right: 4px;
  flex-shrink: 0;
}

.owner-self {
  color: #1890ff;
}

.owner-none {
  color: #999;
}
</style>
