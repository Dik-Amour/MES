<template>
  <div class="pda-page">
    <!-- ==================== 视图1：异常首页 ==================== -->
    <template v-if="view === 'home'">
      <div class="pda-header">
        <div class="pda-header-left"></div>
        <div class="pda-header-title">异常</div>
        <div class="pda-header-right"></div>
      </div>

      <div class="pda-content">
        <div class="group-title">
          <span class="group-bar"></span>
          安灯异常
        </div>

        <div class="entry-grid">
          <div class="entry-tile" @click="view = 'list'">
            <div class="entry-icon">
              <AlertOutlined />
            </div>
            <div class="entry-label">异常工单</div>
          </div>
        </div>
      </div>

      <!-- 底部功能标签栏 -->
      <div class="tab-bar">
        <div
          v-for="t in homeTabs"
          :key="t.label"
          class="tab-item"
          :class="{ active: t.label === activeHomeTab }"
          @click="handleHomeTab(t.label)"
        >
          <div class="tab-icon"><component :is="t.icon" /></div>
          <div class="tab-label">{{ t.label }}</div>
        </div>
      </div>
    </template>

    <!-- ==================== 视图2：异常工单列表 ==================== -->
    <template v-else-if="view === 'list'">
      <div class="pda-header">
        <div class="pda-header-left" @click="view = 'home'">
          <ArrowLeftOutlined />
        </div>
        <div class="pda-header-title">异常工单</div>
        <div class="pda-header-right"></div>
      </div>

      <div class="pda-content">
        <!-- 状态页签 -->
        <div class="status-tabs">
          <div
            v-for="s in statusTabs"
            :key="s"
            class="status-tab"
            :class="{ active: activeStatus === s }"
            @click="activeStatus = s"
          >
            {{ s }}
          </div>
        </div>

        <!-- 产线筛选 -->
        <div class="line-picker">
          <a-select
            v-model:value="filterLine"
            placeholder="请选择产线"
            allow-clear
            style="width: 100%"
          >
            <a-select-option v-for="l in lineOptions" :key="l" :value="l">{{ l }}</a-select-option>
          </a-select>
        </div>

        <!-- 工单卡片 -->
        <template v-if="filteredOrders.length > 0">
          <div v-for="order in filteredOrders" :key="order.id" class="order-card">
            <div class="order-badge">{{ order.exceptionType }}</div>
            <div class="order-stamp">{{ order.workStatus }}</div>

            <div class="order-grid">
              <div class="cell span-2">
                <div class="cell-label">异常名称：</div>
                <div class="cell-value">{{ order.exceptionName }}</div>
              </div>
              <div class="cell span-2">
                <div class="cell-label">产线：</div>
                <div class="cell-value">{{ order.productionLine }}</div>
              </div>
              <div class="cell span-2">
                <div class="cell-label">异常等级：</div>
                <div class="cell-value">{{ order.exceptionLevel }}</div>
              </div>

              <div class="cell span-3">
                <div class="cell-label">工位/子工位：</div>
                <div class="cell-value">{{ order.station }}</div>
              </div>
              <div class="cell span-3">
                <div class="cell-label">设备/上机位：</div>
                <div class="cell-value">{{ order.device }}</div>
              </div>

              <div class="cell span-3">
                <div class="cell-label">异常时间：</div>
                <div class="cell-value">{{ order.exceptionTime }}</div>
              </div>
              <div class="cell span-3">
                <div class="cell-label">恢复时间：</div>
                <div class="cell-value">{{ order.recoveryTime || '—' }}</div>
              </div>

              <div class="cell span-3">
                <div class="cell-label">安灯状态：</div>
                <div class="cell-value">{{ order.andonStatus }}</div>
              </div>
              <div class="cell span-3 cell-action">
                <a-button type="primary" class="action-btn" @click="handleOrderAction(order)">
                  {{ actionLabel(order.workStatus) }}
                </a-button>
              </div>
            </div>
          </div>
        </template>
        <a-empty v-else class="order-empty" description="暂无工单" />
      </div>
    </template>

    <!-- ==================== 视图3：异常处理 ==================== -->
    <template v-else>
      <div class="pda-header">
        <div class="pda-header-left" @click="view = 'list'">
          <ArrowLeftOutlined />
        </div>
        <div class="pda-header-title">异常工单</div>
        <div class="pda-header-right link" @click="showRejectLog">驳回记录</div>
      </div>

      <div class="pda-content" v-if="currentOrder">
        <!-- 异常信息卡 -->
        <div class="info-card">
          <div class="order-badge">{{ currentOrder.exceptionType }}</div>
          <div class="info-list">
            <div class="info-row"><span class="info-label">异常名称：</span>{{ currentOrder.exceptionName }}</div>
            <div class="info-row"><span class="info-label">产线：</span>{{ currentOrder.productionLine }}</div>
            <div class="info-row"><span class="info-label">异常等级：</span>{{ currentOrder.exceptionLevel }}</div>
            <div class="info-row"><span class="info-label">工位/子工位：</span>{{ currentOrder.station }}</div>
            <div class="info-row"><span class="info-label">设备/上机位：</span>{{ currentOrder.device }}</div>
            <div class="info-row"><span class="info-label">异常时间：</span>{{ currentOrder.exceptionTime }}</div>
            <div class="info-row"><span class="info-label">恢复时间：</span>{{ currentOrder.recoveryTime || '—' }}</div>
            <div class="info-row"><span class="info-label">安灯状态：</span>{{ currentOrder.andonStatus }}</div>
            <div class="info-row"><span class="info-label">异常描述：</span>{{ currentOrder.description }}</div>
          </div>
        </div>

        <!-- 处理表单卡 -->
        <div class="form-card">
          <div class="form-item">
            <div class="form-item-label required">异常原因：</div>
            <a-textarea
              v-model:value="handleForm.reason"
              placeholder="请输入"
              :rows="3"
              :disabled="viewOnly"
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
          </div>
          <div class="form-item">
            <div class="form-item-label">整改措施：</div>
            <a-textarea
              v-model:value="handleForm.measure"
              placeholder="请输入"
              :rows="3"
              :disabled="viewOnly"
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
          </div>
          <div class="form-item inline">
            <div class="form-item-label">图片：</div>
            <a-upload
              :show-upload-list="false"
              accept="image/*"
              :before-upload="handleBeforeUpload"
              :disabled="viewOnly"
            >
              <a-button type="primary">
                <UploadOutlined />
                上传
              </a-button>
            </a-upload>
          </div>
          <div v-if="uploadList.length > 0" class="upload-list">
            <div v-for="(f, i) in uploadList" :key="f.url" class="upload-thumb">
              <img :src="f.url" :alt="f.name" />
              <span v-if="!viewOnly" class="upload-remove" @click="uploadList.splice(i, 1)">×</span>
            </div>
          </div>
        </div>

        <!-- 提交 -->
        <div v-if="!viewOnly" class="submit-wrap">
          <a-button type="primary" class="submit-btn" @click="handleSubmit">提交</a-button>
        </div>
      </div>
    </template>

    <!-- 驳回记录弹框 -->
    <a-modal v-model:open="rejectVisible" title="驳回记录" :width="420" :footer="null" @cancel="rejectVisible = false">
      <div v-if="rejectOrders.length > 0">
        <div v-for="r in rejectOrders" :key="'r' + r.id" class="reject-item">
          <div class="reject-head">
            <span class="order-badge">{{ r.exceptionType }}</span>
            <span class="reject-time">{{ r.rejectTime }}</span>
          </div>
          <div class="reject-line">{{ r.exceptionName }} · {{ r.productionLine }}</div>
          <div class="reject-reason">驳回原因：{{ r.rejectReason }}</div>
        </div>
      </div>
      <a-empty v-else description="暂无驳回记录" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  AlertOutlined,
  InboxOutlined,
  ToolOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'

