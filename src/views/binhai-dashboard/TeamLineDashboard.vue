<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'

import dayjs from 'dayjs'

import LineDashboardShell from './LineDashboardShell.vue'
import type { EChartsOption } from 'echarts'

/** 标题栏班组：左右各两个，可点击切换；各班组内容一致 */
const teamGroups = {
  left: ['大机', '曲轴'],
  right: ['新产品', '机体']
} as const

const allTeams = [...teamGroups.left, ...teamGroups.right] as const
type TeamName = (typeof allTeams)[number]

const activeTeam = ref<TeamName>('大机')

function selectTeam(name: TeamName) {
  activeTeam.value = name
}

/** 指标栏：6 项指标（数值为 mock，各班组内容一致）；计划数/造型数/下芯数/合箱数/待浇注数/浇注数可点击打开明细弹框 */
const indicators = [
  { label: '计划数', value: '128', unit: '箱', tone: 'output' as const, clickable: true },
  { label: '造型数', value: '116', unit: '箱', tone: 'inbound' as const, clickable: true },
  { label: '下芯数', value: '86', unit: '颗', tone: 'inbound' as const, clickable: true },
  { label: '合箱数', value: '82', unit: '箱', tone: 'output' as const, clickable: true },
  { label: '待浇注数', value: '14', unit: '箱', tone: 'inbound' as const, clickable: true },
  { label: '浇注数', value: '108', unit: '箱', tone: 'output' as const, clickable: true }
]

/** 计划详情：点击顶部「计划数」打开（各班组共用 mock；计划箱数合计 = 128） */
interface PlanDetailRow {
  line: string
  productSeries: string
  blankNo: string
  blankName: string
  type: string
  planPieces: number
  planBoxes: number
}

const planDetailRows: PlanDetailRow[] = [
  { line: '机体线', productSeries: '机体系列', blankNo: '1002380677R', blankName: '气缸盖毛坯', type: '普通类', planPieces: 48, planBoxes: 6 },
  { line: '机体线', productSeries: '机体系列', blankNo: '1000000244R', blankName: '主轴承盖', type: '参数变更类', planPieces: 80, planBoxes: 10 },
  { line: '大机线', productSeries: '大机系列', blankNo: '1002381102R', blankName: '气缸体毛坯', type: '普通类', planPieces: 64, planBoxes: 8 },
  { line: '曲轴线', productSeries: '曲轴系列', blankNo: '1001560088R', blankName: '曲轴箱盖', type: '验证类', planPieces: 96, planBoxes: 12 },
  { line: '新产品线', productSeries: '新产品系列', blankNo: '1004420015R', blankName: '新产品壳体', type: '临脱+验证', planPieces: 40, planBoxes: 5 },
  { line: '机体线', productSeries: '机体系列', blankNo: '1002380901R', blankName: '气缸盖毛坯', type: '普通类', planPieces: 72, planBoxes: 9 },
  { line: '机体线', productSeries: '机体系列', blankNo: '1000000311R', blankName: '主轴承盖', type: '挑选类', planPieces: 120, planBoxes: 15 },
  { line: '曲轴线', productSeries: '曲轴系列', blankNo: '1001560120R', blankName: '连杆盖', type: '普通类', planPieces: 88, planBoxes: 11 },
  { line: '新产品线', productSeries: '新产品系列', blankNo: '1004420040R', blankName: '支架毛坯', type: '参数变更类', planPieces: 48, planBoxes: 6 },
  { line: '大机线', productSeries: '大机系列', blankNo: '1002381205R', blankName: '气缸体毛坯', type: '验证类', planPieces: 96, planBoxes: 12 },
  { line: '机体线', productSeries: '机体系列', blankNo: '1000000455R', blankName: '轴承座', type: '普通类', planPieces: 72, planBoxes: 9 },
  { line: '曲轴线', productSeries: '曲轴系列', blankNo: '1001560177R', blankName: '飞轮壳', type: '临脱+验证', planPieces: 32, planBoxes: 4 },
  { line: '新产品线', productSeries: '新产品系列', blankNo: '1004420062R', blankName: '端盖毛坯', type: '挑选类', planPieces: 64, planBoxes: 8 },
  { line: '机体线', productSeries: '机体系列', blankNo: '1002381310R', blankName: '气缸盖毛坯', type: '普通类', planPieces: 112, planBoxes: 13 }
]

/** 指标明细弹框：计划数 / 造型数 / 下芯数 / 合箱数 / 待浇注数 / 浇注数共用一个弹框壳，按 key 切换表格 */
type DetailKey = 'plan' | 'molding' | 'core' | 'close' | 'pending' | 'poured'

const detailOpen = ref(false)
const detailKey = ref<DetailKey>('plan')

function openIndicatorDetail(payload: { label: string }) {
  const keyMap: Record<string, DetailKey> = {
    计划数: 'plan',
    造型数: 'molding',
    下芯数: 'core',
    合箱数: 'close',
    待浇注数: 'pending',
    浇注数: 'poured'
  }
  const key = keyMap[payload.label]
  if (!key) return
  detailKey.value = key
  detailOpen.value = true
}

function closeIndicatorDetail() {
  detailOpen.value = false
}

const detailTitle = computed(() => {
  if (detailKey.value === 'molding') return '造型数明细'
  if (detailKey.value === 'core') return '下芯数明细'
  if (detailKey.value === 'close') return '合箱数明细'
  if (detailKey.value === 'pending') return '待浇注数明细'
  if (detailKey.value === 'poured') return '浇注数明细'
  return '计划详情'
})

const detailMeta = computed(() => {
  if (detailKey.value === 'molding') return '当前指标：造型数 116 箱'
  if (detailKey.value === 'core') return '当前指标：下芯数 86 颗'
  if (detailKey.value === 'close') return '当前指标：合箱数 82 箱'
  if (detailKey.value === 'pending') return '当前指标：待浇注数 14 箱'
  if (detailKey.value === 'poured') return '当前指标：浇注数 108 箱'
  return '当前指标：计划数 128 箱'
})

const detailRowCount = computed(() => {
  if (detailKey.value === 'molding') return moldingDetailRows.length
  if (detailKey.value === 'core') return coreDetailRows.length
  if (detailKey.value === 'close') return closeDetailRows.length
  if (detailKey.value === 'pending') return pendingDetailRows.length
  if (detailKey.value === 'poured') return pouredDetailRows.length
  return planDetailRows.length
})

/** 造型数明细（点击「造型数」打开） */
interface MoldingDetailRow {
  line: string
  taskNo: string
  taskType: string
  series: string
  blankNo: string
  dateNo: string
  serialNo: string
  produceTime: string
}

