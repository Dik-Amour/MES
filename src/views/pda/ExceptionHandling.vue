<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">异常上下料</div>
      <div class="pda-header-right"></div>
    </div>

    <div class="pda-content exception-content">
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

      <div class="section-block rack-scan-card">
        <div class="form-row last">
          <div class="form-label">芯架码：</div>
          <div class="form-control with-suffix">
            <a-input v-model:value="scannedRackCode" readonly placeholder="点击右侧按钮模拟扫码" />
            <div class="scan-btn" @click="handleScanRack">
              <ScanOutlined />
            </div>
          </div>
        </div>
        <div v-if="lastScannedRack" class="scan-result">
          <span>已扫描：{{ lastScannedRack.rackCode }}</span>
          <strong>{{ lastScannedRack.coreName }} · {{ lastScannedRack.quantity }} 颗</strong>
        </div>
      </div>

      <div class="section-block rack-scan-card">
        <div class="form-row last">
          <div class="form-label">托盘码：</div>
          <div class="form-control with-suffix">
            <a-input v-model:value="palletCode" readonly placeholder="点击右侧按钮模拟扫码" />
            <div class="scan-btn" @click="handlePalletScan">
              <ScanOutlined />
            </div>
          </div>
        </div>
        <div v-if="palletInfo" class="scan-result">
          <span>已扫描：{{ palletInfo.palletCode }}</span>
          <strong>{{ palletInfo.rfid }}</strong>
        </div>
      </div>

      <div class="section-block tray-card">
        <div class="tray-title">当前托盘信息</div>
        <a-radio-group v-model:value="selectedItem" class="tray-list">
          <a-radio value="current">
            <div class="tray-info">
              <strong>RFID20251105001</strong>
              <span>进气道芯组 · 8 颗</span>
            </div>
          </a-radio>
        </a-radio-group>
      </div>

      <div class="section-block rack-scan-card">
        <div class="form-row last">
          <div class="form-label">芯架码：</div>
          <div class="form-control with-suffix">
            <a-input v-model:value="scannedRackCode" readonly placeholder="点击右侧按钮模拟扫码" />
            <div class="scan-btn" @click="handleScanRack">
              <ScanOutlined />
            </div>
          </div>
        </div>
        <div v-if="lastScannedRack" class="scan-result">
          <span>已扫描：{{ lastScannedRack.rackCode }}</span>
          <strong>{{ lastScannedRack.coreName }} · {{ lastScannedRack.quantity }} 颗</strong>
        </div>
      </div>

      <div class="section-block rack-scan-card">
        <div class="form-row last">
          <div class="form-label">托盘码：</div>
          <div class="form-control with-suffix">
            <a-input v-model:value="palletCode" readonly placeholder="点击右侧按钮模拟扫码" />
            <div class="scan-btn" @click="handlePalletScan">
              <ScanOutlined />
            </div>
          </div>
        </div>
        <div v-if="palletInfo" class="scan-result">
          <span>已扫描：{{ palletInfo.palletCode }}</span>
          <strong>{{ palletInfo.rfid }}</strong>
        </div>
      </div>

      <div class="section-block tray-card">
        <div class="tray-title">线上托盘</div>
        <a-radio-group v-model:value="selectedItem" class="tray-list">
          <a-radio value="online1">
            <div class="tray-info"><strong>RFID20251105002</strong><span>排气道芯组 · 6 颗</span></div>
          </a-radio>
          <a-radio value="online2">
            <div class="tray-info"><strong>RFID20251105003</strong><span>水套芯组 · 4 颗</span></div>
          </a-radio>
        </a-radio-group>
      </div>

      <div class="section-block rack-scan-card">
        <div class="form-row last">
          <div class="form-label">芯架码：</div>
          <div class="form-control with-suffix">
            <a-input v-model:value="scannedRackCode" readonly placeholder="点击右侧按钮模拟扫码" />
            <div class="scan-btn" @click="handleScanRack">
              <ScanOutlined />
            </div>
          </div>
        </div>
        <div v-if="lastScannedRack" class="scan-result">
          <span>已扫描：{{ lastScannedRack.rackCode }}</span>
          <strong>{{ lastScannedRack.coreName }} · {{ lastScannedRack.quantity }} 颗</strong>
        </div>
      </div>

      <div class="section-block rack-scan-card">
        <div class="form-row last">
          <div class="form-label">托盘码：</div>
          <div class="form-control with-suffix">
            <a-input v-model:value="palletCode" readonly placeholder="点击右侧按钮模拟扫码" />
            <div class="scan-btn" @click="handlePalletScan">
              <ScanOutlined />
            </div>
          </div>
        </div>
        <div v-if="palletInfo" class="scan-result">
          <span>已扫描：{{ palletInfo.palletCode }}</span>
          <strong>{{ palletInfo.rfid }}</strong>
        </div>
      </div>

      <div class="section-block tray-card">
        <div class="tray-title">缓存区</div>
        <a-radio-group v-model:value="selectedItem" class="tray-list">
          <a-radio value="cache1">
            <div class="tray-info"><strong>M01-01</strong><span>排气道芯组 · 2 颗</span></div>
          </a-radio>
          <a-radio value="cache2">
            <div class="tray-info"><strong>M01-02</strong><span>水套芯组 · 3 颗</span></div>
          </a-radio>
        </a-radio-group>
      </div>
    </div>

    <div class="pda-footer">
      <div class="action-row">
        <a-button type="primary" :disabled="!canUpload && !canDownload" @click="openAction">执行上下料</a-button>
      </div>
      <div class="pda-footer-tip">请选择需要处理的托盘或缓存库位</div>
    </div>

    <a-modal v-model:open="actionVisible" :title="actionTitle" :footer="null" :width="440">
      <div v-if="canDownload" class="action-modal">
        <div class="modal-label">选择载体编码</div>
        <a-select v-model:value="carrierCode" :options="carrierOptions" placeholder="请选择载体编码" style="width: 100%" />
        <div class="modal-label">选择库位</div>
        <div class="location-grid">
          <button
            v-for="location in locations"
            :key="location.code"
            class="location-item"
            :class="{ active: selectedLocation === location.code, occupied: location.occupied }"
            :disabled="location.occupied"
            @click="selectedLocation = location.code"
          >
            {{ location.code }}
            <span>{{ location.occupied ? '占用' : '可用' }}</span>
          </button>
        </div>
        <a-button type="primary" block :disabled="!carrierCode || !selectedLocation" @click="confirmAction">确认下料</a-button>
      </div>
      <div v-else class="action-modal">
        <div class="upload-info"><span>主线托盘RFID：</span><strong>RFID20251105999</strong></div>
        <div class="upload-info"><span>缓存库位：</span><strong>{{ selectedItem.replace('cache', 'M01-0') }}</strong></div>
        <a-button type="primary" block @click="confirmAction">确认上料</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { simulateRackScan } from '@/lib/pdaRackScan'
