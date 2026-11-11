<template>
  <div class="station-workhour-config">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产线">
          <a-select
            v-model:value="searchForm.productionLine"
            placeholder="请选择产线"
            allow-clear
            style="width: 180px"
            @change="handleSearch"
          >
            <a-select-option v-for="l in productionLineOptions" :key="l" :value="l">{{ l }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="工位">
          <a-input
            v-model:value="searchForm.station"
            placeholder="请输入工位"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="子工位">
          <a-input
            v-model:value="searchForm.subStation"
            placeholder="请输入子工位"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="设备">
          <a-input
            v-model:value="searchForm.equipment"
            placeholder="请输入设备"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
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
        :scroll="{ x: 1200 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, index }">
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
      :title="isEdit ? '修改工位工时' : '新增工位工时'"
      :width="600"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :label-col="{ span: 7 }" :wrapper-col="{ span: 17 }">
        <a-form-item label="产线" required>
          <a-select
            v-model:value="formData.productionLine"
            placeholder="请选择产线"
            allow-clear
            :options="productionLineOptions.map(l => ({ label: l, value: l }))"
            @change="handleLineChange"
          />
        </a-form-item>
        <a-form-item label="工位" required>
          <a-select
            v-model:value="formData.station"
            placeholder="请选择工位"
            allow-clear
            :options="stationOptions.map(v => ({ label: v, value: v }))"
            @change="handleStationChange"
          />
        </a-form-item>
        <a-form-item label="子工位" required>
          <a-select
            v-model:value="formData.subStation"
            placeholder="请选择子工位"
            allow-clear
            :options="subStationOptions.map(v => ({ label: v, value: v }))"
            @change="handleSubStationChange"
          />
        </a-form-item>
        <a-form-item label="设备" required>
          <a-select
            v-model:value="formData.equipment"
            placeholder="请先选择子工位"
            allow-clear
            :disabled="!formData.subStation"
            :options="equipmentOptions.map(v => ({ label: v, value: v }))"
          />
        </a-form-item>
        <a-form-item label="白班工作时长" required>
          <a-input-number
            v-model:value="formData.dayShiftMinutes"
            :min="0"
            :max="1440"
            :step="30"
            placeholder="请输入分钟数"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="夜班工作时长" required>
          <a-input-number
            v-model:value="formData.nightShiftMinutes"
            :min="0"
            :max="1440"
            :step="30"
            placeholder="请输入分钟数"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

// ---------- 类型定义 ----------
interface StationWorkHourRecord {
  id: number
  productionLine: string
  station: string
  subStation: string
  equipment: string
  dayShiftMinutes: number
  nightShiftMinutes: number
  creator: string
  createTime: string
}

const productionLineOptions = ['制芯一线', '制芯二线', '制芯三线']

// ---------- 筛选表单 ----------
const searchForm = reactive({
  productionLine: '',
  station: '',
  subStation: '',
  equipment: ''
})

// ---------- 表格 ----------
const loading = ref(false)
const selectedRowKeys = ref<Array<string | number>>([])

const columns = [
  { title: '序号', key: 'seq', width: 80 },
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 120 },
  { title: '工位', dataIndex: 'station', key: 'station', width: 150 },
  { title: '子工位', dataIndex: 'subStation', key: 'subStation', width: 150 },
  { title: '设备', dataIndex: 'equipment', key: 'equipment', width: 200 },
  { title: '白班工作时长（分钟）', dataIndex: 'dayShiftMinutes', key: 'dayShiftMinutes', width: 150 },
  { title: '夜班工作时长（分钟）', dataIndex: 'nightShiftMinutes', key: 'nightShiftMinutes', width: 150 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 }
]

const dataSource = ref<StationWorkHourRecord[]>([
  { id: 1, productionLine: '制芯一线', station: '制芯工位', subStation: '射芯工位', equipment: '冷芯盒制芯机1#', dayShiftMinutes: 480, nightShiftMinutes: 480, creator: '张三', createTime: '2026-11-01 09:20' },
  { id: 2, productionLine: '制芯一线', station: '制芯工位', subStation: '射芯工位', equipment: '热芯盒制芯机2#', dayShiftMinutes: 480, nightShiftMinutes: 480, creator: '张三', createTime: '2026-11-01 09:25' },
  { id: 3, productionLine: '制芯二线', station: '制芯工位', subStation: '下芯工位', equipment: '组芯机械手1#', dayShiftMinutes: 480, nightShiftMinutes: 720, creator: '李四', createTime: '2026-11-02 14:10' },
  { id: 4, productionLine: '制芯二线', station: '制芯工位', subStation: '修芯工位', equipment: '修芯工作台1#', dayShiftMinutes: 480, nightShiftMinutes: 0, creator: '李四', createTime: '2026-11-03 10:45' },
  { id: 5, productionLine: '制芯三线', station: '砂芯检测工位', subStation: '尺寸检测工位', equipment: '三坐标检测仪1#', dayShiftMinutes: 480, nightShiftMinutes: 0, creator: '王五', createTime: '2026-11-04 15:30' },
  { id: 6, productionLine: '制芯三线', station: '砂芯存储工位', subStation: '立库入库工位', equipment: '立库堆垛机1#', dayShiftMinutes: 480, nightShiftMinutes: 720, creator: '王五', createTime: '2026-11-05 08:50' },
  { id: 7, productionLine: '制芯一线', station: '砂芯存储工位', subStation: '立库出库工位', equipment: '立库堆垛机2#', dayShiftMinutes: 480, nightShiftMinutes: 720, creator: '赵六', createTime: '2026-11-06 16:05' }
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
  onChange: (keys: Array<string | number>) => { selectedRowKeys.value = keys }
}))

