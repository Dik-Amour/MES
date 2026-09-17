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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import dayjs from 'dayjs'

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
