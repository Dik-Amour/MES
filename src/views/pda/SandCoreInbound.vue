<template>
  <div class="pda-page">
    <!-- 顶部标题栏 -->
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">砂芯入库</div>
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
          <div class="form-row">
            <div class="form-label">上机位：</div>
            <div class="form-control with-suffix">
              <a-select
                v-model:value="formData.machinePosition"
                placeholder="上机位"
                :options="machinePositionOptions"
                allow-clear
                style="width: 100%"
              />
              <div class="scan-btn" @click="handleScanMachinePosition">
                <QrcodeOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 芯架码扫描 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row last">
            <div class="form-label">芯架码：</div>
            <div class="form-control with-suffix">
              <a-input
                v-model:value="formData.rackCode"
                placeholder="请扫码"
                @pressEnter="handleRackCodeScan"
              />
              <div class="scan-btn" @click="handleRackCodeScan">
                <ScanOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已添加芯架列表 -->
      <div v-if="rackInfoList.length > 0" class="rack-list-wrapper">
        <div class="rack-header">
          <span class="rack-header-title">已添加芯架</span>
          <span class="rack-header-clear" @click="handleClearAll">清空</span>
        </div>
        <div class="rack-list-scroll">
          <div v-for="(item, index) in rackInfoList" :key="item.rackCode" class="rack-card">
            <div class="rack-card-header">
              <span class="rack-card-title">{{ item.rackCode }}</span>
              <div class="rack-card-delete" @click="removeRackInfo(index)">
                <DeleteOutlined />
              </div>
            </div>
            <div class="rack-card-body">
              <div class="info-grid">
                <div class="info-cell">
                  <div class="info-cell-label">砂芯编号</div>
                  <div class="info-cell-value">{{ item.coreNo }}</div>
                </div>
                <div class="info-cell">
                  <div class="info-cell-label">砂芯名称</div>
                  <div class="info-cell-value">{{ item.coreName }}</div>
                </div>
                <div class="info-cell">
                  <div class="info-cell-label">制芯人</div>
                  <div class="info-cell-value">{{ item.maker }}</div>
                </div>
                <div class="info-cell">
                  <div class="info-cell-label">制芯设备</div>
                  <div class="info-cell-value">{{ item.equipment }}</div>
                </div>
                <div class="info-cell">
                  <div class="info-cell-label">制芯日期</div>
                  <div class="info-cell-value">{{ item.coreDate }}</div>
                </div>
                <div class="info-cell">
                  <div class="info-cell-label">砂芯数量</div>
                  <div class="info-cell-value highlight">{{ item.quantity }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 入库区域 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row last">
            <div class="form-label">入库区域：</div>
            <div class="form-control">
              <a-select
                v-model:value="formData.storageArea"
                placeholder="请选择入库区域"
                :options="storageAreaOptions"
                allow-clear
                style="width: 100%"
              />
            </div>
          </div>
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
        <CheckOutlined /> 确认入库
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
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
  '造型三线HWS清理',
  '造型三线KW清理',
  '造型二线大件清理',
  '造型二线中件清理',
  '造型一线大件清理',
  '造型一线中件清理'
]

// 上机位选项（可根据产线动态加载）
const machinePositionOptions = ref<{ label: string; value: string }[]>([])

// 表单数据
const formData = reactive({
  productionLine: undefined as string | undefined,
  machinePosition: undefined as string | undefined,
  rackCode: '',
  storageArea: undefined as string | undefined
})

// 入库区域选项
const storageAreaOptions = [
  { label: 'A区-一层', value: 'A区-一层' },
  { label: 'A区-二层', value: 'A区-二层' },
  { label: 'B区-一层', value: 'B区-一层' },
  { label: 'B区-二层', value: 'B区-二层' },
  { label: 'C区-一层', value: 'C区-一层' }
]

// 芯架信息列表
const rackInfoList = ref<{
  rackCode: string
  coreNo: string
  coreName: string
  quantity: number
  maker: string
  equipment: string
  coreDate: string
}[]>([])

// 合计数量
const totalQuantity = computed(() => {
  return rackInfoList.value.reduce((sum, item) => sum + item.quantity, 0)
})

// 产线选择弹窗
const showProductionLinePicker = ref(false)

// 是否可提交
const canSubmit = computed(() => {
  return formData.productionLine && formData.machinePosition && formData.storageArea && rackInfoList.value.length > 0
})

// 选择产线
const selectProductionLine = (line: string) => {
  formData.productionLine = line
  formData.machinePosition = undefined
  showProductionLinePicker.value = false
  // 根据产线加载上机位选项
  loadMachinePositions(line)
}

