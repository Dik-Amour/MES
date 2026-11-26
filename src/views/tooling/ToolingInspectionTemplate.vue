<template>
  <div class="tooling-inspection-template">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="模板编码">
          <a-input
            v-model:value="searchForm.templateCode"
            placeholder="请输入模板编码"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="模板名称">
          <a-input
            v-model:value="searchForm.templateName"
            placeholder="请输入模板名称"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="工装类型">
          <a-select
            v-model:value="searchForm.toolingType"
            placeholder="请选择工装类型"
            allow-clear
            style="width: 160px"
          >
            <a-select-option v-for="t in toolingTypeOptions" :key="t" :value="t">
              {{ t }}
            </a-select-option>
          </a-select>
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

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8">
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined /> 新增模板
        </a-button>
        <a-button :disabled="selectedRowKeys.length === 0" @click="handleEdit">
          <EditOutlined /> 修改
        </a-button>
        <a-popconfirm
          title="确定删除选中的模板吗？"
          @confirm="handleDelete"
        >
          <a-button danger :disabled="selectedRowKeys.length === 0">
            <DeleteOutlined /> 删除
          </a-button>
        </a-popconfirm>
      </a-space>
    </a-card>

    <!-- 数据表格卡片 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1100 }"
        :row-selection="{
          selectedRowKeys: selectedRowKeys,
          onChange: onSelectChange
        }"
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'toolingInfo'">
            <a-button type="link" size="small" @click="handleRelateTooling(record)">
              关联工装
            </a-button>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="8">
              <a-button type="link" size="small" @click="handleView(record)">
                查看
              </a-button>
              <a-button type="link" size="small" @click="handleEditRecord(record)">
                编辑
              </a-button>
              <a-button type="link" size="small" @click="handleConfigItems(record)">
                点检项
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗（框架占位） -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="handleSave"
      @cancel="modalVisible = false"
      width="640px"
    >
      <a-form
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="模板编码" required>
          <a-input
            v-model:value="formData.templateCode"
            placeholder="请输入模板编码"
            :disabled="!!formData.id"
          />
        </a-form-item>
        <a-form-item label="模板名称" required>
          <a-input v-model:value="formData.templateName" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="工装类型" required>
          <a-select v-model:value="formData.toolingType" placeholder="请选择工装类型">
            <a-select-option v-for="t in toolingTypeOptions" :key="t" :value="t">
              {{ t }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="适用产线">
          <a-input v-model:value="formData.productionLine" placeholder="请输入适用产线" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="formData.remark"
            placeholder="请输入备注"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch
            v-model:checked="formData.statusChecked"
            checked-children="启用"
            un-checked-children="停用"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 点检项配置弹窗 -->
    <a-modal
      v-model:open="itemsModalVisible"
      :title="`点检项配置 - ${itemsTemplate?.templateName || ''}`"
      :footer="null"
      width="960px"
      @cancel="handleItemsModalClose"
    >
      <div class="items-modal-body">
        <div class="items-modal-meta">
          <a-descriptions :column="4" size="small" bordered>
            <a-descriptions-item label="模板编码">
              {{ itemsTemplate?.templateCode }}
            </a-descriptions-item>
            <a-descriptions-item label="模板名称">
              {{ itemsTemplate?.templateName }}
            </a-descriptions-item>
            <a-descriptions-item label="工装类型">
              {{ itemsTemplate?.toolingType }}
            </a-descriptions-item>
            <a-descriptions-item label="关联工装" :span="2">
              {{ itemsTemplate?.relatedTooling || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <div class="items-modal-toolbar">
          <a-button type="primary" @click="handleAddItem">
            <PlusOutlined /> 新增点检项
          </a-button>
          <span class="items-count">共 {{ editingItems.length }} 项</span>
        </div>

        <a-table
          :columns="itemColumns"
          :data-source="editingItems"
          :pagination="false"
          :scroll="{ x: 820, y: 320 }"
          row-key="itemId"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'seq'">
              {{ editingItems.findIndex(i => i.itemId === (record as InspectionItem).itemId) + 1 }}
            </template>
            <template v-else-if="column.key === 'checkMethod'">
              {{ (record as InspectionItem).checkMethod }}
            </template>
            <template v-else-if="column.key === 'isKey'">
              <a-tag :color="(record as InspectionItem).isKey ? 'red' : 'default'">
                {{ (record as InspectionItem).isKey ? '关键项' : '一般项' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space :size="4">
                <a-button type="link" size="small" @click="handleEditItem(record)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定删除该点检项吗？"
                  @confirm="handleDeleteItem(record)"
                >
                  <a-button type="link" size="small" danger>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>

        <div class="items-modal-footer">
          <a-space :size="8">
            <a-button type="primary" :loading="itemsSaving" @click="handleSaveItems">
              保存
            </a-button>
            <a-button @click="handleItemsModalClose">取消</a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 新增/编辑点检项弹窗 -->
    <a-modal
      v-model:open="itemFormVisible"
      :title="itemFormData.itemId ? '编辑点检项' : '新增点检项'"
      :confirm-loading="itemFormSaving"
      @ok="handleSaveItemForm"
      @cancel="itemFormVisible = false"
      width="560px"
    >
      <a-form
        :model="itemFormData"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="点检项名称" required>
          <a-input
            v-model:value="itemFormData.itemName"
            placeholder="如：定位销磨损、夹紧力、外观裂纹"
            :maxlength="50"
          />
        </a-form-item>
        <a-form-item label="点检方法" required>
          <a-select v-model:value="itemFormData.checkMethod" placeholder="请选择点检方法">
            <a-select-option v-for="m in checkMethodOptions" :key="m" :value="m">
              {{ m }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="判定标准" required>
          <a-textarea
            v-model:value="itemFormData.checkStandard"
            placeholder="请输入合格判定标准，如：磨损量 ≤ 0.5mm"
            :rows="3"
            :maxlength="200"
          />
        </a-form-item>
        <a-form-item label="是否关键项">
          <a-switch
            v-model:checked="itemFormData.isKey"
            checked-children="是"
            un-checked-children="否"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-input
            v-model:value="itemFormData.remark"
            placeholder="选填"
            :maxlength="100"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 关联工装弹窗 -->
    <a-modal
      v-model:open="relateModalVisible"
      :title="`关联工装 - ${relateTemplate?.templateName || ''}`"
      :footer="null"
      width="900px"
      @cancel="handleRelateModalClose"
    >
      <div class="relate-modal-body">
        <!-- 搜索栏 -->
        <a-form layout="inline" :model="relateSearchForm" class="relate-search">
          <a-form-item label="工装型号">
            <a-input
              v-model:value="relateSearchForm.toolingModel"
              placeholder="请输入工装型号"
              allow-clear
              style="width: 200px"
              @press-enter="handleRelateSearch"
            />
          </a-form-item>
          <a-form-item label="工装名称">
            <a-input
              v-model:value="relateSearchForm.toolingName"
              placeholder="请输入工装名称"
              allow-clear
              style="width: 200px"
              @press-enter="handleRelateSearch"
            />
          </a-form-item>
          <a-form-item class="search-actions">
            <a-space :size="8">
              <a-button type="primary" @click="handleRelateSearch">
                <SearchOutlined /> 查询
              </a-button>
              <a-button @click="handleRelateReset">
                <ReloadOutlined /> 重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>

        <a-alert
          type="info"
          show-icon
          message="规则：一件工装只能关联一个点检模板；已被其他模板占用的工装不可勾选。"
          class="relate-tip"
        />

        <!-- 工装信息表格（多选） -->
        <a-table
          :columns="relateColumns"
          :data-source="filteredToolingList"
          :pagination="relatePagination"
          :scroll="{ x: 780, y: 360 }"
          :row-selection="rowSelection"
          row-key="toolingId"
          size="small"
          bordered
          @change="handleRelateTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'toolingType'">
              {{ (record as ToolingRecord).toolingType }}
            </template>
            <template v-else-if="column.key === 'assocStatus'">
              <template v-if="getAssocTemplateId((record as ToolingRecord).toolingId) === relateTemplate?.id">
                <a-tag color="blue">当前模板已关联</a-tag>
              </template>
              <template v-else-if="getAssocTemplateId((record as ToolingRecord).toolingId)">
                <a-tag color="orange">
                  已关联：{{ getAssocTemplateName((record as ToolingRecord).toolingId) }}
                </a-tag>
              </template>
              <template v-else>
                <a-tag color="green">可关联</a-tag>
              </template>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="(record as ToolingRecord).status === 'enabled' ? 'green' : 'default'">
                {{ (record as ToolingRecord).status === 'enabled' ? '启用' : '停用' }}
              </a-tag>
            </template>
          </template>
        </a-table>

        <div class="relate-modal-footer">
          <span class="relate-selected">
            已选 <strong>{{ relateSelectedKeys.length }}</strong> 件
          </span>
          <a-space :size="8">
            <a-button type="primary" :loading="relateSaving" @click="handleSaveRelate">
              确定关联
            </a-button>
            <a-button @click="handleRelateModalClose">取消</a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

interface ToolingInspectionTemplate {
  id: string
  templateCode: string
  templateName: string
  toolingType: string
  productionLine: string
  relatedTooling: string
  itemCount: number
  status: 'enabled' | 'disabled'
  remark: string
  createTime: string
  creator: string
}

interface InspectionItem {
  itemId: string
  itemName: string
  checkMethod: string
  checkStandard: string
  isKey: boolean
  remark: string
}

interface ToolingRecord {
  toolingId: string
  toolingModel: string
  toolingName: string
  toolingType: string
  productionLine: string
  status: 'enabled' | 'disabled'
}

const toolingTypeOptions = ['夹具', '模具', '检具', '刀具', '辅具', '其他']
const checkMethodOptions = ['目视', '手感', '测量', '试装', '功能测试', '其他']

const loading = ref(false)
const selectedRowKeys = ref<string[]>([])

const searchForm = reactive({
  templateCode: '',
  templateName: '',
  toolingType: undefined as string | undefined,
  status: undefined as string | undefined
})

const columns = [
  { title: '模板编码', dataIndex: 'templateCode', key: 'templateCode', width: 140 },
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName', width: 220 },
  { title: '工装类型', dataIndex: 'toolingType', key: 'toolingType', width: 110 },
  { title: '工装信息', key: 'toolingInfo', width: 130 },
  { title: '点检项数量', dataIndex: 'itemCount', key: 'itemCount', width: 110 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const }
]

// 框架阶段：本地示例数据，后续可替换为接口
const dataList = ref<ToolingInspectionTemplate[]>([
  {
    id: '1',
    templateCode: 'TMP-JJ-001',
    templateName: '造型夹具班前点检模板',
    toolingType: '夹具',
    productionLine: '造型一线',
    relatedTooling: 'JJ-ZX-01 造型定位夹具',
    itemCount: 3,
    status: 'enabled',
    remark: '',
    createTime: '2026-01-05 09:00',
    creator: 'admin'
  },
  {
    id: '2',
    templateCode: 'TMP-MJ-001',
    templateName: '清理模具周点检模板',
    toolingType: '模具',
    productionLine: '清理线',
    relatedTooling: 'MJ-QL-01 清理整形模',
    itemCount: 2,
    status: 'enabled',
    remark: '',
    createTime: '2026-01-08 14:30',
    creator: 'admin'
  },
  {
    id: '3',
    templateCode: 'TMP-JJ-002',
    templateName: '制芯夹具月点检模板',
    toolingType: '夹具',
    productionLine: '制芯线',
    relatedTooling: 'JJ-ZX-02 制芯定位夹具',
    itemCount: 0,
    status: 'disabled',
    remark: '停用，待修订',
    createTime: '2026-01-12 10:15',
    creator: 'admin'
  }
])

// 点检项本地存储：templateId -> items
const inspectionItemsMap = ref<Record<string, InspectionItem[]>>({
  '1': [
    {
      itemId: '1-1',
      itemName: '定位销磨损检查',
      checkMethod: '测量',
      checkStandard: '磨损量 ≤ 0.5mm，否则更换',
      isKey: true,
      remark: ''
    },
    {
      itemId: '1-2',
      itemName: '夹紧机构动作检查',
      checkMethod: '功能测试',
      checkStandard: '夹紧/松开动作顺畅，无卡滞',
      isKey: true,
      remark: ''
    },
    {
      itemId: '1-3',
      itemName: '夹具表面外观检查',
      checkMethod: '目视',
      checkStandard: '无裂纹、无严重碰伤、无残留砂料',
      isKey: false,
      remark: ''
    }
  ],
  '2': [
    {
      itemId: '2-1',
      itemName: '模具型腔裂纹检查',
      checkMethod: '目视',
      checkStandard: '型腔、分型面无裂纹',
      isKey: true,
      remark: ''
    },
    {
      itemId: '2-2',
      itemName: '顶出机构间隙检查',
      checkMethod: '测量',
      checkStandard: '顶杆间隙 ≤ 0.2mm',
      isKey: false,
      remark: ''
    }
  ],
  '3': []
})

// ========== 工装台账与关联关系 ==========
// 工装台账示例
const toolingLibrary = ref<ToolingRecord[]>([
  { toolingId: 'T001', toolingModel: 'JJ-ZX-01', toolingName: '造型定位夹具', toolingType: '夹具', productionLine: '造型一线', status: 'enabled' },
  { toolingId: 'T002', toolingModel: 'JJ-ZX-02', toolingName: '造型侧压夹具', toolingType: '夹具', productionLine: '造型一线', status: 'enabled' },
  { toolingId: 'T003', toolingModel: 'JJ-ZX-03', toolingName: '造型顶紧夹具', toolingType: '夹具', productionLine: '造型二线', status: 'enabled' },
  { toolingId: 'T004', toolingModel: 'MJ-QL-01', toolingName: '清理整形模', toolingType: '模具', productionLine: '清理线', status: 'enabled' },
  { toolingId: 'T005', toolingModel: 'MJ-QL-02', toolingName: '清理去毛刺模', toolingType: '模具', productionLine: '清理线', status: 'enabled' },
  { toolingId: 'T006', toolingModel: 'MJ-ZX-01', toolingName: '制芯芯盒模具', toolingType: '模具', productionLine: '制芯线', status: 'enabled' },
  { toolingId: 'T007', toolingModel: 'JJ-ZX-04', toolingName: '制芯定位夹具', toolingType: '夹具', productionLine: '制芯线', status: 'enabled' },
  { toolingId: 'T008', toolingModel: 'JJ-ZX-05', toolingName: '制芯夹紧夹具', toolingType: '夹具', productionLine: '制芯线', status: 'enabled' },
  { toolingId: 'T009', toolingModel: 'JJ-QT-01', toolingName: '通用定位检具', toolingType: '检具', productionLine: '质检站', status: 'enabled' },
  { toolingId: 'T010', toolingModel: 'DJ-RZ-01', toolingName: '热处理装料辅具', toolingType: '辅具', productionLine: '热处理', status: 'enabled' },
  { toolingId: 'T011', toolingModel: 'JJ-ZX-06', toolingName: '造型翻转夹具', toolingType: '夹具', productionLine: '造型二线', status: 'enabled' },
  { toolingId: 'T012', toolingModel: 'MJ-QL-03', toolingName: '清理打磨模', toolingType: '模具', productionLine: '清理线', status: 'disabled' }
])

// 一对一关联：toolingId -> templateId（一件工装只能挂一个模板）
const toolingAssocMap = ref<Record<string, string>>({
  T001: '1',
  T004: '2',
  T007: '3'
})

const getAssocTemplateId = (toolingId: string): string | undefined =>
  toolingAssocMap.value[toolingId]

const getAssocTemplateName = (toolingId: string): string => {
  const tid = toolingAssocMap.value[toolingId]
  if (!tid) return ''
  return dataList.value.find(t => t.id === tid)?.templateName || tid
}

/** 按关联关系刷新模板列表的「关联工装」展示文案 */
const refreshTemplateRelatedTooling = () => {
  dataList.value = dataList.value.map(t => {
    const names = toolingLibrary.value
      .filter(tg => toolingAssocMap.value[tg.toolingId] === t.id)
      .map(tg => `${tg.toolingModel} ${tg.toolingName}`)
    return { ...t, relatedTooling: names.join('，') }
  })
}

// 初始化关联展示
refreshTemplateRelatedTooling()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const filteredData = computed(() => {
  let rows = dataList.value
  if (searchForm.templateCode) {
    rows = rows.filter(r =>
      r.templateCode.toLowerCase().includes(searchForm.templateCode.toLowerCase())
    )
  }
  if (searchForm.templateName) {
    rows = rows.filter(r => r.templateName.includes(searchForm.templateName))
  }
  if (searchForm.toolingType) {
    rows = rows.filter(r => r.toolingType === searchForm.toolingType)
  }
  if (searchForm.status) {
    rows = rows.filter(r => r.status === searchForm.status)
  }
  pagination.total = rows.length
  return rows
})

const modalVisible = ref(false)
const saving = ref(false)
const modalTitle = computed(() => (formData.id ? '编辑模板' : '新增模板'))

const defaultForm = () => ({
  id: '',
  templateCode: '',
  templateName: '',
  toolingType: undefined as string | undefined,
  productionLine: '',
  statusChecked: true,
  remark: ''
})

const formData = reactive(defaultForm())

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.templateCode = ''
  searchForm.templateName = ''
  searchForm.toolingType = undefined
  searchForm.status = undefined
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

const resetForm = () => {
  Object.assign(formData, defaultForm())
}

const handleAdd = () => {
  resetForm()
  modalVisible.value = true
}

const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) {
    message.warning('请选择一条记录进行修改')
    return
  }
  const row = dataList.value.find(r => r.id === selectedRowKeys.value[0])
  if (row) handleEditRecord(row)
}

const handleEditRecord = (record: ToolingInspectionTemplate) => {
  Object.assign(formData, {
    id: record.id,
    templateCode: record.templateCode,
    templateName: record.templateName,
    toolingType: record.toolingType,
    productionLine: record.productionLine,
    statusChecked: record.status === 'enabled',
    remark: record.remark
  })
  modalVisible.value = true
}

const handleView = (_record: ToolingInspectionTemplate) => {
  message.info('详情页面待开发')
}

// ========== 点检项配置 ==========
const itemsModalVisible = ref(false)
const itemsSaving = ref(false)
const itemsTemplate = ref<ToolingInspectionTemplate | null>(null)
const editingItems = ref<InspectionItem[]>([])

const itemColumns = [
  { title: '序号', key: 'seq', width: 60 },
  { title: '点检项名称', dataIndex: 'itemName', key: 'itemName', width: 180 },
  { title: '点检方法', dataIndex: 'checkMethod', key: 'checkMethod', width: 100 },
  { title: '判定标准', dataIndex: 'checkStandard', key: 'checkStandard', width: 240 },
  { title: '是否关键项', key: 'isKey', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 120 },
  { title: '操作', key: 'action', width: 110, fixed: 'right' as const }
]

const itemFormVisible = ref(false)
const itemFormSaving = ref(false)

const defaultItemForm = () => ({
  itemId: '',
  itemName: '',
  checkMethod: undefined as string | undefined,
  checkStandard: '',
  isKey: false,
  remark: ''
})

const itemFormData = reactive(defaultItemForm())

const handleConfigItems = (record: ToolingInspectionTemplate) => {
  itemsTemplate.value = record
  // 深拷贝，避免未保存就污染列表
  const stored = inspectionItemsMap.value[record.id] || []
  editingItems.value = stored.map(i => ({ ...i }))
  itemsModalVisible.value = true
}

const handleItemsModalClose = () => {
  itemsModalVisible.value = false
  itemsTemplate.value = null
  editingItems.value = []
}

const handleAddItem = () => {
  Object.assign(itemFormData, defaultItemForm())
  itemFormVisible.value = true
}

const handleEditItem = (record: InspectionItem) => {
  Object.assign(itemFormData, {
    itemId: record.itemId,
    itemName: record.itemName,
    checkMethod: record.checkMethod,
    checkStandard: record.checkStandard,
    isKey: record.isKey,
    remark: record.remark
  })
  itemFormVisible.value = true
}

const handleDeleteItem = (record: InspectionItem) => {
  editingItems.value = editingItems.value.filter(i => i.itemId !== record.itemId)
}

const handleSaveItemForm = () => {
  if (!itemFormData.itemName || !itemFormData.checkMethod || !itemFormData.checkStandard) {
    message.warning('请填写点检项名称、点检方法和判定标准')
    return
  }
  itemFormSaving.value = true
  setTimeout(() => {
    if (itemFormData.itemId) {
      const idx = editingItems.value.findIndex(i => i.itemId === itemFormData.itemId)
      if (idx >= 0) {
        editingItems.value[idx] = {
          itemId: itemFormData.itemId,
          itemName: itemFormData.itemName,
          checkMethod: itemFormData.checkMethod || '',
          checkStandard: itemFormData.checkStandard,
          isKey: itemFormData.isKey,
          remark: itemFormData.remark
        }
      }
      message.success('修改点检项成功')
    } else {
      const prefix = itemsTemplate.value?.id || 'new'
      editingItems.value.push({
        itemId: `${prefix}-${Date.now()}`,
        itemName: itemFormData.itemName,
        checkMethod: itemFormData.checkMethod || '',
        checkStandard: itemFormData.checkStandard,
        isKey: itemFormData.isKey,
        remark: itemFormData.remark
      })
      message.success('新增点检项成功')
    }
    itemFormSaving.value = false
    itemFormVisible.value = false
  }, 200)
}

const handleSaveItems = () => {
  if (!itemsTemplate.value) return
  itemsSaving.value = true
  setTimeout(() => {
    const tid = itemsTemplate.value!.id
    inspectionItemsMap.value[tid] = editingItems.value.map(i => ({ ...i }))
    const idx = dataList.value.findIndex(r => r.id === tid)
    if (idx >= 0) {
      dataList.value[idx] = {
        ...dataList.value[idx],
        itemCount: editingItems.value.length
      }
    }
    itemsSaving.value = false
    message.success('点检项已保存')
    handleItemsModalClose()
  }, 300)
}

const handleRelateTooling = (record: ToolingInspectionTemplate) => {
  relateTemplate.value = record
  // 当前模板已关联的工装默认勾选
  relateSelectedKeys.value = toolingLibrary.value
    .filter(tg => toolingAssocMap.value[tg.toolingId] === record.id)
    .map(tg => tg.toolingId)
  relateSearchForm.toolingModel = ''
  relateSearchForm.toolingName = ''
  relatePagination.current = 1
  relateModalVisible.value = true
}

// ========== 关联工装弹窗 ==========
const relateModalVisible = ref(false)
const relateSaving = ref(false)
const relateTemplate = ref<ToolingInspectionTemplate | null>(null)
const relateSelectedKeys = ref<string[]>([])

const relateSearchForm = reactive({
  toolingModel: '',
  toolingName: ''
})

const relateColumns = [
  { title: '工装型号', dataIndex: 'toolingModel', key: 'toolingModel', width: 130 },
  { title: '工装名称', dataIndex: 'toolingName', key: 'toolingName', width: 180 },
  { title: '工装类型', dataIndex: 'toolingType', key: 'toolingType', width: 100 },
  { title: '适用产线', dataIndex: 'productionLine', key: 'productionLine', width: 120 },
  { title: '状态', key: 'status', width: 90 },
  { title: '关联状态', key: 'assocStatus', width: 180 }
]

const relatePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

/** 是否可勾选：未被其他模板占用，或已属于当前模板 */
const isSelectable = (record: ToolingRecord): boolean => {
  const assocId = toolingAssocMap.value[record.toolingId]
  return !assocId || assocId === relateTemplate.value?.id
}

const rowSelection = computed(() => ({
  selectedRowKeys: relateSelectedKeys.value,
  onChange: (keys: (string | number)[]) => {
    relateSelectedKeys.value = keys as string[]
  },
  getCheckboxProps: (record: ToolingRecord) => ({
    disabled: !isSelectable(record)
  })
}))

const filteredToolingList = computed(() => {
  let rows = toolingLibrary.value
  if (relateSearchForm.toolingModel) {
    const kw = relateSearchForm.toolingModel.toLowerCase()
    rows = rows.filter(r => r.toolingModel.toLowerCase().includes(kw))
  }
  if (relateSearchForm.toolingName) {
    rows = rows.filter(r => r.toolingName.includes(relateSearchForm.toolingName))
  }
  relatePagination.total = rows.length
  return rows
})

const handleRelateSearch = () => {
  relatePagination.current = 1
}

const handleRelateReset = () => {
  relateSearchForm.toolingModel = ''
  relateSearchForm.toolingName = ''
  handleRelateSearch()
}

const handleRelateTableChange = (
  pag: { current?: number; pageSize?: number },
  _filters: unknown,
  _sorter: unknown
) => {
  if (pag.current) relatePagination.current = pag.current
  if (pag.pageSize) relatePagination.pageSize = pag.pageSize
}

const handleRelateModalClose = () => {
  relateModalVisible.value = false
  relateTemplate.value = null
  relateSelectedKeys.value = []
  relateSearchForm.toolingModel = ''
  relateSearchForm.toolingName = ''
}

const handleSaveRelate = () => {
  if (!relateTemplate.value) return
  const templateId = relateTemplate.value.id
  relateSaving.value = true
  setTimeout(() => {
    // 1) 先解除当前模板名下所有关联
    Object.keys(toolingAssocMap.value).forEach(tid => {
      if (toolingAssocMap.value[tid] === templateId) {
        delete toolingAssocMap.value[tid]
      }
    })
    // 2) 写入当前勾选（互斥已在 UI 层拦截）
    relateSelectedKeys.value.forEach(tid => {
      toolingAssocMap.value[tid] = templateId
    })
    // 3) 刷新模板列表展示
    refreshTemplateRelatedTooling()
    relateSaving.value = false
    message.success(
      relateSelectedKeys.value.length
        ? `已关联 ${relateSelectedKeys.value.length} 件工装`
        : '已清空该模板的工装关联'
    )
    handleRelateModalClose()
  }, 300)
}

const handleDelete = () => {
  const ids = [...selectedRowKeys.value]
  dataList.value = dataList.value.filter(r => !ids.includes(r.id))
  ids.forEach(id => {
    delete inspectionItemsMap.value[id]
    // 解除该模板名下的工装关联
    Object.keys(toolingAssocMap.value).forEach(tid => {
      if (toolingAssocMap.value[tid] === id) {
        delete toolingAssocMap.value[tid]
      }
    })
  })
  selectedRowKeys.value = []
  message.success('删除成功')
}

const handleSave = () => {
  if (!formData.templateCode || !formData.templateName || !formData.toolingType) {
    message.warning('请填写必填项')
    return
  }
  saving.value = true
  setTimeout(() => {
    const status = formData.statusChecked ? 'enabled' : 'disabled'
    if (formData.id) {
      const idx = dataList.value.findIndex(r => r.id === formData.id)
      if (idx >= 0) {
        dataList.value[idx] = {
          ...dataList.value[idx],
          templateCode: formData.templateCode,
          templateName: formData.templateName,
          toolingType: formData.toolingType || '',
          productionLine: formData.productionLine,
          status,
          remark: formData.remark
        }
      }
      message.success('修改成功')
    } else {
      dataList.value.unshift({
        id: String(Date.now()),
        templateCode: formData.templateCode,
        templateName: formData.templateName,
        toolingType: formData.toolingType || '',
        productionLine: formData.productionLine,
        itemCount: 0,
        relatedTooling: '',
        status,
        remark: formData.remark,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        creator: 'admin'
      })
      // 新模板初始化空点检项列表
      const newId = dataList.value[0].id
      inspectionItemsMap.value[newId] = []
      message.success('新增成功')
      pagination.current = 1
    }
    saving.value = false
    modalVisible.value = false
  }, 300)
}
</script>

<style scoped>
.tooling-inspection-template {
  padding: 16px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.search-actions) {
  margin-left: auto;
  margin-right: 0;
}

.action-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.items-modal-body {
  padding-bottom: 8px;
}

.items-modal-meta {
  margin-bottom: 16px;
}

.items-modal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.items-count {
  font-size: 13px;
  color: #666;
}

.items-modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.relate-modal-body {
  padding-bottom: 8px;
}

.relate-search {
  margin-bottom: 12px;
}

.relate-search :deep(.search-actions) {
  margin-left: auto;
  margin-right: 0;
}

.relate-tip {
  margin-bottom: 12px;
}

.relate-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.relate-selected {
  font-size: 13px;
  color: #666;
}

.relate-selected strong {
  color: #1890ff;
  font-size: 16px;
}
</style>
