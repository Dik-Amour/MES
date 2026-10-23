<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">人工刻号</div>
      <div class="pda-header-right"></div>
    </div>

    <div class="pda-content marking-content">
      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">产线：</div>
            <div class="form-control">
              <a-select v-model:value="line" :options="lineOptions" style="width: 100%" />
            </div>
          </div>
          <div class="form-row last">
            <div class="form-label">刻号类型：</div>
            <div class="form-control">
              <a-select v-model:value="markingType" :options="typeOptions" style="width: 100%" />
            </div>
          </div>
        </div>
      </div>

      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">刻号信息：</div>
            <div class="form-control">
              <a-input v-model:value="serialNumber" placeholder="请输入刻号信息" />
            </div>
          </div>
          <div class="button-row">
            <a-button type="primary" @click="confirmSerial">设置</a-button>
            <a-button danger @click="terminateMarking">终止</a-button>
          </div>
        </div>
      </div>

      <div class="section-block info-card">
        <div class="info-header">托盘信息</div>
        <div class="pda-info-row"><span>当前托盘RFID：</span><strong>{{ rfid }}</strong></div>
        <div class="pda-info-row"><span>砂芯名称：</span><strong>排气道砂芯</strong></div>
        <div class="pda-info-row"><span>制芯任务：</span><strong>612600013459R/机体</strong></div>
        <div class="pda-info-row"><span>批次号：</span><strong>BATCH-20251103-A</strong></div>
      </div>
    </div>

    <div class="pda-footer">
      <a-button type="primary" block size="large" class="pda-submit-btn" :disabled="!canStart" @click="startMarking">
        确定
      </a-button>
      <div class="pda-footer-tip">{{ serialSet ? '刻号已设置，可以开始操作' : '请先设置刻号信息' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const line = ref('大四HWS线')
const markingType = ref('人工刻号')
const serialNumber = ref('')
const serialSet = ref(false)
const rfid = ref('RFID-ML-001234')

const lineOptions = [
  { label: '大四HWS线', value: '大四HWS线' },
  { label: '大三KW线', value: '大三KW线' }
]
const typeOptions = [
  { label: '人工刻号', value: '人工刻号' },
  { label: '自动刻号', value: '自动刻号' }
]

const canStart = computed(() => serialSet.value && serialNumber.value.trim().length > 0)

const confirmSerial = () => {
  const value = serialNumber.value.replace(/\D/g, '')
  serialNumber.value = value
  if (!value) {
    message.warning('请输入刻号信息')
    return
  }
  serialSet.value = true
  message.success('刻号设置成功')
}

const terminateMarking = () => {
  serialSet.value = false
  serialNumber.value = ''
  message.info('已终止当前刻号')
}

const startMarking = () => {
  if (!canStart.value) return
  message.success(`刻号完成：${serialNumber.value}`)
}

const goBack = () => router.back()
</script>

<style scoped>
.marking-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.button-row {
  display: flex;
  gap: 10px;
  padding: 12px 0;
}

.info-card {
  padding: 14px 16px;
}

.info-header {
  margin-bottom: 10px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.pda-info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  color: #666;
  font-size: 14px;
}

.pda-info-row:last-child {
  border-bottom: 0;
}

.pda-info-row strong {
  color: #333;
  font-weight: 500;
  text-align: right;
}
</style>