const moldingDetailRows: MoldingDetailRow[] = [
  { line: '机体线', taskNo: 'XH20251118001', taskType: '普通类', series: '机体系列', blankNo: '1002380677R', dateNo: '251118', serialNo: '0001', produceTime: '2025-11-18 08:15:22' },
  { line: '机体线', taskNo: 'XH20251118002', taskType: '参数变更类', series: '机体系列', blankNo: '1000000244R', dateNo: '251118', serialNo: '0002', produceTime: '2025-11-18 08:42:10' },
  { line: '大机线', taskNo: 'XH20251118003', taskType: '普通类', series: '大机系列', blankNo: '1002381102R', dateNo: '251118', serialNo: '0003', produceTime: '2025-11-18 09:05:47' },
  { line: '曲轴线', taskNo: 'XH20251118004', taskType: '验证类', series: '曲轴系列', blankNo: '1001560088R', dateNo: '251118', serialNo: '0004', produceTime: '2025-11-18 09:31:26' },
  { line: '新产品线', taskNo: 'XH20251118005', taskType: '临脱+验证', series: '新产品系列', blankNo: '1004420015R', dateNo: '251118', serialNo: '0005', produceTime: '2025-11-18 10:08:55' },
  { line: '机体线', taskNo: 'XH20251118006', taskType: '普通类', series: '机体系列', blankNo: '1002380901R', dateNo: '251118', serialNo: '0006', produceTime: '2025-11-18 10:36:19' },
  { line: '机体线', taskNo: 'XH20251117011', taskType: '挑选类', series: '机体系列', blankNo: '1000000311R', dateNo: '251117', serialNo: '0011', produceTime: '2025-11-17 14:52:03' },
  { line: '曲轴线', taskNo: 'XH20251117012', taskType: '普通类', series: '曲轴系列', blankNo: '1001560120R', dateNo: '251117', serialNo: '0012', produceTime: '2025-11-17 15:27:44' },
  { line: '新产品线', taskNo: 'XH20251117013', taskType: '参数变更类', series: '新产品系列', blankNo: '1004420040R', dateNo: '251117', serialNo: '0013', produceTime: '2025-11-17 16:11:38' },
  { line: '大机线', taskNo: 'XH20251116021', taskType: '验证类', series: '大机系列', blankNo: '1002381205R', dateNo: '251116', serialNo: '0021', produceTime: '2025-11-16 08:47:52' },
  { line: '机体线', taskNo: 'XH20251116022', taskType: '普通类', series: '机体系列', blankNo: '1000000455R', dateNo: '251116', serialNo: '0022', produceTime: '2025-11-16 09:20:15' },
  { line: '曲轴线', taskNo: 'XH20251116023', taskType: '临脱+验证', series: '曲轴系列', blankNo: '1001560177R', dateNo: '251116', serialNo: '0023', produceTime: '2025-11-16 10:33:41' }
]

/** 下芯数明细（点击「下芯数」打开；下芯数量合计 = 86 颗） */
interface CoreSetDetailRow {
  line: string
  partNo: string
  series: string
  dateNo: string
  serialNo: string
  coreCount: number
  coreTime: string
}

const coreDetailRows: CoreSetDetailRow[] = [
  { line: '机体线', partNo: '1002380677R', series: '机体系列', dateNo: '251118', serialNo: '0001', coreCount: 8, coreTime: '2025-11-18 09:48:02' },
  { line: '机体线', partNo: '1000000244R', series: '机体系列', dateNo: '251118', serialNo: '0002', coreCount: 12, coreTime: '2025-11-18 10:05:27' },
  { line: '大机线', partNo: '1002381102R', series: '大机系列', dateNo: '251118', serialNo: '0003', coreCount: 6, coreTime: '2025-11-18 10:02:55' },
  { line: '曲轴线', partNo: '1001560088R', series: '曲轴系列', dateNo: '251118', serialNo: '0004', coreCount: 10, coreTime: '2025-11-18 10:14:12' },
  { line: '新产品线', partNo: '1004420015R', series: '新产品系列', dateNo: '251118', serialNo: '0005', coreCount: 7, coreTime: '2025-11-18 11:02:41' },
  { line: '机体线', partNo: '1002380901R', series: '机体系列', dateNo: '251117', serialNo: '0006', coreCount: 9, coreTime: '2025-11-17 15:54:47' },
  { line: '曲轴线', partNo: '1001560120R', series: '曲轴系列', dateNo: '251117', serialNo: '0007', coreCount: 11, coreTime: '2025-11-17 17:42:51' },
  { line: '新产品线', partNo: '1004420040R', series: '新产品系列', dateNo: '251117', serialNo: '0008', coreCount: 5, coreTime: '2025-11-17 17:20:33' },
  { line: '大机线', partNo: '1002381205R', series: '大机系列', dateNo: '251116', serialNo: '0009', coreCount: 8, coreTime: '2025-11-16 09:51:36' },
  { line: '机体线', partNo: '1000000455R', series: '机体系列', dateNo: '251116', serialNo: '0010', coreCount: 10, coreTime: '2025-11-16 10:56:49' }
]

/** 合箱数明细（点击「合箱数」打开） */
interface CloseDetailRow {
  line: string
  partNo: string
  series: string
  dateNo: string
  serialNo: string
  flaskNo: string
  operator: string
  closeTime: string
}

const closeDetailRows: CloseDetailRow[] = [
  { line: '机体线', partNo: '1002380677R', series: '机体系列', dateNo: '251118', serialNo: '0001', flaskNo: 'SX-100238-01', operator: '张伟', closeTime: '2025-11-18 10:36:44' },
  { line: '机体线', partNo: '1000000244R', series: '机体系列', dateNo: '251118', serialNo: '0002', flaskNo: 'SX-100000-02', operator: '李强', closeTime: '2025-11-18 10:58:19' },
  { line: '大机线', partNo: '1002381102R', series: '大机系列', dateNo: '251118', serialNo: '0003', flaskNo: 'SX-100238-07', operator: '王芳', closeTime: '2025-11-18 10:51:33' },
  { line: '曲轴线', partNo: '1001560088R', series: '曲轴系列', dateNo: '251118', serialNo: '0004', flaskNo: 'SX-100156-03', operator: '刘洋', closeTime: '2025-11-18 11:22:08' },
  { line: '新产品线', partNo: '1004420015R', series: '新产品系列', dateNo: '251118', serialNo: '0005', flaskNo: 'SX-100442-01', operator: '陈静', closeTime: '2025-11-18 11:45:27' },
  { line: '机体线', partNo: '1002380901R', series: '机体系列', dateNo: '251117', serialNo: '0006', flaskNo: 'SX-100238-02', operator: '张伟', closeTime: '2025-11-17 16:40:22' },
  { line: '曲轴线', partNo: '1001560120R', series: '曲轴系列', dateNo: '251117', serialNo: '0007', flaskNo: 'SX-100156-05', operator: '赵磊', closeTime: '2025-11-17 18:25:09' },
  { line: '新产品线', partNo: '1004420040R', series: '新产品系列', dateNo: '251117', serialNo: '0008', flaskNo: 'SX-100442-04', operator: '陈静', closeTime: '2025-11-17 17:58:36' },
  { line: '大机线', partNo: '1002381205R', series: '大机系列', dateNo: '251116', serialNo: '0009', flaskNo: 'SX-100238-11', operator: '王芳', closeTime: '2025-11-16 10:38:55' },
  { line: '机体线', partNo: '1000000455R', series: '机体系列', dateNo: '251116', serialNo: '0010', flaskNo: 'SX-100000-06', operator: '李强', closeTime: '2025-11-16 11:41:23' },
  { line: '曲轴线', partNo: '1001560177R', series: '曲轴系列', dateNo: '251116', serialNo: '0011', flaskNo: 'SX-100156-08', operator: '刘洋', closeTime: '2025-11-16 12:15:47' },
  { line: '新产品线', partNo: '1004420062R', series: '新产品系列', dateNo: '251116', serialNo: '0012', flaskNo: 'SX-100442-05', operator: '赵磊', closeTime: '2025-11-16 15:49:11' }
]

/** 待浇注数明细（点击「待浇注数」打开；共 14 条 = 14 箱） */
interface PendingPourDetailRow {
  line: string
  partNo: string
  series: string
  dateNo: string
  serialNo: string
  pourSlot: string
  operator: string
  finishTime: string
}

