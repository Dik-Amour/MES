<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'

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

/** 指标栏：6 项指标（数值为 mock，各班组内容一致） */
const indicators = [
  { label: '计划数', value: '128', unit: '件', tone: 'output' as const },
  { label: '造型数', value: '116', unit: '件', tone: 'inbound' as const },
  { label: '浇筑数', value: '108', unit: '件', tone: 'output' as const },
  { label: '过程检验合格率', value: '96.8', unit: '%', tone: 'inbound' as const },
  { label: '主要生产设备可动率', value: '94.5', unit: '%', tone: 'output' as const },
  { label: '生产人员利用率', value: '91.2', unit: '%', tone: 'inbound' as const }
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

const taskListEl = ref<HTMLElement | null>(null)
let autoScrollTimer: ReturnType<typeof setInterval> | null = null
let hoverPaused = false

/** 数据过多时自动上下滚动；悬停暂停 */
function startAutoScroll() {
  stopAutoScroll()
  autoScrollTimer = setInterval(() => {
    const el = taskListEl.value
    if (!el || hoverPaused) return
    // 滚到底后回到顶部，形成循环
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      el.scrollTop = 0
    } else {
      el.scrollTop += 1
    }
  }, 40)
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = null
  }
}

function onListMouseEnter() {
  hoverPaused = true
}

function onListMouseLeave() {
  hoverPaused = false
}

onMounted(() => {
  startAutoScroll()
})

onBeforeUnmount(() => {
  stopAutoScroll()
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

/** 六宫格：首格为任务列表，其余占位 */
const panels = computed(() => [
  { title: '任务列表', contentKey: 'taskList' },
  { title: '浇筑进度分析', option: placeholderOption },
  { title: '过程质量分析', option: placeholderOption },
  { title: '设备可动分析', option: placeholderOption },
  { title: '人员利用分析', option: placeholderOption },
  { title: '班组对比分析', option: placeholderOption }
])
</script>

<template>
  <!-- 造型班组可视化：可切换班组 + 6 指标 + 任务列表卡片 -->
  <LineDashboardShell title="造型班组可视化" :indicators="indicators" :panels="panels">
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
        @mouseenter="onListMouseEnter"
        @mouseleave="onListMouseLeave"
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
  </LineDashboardShell>
</template>

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
</style>
