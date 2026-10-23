<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">制芯任务</div>
      <div class="pda-header-right"></div>
    </div>

    <div class="pda-content task-content">
      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">产线：</div>
            <div class="form-control">
              <a-select v-model:value="line" :options="lineOptions" style="width: 100%" />
            </div>
          </div>
          <div class="form-row last">
            <div class="form-label">工位：</div>
            <div class="form-control">
              <a-select v-model:value="workstation" :options="workstationOptions" style="width: 100%" />
            </div>
          </div>
        </div>
      </div>

      <div class="section-block mold-card">
        <div class="section-title">芯盒型号</div>
        <div class="mold-row">
          <a-select v-model:value="moldModel" :options="moldOptions" placeholder="请选择芯盒型号" style="flex: 1" />
          <a-button @click="scanVisible = true"><CameraOutlined /></a-button>
        </div>
      </div>

      <div v-if="moldModel" class="section-block task-list-card">
        <div class="task-list-header">
          <span>制芯任务列表</span>
          <span class="task-count">{{ currentTasks.length }} 条</span>
        </div>
        <div v-for="task in currentTasks" :key="task.id" class="task-item" @click="openDetail(task)">
          <div class="task-item-top">
            <strong>{{ task.taskName }} · {{ task.taskNumber }}</strong>
            <a-tag :color="statusColor(task.status)">{{ task.status }}</a-tag>
          </div>
          <div class="task-item-meta">
            <span>设备：{{ task.equipment }}</span>
            <span>计划：{{ task.plannedQuantity }} 模</span>
            <span>已报工：{{ task.completedQuantity }} 模</span>
          </div>
          <div class="task-item-date">计划日期：{{ task.plannedDate }}</div>
        </div>
      </div>

      <a-empty v-else description="请选择芯盒型号查看任务" />
    </div>

    <a-modal v-model:open="scanVisible" title="扫描芯盒型号" :footer="null" :width="420">
      <div class="scan-panel">
        <div class="scan-frame">
          <div class="scan-line"></div>
          <div class="scan-corners" />
        </div>
        <p>请将芯盒条码对准扫描框</p>
        <a-button type="primary" block @click="mockScan">模拟扫描</a-button>
      </div>
    </a-modal>

    <a-modal v-model:open="detailVisible" title="任务详情" :footer="null" :width="520">
      <div v-if="selectedTask" class="detail-content">
        <div class="detail-row"><span>产线</span><strong>{{ line }}</strong></div>
        <div class="detail-row"><span>毛坯</span><strong>{{ selectedTask.taskNumber }}</strong></div>
        <div class="detail-row"><span>芯盒件号</span><strong>{{ selectedTask.moldModel }}</strong></div>
        <div class="detail-row"><span>芯盒名称</span><strong>{{ selectedTask.moldName }}</strong></div>
        <div class="detail-row"><span>生产设备</span><strong>{{ selectedTask.equipment }}</strong></div>
        <div class="detail-row"><span>计划生产数</span><strong>{{ selectedTask.plannedQuantity }} 模</strong></div>
        <div class="detail-row"><span>已报工数</span><strong>{{ selectedTask.completedQuantity }} 模</strong></div>
        <div class="shift-row">
          <a-radio-group v-model:value="shift">
            <a-radio-button value="白班">白班</a-radio-button>
            <a-radio-button value="夜班">夜班</a-radio-button>
          </a-radio-group>
        </div>
        <div class="quantity-row">
          <span>报工数（模）</span>
          <a-input-number v-model:value="reportQuantity" :min="0" :max="selectedTask.plannedQuantity" />
        </div>
        <div class="quantity-row">
          <span>废品数（颗）</span>
          <a-input-number v-model:value="wasteQuantity" :min="0" />
        </div>
        <div class="detail-actions">
          <a-button type="primary" @click="submitReport">报工</a-button>
          <a-button danger @click="endProduction">结束生产</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, CameraOutlined } from '@ant-design/icons-vue'

interface Task {
  id: number
  taskName: string
  taskNumber: string
  equipment: string
  moldModel: string
  moldName: string
  plannedQuantity: number
  completedQuantity: number
  plannedDate: string
  status: string
}

const router = useRouter()
const line = ref('制芯线1')
const workstation = ref('工位1')
const moldModel = ref<string>()
const scanVisible = ref(false)
const detailVisible = ref(false)
const selectedTask = ref<Task | null>(null)
const shift = ref('白班')
const reportQuantity = ref(0)
const wasteQuantity = ref(0)