const pendingDetailRows: PendingPourDetailRow[] = [
  { line: '机体线', partNo: '1002380677R', series: '机体系列', dateNo: '251118', serialNo: '0001', pourSlot: 'KW-01', operator: '张伟', finishTime: '2025-11-18 13:20:15' },
  { line: '机体线', partNo: '1000000244R', series: '机体系列', dateNo: '251118', serialNo: '0002', pourSlot: 'KW-02', operator: '李强', finishTime: '2025-11-18 13:42:38' },
  { line: '大机线', partNo: '1002381102R', series: '大机系列', dateNo: '251118', serialNo: '0003', pourSlot: 'KW-03', operator: '王芳', finishTime: '2025-11-18 14:05:22' },
  { line: '曲轴线', partNo: '1001560088R', series: '曲轴系列', dateNo: '251118', serialNo: '0004', pourSlot: 'KW-04', operator: '刘洋', finishTime: '2025-11-18 14:28:51' },
  { line: '新产品线', partNo: '1004420015R', series: '新产品系列', dateNo: '251118', serialNo: '0005', pourSlot: 'KW-05', operator: '陈静', finishTime: '2025-11-18 14:51:09' },
  { line: '机体线', partNo: '1002380901R', series: '机体系列', dateNo: '251118', serialNo: '0006', pourSlot: 'KW-06', operator: '张伟', finishTime: '2025-11-18 15:13:44' },
  { line: '曲轴线', partNo: '1001560120R', series: '曲轴系列', dateNo: '251117', serialNo: '0007', pourSlot: 'KW-01', operator: '赵磊', finishTime: '2025-11-17 19:22:30' },
  { line: '新产品线', partNo: '1004420040R', series: '新产品系列', dateNo: '251117', serialNo: '0008', pourSlot: 'KW-04', operator: '陈静', finishTime: '2025-11-17 18:47:16' },
  { line: '大机线', partNo: '1002381205R', series: '大机系列', dateNo: '251116', serialNo: '0009', pourSlot: 'KW-02', operator: '王芳', finishTime: '2025-11-16 12:45:58' },
  { line: '机体线', partNo: '1000000455R', series: '机体系列', dateNo: '251116', serialNo: '0010', pourSlot: 'KW-03', operator: '李强', finishTime: '2025-11-16 13:08:27' },
  { line: '曲轴线', partNo: '1001560177R', series: '曲轴系列', dateNo: '251116', serialNo: '0011', pourSlot: 'KW-05', operator: '刘洋', finishTime: '2025-11-16 14:31:05' },
  { line: '新产品线', partNo: '1004420062R', series: '新产品系列', dateNo: '251116', serialNo: '0012', pourSlot: 'KW-06', operator: '赵磊', finishTime: '2025-11-16 16:02:49' },
  { line: '机体线', partNo: '1002381310R', series: '机体系列', dateNo: '251117', serialNo: '0013', pourSlot: 'KW-01', operator: '张伟', finishTime: '2025-11-17 20:14:33' },
  { line: '大机线', partNo: '1002381102R', series: '大机系列', dateNo: '251117', serialNo: '0014', pourSlot: 'KW-03', operator: '王芳', finishTime: '2025-11-17 21:05:12' }
]

/** 浇注数明细（点击「浇注数」打开；数量合计 = 108 箱） */
interface PouredDetailRow {
  taskNo: string
  line: string
  productPartNo: string
  blankSerialNo: string
  qty: number
  flaskSerialNo: string
  furnaceNo: string
  ladleNo: string
  ladleBatch: string
  pourTime: string
}

const pouredDetailRows: PouredDetailRow[] = [
  { taskNo: 'XH20251118001', line: '机体线', productPartNo: '1002380677R', blankSerialNo: 'MP-0001', qty: 12, flaskSerialNo: 'SX-0001', furnaceNo: 'RC-03', ladleNo: 'B-02', ladleBatch: '1', pourTime: '2025-11-18 13:20:15' },
  { taskNo: 'XH20251118002', line: '机体线', productPartNo: '1000000244R', blankSerialNo: 'MP-0002', qty: 9, flaskSerialNo: 'SX-0002', furnaceNo: 'RC-03', ladleNo: 'B-02', ladleBatch: '2', pourTime: '2025-11-18 13:42:38' },
  { taskNo: 'XH20251118003', line: '大机线', productPartNo: '1002381102R', blankSerialNo: 'MP-0003', qty: 11, flaskSerialNo: 'SX-0003', furnaceNo: 'RC-04', ladleNo: 'B-01', ladleBatch: '1', pourTime: '2025-11-18 14:05:22' },
  { taskNo: 'XH20251118004', line: '曲轴线', productPartNo: '1001560088R', blankSerialNo: 'MP-0004', qty: 8, flaskSerialNo: 'SX-0004', furnaceNo: 'RC-04', ladleNo: 'B-01', ladleBatch: '2', pourTime: '2025-11-18 14:28:51' },
  { taskNo: 'XH20251118005', line: '新产品线', productPartNo: '1004420015R', blankSerialNo: 'MP-0005', qty: 10, flaskSerialNo: 'SX-0005', furnaceNo: 'RC-05', ladleNo: 'B-03', ladleBatch: '1', pourTime: '2025-11-18 14:51:09' },
  { taskNo: 'XH20251118006', line: '机体线', productPartNo: '1002380901R', blankSerialNo: 'MP-0006', qty: 7, flaskSerialNo: 'SX-0006', furnaceNo: 'RC-05', ladleNo: 'B-03', ladleBatch: '2', pourTime: '2025-11-18 15:13:44' },
  { taskNo: 'XH20251117011', line: '机体线', productPartNo: '1000000311R', blankSerialNo: 'MP-0011', qty: 12, flaskSerialNo: 'SX-0011', furnaceNo: 'RC-01', ladleNo: 'B-02', ladleBatch: '3', pourTime: '2025-11-17 19:22:30' },
  { taskNo: 'XH20251117012', line: '曲轴线', productPartNo: '1001560120R', blankSerialNo: 'MP-0012', qty: 9, flaskSerialNo: 'SX-0012', furnaceNo: 'RC-01', ladleNo: 'B-04', ladleBatch: '1', pourTime: '2025-11-17 19:48:17' },
  { taskNo: 'XH20251117013', line: '新产品线', productPartNo: '1004420040R', blankSerialNo: 'MP-0013', qty: 8, flaskSerialNo: 'SX-0013', furnaceNo: 'RC-02', ladleNo: 'B-04', ladleBatch: '2', pourTime: '2025-11-17 20:14:33' },
  { taskNo: 'XH20251116021', line: '大机线', productPartNo: '1002381205R', blankSerialNo: 'MP-0021', qty: 10, flaskSerialNo: 'SX-0021', furnaceNo: 'RC-06', ladleNo: 'B-01', ladleBatch: '3', pourTime: '2025-11-16 12:45:58' },
  { taskNo: 'XH20251116022', line: '机体线', productPartNo: '1000000455R', blankSerialNo: 'MP-0022', qty: 7, flaskSerialNo: 'SX-0022', furnaceNo: 'RC-06', ladleNo: 'B-02', ladleBatch: '4', pourTime: '2025-11-16 13:08:27' },
  { taskNo: 'XH20251116023', line: '曲轴线', productPartNo: '1001560177R', blankSerialNo: 'MP-0023', qty: 5, flaskSerialNo: 'SX-0023', furnaceNo: 'RC-02', ladleNo: 'B-03', ladleBatch: '3', pourTime: '2025-11-16 14:31:05' }
]

/** 任务列表 mock（各班组共用同一套数据） */
interface TaskCardItem {
  blankNo: string
  blankName: string
  planBoxes: number
  fixtureCount: number
  flaskCount: number
  line: string
  status: TaskStatus
  taskType: TaskType
}

/** 当前状态枚举 */
type TaskStatus = '未开始' | '生产中' | '完成' | '暂停' | '异常结束'

/** 任务类型枚举 */
type TaskType = '普通类' | '参数变更类' | '验证类' | '临脱+验证' | '挑选类'

const statusToneMap: Record<TaskStatus, 'wait' | 'run' | 'done' | 'pause' | 'error'> = {
  未开始: 'wait',
  生产中: 'run',
  完成: 'done',
  暂停: 'pause',
  异常结束: 'error'
}

const taskTypeToneMap: Record<TaskType, string> = {
  普通类: 'type-normal',
  参数变更类: 'type-param',
  验证类: 'type-verify',
  '临脱+验证': 'type-temp',
  挑选类: 'type-pick'
}

