<template>
  <div class="andon-record">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产线">
          <a-select v-model:value="searchForm.productionLine" placeholder="自动获取登录产线" allow-clear style="width: 170px">
            <a-select-option v-for="l in productionLineOptions" :key="l" :value="l">{{ l }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="异常类型">
          <a-select v-model:value="searchForm.exceptionType" placeholder="请选择" allow-clear style="width: 150px">
            <a-select-option v-for="t in exceptionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="异常名称">
          <a-input v-model:value="searchForm.exceptionName" placeholder="请输入" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="安灯状态">
          <a-select v-model:value="searchForm.andonStatus" placeholder="请选择" allow-clear style="width: 130px">
            <a-select-option v-for="s in andonStatusOptions" :key="s" :value="s">{{ s }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="工单状态">
          <a-select v-model:value="searchForm.workOrderStatus" placeholder="请选择" allow-clear style="width: 130px">
            <a-select-option v-for="s in workOrderStatusOptions" :key="s" :value="s">{{ s }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              搜索
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-form-item>
        <a-form-item label="日期">
          <a-range-picker
            v-model:value="searchForm.dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始时间', '结束时间']"
            style="width: 240px"
          />
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-button type="primary" @click="handleAudit" :disabled="selectedRowKeys.length === 0">
        <AuditOutlined />
        审核
      </a-button>
    </a-card>

    <!-- 数据表格卡片 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :row-key="'id'"
        :row-selection="rowSelection"
        :scroll="{ x: 1200 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'andonStatus'">
            <a-tag :color="andonStatusColor[record.andonStatus]">
              {{ record.andonStatus }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'workOrderStatus'">
            <a-tag :color="workOrderStatusColor[record.workOrderStatus]">
              {{ record.workOrderStatus }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewDetail(record)">明细</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 明细弹框：异常基础信息 / 异常推送日志 / 工单处理明细 -->
    <a-modal
      v-model:open="detailVisible"
      title="安灯异常明细"
      :width="980"
      @cancel="detailVisible = false"
    >
      <template v-if="detailRecord">
        <!-- 模块1：异常基础信息 -->
        <div class="detail-section">
          <div class="section-chip">异常基础信息</div>
          <span class="status-stamp" :style="stampStyle(detailRecord.andonStatus)">{{ detailRecord.andonStatus }}</span>
          <div class="field-grid grid-4">
            <div class="field"><span class="f-label">异常类型：</span>{{ detailRecord.exceptionType }}</div>
            <div class="field"><span class="f-label">异常名称：</span>{{ detailRecord.exceptionName }}</div>
            <div class="field"><span class="f-label">异常等级：</span>{{ detailRecord.exceptionLevel }}</div>
            <div class="field"><span class="f-label">业务类型：</span>{{ detailRecord.businessType }}</div>
          </div>
          <div class="field-grid grid-3">
            <div class="field"><span class="f-label">产线：</span>{{ detailRecord.productionLine }}</div>
            <div class="field"><span class="f-label">工位/子工位：</span>{{ detailRecord.station }}</div>
            <div class="field"><span class="f-label">设备/上机位：</span>{{ detailRecord.device }}</div>
          </div>
          <div class="field-grid grid-3">
            <div class="field"><span class="f-label">异常时间：</span>{{ detailRecord.exceptionTime }}</div>
            <div class="field"><span class="f-label">恢复时间：</span>{{ detailRecord.recoveryTime || '—' }}</div>
          </div>
          <div class="field full"><span class="f-label">异常描述：</span>{{ detailRecord.description }}</div>
        </div>

        <!-- 模块2：异常推送日志 -->
        <div class="detail-section">
          <div class="section-chip">异常推送日志</div>
          <div class="push-logs">
            <div
              v-for="(lv, i) in pushLevels"
              :key="lv.title"
              class="push-item"
              :class="{ pending: i + 1 > pushCurrentLevel }"
            >
              <div class="push-node-row">
                <span class="push-dot" :class="pushDotClass(i)">{{ pushDotText(i) }}</span>
                <span
                  v-if="i < pushLevels.length - 1"
                  class="push-line"
                  :class="{ active: i + 2 <= pushCurrentLevel }"
                ></span>
              </div>
              <div class="push-title">{{ lv.title }}</div>
              <div class="push-sub">{{ lv.sub }}</div>
              <div class="push-time">{{ pushTime(i) }}</div>
            </div>
          </div>
        </div>

        <!-- 模块3：工单处理明细 -->
        <div class="detail-section">
          <div class="section-chip">工单处理明细</div>
          <span class="status-stamp" :style="stampStyle(detailRecord.workOrderStatus)">{{ detailRecord.workOrderStatus }}</span>
          <div class="field-grid grid-3">
            <div class="field"><span class="f-label">认领人：</span>{{ detailRecord.reporter }}</div>
            <div class="field"><span class="f-label">认领时间：</span>{{ claimTime }}</div>
            <div class="field"><span class="f-label">提交时间：</span>{{ submitTime }}</div>
          </div>
          <div class="field full"><span class="f-label">异常原因：</span><span class="em-text">{{ detailRecord.reason }}</span></div>
          <div class="field full"><span class="f-label">整改措施：</span>{{ detailRecord.measure }}</div>
          <div class="field full">
            <span class="f-label">图片：</span>
            <div class="img-placeholder">暂无图片</div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="detail-footer">
          <a-button @click="detailVisible = false">关闭</a-button>
        </div>
      </template>
    </a-modal>

    <!-- 审核弹框：工单审核 -->
    <a-modal
      v-model:open="auditVisible"
      title="工单审核"
      :width="980"
      @cancel="handleAuditCancel"
    >
      <template v-if="auditRecord">
        <div class="audit-body">
          <div class="field-grid grid-3">
            <div class="field"><span class="f-label">认领人：</span>{{ auditRecord.reporter }}</div>
            <div class="field"><span class="f-label">认领时间：</span>{{ fmtTime(auditRecord.exceptionTime, 1) }}</div>
            <div class="field"><span class="f-label">提交时间：</span>{{ fmtTime(auditRecord.exceptionTime, 5) }}</div>
          </div>
          <div class="field full">
            <span class="f-label">异常原因：</span><span class="em-text">{{ auditRecord.reason }}</span>
          </div>
          <div class="field full">
            <span class="f-label">整改措施：</span>{{ auditRecord.measure }}
          </div>
          <div class="field full">
            <span class="f-label">图片：</span>
            <div class="img-placeholder">暂无图片</div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="audit-footer">
          <a-button type="primary" @click="handleAuditPass">通过</a-button>
          <a-button type="primary" ghost @click="handleAuditReject">驳回</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  ReloadOutlined,
  AuditOutlined
} from '@ant-design/icons-vue'

interface AndonRecord {
  id: number
  exceptionType: string
  exceptionName: string
  productionLine: string
  businessType: string
  exceptionTime: string
  recoveryTime: string
  andonStatus: string
  workOrderStatus: string
  exceptionLevel: string
  station: string
  device: string
  reason: string
  measure: string
  reporter: string
  description: string
}

const exceptionTypeOptions = ['生产异常', '质量异常', '安全异常', '工艺异常']
const productionLineOptions = ['造型三线HWS造型', '造型一线HWS造型', '造型二线HWS造型', '制芯线', '浇注线', '机体线']
const andonStatusOptions = ['异常中', '已恢复']
const workOrderStatusOptions = ['待处理', '处理中', '待审核', '已关闭', '无需处理']

const andonStatusColor: Record<string, string> = {
  '异常中': 'red',
  '已恢复': 'green'
}
const workOrderStatusColor: Record<string, string> = {
  '待处理': 'orange',
  '处理中': 'blue',
  '待审核': 'purple',
  '已关闭': 'green',
  '无需处理': 'default'
}

const loading = ref(false)
const recordSeeds: Array<Pick<AndonRecord, 'exceptionType' | 'exceptionName' | 'productionLine' | 'businessType'>> = [
  { exceptionType: '生产异常', exceptionName: '浇注机异常', productionLine: '造型三线HWS造型', businessType: '处置类' },
  { exceptionType: '生产异常', exceptionName: '造型线异常', productionLine: '造型三线HWS造型', businessType: '处置类' },
  { exceptionType: '质量异常', exceptionName: '尺寸超差', productionLine: '机体线', businessType: '通知类' },
  { exceptionType: '安全异常', exceptionName: '消防通道堵塞', productionLine: '造型二线HWS造型', businessType: '通知类' },
  { exceptionType: '工艺异常', exceptionName: '浇注温度偏差', productionLine: '浇注线', businessType: '处置类' },
  { exceptionType: '生产异常', exceptionName: '制芯机故障', productionLine: '制芯线', businessType: '处置类' }
]
// 安灯状态按 5 步轮换；工单状态按 4 步流程轮换（通知类固定为无需处理）
const andonCycle = ['已恢复', '异常中', '异常中', '已恢复', '已恢复']
const workCycle = ['待处理', '处理中', '待审核', '已关闭']
const reporterCycle = ['张三', '李四', '王五', '赵六', '冯永增']
const levelCycle = ['2级（重点异常）', '3级（一般异常）', '1级（紧急异常）']
const stationCycle = ['A00-PUMA25浇注/浇注', 'B10-FDM08造型/造型', 'C20-CORE06制芯/制芯', 'D30-CLEAN02清理/清理', 'E40-SAND03砂处理/砂处理', 'F50-MELT01熔炼/熔炼']
const deviceCycle = ['全自动浇注机', '静压造型机', '冷芯盒制芯机', '抛丸清理机', '混砂机', '中频电炉']
const reasonCycle = [
  '操作不合规：未按SOP执行作业，参数调整后未复核确认即启动设备',
  '参数超差：浇注温度低于工艺下限未及时处置',
  '点检遗漏：班前点检未发现液压管路渗漏'
]
const measureCycle = ['已完成操作人员培训', '已调整工艺参数并复测合格', '已安排设备检修并更新点检表']

// 演示数据：34 条（15 条/页，共 3 页，与图示一致）
const dataSource = ref<AndonRecord[]>(
  Array.from({ length: 34 }, (_, i) => {
    const seed = recordSeeds[i % recordSeeds.length]
    const andonStatus = andonCycle[i % andonCycle.length]
    const exceptionTime = dayjs('2026-07-10 14:54').subtract(i, 'day').add((i * 7) % 50, 'minute')
    // 工单状态说明：业务类型为「通知类」的记录固定为「无需处理」
    const workOrderStatus = seed.businessType === '通知类' ? '无需处理' : workCycle[i % workCycle.length]
    return {
      id: i + 1,
      ...seed,
      exceptionTime: exceptionTime.format('YYYY-MM-DD HH:mm'),
      recoveryTime: andonStatus === '已恢复' ? exceptionTime.add(60, 'minute').format('YYYY-MM-DD HH:mm') : '',
      andonStatus,
      workOrderStatus,
      exceptionLevel: levelCycle[i % levelCycle.length],
      station: stationCycle[i % stationCycle.length],
      device: deviceCycle[i % deviceCycle.length],
      reason: reasonCycle[i % reasonCycle.length],
      measure: measureCycle[i % measureCycle.length],
      reporter: reporterCycle[i % reporterCycle.length],
      description: `${seed.exceptionName}（${seed.productionLine}）触发安灯，请及时处置`
    }
  })
)

const selectedRowKeys = ref<Array<string | number>>([])
const searchForm = reactive({
  exceptionType: '',
  exceptionName: '',
  productionLine: '',
  andonStatus: '',
  workOrderStatus: '',
  dateRange: [] as any[]
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => { selectedRowKeys.value = keys }
}))

const columns = [
  { title: '序号', key: 'seq', width: 70 },
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 180 },
  { title: '异常类型', dataIndex: 'exceptionType', key: 'exceptionType', width: 110 },
  { title: '异常名称', dataIndex: 'exceptionName', key: 'exceptionName', width: 150 },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType', width: 100 },
  { title: '异常时间', dataIndex: 'exceptionTime', key: 'exceptionTime', width: 160 },
  { title: '恢复时间', dataIndex: 'recoveryTime', key: 'recoveryTime', width: 160 },
  { title: '安灯状态', dataIndex: 'andonStatus', key: 'andonStatus', width: 100 },
  { title: '工单状态', dataIndex: 'workOrderStatus', key: 'workOrderStatus', width: 110 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const }
]

const filteredData = computed(() => {
  let list = dataSource.value
  if (searchForm.exceptionType) list = list.filter(i => i.exceptionType === searchForm.exceptionType)
  if (searchForm.exceptionName) list = list.filter(i => i.exceptionName.includes(searchForm.exceptionName))
  if (searchForm.productionLine) list = list.filter(i => i.productionLine === searchForm.productionLine)
  if (searchForm.andonStatus) list = list.filter(i => i.andonStatus === searchForm.andonStatus)
  if (searchForm.workOrderStatus) list = list.filter(i => i.workOrderStatus === searchForm.workOrderStatus)
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const start = searchForm.dateRange[0].format('YYYY-MM-DD')
    const end = searchForm.dateRange[1].format('YYYY-MM-DD')
    list = list.filter(i => i.exceptionTime.slice(0, 10) >= start && i.exceptionTime.slice(0, 10) <= end)
  }
  pagination.total = list.length
  return list
})

const detailVisible = ref(false)
const detailRecord = ref<AndonRecord | null>(null)

// ---- 明细弹框：异常推送日志 ----
const pushLevels = [
  { title: '一级角色', sub: '班组长，mes主管' },
  { title: '二级角色', sub: '产线经理，产线工艺' },
  { title: '三级角色', sub: '生产主管，制造工程室计划' },
  { title: '四级角色', sub: '副总经理' }
]
// 工单状态 → 当前推进到的推送层级
const pushLevelMap: Record<string, number> = { '待处理': 2, '处理中': 3, '待审核': 4, '已关闭': 4, '无需处理': 1 }
const pushCurrentLevel = computed(() => pushLevelMap[detailRecord.value?.workOrderStatus || ''] || 1)
const pushDotClass = (i: number) => ({
  done: i + 1 < pushCurrentLevel.value,
  current: i + 1 === pushCurrentLevel.value
})
const pushDotText = (i: number) => (i + 1 < pushCurrentLevel.value ? '✓' : String(i + 1))
const pushTime = (i: number) => {
  if (!detailRecord.value || i + 1 > pushCurrentLevel.value) return ''
  return dayjs(detailRecord.value.exceptionTime).add(i * 10, 'minute').format('YYYY-MM-DD HH:mm')
}

// ---- 明细弹框：工单处理明细 ----
const claimTime = computed(() =>
  detailRecord.value ? dayjs(detailRecord.value.exceptionTime).add(1, 'minute').format('YYYY-MM-DD HH:mm') : ''
)
const submitTime = computed(() => {
  const r = detailRecord.value
  if (!r || !['待审核', '已关闭'].includes(r.workOrderStatus)) return '—'
  return dayjs(r.exceptionTime).add(5, 'minute').format('YYYY-MM-DD HH:mm')
})

// 状态印章颜色
const stampColor: Record<string, string> = {
  '异常中': '#ff4d4f',
  '已恢复': '#52c41a',
  '待处理': '#fa8c16',
  '处理中': '#1890ff',
  '待审核': '#722ed1',
  '已关闭': '#52c41a',
  '无需处理': '#8c8c8c'
}
const stampStyle = (status: string) => {
  const c = stampColor[status] || '#595959'
  return { color: c, borderColor: c }
}

const handleSearch = () => { pagination.current = 1 }
const handleReset = () => {
  searchForm.exceptionType = ''
  searchForm.exceptionName = ''
  searchForm.productionLine = ''
  searchForm.andonStatus = ''
  searchForm.workOrderStatus = ''
  searchForm.dateRange = []
  pagination.current = 1
}
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize }

const handleViewDetail = (record: AndonRecord) => {
  detailRecord.value = record
  detailVisible.value = true
}

// ---- 审核弹框：工单审核（多选时逐条审核） ----
const auditVisible = ref(false)
const auditQueue = ref<AndonRecord[]>([])
const auditRecord = computed(() => auditQueue.value[0] || null)

const fmtTime = (base: string, addMinutes: number) =>
  dayjs(base).add(addMinutes, 'minute').format('YYYY-MM-DD HH:mm')

const handleAudit = () => {
  const targets = dataSource.value.filter(i => selectedRowKeys.value.includes(i.id) && i.workOrderStatus === '待审核' && i.businessType !== '通知类')
  if (targets.length === 0) { message.warning('所选记录中没有待审核的工单'); return }
  auditQueue.value = targets
  auditVisible.value = true
}

// 通过：工单关闭；驳回：退回处理中
const finishAudit = (result: '通过' | '驳回') => {
  const record = auditQueue.value.shift()
  if (!record) return
  record.workOrderStatus = result === '通过' ? '已关闭' : '处理中'
  message.success(result === '通过' ? '审核通过' : '已驳回')
  if (auditQueue.value.length === 0) {
    auditVisible.value = false
    selectedRowKeys.value = []
  }
}
const handleAuditPass = () => finishAudit('通过')
const handleAuditReject = () => finishAudit('驳回')
const handleAuditCancel = () => {
  auditVisible.value = false
  auditQueue.value = []
}
</script>

