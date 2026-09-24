<template>
  <a-modal
    :open="open"
    :title="deviceName"
    width="860px"
    :footer="null"
    centered
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <div class="core-modal-body">
      <!-- 状态徽章（独立于设备基础信息之外，右上方展示） -->
      <div class="cm-badge-row">
        <span
          class="cm-badge"
          :style="{ background: statusColorMap[status] }"
        >{{ status }}</span>
      </div>

      <!-- 上半部分（固定）：一行三个字段 -->
      <div class="cm-top">
        <div class="cm-info">
          <div class="cm-cell">
            <span class="cm-label">设备名称：</span>
            <span class="cm-value">{{ deviceName }}</span>
          </div>
          <div class="cm-cell">
            <span class="cm-label">设备编号：</span>
            <span class="cm-value">CJ-001</span>
          </div>
          <div class="cm-cell">
            <span class="cm-label">子工位名称：</span>
            <span class="cm-value">射芯工位</span>
          </div>
          <div class="cm-cell">
            <span class="cm-label">产线：</span>
            <span class="cm-value">造型一线</span>
          </div>
          <div class="cm-cell">
            <span class="cm-label">开启时间：</span>
            <span class="cm-value">2026-09-22 08:30:00</span>
          </div>
          <div class="cm-cell">
            <span class="cm-label">关闭时间：</span>
            <span class="cm-value">2026-09-22 20:30:00</span>
          </div>
          <div class="cm-cell">
            <span class="cm-label">运行时长：</span>
            <span class="cm-value">6.5 小时</span>
          </div>
        </div>
      </div>

      <!-- 下半部分 Tab -->
      <a-tabs v-model:activeKey="activeTab" class="cm-tabs">
        <a-tab-pane key="realtime" tab="实时状态"></a-tab-pane>
        <a-tab-pane key="stat" tab="生产统计"></a-tab-pane>
        <a-tab-pane key="param" tab="工艺参数"></a-tab-pane>
        <a-tab-pane key="operator" tab="操作人"></a-tab-pane>
      </a-tabs>
      <div class="cm-tab-content">
        <!-- 实时状态 -->
        <div v-if="activeTab === 'realtime'" class="cm-info">
          <div class="cm-cell" v-for="f in realtimeFields" :key="f.label">
            <span class="cm-label">{{ f.label }}：</span>
            <span class="cm-value">{{ f.value }}</span>
          </div>
        </div>
        <!-- 生产统计 -->
        <div v-else-if="activeTab === 'stat'" class="stat-grid">
          <div
            class="stat-cell"
            v-for="s in statFields"
            :key="s.label"
            :class="{ danger: s.danger }"
          >
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
        <!-- 工艺参数 -->
        <div v-else-if="activeTab === 'param'" class="param-table">
          <a-table
            :columns="paramColumns"
            :data-source="paramRows"
            :pagination="{ pageSize: 5, size: 'small', showSizeChanger: false }"
            size="small"
            row-key="seq"
          />
        </div>
        <!-- 操作人 -->
        <div v-else-if="activeTab === 'operator'" class="param-table">
          <a-table
            :columns="operatorColumns"
            :data-source="operatorRows"
            :pagination="{ pageSize: 5, size: 'small', showSizeChanger: false }"
            size="small"
            row-key="seq"
          />
        </div>
        <!-- 其他 Tab 占位 -->
        <div v-else class="cm-placeholder">「{{ currentTabLabel }}」内容待接入</div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ open: boolean; deviceName: string }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const activeTab = ref('realtime')
// 设备状态：故障 / 待机 / 作业
const status = ref<'故障' | '待机' | '作业'>('作业')
const statusColorMap: Record<string, string> = {
  作业: '#52c41a',
  待机: '#faad14',
  故障: '#ff4d4f'
}
const tabs = [
  { key: 'realtime', label: '实时状态' },
  { key: 'stat', label: '生产统计' },
  { key: 'param', label: '工艺参数' },
  { key: 'operator', label: '操作人' }
]
const currentTabLabel = computed(
  () => tabs.find(t => t.key === activeTab.value)?.label ?? ''
)

// 实时状态字段
const realtimeFields = [
  { label: '任务编号', value: 'RW20260922001' },
  { label: '毛坯件号', value: '612600013542R' },
  { label: '毛坯名称', value: '曲轴箱' },
  { label: '砂芯编号', value: 'SX-0815' },
  { label: '砂芯名称', value: '曲轴箱内腔芯' },
  { label: '芯盒编号', value: 'XB-012' },
  { label: '芯盒名称', value: '曲轴箱芯盒-1' },
  { label: '生产开始时间', value: '2026-09-22 14:30:00' },
  { label: '生产人', value: '张伟' },
  { label: '班次', value: '白班' },
  { label: '计划颗数', value: '200' },
  { label: '当前生产颗数', value: '86' },
  { label: '流转颗数', value: '84' }
]