interface PdaExceptionOrder {
  id: number
  exceptionType: string
  exceptionName: string
  productionLine: string
  exceptionLevel: string
  station: string
  device: string
  exceptionTime: string
  recoveryTime: string
  andonStatus: string
  workStatus: '待处理' | '处理中' | '待审核' | '已关闭'
  description: string
  rejected?: boolean
  rejectTime?: string
  rejectReason?: string
}

// ---------- 视图切换（单页面三视图：首页 / 工单列表 / 异常处理） ----------
const view = ref<'home' | 'list' | 'handle'>('home')

const homeTabs = [
  { label: '仓储', icon: InboxOutlined },
  { label: '生产', icon: ToolOutlined },
  { label: '现场', icon: AppstoreOutlined },
  { label: '异常', icon: AlertOutlined },
  { label: '质检', icon: CheckCircleOutlined }
]
const activeHomeTab = ref('异常')
const handleHomeTab = (label: string) => {
  if (label === activeHomeTab.value) return
  message.info(`「${label}」功能暂未开放`)
}

const statusTabs = ['待处理', '处理中', '待审核', '已关闭'] as const
const activeStatus = ref<(typeof statusTabs)[number]>('待处理')
const filterLine = ref<string | undefined>(undefined)
const lineOptions = ['造型三线HWS造型', '造型一线HWS造型', '造型二线HWS造型', '制芯线', '浇注线', '机体线']