const taskList = ref<TaskCardItem[]>([
  { blankNo: '1002380677R', blankName: '气缸盖毛坯', planBoxes: 6, fixtureCount: 2, flaskCount: 6, line: '机体线', status: '未开始', taskType: '普通类' },
  { blankNo: '1000000244R', blankName: '主轴承盖', planBoxes: 24, fixtureCount: 4, flaskCount: 24, line: '机体线', status: '未开始', taskType: '参数变更类' },
  { blankNo: '1002381102R', blankName: '气缸体毛坯', planBoxes: 12, fixtureCount: 3, flaskCount: 12, line: '大机线', status: '生产中', taskType: '普通类' },
  { blankNo: '1001560088R', blankName: '曲轴箱盖', planBoxes: 18, fixtureCount: 3, flaskCount: 18, line: '曲轴线', status: '生产中', taskType: '验证类' },
  { blankNo: '1004420015R', blankName: '新产品壳体', planBoxes: 9, fixtureCount: 2, flaskCount: 9, line: '新产品线', status: '暂停', taskType: '临脱+验证' },
  { blankNo: '1002380901R', blankName: '气缸盖毛坯', planBoxes: 15, fixtureCount: 3, flaskCount: 15, line: '机体线', status: '完成', taskType: '普通类' },
  { blankNo: '1000000311R', blankName: '主轴承盖', planBoxes: 30, fixtureCount: 5, flaskCount: 30, line: '机体线', status: '未开始', taskType: '挑选类' },
  { blankNo: '1001560120R', blankName: '连杆盖', planBoxes: 22, fixtureCount: 4, flaskCount: 22, line: '曲轴线', status: '生产中', taskType: '普通类' },
  { blankNo: '1004420040R', blankName: '支架毛坯', planBoxes: 11, fixtureCount: 2, flaskCount: 11, line: '新产品线', status: '异常结束', taskType: '参数变更类' },
  { blankNo: '1002381205R', blankName: '气缸体毛坯', planBoxes: 20, fixtureCount: 4, flaskCount: 20, line: '大机线', status: '未开始', taskType: '验证类' },
  { blankNo: '1000000455R', blankName: '轴承座', planBoxes: 16, fixtureCount: 3, flaskCount: 16, line: '机体线', status: '完成', taskType: '普通类' },
  { blankNo: '1001560177R', blankName: '飞轮壳', planBoxes: 8, fixtureCount: 2, flaskCount: 8, line: '曲轴线', status: '暂停', taskType: '临脱+验证' },
  { blankNo: '1004420062R', blankName: '端盖毛坯', planBoxes: 14, fixtureCount: 3, flaskCount: 14, line: '新产品线', status: '生产中', taskType: '挑选类' },
  { blankNo: '1002381310R', blankName: '气缸盖毛坯', planBoxes: 26, fixtureCount: 5, flaskCount: 26, line: '机体线', status: '异常结束', taskType: '普通类' }
])

/** 造型追溯卡片（各班组共用 mock；时间未到的工序显示 —） */
interface TraceCardItem {
  blankNo: string
  series: string
  dateNo: string
  serialNo: string
  startTime: string
  closeTime: string
  pourTime: string
}

const traceList = ref<TraceCardItem[]>([
  { blankNo: '1002380677R', series: '机体系列', dateNo: '251118', serialNo: '0001', startTime: '2025-11-18 08:12:30', closeTime: '2025-11-18 10:36:44', pourTime: '2025-11-18 11:20:08' },
  { blankNo: '1000000244R', series: '机体系列', dateNo: '251118', serialNo: '0002', startTime: '2025-11-18 08:30:11', closeTime: '2025-11-18 10:58:19', pourTime: '2025-11-18 11:45:03' },
  { blankNo: '1002381102R', series: '大机系列', dateNo: '251118', serialNo: '0003', startTime: '2025-11-18 08:05:52', closeTime: '2025-11-18 10:51:33', pourTime: '' },
  { blankNo: '1001560088R', series: '曲轴系列', dateNo: '251118', serialNo: '0004', startTime: '2025-11-18 08:41:25', closeTime: '', pourTime: '' },
  { blankNo: '1004420015R', series: '新产品系列', dateNo: '251118', serialNo: '0005', startTime: '2025-11-18 09:02:06', closeTime: '', pourTime: '' },
  { blankNo: '1002380901R', series: '机体系列', dateNo: '251117', serialNo: '0006', startTime: '2025-11-17 14:20:18', closeTime: '2025-11-17 16:40:22', pourTime: '2025-11-17 17:18:56' },
  { blankNo: '1000000311R', series: '机体系列', dateNo: '251117', serialNo: '0007', startTime: '2025-11-17 15:05:44', closeTime: '', pourTime: '' },
  { blankNo: '1001560120R', series: '曲轴系列', dateNo: '251117', serialNo: '0008', startTime: '2025-11-17 16:10:03', closeTime: '2025-11-17 18:25:09', pourTime: '2025-11-17 19:03:44' },
  { blankNo: '1004420040R', series: '新产品系列', dateNo: '251117', serialNo: '0009', startTime: '2025-11-17 16:48:27', closeTime: '', pourTime: '' },
  { blankNo: '1002381205R', series: '大机系列', dateNo: '251116', serialNo: '0010', startTime: '2025-11-16 08:15:40', closeTime: '2025-11-16 10:38:55', pourTime: '2025-11-16 11:22:17' },
  { blankNo: '1000000455R', series: '机体系列', dateNo: '251116', serialNo: '0011', startTime: '2025-11-16 09:22:58', closeTime: '2025-11-16 11:41:23', pourTime: '2025-11-16 12:20:08' },
  { blankNo: '1001560177R', series: '曲轴系列', dateNo: '251116', serialNo: '0012', startTime: '2025-11-16 10:08:33', closeTime: '', pourTime: '' },
  { blankNo: '1004420062R', series: '新产品系列', dateNo: '251116', serialNo: '0013', startTime: '2025-11-16 13:35:16', closeTime: '2025-11-16 15:49:11', pourTime: '2025-11-16 16:31:04' },
  { blankNo: '1002381310R', series: '机体系列', dateNo: '251115', serialNo: '0014', startTime: '2025-11-15 08:02:49', closeTime: '2025-11-15 10:22:40', pourTime: '2025-11-15 11:05:19' }
])

const taskListEl = ref<HTMLElement | null>(null)
const traceListEl = ref<HTMLElement | null>(null)
let taskScrollTimer: ReturnType<typeof setInterval> | null = null
let traceScrollTimer: ReturnType<typeof setInterval> | null = null
let taskHoverPaused = false
let traceHoverPaused = false

/** 数据过多时自动上下滚动；悬停暂停 */
function startScroll(elRef: typeof taskListEl, paused: () => boolean): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const el = elRef.value
    if (!el || paused()) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      el.scrollTop = 0
    } else {
      el.scrollTop += 1
    }
  }, 40)
}

function stopScroll(timer: ReturnType<typeof setInterval> | null) {
  if (timer) clearInterval(timer)
}

function onTaskEnter() { taskHoverPaused = true }
function onTaskLeave() { taskHoverPaused = false }
function onTraceEnter() { traceHoverPaused = true }
function onTraceLeave() { traceHoverPaused = false }

onMounted(() => {
  taskScrollTimer = startScroll(taskListEl, () => taskHoverPaused)
  traceScrollTimer = startScroll(traceListEl, () => traceHoverPaused)
})

onBeforeUnmount(() => {
  stopScroll(taskScrollTimer)
  stopScroll(traceScrollTimer)
})

/** 占位面板 option：显示建设中提示 */
const placeholderOption: EChartsOption = {
  title: {
    text: '页面建设中',
    left: 'center',
    top: 'middle',
    textStyle: {
      color: 'rgba(169, 201, 212, 0.72)',
      fontSize: 14,
      fontWeight: 400
    }
  },
  xAxis: { show: false, type: 'category', data: [] },
  yAxis: { show: false, type: 'value' },
  series: []
}