<style scoped>
/* ---- 明细弹框 ---- */
.detail-section {
  position: relative;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 18px 20px 16px;
  margin-bottom: 18px;
}

.detail-section:last-of-type {
  margin-bottom: 4px;
}

.section-chip {
  display: inline-block;
  background: #1890ff;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  padding: 3px 12px;
  border-radius: 3px;
  margin-bottom: 16px;
}

.status-stamp {
  position: absolute;
  top: 12px;
  right: 24px;
  width: 62px;
  height: 62px;
  border: 2px solid #595959;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background: #fff;
  transform: rotate(-12deg);
}

.field-grid {
  display: grid;
  row-gap: 16px;
  margin-bottom: 16px;
}

.field-grid.grid-4 { grid-template-columns: repeat(4, 1fr); }
.field-grid.grid-3 { grid-template-columns: repeat(3, 1fr); }

.field {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  word-break: break-all;
}

.field.full {
  margin-bottom: 16px;
}

.field.full:last-child {
  margin-bottom: 0;
}

.em-text {
  font-weight: 700;
}

.img-placeholder {
  width: 110px;
  height: 72px;
  background: #f5f5f5;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bfbfbf;
  font-size: 12px;
  margin-top: 8px;
}

/* 推送日志时间线 */
.push-logs {
  display: flex;
}

.push-item {
  flex: 1;
  min-width: 0;
}

.push-node-row {
  display: flex;
  align-items: center;
}

.push-dot {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid #d9d9d9;
  background: #fff;
  color: #bfbfbf;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.push-dot.done {
  border-color: #1890ff;
  color: #1890ff;
}

.push-dot.current {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
  font-weight: 600;
}

.push-line {
  flex: 1;
  height: 1.5px;
  background: #e8e8e8;
}

.push-line.active {
  background: #1890ff;
}

.push-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-top: 8px;
}

.push-sub {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.push-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.push-item.pending .push-title {
  color: #bfbfbf;
}

.detail-footer {
  text-align: center;
}

/* ---- 审核弹框 ---- */
.audit-footer {
  text-align: center;
}

.audit-footer .ant-btn {
  min-width: 96px;
  margin: 0 10px;
}
</style>