// ---------- 演示数据 ----------
const orders = ref<PdaExceptionOrder[]>([
  { id: 1, exceptionType: '生产异常', exceptionName: '浇注机异常', productionLine: '造型三线HWS造型', exceptionLevel: '4级', station: 'A00-PUMA25浇注/浇注', device: '全自动浇注机', exceptionTime: '2026-07-08 14:54', recoveryTime: '2026-07-08 15:54', andonStatus: '已恢复', workStatus: '待审核', description: '浇注机超过30分钟没有浇注信号，触发安灯异常' },
  { id: 2, exceptionType: '质量异常', exceptionName: '尺寸超差', productionLine: '机体线', exceptionLevel: '3级', station: 'E00-MEAS01检测/终检', device: '三坐标测量机', exceptionTime: '2026-07-08 09:30', recoveryTime: '', andonStatus: '异常中', workStatus: '待处理', description: '机体孔径超出公差范围，触发质量安灯' },
  { id: 3, exceptionType: '安全异常', exceptionName: '消防通道堵塞', productionLine: '造型二线HWS造型', exceptionLevel: '2级', station: 'S00-SAFE01现场/通道', device: '—', exceptionTime: '2026-07-07 16:00', recoveryTime: '2026-07-07 16:30', andonStatus: '已恢复', workStatus: '待处理', description: '车间消防通道被物料堵塞，触发安全安灯' },
  { id: 4, exceptionType: '工艺异常', exceptionName: '浇注温度偏差', productionLine: '浇注线', exceptionLevel: '4级', station: 'B20-MELT01熔炼/保温', device: '保温炉', exceptionTime: '2026-07-06 15:22', recoveryTime: '2026-07-06 16:22', andonStatus: '已恢复', workStatus: '处理中', description: '保温炉温度低于工艺下限，触发工艺安灯' },
  { id: 5, exceptionType: '生产异常', exceptionName: '造型线异常', productionLine: '造型三线HWS造型', exceptionLevel: '3级', station: 'A10-HWS03造型/合箱', device: '静压造型机', exceptionTime: '2026-07-05 15:29', recoveryTime: '', andonStatus: '异常中', workStatus: '待审核', description: '造型线合箱错位停线，触发生产安灯' },
  { id: 6, exceptionType: '质量异常', exceptionName: '砂芯强度不足', productionLine: '制芯线', exceptionLevel: '2级', station: 'C20-CORE06制芯/制芯', device: '冷芯盒制芯机', exceptionTime: '2026-07-04 10:12', recoveryTime: '2026-07-04 10:58', andonStatus: '已恢复', workStatus: '已关闭', description: '砂芯抗压强度低于标准值，触发质量安灯' },
  { id: 7, exceptionType: '生产异常', exceptionName: '制芯机故障', productionLine: '制芯线', exceptionLevel: '3级', station: 'C10-CORE02制芯/制芯', device: '热芯盒制芯机', exceptionTime: '2026-07-03 09:10', recoveryTime: '', andonStatus: '异常中', workStatus: '处理中', rejected: true, rejectTime: '2026-07-03 14:20', rejectReason: '整改措施不完整，请补充设备点检记录后重新提交', description: '制芯机射砂压力异常停机，触发生产安灯' }
])

const filteredOrders = computed(() =>
  orders.value.filter(
    o => o.workStatus === activeStatus.value && (!filterLine.value || o.productionLine === filterLine.value)
  )
)

const actionLabel = (status: PdaExceptionOrder['workStatus']) => {
  if (status === '待处理') return '认领'
  if (status === '处理中') return '处理'
  return '查看'
}

// ---------- 异常处理（视图3） ----------
const currentOrder = ref<PdaExceptionOrder | null>(null)
const viewOnly = ref(false)
const handleForm = reactive({ reason: '', measure: '' })
const uploadList = ref<Array<{ name: string; url: string }>>([])