// 生产统计字段
const statFields = [
  { label: '当班产量', value: '48' },
  { label: '当日产量', value: '96' },
  { label: '计划产量', value: '120' },
  { label: '完成率', value: '80%' },
  { label: '累计产量', value: '12,480' },
  { label: '合格数', value: '94' },
  { label: '不合格数', value: '2', danger: true },
  { label: '合格率', value: '97.9%' },
  { label: '废品率', value: '2.1%', danger: true },
  { label: '平均节拍', value: '4.2min' },
  { label: '设备利用率', value: '85%' },
  { label: 'OEE', value: '78%' }
]

// 工艺参数表格
const paramColumns = [
  { title: '序号', dataIndex: 'seq', width: 60, align: 'center' as const },
  { title: '射砂压力', dataIndex: 'pressure', align: 'center' as const },
  { title: '射砂时间', dataIndex: 'shootTime', align: 'center' as const },
  { title: '固化时间', dataIndex: 'cureTime', align: 'center' as const },
  { title: '模具温度', dataIndex: 'moldTemp', align: 'center' as const },
  { title: '创建时间', dataIndex: 'createTime', align: 'center' as const }
]

const paramRows = [
  { seq: 1, pressure: '0.52 MPa', shootTime: '1.5 s', cureTime: '30 s', moldTemp: '168 ℃', createTime: '2026-09-22 08:35:12' },
  { seq: 2, pressure: '0.50 MPa', shootTime: '1.5 s', cureTime: '30 s', moldTemp: '170 ℃', createTime: '2026-09-22 09:12:47' },
  { seq: 3, pressure: '0.53 MPa', shootTime: '1.6 s', cureTime: '32 s', moldTemp: '172 ℃', createTime: '2026-09-22 10:03:25' },
  { seq: 4, pressure: '0.49 MPa', shootTime: '1.4 s', cureTime: '30 s', moldTemp: '169 ℃', createTime: '2026-09-22 11:26:08' },
  { seq: 5, pressure: '0.51 MPa', shootTime: '1.5 s', cureTime: '31 s', moldTemp: '171 ℃', createTime: '2026-09-22 13:40:33' },
  { seq: 6, pressure: '0.54 MPa', shootTime: '1.7 s', cureTime: '33 s', moldTemp: '173 ℃', createTime: '2026-09-22 14:30:19' },
  { seq: 7, pressure: '0.50 MPa', shootTime: '1.5 s', cureTime: '30 s', moldTemp: '170 ℃', createTime: '2026-09-22 15:18:54' },
  { seq: 8, pressure: '0.52 MPa', shootTime: '1.6 s', cureTime: '31 s', moldTemp: '167 ℃', createTime: '2026-09-22 16:05:41' }
]

// 操作人表格
const operatorColumns = [
  { title: '序号', dataIndex: 'seq', width: 60, align: 'center' as const },
  { title: '上机人', dataIndex: 'operator', align: 'center' as const },
  { title: '班组', dataIndex: 'team', align: 'center' as const },
  { title: '班次', dataIndex: 'shift', align: 'center' as const },
  { title: '上机时间', dataIndex: 'onTime', align: 'center' as const },
  { title: '下机时间', dataIndex: 'offTime', align: 'center' as const }
]

const operatorRows = [
  { seq: 1, operator: '张伟', team: '制芯一班', shift: '白班', onTime: '2026-09-22 08:00:00', offTime: '2026-09-22 16:00:00' },
  { seq: 2, operator: '李强', team: '制芯一班', shift: '白班', onTime: '2026-09-21 08:00:00', offTime: '2026-09-21 16:00:00' },
  { seq: 3, operator: '王芳', team: '制芯二班', shift: '夜班', onTime: '2026-09-21 16:00:00', offTime: '2026-09-21 24:00:00' },
  { seq: 4, operator: '刘洋', team: '制芯二班', shift: '夜班', onTime: '2026-09-20 16:00:00', offTime: '2026-09-20 24:00:00' },
  { seq: 5, operator: '陈晨', team: '制芯一班', shift: '白班', onTime: '2026-09-20 08:00:00', offTime: '2026-09-20 16:00:00' },
  { seq: 6, operator: '赵磊', team: '制芯三班', shift: '白班', onTime: '2026-09-19 08:00:00', offTime: '2026-09-19 16:00:00' }
]

// 打开时重置到实时状态
watch(
  () => props.open,
  v => {
    if (v) activeTab.value = 'realtime'
  }
)
</script>

<style scoped>
.core-modal-body {
  min-height: 380px;
}

.cm-top {
  position: relative;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

/* 状态徽章（右上方，标签样式而非按钮） */
.cm-badge-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.cm-badge {
  display: inline-block;
  padding: 1px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 19px;
  color: #fff;
  background: #52c41a;
  border-radius: 3px;
}

.cm-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 16px;
}

.cm-cell {
  display: flex;
  align-items: center;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
}

.cm-label {
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}

.cm-value {
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cm-tabs {
  margin-top: 14px;
  margin-bottom: 0;
}

.cm-tab-content {
  padding: 16px 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  min-height: 160px;
  background: #fff;
}

.cm-placeholder {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}

/* 生产统计指标卡 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-cell {
  padding: 12px 8px;
  text-align: center;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #4472c4;
  line-height: 28px;
}

.stat-cell.danger .stat-value {
  color: #ff4d4f;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

/* 工艺参数表格 */
.param-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}
</style>