// 加载上机位选项（模拟）
const loadMachinePositions = (line: string) => {
  // TODO: 根据产线从接口获取上机位列表
  machinePositionOptions.value = [
    { label: `${line}-上机位1`, value: `${line}-上机位1` },
    { label: `${line}-上机位2`, value: `${line}-上机位2` },
    { label: `${line}-上机位3`, value: `${line}-上机位3` }
  ]
}

// 扫码获取上机位
const handleScanMachinePosition = () => {
  // TODO: 调用扫码接口获取上机位信息
  message.info('扫码功能开发中...')
}

// 扫码芯架码（直接添加）
const handleRackCodeScan = () => {
  const code = formData.rackCode.trim()
  if (!code) {
    message.warning('请输入或扫描芯架码')
    return
  }
  // 检查是否重复扫描
  if (rackInfoList.value.some(item => item.rackCode === code)) {
    message.warning('该芯架已添加，请勿重复')
    formData.rackCode = ''
    return
  }
  // TODO: 调用接口查询芯架信息，以下为模拟数据
  const mockMap: Record<string, { coreNo: string; coreName: string; quantity: number; maker: string; equipment: string; coreDate: string }> = {
    'XJ-001': { coreNo: 'SX-20260909-001', coreName: 'WP12缸体砂芯', quantity: 24, maker: '张三', equipment: '制芯机-A01', coreDate: '2026-09-09' },
    'XJ-002': { coreNo: 'SX-20260909-002', coreName: 'WP12缸盖砂芯', quantity: 18, maker: '李四', equipment: '制芯机-A02', coreDate: '2026-09-09' },
    'XJ-003': { coreNo: 'SX-20260909-003', coreName: 'WP13缸体砂芯', quantity: 30, maker: '王五', equipment: '制芯机-B01', coreDate: '2026-09-08' }
  }
  const info = mockMap[code] || { coreNo: `SX-${code}`, coreName: `砂芯-${code}`, quantity: Math.floor(Math.random() * 30) + 1, maker: '未知', equipment: '未知设备', coreDate: '2026-09-09' }
  rackInfoList.value.push({ rackCode: code, ...info })
  formData.rackCode = ''
  message.success(`芯架 ${code} 已添加`)
}

// 移除单个芯架
const removeRackInfo = (index: number) => {
  rackInfoList.value.splice(index, 1)
}

// 清空所有芯架
const handleClearAll = () => {
  rackInfoList.value = []
}

// 提交入库
const handleSubmit = () => {
  if (!canSubmit.value) return
  // TODO: 调用入库接口
  message.success(`砂芯入库成功，共 ${rackInfoList.value.length} 个芯架，${totalQuantity.value} 件`)
  // 清空当前页面内容
  formData.productionLine = undefined
  formData.machinePosition = undefined
  formData.rackCode = ''
  formData.storageArea = undefined
  machinePositionOptions.value = []
  rackInfoList.value = []
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.pda-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
}

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

.pda-header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.pda-header-left:active {
  background: rgba(255, 255, 255, 0.2);
}

.pda-header-title {
  flex: 1;
  text-align: center;
}

.pda-header-right {
  width: 40px;
}

.pda-content {
  flex: 1;
  padding: 12px;
  padding-bottom: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
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

/* 表单行 */
.form-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.form-row.last {
  border-bottom: none;
}

.rack-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.rack-header-clear {
  font-size: 14px;
  color: #ff4d4f;
  cursor: pointer;
}

.rack-header-clear:active {
  opacity: 0.7;
}

/* 已添加芯架列表容器 */
.rack-list-wrapper {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.rack-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.rack-list-scroll {
  max-height: 280px;
  overflow-y: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
}

.rack-list-scroll::-webkit-scrollbar {
  width: 4px;
}

.rack-list-scroll::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}

.rack-card {
  border: 1px solid #e8f0fe;
  border-left: 3px solid #1890ff;
  background: #f8fbff;
  border-radius: 8px;
  flex-shrink: 0;
}

.rack-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.rack-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.rack-card-delete {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #ff4d4f;
  background: #fff2f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.rack-card-delete:active {
  background: #ffccc7;
}

.rack-card-body {
  padding: 12px 16px;
}

.rack-card .form-row {
  padding-bottom: 8px;
}

.rack-card .scan-btn.delete {
  color: #ff4d4f;
  background: #fff2f0;
}

.rack-card .scan-btn.delete:active {
  background: #ffccc7;
}

/* 双列网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
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
  font-weight: 500;
}

.info-cell-value.highlight {
  color: #1890ff;
  font-weight: 700;
}


.form-label {
  width: 80px;
  min-width: 80px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.form-control {
  flex: 1;
  min-width: 0;
}

.form-control.with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control.with-suffix :deep(.ant-select) {
  flex: 1;
}

.scan-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #1890ff;
  background: #e6f7ff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.scan-btn:active {
  background: #bae7ff;
  transform: scale(0.95);
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
  padding: 14px 16px;
  font-size: 15px;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
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
