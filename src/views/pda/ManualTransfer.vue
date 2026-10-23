<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">人工流转</div>
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
            <div class="form-label">工位：</div>
            <div class="form-control">
              <a-select v-model:value="workstation" :options="workstationOptions" style="width: 100%" />
            </div>
          </div>
        </div>
      </div>

      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">上盖芯：</div>
            <div class="form-control">
              <a-input v-model:value="upperCore" placeholder="PGE-TR-006" />
            </div>
            <a-button type="primary" @click="confirmCore('上盖芯', upperCore)">确认</a-button>
          </div>
          <div class="form-row last">
            <div class="form-label">挺杆芯：</div>
            <div class="form-control">
              <a-input v-model:value="pushrodCore" placeholder="PGE-TR-006" />
            </div>
            <a-button type="primary" @click="confirmCore('挺杆芯', pushrodCore)">确认</a-button>
          </div>
        </div>
      </div>

      <div class="section-block frame-section">
        <div class="section-title">上盖芯</div>
        <div class="frame-grid">
          <button
            v-for="frame in upperFrames"
            :key="frame"
            class="frame-item"
            :class="{ active: selectedFrame?.code === frame }"
            @click="selectFrame('upper', frame)"
          >
            {{ frame }}
          </button>
        </div>
      </div>

      <div class="section-block frame-section">
        <div class="section-title">挺杆芯</div>
        <div class="frame-grid">
          <button
            v-for="frame in pushrodFrames"
            :key="frame"
            class="frame-item"
            :class="{ active: selectedFrame?.code === frame }"
            @click="selectFrame('pushrod', frame)"
          >
            {{ frame }}
          </button>
        </div>
      </div>

      <div v-if="selectedFrame" class="section-block selected-card">
        <div class="selected-title">{{ selectedFrame.typeName }} {{ selectedFrame.code }}</div>
        <div class="selected-row"><span>芯架状态：</span><strong>可绑定</strong></div>
        <div class="selected-row"><span>当前工位：</span><strong>{{ workstation }}</strong></div>
        <div class="selected-row"><span>砂芯编码：</span><strong>{{ selectedFrame.coreCode }}</strong></div>
      </div>
    </div>

    <div class="pda-footer">
      <a-button type="primary" block size="large" class="pda-submit-btn" :disabled="!selectedFrame" @click="confirmTransfer">
        确认流转
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const line = ref('大四HWS线')
const workstation = ref('工位1')
const upperCore = ref('PGE-TR-006')
const pushrodCore = ref('PGE-TR-006')

const lineOptions = ['大四HWS线', '大三HWS线', '大三KW线'].map(value => ({ label: value, value }))
const workstationOptions = ['工位1', '工位2', '工位3', '工位4'].map(value => ({ label: value, value }))
const upperFrames = ['PGE-FR-001', 'PGE-FR-002', 'PGE-FR-003', 'PGE-FR-004']
const pushrodFrames = ['PGE-FR-005', 'PGE-FR-006', 'PGE-FR-007', 'PGE-FR-008']

const selectedFrame = ref<{
  typeName: string
  code: string
  coreCode: string
} | null>(null)

const confirmCore = (name: string, code: string) => {
  if (!code.trim()) {
    message.warning(`请输入${name}编码`)
    return
  }
  message.success(`${name}编码已确认`)
}

const selectFrame = (type: 'upper' | 'pushrod', code: string) => {
  selectedFrame.value = {
    typeName: type === 'upper' ? '上盖芯' : '挺杆芯',
    code,
    coreCode: type === 'upper' ? upperCore.value : pushrodCore.value
  }
}

const confirmTransfer = () => {
  if (!selectedFrame.value) return
  message.success(`${selectedFrame.value.typeName} ${selectedFrame.value.code} 流转成功`)
}

const goBack = () => router.back()
</script>

<style scoped>
.transfer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-control + .ant-btn {
  margin-left: 8px;
}

.frame-section {
  padding: 14px 16px;
}

.section-title {
  margin-bottom: 12px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.frame-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.frame-item {
  height: 44px;
  border: 1px solid #d9e8ff;
  border-radius: 8px;
  background: #f8fbff;
  color: #1890ff;
  font-size: 14px;
  cursor: pointer;
}

.frame-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
  font-weight: 600;
}

.selected-card {
  padding: 14px 16px;
}

.selected-title {
  margin-bottom: 10px;
  color: #1890ff;
  font-size: 15px;
  font-weight: 600;
}

.selected-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  color: #666;
  font-size: 14px;
}

.selected-row strong {
  color: #333;
  font-weight: 500;
}
</style>
