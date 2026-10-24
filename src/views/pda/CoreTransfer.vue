<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">组芯流转</div>
      <div class="pda-header-right"></div>
    </div>

    <div class="pda-content transfer-content">
      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">产线：</div>
            <div class="form-control">
              <a-select v-model:value="line" :options="lineOptions" style="width: 100%" />
            </div>
          </div>
          <div class="form-row last">
            <div class="form-label">上下料：</div>
            <div class="form-control">
              <a-select v-model:value="position" :options="positionOptions" style="width: 100%" />
            </div>
          </div>
        </div>
      </div>

      <div class="section-block transfer-card">
        <div class="transfer-row">
          <span class="transfer-label">消耗芯架：</span>
          <a-select v-model:value="consumptionFrame" :options="consumptionFrameOptions" allow-clear placeholder="选择消耗芯架编码" style="flex: 1" />
          <div class="scan-btn" @click="scanFrame('consumption')"><ScanOutlined /></div>
        </div>
        <div class="core-info" v-if="consumptionInfo">
          <div class="core-info-title">消耗芯架砂芯信息</div>
          <div class="core-grid">
            <div><span>任务编号</span><strong>{{ consumptionInfo.taskNumber }}</strong></div>
            <div><span>砂芯名称</span><strong>{{ consumptionInfo.coreName }}</strong></div>
            <div><span>砂芯数量</span><strong>{{ consumptionInfo.coreCount }}</strong></div>
            <div><span>生产批次</span><strong>{{ consumptionInfo.batch }}</strong></div>
          </div>
        </div>
      </div>

      <div class="section-block transfer-card">
        <div class="transfer-row">
          <span class="transfer-label">流转芯架：</span>
          <a-select v-model:value="transferFrame" :options="transferFrameOptions" allow-clear placeholder="选择流转芯架编码" style="flex: 1" />
          <div class="scan-btn" @click="scanFrame('transfer')"><ScanOutlined /></div>
        </div>
        <div class="core-info" v-if="transferInfo">
          <div class="core-info-title">流转芯架砂芯信息</div>
          <div class="core-grid">
            <div><span>任务编号</span><strong>{{ transferInfo.taskNumber }}</strong></div>
            <div><span>砂芯名称</span><strong>{{ transferInfo.coreName }}</strong></div>
            <div><span>砂芯数量</span><strong>{{ transferInfo.coreCount }}</strong></div>
            <div><span>生产批次</span><strong>{{ transferInfo.batch }}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <div class="pda-footer">
      <div class="mode-row">
        <span>当前方式</span>
        <strong>{{ productionMode }}</strong>
      </div>
      <a-button type="primary" block size="large" class="pda-submit-btn" @click="modeVisible = true">
        切换生产方式
      </a-button>
    </div>

    <a-modal v-model:open="modeVisible" title="选择生产方式" :footer="null" :width="420">
      <div class="mode-options">
        <a-button type="primary" block @click="selectMode('砂芯流转')">砂芯流转</a-button>
        <a-button type="primary" block @click="selectMode('消耗流转')">消耗流转</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { simulateRackScan } from '@/lib/pdaRackScan'
import { ArrowLeftOutlined, ScanOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const line = ref('大三HWS线')
const position = ref('异常上下料')
const consumptionFrame = ref<string>()
const transferFrame = ref<string>()
const productionMode = ref('正常组芯')
const modeVisible = ref(false)

const lineOptions = ['大三HWS线', '大四HWS线', '大三KW线'].map(value => ({ label: value, value }))
const positionOptions = ['异常上下料', '正常上下料', '维护上下料'].map(value => ({ label: value, value }))
const consumptionFrameOptions = ['CJ-2025-001', 'CJ-2025-002', 'CJ-2025-003', 'CJ-2025-004', 'CJ-2025-005', 'CJ-2025-006'].map(value => ({ label: value, value }))
const transferFrameOptions = ['LZ-2025-001', 'LZ-2025-002', 'LZ-2025-003', 'LZ-2025-004', 'LZ-2025-005', 'LZ-2025-006'].map(value => ({ label: value, value }))

interface CoreInfo {
  taskNumber: string
  coreName: string
  coreCount: number
  batch: string
}

const consumptionInfo = ref<CoreInfo | null>(null)
const transferInfo = ref<CoreInfo | null>(null)

const coreInfo = (): CoreInfo => {
  const rack = simulateRackScan()
  return {
    taskNumber: rack.coreNo,
    coreName: rack.coreName,
    coreCount: rack.quantity,
    batch: rack.batch
  }
}

const scanFrame = (type: 'consumption' | 'transfer') => {
  const info = coreInfo()
  if (type === 'consumption') {
    consumptionFrame.value = 'CJ-2025-001'
    consumptionInfo.value = info
    message.success('消耗芯架扫描成功')
  } else {
    transferFrame.value = 'LZ-2025-001'
    transferInfo.value = info
    message.success('流转芯架扫描成功')
  }
}

const selectMode = (mode: string) => {
  productionMode.value = mode
  modeVisible.value = false
  message.success(`已切换为${mode}`)
}

const goBack = () => router.back()
</script>

<style scoped>
.transfer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transfer-card {
  padding: 14px 16px;
}

.transfer-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transfer-label {
  flex-shrink: 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.core-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.core-info-title {
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.core-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.core-grid div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #999;
  font-size: 12px;
}

.core-grid strong {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.mode-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
}

.mode-row strong {
  color: #1890ff;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
