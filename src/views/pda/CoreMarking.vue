<template>
  <div class="pda-page">
    <!-- 顶部标题栏 -->
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">制芯缸盖刻号</div>
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
                placeholder="请输入或扫描上机位"
                allow-clear
              />
              <div class="scan-btn" @click="handleScanMachinePosition">
                <QrcodeOutlined />
              </div>
            </div>
            <div class="form-tip">可手动输入或扫码获取上机位信息</div>
          </div>
        </div>
      </div>

      <!-- 区块2：托盘码 & 砂芯信息 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row last">
            <div class="form-label">托盘码：</div>
            <div class="form-control with-suffix">
              <a-input
                v-model:value="formData.palletCode"
                placeholder="请扫码"
                @press-enter="handlePalletScan"
              />
              <div class="scan-btn" @click="handlePalletScan">
                <ScanOutlined />
              </div>
            </div>
            <div class="form-tip">读取托盘码后自动带出砂芯信息，可扫码更新</div>
          </div>
        </div>
        <!-- 托盘上的砂芯信息（只读） -->
        <div v-if="palletInfo" class="pallet-info">
          <div class="pallet-info-title">砂芯信息</div>
          <div class="info-grid">
            <div class="info-cell">
              <div class="info-cell-label">砂芯编号</div>
              <div class="info-cell-value">{{ palletInfo.coreNo }}</div>
            </div>
            <div class="info-cell">
              <div class="info-cell-label">砂芯名称</div>
              <div class="info-cell-value">{{ palletInfo.coreName }}</div>
            </div>
            <div class="info-cell">
              <div class="info-cell-label">制芯日期</div>
              <div class="info-cell-value">{{ palletInfo.coreDate }}</div>
            </div>
            <div class="info-cell">
              <div class="info-cell-label">制芯人</div>
              <div class="info-cell-value">{{ palletInfo.maker }}</div>
            </div>
          </div>
          <div class="form-tip">系统自动带出，不可编辑</div>
        </div>
      </div>

      <!-- 区块3：刻号信息 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label top">刻号信息1：</div>
            <div class="form-control">
              <a-textarea
                v-model:value="formData.engrave1"
                placeholder="请输入刻号信息"
                :auto-size="{ minRows: 1, maxRows: 3 }"
              />
            </div>
          </div>
          <div class="form-row last">
            <div class="form-label top">刻号信息2：</div>
            <div class="form-control">
              <a-textarea
                v-model:value="formData.engrave2"
                placeholder="请输入刻号信息"
                :auto-size="{ minRows: 1, maxRows: 3 }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 区块4：扫码绑定芯架 -->
      <div class="section-block bind-block">
        <div class="bind-btn" @click="handleBindRackScan">
          <QrcodeOutlined /> 扫码绑定芯架
        </div>
        <div class="bind-tip">扫描芯架二维码完成绑定操作</div>
        <!-- 已绑定芯架列表 -->
        <div v-if="boundRacks.length > 0" class="rack-list-body">
          <div v-for="(item, index) in boundRacks" :key="item.rackCode" class="rack-card">
            <div class="rack-card-delete" @click="removeRack(index)">
              <DeleteOutlined />
            </div>
            <div class="info-grid">
              <div class="info-cell">
                <div class="info-cell-label">芯架码</div>
                <div class="info-cell-value">{{ item.rackCode }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">绑定时间</div>
                <div class="info-cell-value">{{ item.bindTime }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">砂芯编号</div>
                <div class="info-cell-value">{{ item.coreNo }}</div>
              </div>
              <div class="info-cell">
                <div class="info-cell-label">砂芯名称</div>
                <div class="info-cell-value">{{ item.coreName }}</div>
              </div>
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
        <CheckOutlined /> 确认绑定
      </a-button>
      <div class="footer-tip">请确保输入的信息准确无误，确认后将完成绑定操作</div>
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
  '缸盖一线',
  '缸盖二线',
  '缸体线',
  '壳体线'
]

// 表单数据
const formData = reactive({
  productionLine: undefined as string | undefined,
  machinePosition: undefined as string | undefined,
  palletCode: '',
  engrave1: '',
  engrave2: ''
})

// 托盘上的砂芯信息
const palletInfo = ref<{ coreNo: string; coreName: string; coreDate: string; maker: string } | null>(null)

// 已绑定芯架列表
const boundRacks = ref<{
  rackCode: string
  coreNo: string
  coreName: string
  bindTime: string
}[]>([])

// 产线选择弹窗
const showProductionLinePicker = ref(false)

// 是否可提交
const canSubmit = computed(() => {
  return formData.productionLine && formData.machinePosition && palletInfo.value && formData.engrave1.trim()
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
  formData.machinePosition = '缸盖线刻号工位'
  message.success('上机位扫码成功')
}

// 扫描托盘码（读出托盘上的砂芯信息）
const handlePalletScan = () => {
  const code = formData.palletCode.trim()
  if (!code) {
    message.warning('请扫描托盘码')
    return
  }
  // TODO: 调用接口根据托盘码查询砂芯信息，以下为模拟数据
  const mockMap: Record<string, { coreNo: string; coreName: string; coreDate: string; maker: string }> = {
    'TP202309001': { coreNo: 'C000005980', coreName: '1000978236R_KMA_jzx_缸盖芯', coreDate: '2026-10-22', maker: '张三' },
    'TP202309002': { coreNo: 'C000006123', coreName: '1000978237R_KMA_jzx_进气芯', coreDate: '2026-10-22', maker: '李四' },
    'TP202309003': { coreNo: 'C000006230', coreName: '1001024589R_KMA_jzx_排气芯', coreDate: '2026-10-21', maker: '王五' }
  }
  palletInfo.value = mockMap[code] || {
    coreNo: `C${Math.floor(Math.random() * 900000000 + 100000000)}`,
    coreName: `${code}_砂芯`,
    coreDate: dayjs().format('YYYY-MM-DD'),
    maker: '未知'
  }
  message.success(`托盘 ${code} 信息读取成功`)
}

// 扫码绑定芯架
const handleBindRackScan = () => {
  if (!palletInfo.value) {
    message.warning('请先扫描托盘码读取砂芯信息')
    return
  }
  // TODO: 调用接口查询芯架信息，以下为模拟数据
  const rackCode = `GJ${Math.floor(Math.random() * 9000 + 1000)}`
  if (boundRacks.value.some(item => item.rackCode === rackCode)) {
    message.warning('该芯架已绑定，请勿重复')
    return
  }
  boundRacks.value.push({
    rackCode,
    coreNo: palletInfo.value.coreNo,
    coreName: palletInfo.value.coreName,
    bindTime: dayjs().format('HH:mm:ss')
  })
  message.success(`芯架 ${rackCode} 绑定成功`)
}

// 移除单个绑定芯架
const removeRack = (index: number) => {
  boundRacks.value.splice(index, 1)
}

// 确认绑定
const handleSubmit = () => {
  if (!canSubmit.value) return
  // TODO: 调用绑定接口
  message.success(`绑定成功：托盘 ${formData.palletCode}，刻号 ${formData.engrave1}${formData.engrave2 ? ' / ' + formData.engrave2 : ''}，共 ${boundRacks.value.length} 个芯架`)
  // 清空当前页面内容
  formData.productionLine = undefined
  formData.machinePosition = undefined
  formData.palletCode = ''
  formData.engrave1 = ''
  formData.engrave2 = ''
  palletInfo.value = null
  boundRacks.value = []
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

.form-label.top {
  align-self: flex-start;
  padding-top: 6px;
}

.form-control.with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control.with-suffix :deep(.ant-input-affix-wrapper) {
  flex: 1;
}

.form-row {
  flex-wrap: wrap;
}

.form-row.last {
  border-bottom: none;
}

/* 辅助提示 */
.form-tip {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

/* 托盘砂芯信息 */
.pallet-info {
  margin: 0 16px 12px;
  padding: 12px 16px;
  background: #f8fbff;
  border: 1px solid #e8f0fe;
  border-left: 3px solid #1890ff;
  border-radius: 8px;
}

.pallet-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
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
  word-break: break-all;
}

/* 扫码绑定芯架 */
.bind-block {
  padding: 16px;
}

.bind-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  background: #52c41a;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  user-select: none;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.35);
}

.bind-btn:active {
  background: #49ad14;
  transform: scale(0.99);
}

.bind-tip {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

/* 已绑定芯架列表 */
.rack-list-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  max-height: 320px;
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

.footer-tip {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
