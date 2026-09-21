<template>
  <div class="binhai-core-making">
    <div class="core-making-layout">
      <!-- 左侧：砂芯需求列表 -->
      <div class="sand-core-list-panel">
        <div class="panel-header">
          <h3>砂芯需求列表</h3>
        </div>
        <div class="panel-content">
          <!-- 产品选择下拉框 -->
          <a-select
            v-model:value="selectedProduct"
            placeholder="请选择产品"
            style="width: 100%; margin-bottom: 12px"
            @change="handleProductChange"
          >
            <a-select-option value="1000978236R">1000978236R</a-select-option>
          </a-select>

          <!-- 砂芯需求卡片列表 -->
          <div class="sand-core-cards">
            <div
              v-for="item in sandCoreList"
              :key="item.id"
              class="sand-core-card"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
            >
              <div class="card-title">{{ item.code }}_{{ item.name }}</div>
              <div class="card-info">
                <div>芯盒编号/名称：{{ item.boxName || '' }}</div>
                <div>库存数量（颗）：{{ item.stock }}</div>
                <div>
                  排产数/需求数：
                  <span class="demand-count">{{ item.produced }}/{{ item.demand }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：排产可视化区域 -->
      <div class="scheduling-visualization-panel">
        <div class="panel-header">
          <h3>排产可视化区域</h3>
          <div class="header-actions">
            <a-button type="primary" @click="showAddModal">新增</a-button>
            <a-button type="primary" danger @click="handleClear">清空</a-button>
            <a-button type="primary" @click="handleDispatch">下发</a-button>
          </div>
        </div>

        <!-- 制芯类型标签页 -->
        <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
          <a-tab-pane key="engine" tab="机体制芯" />
          <a-tab-pane key="crankshaft" tab="曲轴制芯" />
          <a-tab-pane key="large" tab="大机制芯" />
        </a-tabs>

        <!-- 班次选择 -->
        <div class="shift-selector">
          <a-radio-group v-model:value="currentShift" @change="handleShiftChange">
            <a-radio-button value="morning">早（白）班</a-radio-button>
            <a-radio-button value="night">晚（夜）班</a-radio-button>
          </a-radio-group>
        </div>

        <!-- 日期导航 -->
        <div class="date-navigation">
          <a-button @click="goToToday">今日</a-button>
          <a-button @click="goToPrevDay">＜ 前一天</a-button>
          <a-date-picker
            v-model:value="selectedDate"
            format="YYYY-MM-DD"
            @change="handleDateChange"
            style="width: 160px"
          />
          <a-button @click="goToNextDay">后一天 ＞</a-button>
        </div>

        <!-- 设备排产区域 -->
        <div class="equipment-grid">
          <div
            v-for="equipment in equipmentList"
            :key="equipment.id"
            class="equipment-card"
            @dragover.prevent
            @drop="handleDrop($event, equipment)"
          >
            <div class="equipment-header">
              <span class="equipment-icon">⚙</span>
              <span>{{ equipment.name }}</span>
            </div>
            <div class="equipment-body">
              <div v-if="equipment.scheduledItems && equipment.scheduledItems.length > 0" class="scheduled-items">
                <div
                  v-for="(item, index) in equipment.scheduledItems"
                  :key="index"
                  class="scheduled-item"
                >
                  {{ item.name }}
                </div>
              </div>
              <div v-else class="drop-zone">
                <div class="plus-icon">+</div>
                <div class="drop-text">拖拽砂芯到此排产</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 页脚 -->
        <div class="page-footer">
          Copyright ©2024-2025 潍柴动力股份有限公司
        </div>
      </div>
    </div>

    <!-- 新增排产弹窗 -->
    <a-modal
      v-model:open="addModalVisible"
      title="新增排产"
      width="1160px"
      :footer="null"
      @cancel="handleCancelAdd"
    >
      <a-form
        :model="addForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="add-form"
      >
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="排产日期">
              <a-date-picker
                v-model:value="addForm.scheduleDate"
                format="YYYY-MM-DD"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="产品系列">
              <a-select
                v-model:value="addForm.productSeries"
                placeholder="请选择产品系列"
              >
                <a-select-option value="A系列">A系列</a-select-option>
                <a-select-option value="B系列">B系列</a-select-option>
                <a-select-option value="C系列">C系列</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="毛坯件号">
              <a-select
                v-model:value="addForm.partNo"
                placeholder="请选择毛坯件号"
                show-search
                allow-clear
                :options="partNoOptions"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- 排产明细表格 -->
      <a-table
        :columns="detailColumns"
        :data-source="addForm.details"
        :pagination="false"
        :scroll="{ x: 1100 }"
        bordered
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'coreName'">
            <a-select
              v-model:value="record.coreName"
              placeholder="请选择砂芯"
              style="width: 100%"
            >
              <a-select-option
                v-for="item in sandCoreList"
                :key="item.id"
                :value="item.name"
              >
                {{ item.name }}
              </a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'area'">
            <a-select
              v-model:value="record.area"
              placeholder="请选择区域"
              style="width: 100%"
            >
              <a-select-option value="机体制芯">机体制芯</a-select-option>
              <a-select-option value="曲轴制芯">曲轴制芯</a-select-option>
              <a-select-option value="大机制芯">大机制芯</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'equipment'">
            <a-select
              v-model:value="record.equipment"
              placeholder="请选择设备"
              style="width: 100%"
            >
              <a-select-option
                v-for="eq in equipmentList"
                :key="eq.id"
                :value="eq.name"
              >
                {{ eq.name }}
              </a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'shift'">
            <a-select
              v-model:value="record.shift"
              placeholder="请选择班次"
              style="width: 100%"
            >
              <a-select-option value="morning">早（白）班</a-select-option>
              <a-select-option value="night">晚（夜）班</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'coreBox'">
            <a-select
              v-model:value="record.coreBox"
              placeholder="请选择排产芯盒"
              show-search
              allow-clear
              :options="coreBoxOptions"
            />
          </template>
          <template v-else-if="column.key === 'quantity'">
            <a-input-number
              v-model:value="record.quantity"
              :min="0"
              :precision="0"
              placeholder="请输入颗数"
              style="width: 100%"
            />
          </template>
          <template v-else-if="column.key === 'moldCount'">
            <span class="mold-count">{{ getMoldCount(record) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              type="link"
              danger
              size="small"
              @click="removeDetailRow(index)"
            >
              删除
            </a-button>
          </template>
        </template>
      </a-table>

      <!-- 添加行按钮 -->
      <a-button
        type="dashed"
        block
        style="margin-top: 12px"
        @click="addDetailRow"
      >
        <PlusOutlined />
        添加排产明细
      </a-button>

      <!-- 弹窗底部按钮 -->
      <div class="modal-footer">
        <a-button @click="handleCancelAdd">取消</a-button>
        <a-button type="primary" @click="handleConfirmAdd">确定</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { PlusOutlined } from '@ant-design/icons-vue'

// 砂芯需求数据类型
interface SandCoreItem {
  id: string
  code: string
  name: string
  boxName: string
  stock: number
  produced: number
  demand: number
}

// 设备数据类型
interface EquipmentItem {
  id: string
  name: string
  scheduledItems: SandCoreItem[]
}

// 当前选中的产品
const selectedProduct = ref('1000978236R')

// 当前激活的标签页
const activeTab = ref('engine')

// 当前班次
const currentShift = ref('morning')

// 当前日期
const selectedDate = ref(dayjs())

// 砂芯需求列表
const sandCoreList = ref<SandCoreItem[]>([
  {
    id: '1',
    code: 'C000005939_1000978236R_KMA_1#dgx',
    name: '1#大缸芯',
    boxName: '',
    stock: 0,
    produced: 0,
    demand: 4704
  },
  {
    id: '2',
    code: 'C000005941_1000978236R_KMA_2#dgx',
    name: '2#大缸芯',
    boxName: '',
    stock: 0,
    produced: 0,
    demand: 14112
  },
  {
    id: '3',
    code: 'C000005943_1000978236R_KMA_qdxbx',
    name: '前端下半芯',
    boxName: '',
    stock: 0,
    produced: 0,
    demand: 2352
  },
  {
    id: '4',
    code: 'C000005945_1000978236R_KMA_qdsbx',
    name: '前端上半芯',
    boxName: '',
    stock: 0,
    produced: 0,
    demand: 2352
  },
  {
    id: '5',
    code: 'C000005950_1000978236R_KMA_hdsbx',
    name: '后端上半芯',
    boxName: '',
    stock: 0,
    produced: 0,
    demand: 2352
  },
  {
    id: '6',
    code: 'C000005952_1000978236R_KMA_zcgccx',
    name: '左侧观察窗芯',
    boxName: '',
    stock: 0,
    produced: 0,
    demand: 2352
  }
])

// 设备列表
const equipmentList = ref<EquipmentItem[]>([
  {
    id: 'L40',
    name: 'L40',
    scheduledItems: []
  },
  {
    id: '二手40',
    name: '二手40',
    scheduledItems: []
  }
])

// 排产明细类型
interface DetailItem {
  coreName: string | undefined
  area: string | undefined
  equipment: string | undefined
  shift: string | undefined
  coreBox: string | undefined
  quantity: number | null
}

// 新增弹窗是否可见
const addModalVisible = ref(false)

// 毛坯件号下拉选项
const partNoOptions = [
  { label: '1000978236R', value: '1000978236R' },
  { label: '1000978237R', value: '1000978237R' },
  { label: '1000978238R', value: '1000978238R' },
  { label: '1000978239R', value: '1000978239R' },
  { label: '1000978240R', value: '1000978240R' }
]

// 排产芯盒下拉选项
const coreBoxOptions = [
  { label: 'C000005939_1#大缸芯', value: 'C000005939' },
  { label: 'C000005941_2#大缸芯', value: 'C000005941' },
  { label: 'C000005943_前端下半芯', value: 'C000005943' },
  { label: 'C000005945_前端上半芯', value: 'C000005945' },
  { label: 'C000005950_后端上半芯', value: 'C000005950' },
  { label: 'C000005952_左侧观察窗芯', value: 'C000005952' }
]

// 每模颗数（根据芯盒型腔数换算）
const coresPerMoldMap: Record<string, number> = {
  C000005939: 1,
  C000005941: 1,
  C000005943: 2,
  C000005945: 2,
  C000005950: 2,
  C000005952: 2
}

// 计算排产模数 = 排产颗数 / 每模颗数（向上取整）
const getMoldCount = (record: DetailItem) => {
  if (!record.quantity || record.quantity <= 0) return '-'
  const coresPerMold = (record.coreBox && coresPerMoldMap[record.coreBox]) || 1
  return Math.ceil(record.quantity / coresPerMold)
}

// 新增表单数据
const addForm = reactive({
  scheduleDate: null as Dayjs | null,
  productSeries: undefined as string | undefined,
  partNo: undefined as string | undefined,
  details: [] as DetailItem[]
})

// 表格列定义
const detailColumns = [
  {
    title: '砂芯名称',
    key: 'coreName',
    dataIndex: 'coreName',
    width: 180
  },
  {
    title: '排产区域',
    key: 'area',
    dataIndex: 'area',
    width: 150
  },
  {
    title: '排产设备',
    key: 'equipment',
    dataIndex: 'equipment',
    width: 150
  },
  {
    title: '生产班次',
    key: 'shift',
    dataIndex: 'shift',
    width: 150
  },
  {
    title: '排产芯盒',
    key: 'coreBox',
    dataIndex: 'coreBox',
    width: 150
  },
  {
    title: '排产颗数',
    key: 'quantity',
    dataIndex: 'quantity',
    width: 120
  },
  {
    title: '排产模数',
    key: 'moldCount',
    dataIndex: 'moldCount',
    width: 110
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right' as const
  }
]

// 拖拽数据
let draggedItem: SandCoreItem | null = null

// 处理产品切换
const handleProductChange = (value: string) => {
  console.log('产品切换:', value)
}

// 处理标签页切换
const handleTabChange = (key: string) => {
  console.log('标签页切换:', key)
}

// 处理班次切换
const handleShiftChange = () => {
  console.log('班次切换:', currentShift.value)
}

// 前一天
const goToPrevDay = () => {
  selectedDate.value = selectedDate.value.subtract(1, 'day')
}

// 后一天
const goToNextDay = () => {
  selectedDate.value = selectedDate.value.add(1, 'day')
}

// 今日
const goToToday = () => {
  selectedDate.value = dayjs()
}

// 处理日期变化
const handleDateChange = () => {
  console.log('日期切换:', selectedDate.value.format('YYYY-MM-DD'))
}

// 拖拽开始
const handleDragStart = (event: DragEvent, item: SandCoreItem) => {
  draggedItem = item
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', item.id)
  }
}

// 拖拽放下
const handleDrop = (event: DragEvent, equipment: EquipmentItem) => {
  event.preventDefault()
  if (draggedItem && !equipment.scheduledItems.find(i => i.id === draggedItem!.id)) {
    equipment.scheduledItems.push({ ...draggedItem })
    console.log(`已将 ${draggedItem.name} 排产到 ${equipment.name}`)
  }
  draggedItem = null
}

// 清空排产
const handleClear = () => {
  equipmentList.value.forEach(eq => {
    eq.scheduledItems = []
  })
  console.log('已清空所有排产')
}

// 下发排产
const handleDispatch = () => {
  console.log('下发排产:', equipmentList.value)
}

// 显示新增弹窗
const showAddModal = () => {
  addForm.scheduleDate = dayjs()
  addForm.productSeries = undefined
  addForm.partNo = undefined
  addForm.details = [
    {
      coreName: undefined,
      area: undefined,
      equipment: undefined,
      shift: undefined,
      coreBox: undefined,
      quantity: null
    }
  ]
  addModalVisible.value = true
}

// 取消新增
const handleCancelAdd = () => {
  addModalVisible.value = false
}

// 添加明细行
const addDetailRow = () => {
  addForm.details.push({
    coreName: undefined,
    area: undefined,
    equipment: undefined,
    shift: undefined,
    coreBox: undefined,
    quantity: null
  })
}

// 删除明细行
const removeDetailRow = (index: number) => {
  addForm.details.splice(index, 1)
}

// 确认新增
const handleConfirmAdd = () => {
  if (!addForm.scheduleDate) {
    message.warning('请选择排产日期')
    return
  }
  if (!addForm.productSeries) {
    message.warning('请选择产品系列')
    return
  }
  if (!addForm.partNo) {
    message.warning('请选择毛坯件号')
    return
  }
  if (addForm.details.length === 0) {
    message.warning('请至少添加一条排产明细')
    return
  }
  for (let i = 0; i < addForm.details.length; i++) {
    const detail = addForm.details[i]
    if (!detail.coreName) {
      message.warning(`第${i + 1}行：请选择砂芯名称`)
      return
    }
    if (!detail.area) {
      message.warning(`第${i + 1}行：请选择排产区域`)
      return
    }
    if (!detail.equipment) {
      message.warning(`第${i + 1}行：请选择排产设备`)
      return
    }
    if (!detail.shift) {
      message.warning(`第${i + 1}行：请选择生产班次`)
      return
    }
    if (!detail.quantity) {
      message.warning(`第${i + 1}行：请输入排产颗数`)
      return
    }
  }
  console.log('新增排产数据:', {
    scheduleDate: addForm.scheduleDate.format('YYYY-MM-DD'),
    productSeries: addForm.productSeries,
    partNo: addForm.partNo,
    details: addForm.details
  })
  message.success('新增排产成功')
  addModalVisible.value = false
}
</script>

<style scoped>
.binhai-core-making {
  height: 100vh;
  padding: 16px;
}

.core-making-layout {
  display: flex;
  height: 100%;
  gap: 16px;
}

/* 左侧砂芯需求列表 */
.sand-core-list-panel {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sand-core-list-panel .panel-content {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}

.sand-core-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sand-core-card {
  background: #f7f8fa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  cursor: grab;
  transition: all 0.2s;
}

.sand-core-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.sand-core-card:active {
  cursor: grabbing;
}

.card-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  word-break: break-all;
}

.card-info {
  font-size: 13px;
  color: #333;
  line-height: 1.8;
}

.demand-count {
  color: #f5222d;
  font-weight: 500;
}

/* 右侧排产可视化区域 */
.scheduling-visualization-panel {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scheduling-visualization-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 标签页样式 */
.scheduling-visualization-panel :deep(.ant-tabs) {
  padding: 0 16px;
}

.scheduling-visualization-panel :deep(.ant-tabs-tab) {
  font-size: 14px;
  padding: 12px 0;
}

/* 班次选择 */
.shift-selector {
  padding: 12px 16px;
}

/* 日期导航 */
.date-navigation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 16px;
}

/* 设备网格 */
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
}

.equipment-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.equipment-header {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.equipment-icon {
  font-size: 18px;
}

.equipment-body {
  min-height: 200px;
  padding: 16px;
}

.drop-zone {
  height: 160px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.plus-icon {
  font-size: 48px;
  color: #d9d9d9;
  line-height: 1;
  margin-bottom: 8px;
}

.drop-text {
  font-size: 14px;
}

/* 新增弹窗样式 */
.add-form {
  margin-bottom: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.mold-count {
  color: #1890ff;
  font-weight: 500;
}

/* 已排产项目 */
.scheduled-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scheduled-item {
  background: #f0f5ff;
  border: 1px solid #adc6ff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  color: #1890ff;
}

/* 页脚 */
.page-footer {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