const handleOrderAction = (order: PdaExceptionOrder) => {
  if (order.workStatus === '待处理') {
    order.workStatus = '处理中'
    activeStatus.value = '处理中'
    message.success('认领成功')
    return
  }
  currentOrder.value = order
  viewOnly.value = order.workStatus !== '处理中'
  handleForm.reason = ''
  handleForm.measure = ''
  uploadList.value = []
  view.value = 'handle'
}

const handleBeforeUpload = (file: File) => {
  uploadList.value.push({ name: file.name, url: URL.createObjectURL(file) })
  return false
}

const handleSubmit = () => {
  if (!handleForm.reason.trim()) {
    message.warning('请输入异常原因')
    return
  }
  if (!currentOrder.value) return
  // TODO: 调用提交接口
  currentOrder.value.workStatus = '待审核'
  currentOrder.value.rejected = false
  activeStatus.value = '待审核'
  message.success('提交成功')
  view.value = 'list'
}

// ---------- 驳回记录 ----------
const rejectVisible = ref(false)
const rejectOrders = computed(() => orders.value.filter(o => o.rejected))
const showRejectLog = () => { rejectVisible.value = true }
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

/* 顶部标题栏（白底黑字，与示意图一致） */
.pda-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: #fff;
  color: #333;
  font-size: 17px;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
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
}

.pda-header-left:active {
  background: #f0f0f0;
}

.pda-header-title {
  flex: 1;
  text-align: center;
}

.pda-header-right {
  width: 64px;
  text-align: right;
  font-size: 13px;
  font-weight: 400;
}

.pda-header-right.link {
  color: #333;
  cursor: pointer;
}

.pda-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ---------- 首页 ---------- */
.group-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 4px 0 12px;
}

.group-bar {
  width: 3px;
  height: 16px;
  background: #1890ff;
  border-radius: 2px;
  margin-right: 8px;
}

.entry-grid {
  display: flex;
  gap: 12px;
}

.entry-tile {
  width: 130px;
  height: 96px;
  background: #fafafa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.entry-tile:active {
  background: #f0f0f0;
}

.entry-icon {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: #e6f7ff;
  color: #1890ff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-label {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
}

/* 底部标签栏 */
.tab-bar {
  display: flex;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.tab-item .tab-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.tab-item.active {
  color: #1890ff;
}

.tab-item.active .tab-icon {
  background: #e6f7ff;
}

/* ---------- 列表视图 ---------- */
.status-tabs {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 0 4px;
}

.status-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0 10px;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.status-tab.active {
  color: #1890ff;
  font-weight: 600;
  border-bottom-color: #1890ff;
}

.line-picker {
  margin: 12px 0;
}

.order-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}

.order-badge {
  display: inline-block;
  background: #1890ff;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 4px;
}

.order-stamp {
  position: absolute;
  top: 10px;
  right: 14px;
  width: 54px;
  height: 54px;
  border: 2px solid #ff4d4f;
  border-radius: 50%;
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-15deg);
  background: rgba(255, 255, 255, 0.9);
}

.order-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  column-gap: 8px;
  row-gap: 12px;
  margin-top: 12px;
}

.cell.span-2 { grid-column: span 2; }
.cell.span-3 { grid-column: span 3; }

.cell-label {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  margin-bottom: 4px;
}

.cell-value {
  font-size: 13px;
  color: #666;
  word-break: break-all;
}

.cell-action {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.action-btn {
  min-width: 76px;
}

.order-empty {
  margin-top: 40px;
}

/* ---------- 处理视图 ---------- */
.info-card,
.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}

.info-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}

.info-label {
  color: #333;
  font-weight: 600;
}

.form-item {
  margin-bottom: 14px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-item.inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-item-label {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-item.inline .form-item-label {
  margin-bottom: 0;
}

.form-item-label.required::before {
  content: '*';
  color: #ff4d4f;
  margin-right: 4px;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.upload-thumb {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.upload-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  cursor: pointer;
}

.submit-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0 20px;
}

.submit-btn {
  min-width: 140px;
  height: 40px;
  font-size: 15px;
}

/* ---------- 驳回记录 ---------- */
.reject-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.reject-item:last-child {
  border-bottom: none;
}

.reject-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reject-time {
  font-size: 12px;
  color: #999;
}

.reject-line {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.reject-reason {
  font-size: 13px;
  color: #999;
}
</style>