const filteredData = computed(() => {
  let list = dataSource.value
  if (searchForm.productionLine) list = list.filter(i => i.productionLine === searchForm.productionLine)
  if (searchForm.station) list = list.filter(i => i.station.includes(searchForm.station))
  if (searchForm.subStation) list = list.filter(i => i.subStation.includes(searchForm.subStation))
  if (searchForm.equipment) list = list.filter(i => i.equipment.includes(searchForm.equipment))
  pagination.total = list.length
  return list
})

// ---------- 新增/编辑弹框 ----------
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)

const emptyForm = {
  productionLine: '',
  station: '',
  subStation: '',
  equipment: '',
  dayShiftMinutes: undefined as number | undefined,
  nightShiftMinutes: undefined as number | undefined
}

const formData = reactive({ ...emptyForm })

const resetForm = () => {
  Object.assign(formData, { ...emptyForm, dayShiftMinutes: undefined, nightShiftMinutes: undefined })
}

// ---------- 弹框下拉选项：产线 → 工位 → 子工位 → 设备（自动填充） ----------
const uniq = (list: string[]) => Array.from(new Set(list))

const stationOptions = computed(() =>
  uniq(
    dataSource.value
      .filter(r => !formData.productionLine || r.productionLine === formData.productionLine)
      .map(r => r.station)
  )
)

const subStationOptions = computed(() =>
  uniq(
    dataSource.value
      .filter(r =>
        (!formData.productionLine || r.productionLine === formData.productionLine) &&
        (!formData.station || r.station === formData.station)
      )
      .map(r => r.subStation)
  )
)

const equipmentOptions = computed(() =>
  uniq(
    dataSource.value
      .filter(r =>
        (!formData.productionLine || r.productionLine === formData.productionLine) &&
        (!formData.station || r.station === formData.station) &&
        (!formData.subStation || r.subStation === formData.subStation)
      )
      .map(r => r.equipment)
  )
)

const handleLineChange = () => {
  formData.station = ''
  formData.subStation = ''
  formData.equipment = ''
}

const handleStationChange = () => {
  formData.subStation = ''
  formData.equipment = ''
}

const handleSubStationChange = () => {
  const options = equipmentOptions.value
  formData.equipment = options.length === 1 ? options[0] : ''
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = 0
  resetForm()
  modalVisible.value = true
}

const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) { message.warning('请选择一条记录进行修改'); return }
  const record = dataSource.value.find(i => i.id === selectedRowKeys.value[0])
  if (!record) return
  isEdit.value = true
  editingId.value = record.id
  Object.assign(formData, {
    productionLine: record.productionLine,
    station: record.station,
    subStation: record.subStation,
    equipment: record.equipment,
    dayShiftMinutes: record.dayShiftMinutes,
    nightShiftMinutes: record.nightShiftMinutes
  })
  modalVisible.value = true
}

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) { message.warning('请先选择要删除的记录'); return }
  Modal.confirm({
    title: '确认删除',
    content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
    onOk() {
      dataSource.value = dataSource.value.filter(i => !selectedRowKeys.value.includes(i.id))
      selectedRowKeys.value = []
      message.success('删除成功')
    }
  })
}

const handleModalOk = () => {
  if (
    !formData.productionLine ||
    !formData.station ||
    !formData.subStation ||
    !formData.equipment ||
    formData.dayShiftMinutes === null ||
    formData.dayShiftMinutes === undefined ||
    formData.nightShiftMinutes === null ||
    formData.nightShiftMinutes === undefined
  ) {
    message.warning('请填写所有必填项')
    return
  }
  if (isEdit.value) {
    const idx = dataSource.value.findIndex(i => i.id === editingId.value)
    if (idx !== -1) {
      dataSource.value[idx] = {
        ...dataSource.value[idx],
        productionLine: formData.productionLine,
        station: formData.station,
        subStation: formData.subStation,
        equipment: formData.equipment,
        dayShiftMinutes: formData.dayShiftMinutes,
        nightShiftMinutes: formData.nightShiftMinutes
      }
    }
    message.success('修改成功')
  } else {
    dataSource.value.unshift({
      id: Date.now(),
      productionLine: formData.productionLine,
      station: formData.station,
      subStation: formData.subStation,
      equipment: formData.equipment,
      dayShiftMinutes: formData.dayShiftMinutes!,
      nightShiftMinutes: formData.nightShiftMinutes!,
      creator: 'admin',
      createTime: dayjs().format('YYYY-MM-DD HH:mm')
    })
    message.success('新增成功')
  }
  modalVisible.value = false
}

const handleModalCancel = () => { modalVisible.value = false }

// ---------- 筛选 ----------
const handleSearch = () => { pagination.current = 1 }
const handleReset = () => {
  searchForm.productionLine = ''
  searchForm.station = ''
  searchForm.subStation = ''
  searchForm.equipment = ''
  pagination.current = 1
}
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}
</script>

<style scoped>
.station-workhour-config {
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
</style>