/* =========================
   通用图表样式（与生产运营大屏一致）
   ========================= */
const tooltipBase = {
  backgroundColor: 'rgba(5, 24, 34, 0.96)',
  borderColor: 'rgba(0, 198, 239, 0.55)',
  textStyle: { color: '#dff8ff' }
}

const axisLine = { lineStyle: { color: 'rgba(76, 196, 226, 0.55)' } }
const splitLine = { lineStyle: { type: 'dashed' as const, color: 'rgba(72, 164, 194, 0.24)' } }
const axisLabel = { color: '#a9c9d4', fontSize: 10 }
const axisNameStyle = { color: '#a9c9d4', fontSize: 10 }

/** 近 7 日横轴（MM-DD） */
const todayStart = dayjs().startOf('day')
const pourDates = Array.from({ length: 7 }, (_, index) =>
  todayStart.subtract(6 - index, 'day').format('MM-DD')
)

/** 按日期确定性生成近一周浇注吨位，刷新不跳变 */
function mockPourTons(): number[] {
  return pourDates.map((_, index) => {
    const date = todayStart.subtract(6 - index, 'day')
    const seed = date.year() + date.month() * 31 + date.date() + 23
    return 86 + ((seed * 13) % 41)
  })
}

/** 浇注吨位统计：横轴日期，纵轴吨位，柱状图 */
const pourTonsOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const body = list
        .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value} 吨`)
        .join('<br/>')
      return `${list[0]?.axisValue ?? ''}<br/>${body}`
    }
  },
  grid: { left: '4%', right: '5%', bottom: '4%', top: '14%', containLabel: true },
  xAxis: {
    type: 'category',
    data: pourDates,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '吨',
    nameTextStyle: axisNameStyle,
    axisLabel,
    splitLine,
    axisLine: { show: false },
    axisTick: { show: false }
  },
  series: [
    {
      name: '浇注吨位',
      type: 'bar',
      data: mockPourTons(),
      barWidth: '36%',
      itemStyle: {
        color: '#20cfff',
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: '#dff8ff', fontSize: 10 }
    }
  ]
}

/** 生产趋势：图例改为面板头部单选下拉（仅各系列，无「全部」），单系列面积图 */
const trendSeriesNames = ['计划数', '造型数', '合箱数', '浇注数', '转运数'] as const

const trendSeriesData: Record<(typeof trendSeriesNames)[number], number[]> = {
  计划数: [128, 132, 126, 140, 136, 142, 128],
  造型数: [116, 121, 118, 129, 124, 133, 116],
  合箱数: [112, 118, 114, 124, 120, 128, 113],
  浇注数: [108, 114, 110, 120, 116, 124, 108],
  转运数: [104, 110, 106, 116, 112, 120, 104]
}

/** 各系列主色（面积渐变同色系） */
const trendSeriesColor: Record<(typeof trendSeriesNames)[number], string> = {
  计划数: '#20cfff',
  造型数: '#4ee6a6',
  合箱数: '#ffd52a',
  浇注数: '#9b8cff',
  转运数: '#ff4f8b'
}

const activeTrendKey = ref<(typeof trendSeriesNames)[number]>('计划数')

/** 六宫格：首格为任务列表，浇注吨位为柱状图，其余占位 */
const productionTrendOption = computed<EChartsOption>(() => {
  const name = activeTrendKey.value
  const color = trendSeriesColor[name]

  return {
    tooltip: { trigger: 'axis', ...tooltipBase },
    // 图例已改为面板头部下拉，不再内嵌 legend
    legend: { show: false },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: pourDates,
      axisLabel: { ...axisLabel, interval: 0 },
      axisLine,
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '箱数',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name,
        type: 'line',
        smooth: true,
        data: trendSeriesData[name],
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color },
        itemStyle: { color },
        // 面积渐变与「过程检验分析」一致
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}59` },
              { offset: 1, color: `${color}05` }
            ]
          }
        },
        label: {
          show: true,
          position: 'top',
          color: '#dff8ff',
          fontSize: 10,
          formatter: (params: any) => `${params.value}`
        }
      }
    ]
  }
})

/* =========================
   不合格品分析：返工 / 返修 / 报废 / 回用，横向条形图
   ========================= */
type NgTabKey = 'rework' | 'repair' | 'scrap' | 'reuse'

const ngTabs = [
  { key: 'rework', label: '返工' },
  { key: 'repair', label: '返修' },
  { key: 'scrap', label: '报废' },
  { key: 'reuse', label: '回用' }
] as const

const activeNgKey = ref<NgTabKey>('rework')

/** 各类型下按毛坯件号的数量 mock（降序排列，便于横向条形阅读） */
const ngMetrics: Record<
  NgTabKey,
  { color: string; items: { blankNo: string; count: number }[] }
> = {
  rework: {
    color: '#20cfff',
    items: [
      { blankNo: '1002380677R', count: 42 },
      { blankNo: '1000000244R', count: 36 },
      { blankNo: '1002381102R', count: 31 },
      { blankNo: '1001560088R', count: 27 },
      { blankNo: '1004420015R', count: 22 },
      { blankNo: '1002380901R', count: 18 },
      { blankNo: '1000000311R', count: 14 },
      { blankNo: '1001560120R', count: 9 }
    ]
  },
  repair: {
    color: '#ffd52a',
    items: [
      { blankNo: '1002381102R', count: 33 },
      { blankNo: '1002380677R', count: 28 },
      { blankNo: '1004420040R', count: 24 },
      { blankNo: '1001560088R', count: 19 },
      { blankNo: '1000000244R', count: 16 },
      { blankNo: '1002381310R', count: 12 },
      { blankNo: '1001560177R', count: 8 },
      { blankNo: '1000000455R', count: 5 }
    ]
  },
  scrap: {
    color: '#ff4f8b',
    items: [
      { blankNo: '1004420015R', count: 18 },
      { blankNo: '1002381102R', count: 14 },
      { blankNo: '1001560120R', count: 11 },
      { blankNo: '1002380677R', count: 9 },
      { blankNo: '1004420062R', count: 7 },
      { blankNo: '1000000311R', count: 5 },
      { blankNo: '1002380901R', count: 4 },
      { blankNo: '1001560088R', count: 2 }
    ]
  },
  reuse: {
    color: '#4ee6a6',
    items: [
      { blankNo: '1000000244R', count: 39 },
      { blankNo: '1002381310R', count: 34 },
      { blankNo: '1001560088R', count: 29 },
      { blankNo: '1002380901R', count: 25 },
      { blankNo: '1004420040R', count: 21 },
      { blankNo: '1000000455R', count: 17 },
      { blankNo: '1002381102R', count: 13 },
      { blankNo: '1001560177R', count: 10 }
    ]
  }
}

/** 缺陷名称池（悬浮框按缺陷分类展示用） */
const ngDefectNames = ['损伤', '挤砂', '气孔', '砂眼', '夹渣', '裂纹']

/**
 * 按 件号+类型 确定性拆分该柱的总数为若干缺陷分类（各班组刷新不跳变），
 * 返回按数量从多到少排列的缺陷清单。
 */
