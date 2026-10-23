<template>
  <div class="pda-page">
    <!-- 顶部标题栏 -->
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">大机组芯下芯</div>
      <div class="pda-header-right"></div>
    </div>

    <!-- 内容区域 -->
    <div class="pda-content">
      <!-- 区块1：产线 & 上机位 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">产线：</div>
            <div class="form-control">
              <a-input
                v-model:value="formData.productionLine"
                placeholder="产线"
                readonly
                @click="showProductionLinePicker = true"
              />
            </div>
          </div>
          <div class="form-row last">
            <div class="form-label">上机位：</div>
            <div class="form-control with-suffix">
              <a-input
                v-model:value="formData.machinePosition"
                placeholder="上机位"
                allow-clear
              />
              <div class="scan-btn" @click="handleScanMachinePosition">
                <QrcodeOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 区块2：日期切换 -->
      <div class="date-nav">
        <div class="date-nav-btn" @click="changeDate(-1)">前一天</div>
        <a-date-picker
          v-model:value="currentDate"
          :allow-clear="false"
          class="date-nav-picker"
        />
        <div class="date-nav-btn" @click="changeDate(1)">后一天</div>
      </div>

      <!-- 区块3：砂箱号扫描 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row last">
            <div class="form-label">砂箱号：</div>
            <div class="form-control with-suffix">
              <a-input
                v-model:value="formData.boxCode"
                placeholder="请扫码"
                @press-enter="handleBoxScan"
              />
              <div class="scan-btn" @click="handleBoxScan">
                <ScanOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 区块4：芯架码扫描 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row last">
            <div class="form-label">芯架码：</div>
            <div class="form-control with-suffix">
              <a-input
                v-model:value="formData.rackCode"
                placeholder="请扫码"
                @press-enter="handleRackScan"
              />
              <div class="scan-btn" @click="handleRackScan">
                <ScanOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 区块5：已扫描芯架列表 -->
      <div class="rack-list-wrapper">
        <div class="rack-header">
          <span class="rack-header-title">已扫描芯架列表</span>
          <span class="rack-count">（{{ rackList.length }}个芯架）</span>
        </div>
        <div class="rack-list-body">
          <div v-for="(item, index) in rackList" :key="item.rackCode" class="rack-card">
            <div class="rack-card-delete" @click="removeRack(index)">
              <DeleteOutlined />
            </div>
            <div class="info-grid">
              <div class="info-cell">
                <div class="info-cell-label">砂芯编码</div>
                <div class="info-cell-value">{{ item.coreNo }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">砂芯名称</div>
                <div class="info-cell-value">{{ item.coreName }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">芯架码</div>
                <div class="info-cell-value">{{ item.rackCode }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">扫描时间</div>
                <div class="info-cell-value">{{ item.scanTime }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">数量</div>
                <div class="info-cell-value highlight">{{ item.quantity }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">剩余数量</div>
                <div class="info-cell-value highlight">{{ item.remainQuantity }}</div>
              </div>
            </div>
          </div>
          <div v-if="rackList.length === 0" class="rack-empty">暂无扫描记录，请扫描芯架码</div>
        </div>
      </div>

      <!-- 产线选择弹窗 -->
      <a-drawer
        v-model:open="showProductionLinePicker"
        title="选择产线"
        placement="bottom"
        :height="360"
        :closable="true"
      >
        <div class="picker-list">
          <div
            v-for="line in productionLineOptions"
            :key="line"
            class="picker-item"
            :class="{ active: formData.productionLine === line }"
            @click="selectProductionLine(line)"
          >
            <span>{{ line }}</span>
            <CheckOutlined v-if="formData.productionLine === line" class="check-icon" />
          </div>
        </div>
      </a-drawer>
    </div>

    <!-- 底部操作区 -->
    <div class="pda-footer">
      <a-button type="primary" block size="large" class="submit-btn" :disabled="!canSubmit" @click="handleSubmit">
        <CheckOutlined /> 确认
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  ScanOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 产线选项
const productionLineOptions = [
  '机体线',
  '缸体线',
  '缸盖线',
  '壳体线'
]

// 表单数据
const formData = reactive({
  productionLine: undefined as string | undefined,
  machinePosition: undefined as string | undefined,
  rackCode: '',
  boxCode: ''
})

// 当前日期（默认今天）
const currentDate = ref(dayjs())

// 切换日期
const changeDate = (delta: number) => {
  currentDate.value = currentDate.value.add(delta, 'day')
}

// 已扫描芯架列表
const rackList = ref<{
  rackCode: string
  coreNo: string
  coreName: string
  quantity: number
  remainQuantity: number
  scanTime: string
}[]>([])

// 产线选择弹窗
const showProductionLinePicker = ref(false)

// 是否可提交
const canSubmit = computed(() => {
  return formData.productionLine && formData.machinePosition && formData.boxCode && rackList.value.length > 0
})

// 选择产线
const selectProductionLine = (line: string) => {
  formData.productionLine = line
  formData.machinePosition = undefined
  showProductionLinePicker.value = false
}

// 扫码获取上机位
const handleScanMachinePosition = () => {
  // TODO: 调用扫码接口获取上机位信息
  formData.machinePosition = '机体线封箱'
  message.success('上机位扫码成功')
}

// 扫描芯架码（直接填充到已扫描芯架列表）
const handleRackScan = () => {
  const code = formData.rackCode.trim()
  if (!code) {
    message.warning('请扫描芯架码')
    return
  }
  // 检查是否重复扫描
  if (rackList.value.some(item => item.rackCode === code)) {
    message.warning('该芯架已扫描，请勿重复')
    formData.rackCode = ''
    return
  }
  // TODO: 调用接口查询芯架信息，以下为模拟数据
  const mockMap: Record<string, { coreNo: string; coreName: string; quantity: number }> = {
    'MPJ005': { coreNo: 'C000005980', coreName: '1000978236R_KMA_jzx_减重芯', quantity: 372 },
    'MPJ006': { coreNo: 'C000006123', coreName: '1000978237R_KMA_jzx_连通芯', quantity: 288 },
    'MPJ007': { coreNo: 'C000006230', coreName: '1001024589R_KMA_jzx_水套芯', quantity: 316 }
  }
  const info = mockMap[code] || {
    coreNo: `C${Math.floor(Math.random() * 900000000 + 100000000)}`,
    coreName: `${code}_砂芯`,
    quantity: Math.floor(Math.random() * 300) + 50
  }
  rackList.value.push({
    rackCode: code,
    ...info,
    remainQuantity: info.quantity,
    scanTime: dayjs().format('HH:mm:ss')
  })
  formData.rackCode = ''
  message.success(`芯架 ${code} 已扫描`)
}

// 扫描砂箱号
const handleBoxScan = () => {
  // TODO: 调用扫码接口获取砂箱号
  formData.boxCode = `3302140001-${Math.floor(Math.random() * 9000 + 1000)}`
  message.success('砂箱号扫码成功')
}

// 移除单个芯架
const removeRack = (index: number) => {
  rackList.value.splice(index, 1)
}

// 确认下芯
const handleSubmit = () => {
  if (!canSubmit.value) return
  // TODO: 调用下芯接口
  const total = rackList.value.reduce((sum, item) => sum + item.quantity, 0)
  message.success(`下芯确认成功，共 ${rackList.value.length} 个芯架，${total} 件`)
  // 清空当前页面内容
  formData.productionLine = undefined
  formData.machinePosition = undefined
  formData.rackCode = ''
  formData.boxCode = ''
  rackList.value = []
  currentDate.value = dayjs()
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* 顶部标题栏 */
.pda-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 100;
}

.pda-header-left:active {
  background: rgba(255, 255, 255, 0.2);
}

.pda-header-right {
  width: 40px;
}

/* 内容区域 */
.pda-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}

/* 区块 */
.section-block {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-body {
  padding: 4px 16px;
}

.form-label {
  width: 80px;
  min-width: 80px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.form-control.with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control.with-suffix :deep(.ant-input-affix-wrapper) {
  flex: 1;
}

.form-row.last {
  border-bottom: none;
}

/* 日期切换行 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.date-nav-btn {
  font-size: 15px;
  color: #1890ff;
  font-weight: 500;
  padding: 8px 4px;
  user-select: none;
}

.date-nav-btn:active {
  opacity: 0.6;
}

.date-nav-picker {
  width: 150px;
  text-align: center;
}

/* 已扫描芯架列表 */
.rack-list-wrapper {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.rack-header {
  display: flex;
  align-items: baseline;
  padding: 12px 16px 8px;
}

.rack-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.rack-count {
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
}

.rack-list-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 12px 12px;
  max-height: 400px;
  overflow-y: auto;
}

.rack-card {
  position: relative;
  border: 1px solid #e8f0fe;
  border-left: 3px solid #1890ff;
  background: #f8fbff;
  border-radius: 8px;
  padding: 12px 16px;
  flex-shrink: 0;
}

.rack-card-delete {
  position: absolute;
  top: 10px;
  right: 12px;
  color: #ff4d4f;
  font-size: 16px;
  padding: 4px;
}

.rack-card-delete:active {
  background: #ffccc7;
  border-radius: 4px;
}

.rack-empty {
  padding: 24px 0;
  text-align: center;
  color: #999;
  font-size: 13px;
}

/* 双列网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  padding-right: 24px;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-cell-label {
  font-size: 12px;
  color: #999;
}

.info-cell-value {
  font-size: 14px;
  color: #333;
  word-break: break-all;
}

.info-cell-value.highlight {
  color: #1890ff;
  font-weight: 700;
}

/* 产线选择弹窗 */
.picker-list {
  display: flex;
  flex-direction: column;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
}

.picker-item:active {
  background: #f5f5f5;
}

.picker-item.active {
  color: #1890ff;
  font-weight: 500;
}

.check-icon {
  color: #1890ff;
  font-size: 16px;
}

/* 底部操作区 */
.pda-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}
</style>