const lineOptions = ['制芯线1', '制芯线2', '制芯线3'].map(value => ({ label: value, value }))
const workstationOptions = ['工位1', '工位2', '工位3'].map(value => ({ label: value, value }))
const moldOptions = ['XH-2025-001', 'XH-2025-002', 'XH-2025-003', 'XH-2025-004'].map(value => ({ label: value, value }))

const taskMap: Record<string, Task[]> = {
  'XH-2025-001': [
    { id: 1, taskName: '机体', taskNumber: '612600013459R', equipment: '223250217-001', moldModel: 'Q302240209', moldName: '挺杆芯冷芯盒', plannedQuantity: 11, completedQuantity: 0, plannedDate: '2025-07-22', status: '待开始' },
    { id: 2, taskName: '机体', taskNumber: '612600013460R', equipment: '223250217-002', moldModel: 'Q302240209', moldName: '挺杆芯冷芯盒', plannedQuantity: 15, completedQuantity: 5, plannedDate: '2025-07-22', status: '进行中' }
  ],
  'XH-2025-002': [
    { id: 3, taskName: '缸盖', taskNumber: '612600013461R', equipment: '223250217-003', moldModel: 'Q302240210', moldName: '进气道芯冷芯盒', plannedQuantity: 20, completedQuantity: 20, plannedDate: '2025-07-22', status: '已完成' }
  ],
  'XH-2025-003': [
    { id: 4, taskName: '缸体', taskNumber: '612600013462R', equipment: '223250217-004', moldModel: 'Q302240211', moldName: '水套芯冷芯盒', plannedQuantity: 18, completedQuantity: 8, plannedDate: '2025-07-23', status: '进行中' }
  ],
  'XH-2025-004': [
    { id: 5, taskName: '机体', taskNumber: '612600013463R', equipment: '223250217-005', moldModel: 'Q302240212', moldName: '冷却水道芯冷芯盒', plannedQuantity: 25, completedQuantity: 0, plannedDate: '2025-07-23', status: '待开始' }
  ]
}

const currentTasks = computed(() => (moldModel.value ? taskMap[moldModel.value] ?? [] : []))

const statusColor = (status: string) => ({
  待开始: 'default',
  进行中: 'processing',
  已完成: 'success'
}[status] ?? 'default')

const openDetail = (task: Task) => {
  selectedTask.value = task
  reportQuantity.value = 0
  wasteQuantity.value = 0
  detailVisible.value = true
}

const mockScan = () => {
  moldModel.value = 'XH-2025-001'
  scanVisible.value = false
  message.success('芯盒型号扫描成功')
}

const submitReport = () => {
  if (!selectedTask.value || reportQuantity.value <= 0) {
    message.warning('请输入报工数量')
    return
  }
  selectedTask.value.completedQuantity += reportQuantity.value
  message.success('报工成功')
  detailVisible.value = false
}

const endProduction = () => {
  message.success('生产任务已结束')
  detailVisible.value = false
}

const goBack = () => router.back()
</script>

<style scoped>
.task-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mold-card,
.task-list-card {
  padding: 14px 16px;
}

.section-title {
  margin-bottom: 12px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.mold-row {
  display: flex;
  gap: 8px;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.task-count {
  color: #999;
  font-size: 12px;
  font-weight: 400;
}

.task-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.task-item:last-child {
  border-bottom: 0;
}

.task-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.task-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 8px;
  color: #666;
  font-size: 12px;
}

.task-item-date {
  margin-top: 6px;
  color: #999;
  font-size: 12px;
}

.scan-panel {
  text-align: center;
}

.scan-frame {
  position: relative;
  width: 220px;
  height: 160px;
  margin: 0 auto 14px;
  border: 2px solid #1890ff;
  border-radius: 10px;
  background: #f8fbff;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  height: 2px;
  background: #1890ff;
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.6);
}

.scan-panel p {
  margin-bottom: 16px;
  color: #666;
  font-size: 13px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
  color: #666;
  font-size: 14px;
}

.detail-row strong {
  color: #333;
  font-weight: 500;
  text-align: right;
}

.shift-row {
  padding: 6px 0;
}

.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #666;
  font-size: 14px;
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.detail-actions .ant-btn {
  flex: 1;
}
</style>