import { simulatePalletScan } from '@/lib/pdaPalletScan'
import { ArrowLeftOutlined, ScanOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const line = ref('大四HWS线')
const workstation = ref('界面下料')
const selectedItem = ref('current')
const actionVisible = ref(false)
const carrierCode = ref<string>()
const selectedLocation = ref('')
const scannedRackCode = ref('')
const lastScannedRack = ref<ReturnType<typeof simulateRackScan> | null>(null)
const palletCode = ref('')
const palletInfo = ref<ReturnType<typeof simulatePalletScan> | null>(null)

const handlePalletScan = () => {
  const result = simulatePalletScan(palletCode.value)
  palletCode.value = result.palletCode
  palletInfo.value = result
  message.success(`托盘扫码成功：${result.palletCode}`)
}

const handleScanRack = () => {
  const rack = simulateRackScan()
  scannedRackCode.value = rack.rackCode
  lastScannedRack.value = rack
  message.success(`芯架扫码成功：${rack.rackCode}`)
}

const lineOptions = ['大四HWS线', '大三KW线'].map(value => ({ label: value, value }))
const workstationOptions = ['界面下料', '界面上料', '异常处理'].map(value => ({ label: value, value }))
const carrierOptions = ['TP001', 'XJ002', 'LK003'].map(value => ({ label: value, value }))
const locations = [
  { code: 'M01-01', occupied: false },
  { code: 'M01-02', occupied: false },
  { code: 'M01-03', occupied: true },
  { code: 'M01-04', occupied: false },
  { code: 'M01-05', occupied: true },
  { code: 'M01-06', occupied: false }
]

const canDownload = computed(() => ['current', 'online1', 'online2'].includes(selectedItem.value))
const canUpload = computed(() => selectedItem.value.startsWith('cache'))
const actionTitle = computed(() => (canDownload.value ? '选择缓存区库位' : '确认上料'))

const openAction = () => {
  carrierCode.value = undefined
  selectedLocation.value = ''
  actionVisible.value = true
}

const confirmAction = () => {
  actionVisible.value = false
  message.success(canDownload.value ? '下料成功' : '上料成功')
}

const goBack = () => router.back()
</script>

<style scoped>
.exception-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rack-scan-card {
  padding: 4px 16px;
}

.scan-result {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 0 0 12px;
  color: #666;
  font-size: 13px;
}

.scan-result strong {
  color: #1890ff;
  font-weight: 500;
}

.tray-card {
  padding: 14px 16px;
}

.tray-title {
  margin-bottom: 12px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.tray-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.tray-list :deep(.ant-radio-wrapper) {
  align-items: flex-start;
}

.tray-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-left: 4px;
}

.tray-info span {
  color: #666;
  font-size: 13px;
}

.action-row {
  display: flex;
}

.action-row .ant-btn {
  flex: 1;
}

.action-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-label {
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.location-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 6px;
}

.location-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid #d9e8ff;
  border-radius: 8px;
  background: #f8fbff;
  color: #1890ff;
  cursor: pointer;
}

.location-item span {
  color: #52c41a;
  font-size: 11px;
}

.location-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.location-item.occupied {
  border-color: #f0f0f0;
  background: #fafafa;
  color: #bfbfbf;
  cursor: not-allowed;
}

.location-item.occupied span {
  color: #ff4d4f;
}

.upload-info {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  color: #666;
  font-size: 14px;
}

.upload-info strong {
  color: #333;
  font-weight: 500;
}
</style>