function ngDefectBreakdown(
  blankNo: string,
  total: number,
  tabKey: string
): { name: string; count: number }[] {
  if (total <= 0) return []
  const seed = `${tabKey}${blankNo}`
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  // 目标 2~4 类，但不超过总数与名称池大小（保证后续分配循环可终止）
  const typeCount = Math.max(1, Math.min(2 + (seed % 3), total, ngDefectNames.length))

  // 顺序遍历名称池取不重复缺陷：一轮内必然取满 typeCount 个（不会死循环）
  const picks: string[] = []
  for (let i = 0; i < ngDefectNames.length && picks.length < typeCount; i++) {
    const name = ngDefectNames[(seed + i) % ngDefectNames.length]
    if (!picks.includes(name)) picks.push(name)
  }

  const weights = picks.map((_, i) => ((seed >> (i * 2)) % 5) + 1)
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  const parts = weights.map((w) => Math.max(1, Math.floor((w * total) / weightSum)))
  let diff = total - parts.reduce((sum, n) => sum + n, 0)
  // typeCount ≤ total 且每份 ≥1：差值必能在有余量的份上摊平，循环可终止
  for (let i = 0; diff !== 0 && parts.length > 0; i = (i + 1) % parts.length) {
    if (diff > 0) {
      parts[i] += 1
      diff -= 1
    } else if (parts[i] > 1) {
      parts[i] -= 1
      diff += 1
    }
  }

  return picks
    .map((name, i) => ({ name, count: parts[i] ?? 0 }))
    .sort((a, b) => b.count - a.count)
}

/** 不合格品分析：纵轴毛坯件号、横轴数量的横向条形图（由多到少排序） */
function createNgOption(key: NgTabKey): EChartsOption {
  const metric = ngMetrics[key]
  const label = ngTabs.find((tab) => tab.key === key)?.label ?? ''
  // 横向条形：按数量由多到少排序后自上而下绘制
  const sortedItems = [...metric.items].sort((a, b) => b.count - a.count)
  const blankNos = sortedItems.map((item) => item.blankNo)
  const counts = sortedItems.map((item) => item.count)
  const maxCount = Math.max(...counts, 1)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipBase,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item) return ''
        // 悬浮框按缺陷名称分类展示（损伤：3 / 挤砂：2 …），由多到少
        return ngDefectBreakdown(item.name as string, item.value as number, key)
          .map((d) => `${d.name}：${d.count}`)
          .join('<br/>')
      }
    },
    grid: { left: '4%', right: '10%', bottom: '4%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: axisNameStyle,
      axisLabel,
      splitLine,
      axisLine: { show: false },
      axisTick: { show: false },
      max: Math.ceil(maxCount * 1.15)
    },
    yAxis: {
      type: 'category',
      data: blankNos,
      axisLabel: { ...axisLabel, interval: 0 },
      axisLine,
      axisTick: { show: false },
      splitLine: { show: false }
    },
    series: [
      {
        name: label,
        type: 'bar',
        data: counts,
        barWidth: '55%',
        itemStyle: {
          color: metric.color,
          borderRadius: [0, 3, 3, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#dff8ff',
          fontSize: 10
        }
      }
    ]
  }
}

const ngOption = computed(() => createNgOption(activeNgKey.value))

/** 过程检验分析：最近 6 个月，横轴月份、纵轴数量的堆叠柱状图 */
const processMonths = Array.from({ length: 6 }, (_, index) =>
  todayStart.subtract(5 - index, 'month').format('YYYY-MM')
)

/** 确定性 mock：每月 待送检 + 合格 + 不合格 = 过程检验数量 */
function mockProcessInspectData(): { pending: number[]; pass: number[]; fail: number[] } {
  const pending: number[] = []
  const pass: number[] = []
  const fail: number[] = []
  processMonths.forEach((_, index) => {
    const base = todayStart.subtract(5 - index, 'month')
    const seed = base.year() * 100 + base.month() + 17
    const total = 360 + ((seed * 13) % 90) // 过程检验数量 360~449
    const failCount = 8 + ((seed * 7) % 18) // 不合格 8~25
    const pendingCount = 30 + ((seed * 11) % 40) // 待送检 30~69
    fail.push(failCount)
    pending.push(pendingCount)
    pass.push(total - failCount - pendingCount)
  })
  return { pending, pass, fail }
}

const processInspectData = mockProcessInspectData()

const processInspectOption: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    ...tooltipBase,
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      const total = list.reduce((sum, item: any) => sum + Number(item.value ?? 0), 0)
      const body = list
        .map((item: any) => `${item.marker} ${item.seriesName}: ${item.value}`)
        .join('<br/>')
      return `${list[0]?.axisValue ?? ''}<br/>${body}<br/>过程检验数量: ${total}`
    }
  },
  legend: {
    data: ['待送检数量', '合格数量', '不合格数量'],
    textStyle: { color: '#a9c9d4' },
    top: 4
  },
  grid: { left: '4%', right: '6%', bottom: '4%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    data: processMonths,
    axisLabel: { ...axisLabel, interval: 0 },
    axisLine,
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '数量',
    nameTextStyle: axisNameStyle,
    axisLabel,
    splitLine,
    axisLine: { show: false },
    axisTick: { show: false }
  },
  series: [
    {
      name: '待送检数量',
      type: 'bar',
      stack: 'total',
      data: processInspectData.pending,
      barWidth: '42%',
      itemStyle: { color: '#ffd52a' },
      label: {
        show: true,
        position: 'inside',
        color: '#04202b',
        fontSize: 9,
        formatter: (params: any) => `${params.value}`
      }
    },
    {
      name: '合格数量',
      type: 'bar',
      stack: 'total',
      data: processInspectData.pass,
      itemStyle: { color: '#4ee6a6' },
      label: {
        show: true,
        position: 'inside',
        color: '#04202b',
        fontSize: 9,
        formatter: (params: any) => `${params.value}`
      }
    },
    {
      name: '不合格数量',
      type: 'bar',
      stack: 'total',
      data: processInspectData.fail,
      itemStyle: { color: '#ff4f8b', borderRadius: [3, 3, 0, 0] },
      label: {
        show: true,
        position: 'inside',
        color: '#f4fdff',
        fontSize: 9,
        formatter: (params: any) => `${params.value}`
      }
    }
  ]
}

/** 面板 tab 切换：生产趋势系列 / 不合格品分析按类型（返工/返修/报废/回用） */
function handleTabChange(payload: { title: string; key: string }) {
  if (payload.title === '不合格品分析') {
    activeNgKey.value = payload.key as NgTabKey
  } else if (payload.title === '生产趋势') {
    activeTrendKey.value = payload.key as (typeof trendSeriesNames)[number]
  }
}

const panels = computed(() => [
  { title: '任务列表', contentKey: 'taskList' },
  { title: '造型追溯', contentKey: 'traceList' },
  {
    title: '生产趋势',
    option: productionTrendOption.value,
    tabs: trendSeriesNames.map((name) => ({ key: name as string, label: name })),
    activeKey: activeTrendKey.value,
    mode: 'select' as const
  },
  {
    title: '不合格品分析',
    option: ngOption.value,
    tabs: ngTabs.map((tab) => ({ key: tab.key as string, label: tab.label })),
    activeKey: activeNgKey.value
  },
  { title: '浇注吨位统计', option: pourTonsOption },
  { title: '过程检验分析', option: processInspectOption }
])
</script>

<template>
  <!-- 造型班组可视化：可切换班组 + 6 指标 + 任务列表卡片 -->
  <LineDashboardShell
    title="造型班组可视化"
    :indicators="indicators"
    :panels="panels"
    @tab-change="handleTabChange"
    @indicator-click="openIndicatorDetail"
  >
    <template #headerTeamsLeft>
      <button
        v-for="name in teamGroups.left"
        :key="name"
        type="button"
        class="team-tag"
        :class="{ active: activeTeam === name }"
        @click="selectTeam(name)"
      >
        {{ name }}
      </button>
    </template>
    <template #headerTeamsRight>
      <button
        v-for="name in teamGroups.right"
        :key="name"
        type="button"
        class="team-tag"
        :class="{ active: activeTeam === name }"
        @click="selectTeam(name)"
      >
        {{ name }}
      </button>
    </template>

    <template #taskList>
      <div
        ref="taskListEl"
        class="task-list-scroll"
        @mouseenter="onTaskEnter"
        @mouseleave="onTaskLeave"
      >
        <div
          v-for="task in taskList"
          :key="task.blankNo"
          class="task-card"
        >
          <div class="task-card-grid">
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">毛坯件号:</span>
                <span class="task-value">{{ task.blankNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">毛坯名称:</span>
                <span class="task-value">{{ task.blankName }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">计划箱数:</span>
                <span class="task-value">{{ task.planBoxes }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">任务类型:</span>
                <span
                  class="task-type"
                  :class="taskTypeToneMap[task.taskType]"
                >{{ task.taskType }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">当前状态:</span>
                <span
                  class="task-status"
                  :class="`status-${statusToneMap[task.status]}`"
                >{{ task.status }}</span>
              </div>
            </div>
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">工装数:</span>
                <span class="task-value">{{ task.fixtureCount }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">砂箱数:</span>
                <span class="task-value">{{ task.flaskCount }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">产线:</span>
                <span class="task-value">{{ task.line }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #traceList>
      <div
        ref="traceListEl"
        class="task-list-scroll"
        @mouseenter="onTraceEnter"
        @mouseleave="onTraceLeave"
      >
        <div
          v-for="trace in traceList"
          :key="trace.blankNo"
          class="task-card trace-card"
        >
          <div class="task-card-grid trace-grid">
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">毛坯件号:</span>
                <span class="task-value">{{ trace.blankNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">系列:</span>
                <span class="task-value">{{ trace.series }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">日期号:</span>
                <span class="task-value">{{ trace.dateNo }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">流水号:</span>
                <span class="task-value">{{ trace.serialNo }}</span>
              </div>
            </div>
            <div class="task-card-col">
              <div class="task-field">
                <span class="task-label">任务开始时间:</span>
                <span class="task-value">{{ trace.startTime || '—' }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">合箱时间:</span>
                <span class="task-value">{{ trace.closeTime || '—' }}</span>
              </div>
              <div class="task-field">
                <span class="task-label">浇注时间:</span>
                <span class="task-value trace-pour">{{ trace.pourTime || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </LineDashboardShell>

  <!-- 指标 → 明细弹框：计划数 / 造型数 / 下芯数 / 合箱数 / 待浇注数 / 浇注数共用壳，按 detailKey 切换表格 -->
  <Teleport to="body">
    <div
      v-if="detailOpen"
      class="plan-modal-mask"
      @click.self="closeIndicatorDetail"
    >
      <div class="plan-modal" role="dialog" aria-modal="true" :aria-label="detailTitle">
        <div class="plan-modal-corner tl"></div>
        <div class="plan-modal-corner tr"></div>
        <div class="plan-modal-corner bl"></div>
        <div class="plan-modal-corner br"></div>

        <button
          type="button"
          class="plan-modal-close"
          aria-label="关闭"
          @click="closeIndicatorDetail"
        >
          ×
        </button>

        <div class="plan-modal-header">
          <h3 class="plan-modal-title">{{ detailTitle }}</h3>
        </div>

        <div class="plan-modal-body">
          <div class="plan-modal-meta">
            <span>{{ detailMeta }}</span>
            <span>共 {{ detailRowCount }} 条记录</span>
          </div>

          <div class="plan-modal-table-wrap">
            <!-- 计划数 → 计划详情 -->
            <table v-if="detailKey === 'plan'" class="inbound-modal-table">
              <thead>
                <tr>
                  <th>产线</th>
                  <th>产品系列</th>
                  <th>毛坯件号</th>
                  <th>毛坯名称</th>
                  <th>类型</th>
                  <th>计划件数（件）</th>
                  <th>计划箱数（箱）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in planDetailRows" :key="`${row.blankNo}-${row.line}`">
                  <td>{{ row.line }}</td>
                  <td>{{ row.productSeries }}</td>
                  <td>{{ row.blankNo }}</td>
                  <td>{{ row.blankName }}</td>
                  <td>{{ row.type }}</td>
                  <td class="num">{{ row.planPieces }}</td>
                  <td class="num">{{ row.planBoxes }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5">合计</td>
                  <td class="num">
                    {{ planDetailRows.reduce((sum, row) => sum + row.planPieces, 0) }}
                  </td>
                  <td class="num">
                    {{ planDetailRows.reduce((sum, row) => sum + row.planBoxes, 0) }}
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- 造型数 → 造型数明细 -->
            <table v-else-if="detailKey === 'molding'" class="inbound-modal-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>产线</th>
                  <th>任务编号</th>
                  <th>任务类型</th>
                  <th>系列</th>
                  <th>毛坯件号</th>
                  <th>日期号</th>
                  <th>流水号</th>
                  <th>生产时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in moldingDetailRows" :key="row.taskNo">
                  <td class="num">{{ index + 1 }}</td>
                  <td>{{ row.line }}</td>
                  <td>{{ row.taskNo }}</td>
                  <td>{{ row.taskType }}</td>
                  <td>{{ row.series }}</td>
                  <td>{{ row.blankNo }}</td>
                  <td>{{ row.dateNo }}</td>
                  <td>{{ row.serialNo }}</td>
                  <td>{{ row.produceTime }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 下芯数 → 下芯数明细 -->
            <table v-else-if="detailKey === 'core'" class="inbound-modal-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>产线</th>
                  <th>件号</th>
                  <th>系列</th>
                  <th>日期号</th>
                  <th>流水号</th>
                  <th>下芯数量（颗）</th>
                  <th>下芯时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in coreDetailRows" :key="`${row.partNo}-${row.serialNo}`">
                  <td class="num">{{ index + 1 }}</td>
                  <td>{{ row.line }}</td>
                  <td>{{ row.partNo }}</td>
                  <td>{{ row.series }}</td>
                  <td>{{ row.dateNo }}</td>
                  <td>{{ row.serialNo }}</td>
                  <td class="num">{{ row.coreCount }}</td>
                  <td>{{ row.coreTime }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="6">合计</td>
                  <td class="num">
                    {{ coreDetailRows.reduce((sum, row) => sum + row.coreCount, 0) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <!-- 合箱数 → 合箱数明细 -->
            <table v-else-if="detailKey === 'close'" class="inbound-modal-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>产线</th>
                  <th>件号</th>
                  <th>系列</th>
                  <th>日期号</th>
                  <th>流水号</th>
                  <th>砂箱号</th>
                  <th>操作人</th>
                  <th>合箱时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in closeDetailRows" :key="`${row.partNo}-${row.serialNo}`">
                  <td class="num">{{ index + 1 }}</td>
                  <td>{{ row.line }}</td>
                  <td>{{ row.partNo }}</td>
                  <td>{{ row.series }}</td>
                  <td>{{ row.dateNo }}</td>
                  <td>{{ row.serialNo }}</td>
                  <td>{{ row.flaskNo }}</td>
                  <td>{{ row.operator }}</td>
                  <td>{{ row.closeTime }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 待浇注数 → 待浇注数明细 -->
            <table v-else-if="detailKey === 'pending'" class="inbound-modal-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>产线</th>
                  <th>件号</th>
                  <th>系列</th>
                  <th>日期号</th>
                  <th>流水号</th>
                  <th>浇注坑位</th>
                  <th>操作人</th>
                  <th>完成时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in pendingDetailRows" :key="`${row.partNo}-${row.serialNo}`">
                  <td class="num">{{ index + 1 }}</td>
                  <td>{{ row.line }}</td>
                  <td>{{ row.partNo }}</td>
                  <td>{{ row.series }}</td>
                  <td>{{ row.dateNo }}</td>
                  <td>{{ row.serialNo }}</td>
                  <td>{{ row.pourSlot }}</td>
                  <td>{{ row.operator }}</td>
                  <td>{{ row.finishTime }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 浇注数 → 浇注数明细 -->
            <table v-else class="inbound-modal-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>任务编号</th>
                  <th>产线</th>
                  <th>产品件号</th>
                  <th>毛坯流水号</th>
                  <th>数量</th>
                  <th>砂箱流水号</th>
                  <th>浇注炉次</th>
                  <th>包号</th>
                  <th>包次</th>
                  <th>浇注时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in pouredDetailRows" :key="row.taskNo">
                  <td class="num">{{ index + 1 }}</td>
                  <td>{{ row.taskNo }}</td>
                  <td>{{ row.line }}</td>
                  <td>{{ row.productPartNo }}</td>
                  <td>{{ row.blankSerialNo }}</td>
                  <td class="num">{{ row.qty }}</td>
                  <td>{{ row.flaskSerialNo }}</td>
                  <td>{{ row.furnaceNo }}</td>
                  <td>{{ row.ladleNo }}</td>
                  <td>{{ row.ladleBatch }}</td>
                  <td>{{ row.pourTime }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5">合计</td>
                  <td class="num">
                    {{ pouredDetailRows.reduce((sum, row) => sum + row.qty, 0) }}
                  </td>
                  <td colspan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style src="./dashboard-common.css"></style>
<style scoped src="./dashboard-theme.css"></style>

<style scoped>
/* 班组标签：可点击切换，激活高亮 */
.team-tag {
  appearance: none;
  cursor: pointer;
  border: 1px solid rgba(0, 190, 236, 0.65);
  border-radius: 2px;
  padding: 4px 14px;
  color: #dff8ff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  white-space: nowrap;
  background: rgba(0, 166, 216, 0.16);
  box-shadow:
    inset 0 0 10px rgba(0, 166, 216, 0.12),
    0 0 8px rgba(0, 166, 216, 0.12);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
  line-height: 1.2;
}

.team-tag::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  vertical-align: middle;
  background: #20cfff;
  box-shadow: 0 0 6px rgba(32, 207, 255, 0.9);
}

.team-tag:hover {
  background: rgba(0, 190, 236, 0.28);
  border-color: rgba(67, 229, 255, 0.9);
}

.team-tag.active {
  color: #04202b;
  font-weight: 700;
  background: linear-gradient(180deg, #43e5ff, #20cfff);
  border-color: #7ef0ff;
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.25),
    0 0 12px rgba(32, 207, 255, 0.55);
}

.team-tag.active::before {
  background: #04202b;
  box-shadow: none;
}

/* 任务列表：卡片式，超出自动上下滚动 */
.task-list-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 2px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.task-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.task-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.task-list-scroll::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.task-list-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(26, 202, 242, 0.7);
}

.task-card {
  position: relative;
  margin-bottom: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 190, 235, 0.28);
  border-radius: 4px;
  background:
    linear-gradient(135deg, rgba(10, 48, 64, 0.95), rgba(6, 28, 40, 0.98)),
    #082532;
  box-shadow: inset 0 0 16px rgba(0, 154, 201, 0.08);
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 36%;
  height: 2px;
  background: linear-gradient(90deg, #26d9ff, transparent);
}

.task-card:last-child {
  margin-bottom: 0;
}

.task-card-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 8px 18px;
}

.task-card-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.task-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  line-height: 1.35;
}

.task-label {
  flex: 0 0 auto;
  color: #c5e4ee;
  white-space: nowrap;
}

.task-value {
  color: #f0fbff;
  font-weight: 600;
  word-break: break-all;
}

.task-status {
  font-weight: 700;
}

.task-status.status-wait {
  color: #ffd52a;
}

.task-status.status-run {
  color: #20cfff;
}

.task-status.status-done {
  color: #4ee6a6;
}

.task-status.status-pause {
  color: #9b8cff;
}

.task-status.status-error {
  color: #ff4f8b;
}

.task-type {
  display: inline-block;
  padding: 0 8px;
  border-radius: 2px;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  border: 1px solid transparent;
}

.task-type.type-normal {
  color: #20cfff;
  background: rgba(32, 207, 255, 0.12);
  border-color: rgba(32, 207, 255, 0.45);
}

.task-type.type-param {
  color: #ffd52a;
  background: rgba(255, 213, 42, 0.12);
  border-color: rgba(255, 213, 42, 0.45);
}

.task-type.type-verify {
  color: #4ee6a6;
  background: rgba(78, 230, 166, 0.12);
  border-color: rgba(78, 230, 166, 0.45);
}

.task-type.type-temp {
  color: #9b8cff;
  background: rgba(155, 140, 255, 0.14);
  border-color: rgba(155, 140, 255, 0.5);
}

.task-type.type-pick {
  color: #ff8fb5;
  background: rgba(255, 79, 139, 0.12);
  border-color: rgba(255, 79, 139, 0.45);
}

/* 造型追溯卡片：双列时间字段略紧凑 */
.trace-card .task-field {
  font-size: 13px;
}

.trace-card .task-label {
  min-width: 7.5em;
}

.trace-grid {
  grid-template-columns: 1.2fr 1fr;
}

.trace-pour {
  color: #20cfff;
}

/* 计划详情弹框：FUI 暗色（Teleport 到 body，样式需全局） */
</style>

<style>
.plan-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(2, 12, 18, 0.72);
  backdrop-filter: blur(2px);
}

.plan-modal {
  position: relative;
  width: min(960px, 94vw);
  max-height: min(86vh, 780px);
  display: flex;
  flex-direction: column;
  color: #dff8ff;
  background:
    linear-gradient(180deg, rgba(8, 48, 72, 0.96), rgba(4, 24, 36, 0.98)),
    radial-gradient(ellipse at 50% 0%, rgba(0, 180, 230, 0.18), transparent 55%);
  border: 1px solid rgba(0, 210, 255, 0.75);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(0, 120, 180, 0.25),
    0 0 28px rgba(0, 190, 255, 0.28),
    inset 0 0 40px rgba(0, 100, 150, 0.12);
}

.plan-modal::before,
.plan-modal::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 2px;
  pointer-events: none;
}

.plan-modal::before {
  top: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  box-shadow: 0 0 10px rgba(24, 210, 255, 0.85);
}

.plan-modal::after {
  bottom: 0;
  background: linear-gradient(90deg, transparent, #18d2ff, transparent);
  opacity: 0.55;
}

.plan-modal-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  border-color: #43e5ff;
  border-style: solid;
  z-index: 1;
}

.plan-modal-corner.tl {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.plan-modal-corner.tr {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.plan-modal-corner.bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}

.plan-modal-corner.br {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

.plan-modal-close {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(0, 200, 240, 0.45);
  border-radius: 2px;
  background: rgba(0, 80, 120, 0.35);
  color: #dff8ff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.plan-modal-close:hover {
  background: rgba(0, 160, 210, 0.4);
  border-color: #43e5ff;
}

.plan-modal-header {
  flex: 0 0 auto;
  padding: 16px 48px 12px 20px;
  border-bottom: 1px solid rgba(0, 190, 235, 0.28);
}

.plan-modal-title {
  margin: 0;
  color: #f4fdff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
}

.plan-modal-title::after {
  content: '';
  display: block;
  width: 48px;
  height: 2px;
  margin-top: 8px;
  background: linear-gradient(90deg, #26d9ff, transparent);
  box-shadow: 0 0 8px rgba(38, 217, 255, 0.55);
}

.plan-modal-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 18px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.plan-modal-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.plan-modal-body::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.plan-modal-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #a9c9d4;
  font-size: 12px;
}

.plan-modal-table-wrap {
  overflow: auto;
  border: 1px solid rgba(0, 190, 235, 0.22);
  border-radius: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 202, 242, 0.55) transparent;
}

.plan-modal-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.plan-modal-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(26, 202, 242, 0.45);
  border-radius: 3px;
}

.plan-modal .inbound-modal-table tfoot td {
  background: rgba(0, 143, 184, 0.22) !important;
  color: #f4fdff !important;
  font-weight: 700 !important;
  border-top: 1px solid rgba(0, 200, 240, 0.35) !important;
}
</style>





