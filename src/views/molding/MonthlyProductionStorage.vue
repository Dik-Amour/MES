<template>
  <div class="monthly-production-storage">
    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="日期">
          <a-range-picker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
          />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleQuery">
              <SearchOutlined /> 查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined /> 重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 操作按钮区域 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button type="primary" @click="handleAssessSetting">
          <SettingOutlined /> 考核设置
        </a-button>
      </a-space>
    </a-card>

    <!-- 生产数据表格 -->
    <a-card :bordered="false">
      <a-table
        :columns="productionColumns"
        :data-source="productionData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :row-key="(record: any) => record.key"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'productSeries'">
            {{ record.productSeries }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 考核设置弹框 -->
    <a-modal
      v-model:open="assessModalVisible"
      title="考核设置"
      @cancel="handleAssessCancel"
      :footer="null"
      width="700px"
    >
      <div class="assess-modal-content">
        <a-table
          :columns="assessColumns"
          :data-source="assessData"
          :pagination="false"
          bordered
          size="small"
          class="data-table assess-table"
          :row-key="(record: any) => record.key"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'assessQuantity'">
              <div class="quantity-stepper">
                <a-button size="small" @click="decrementQuantity(record)">-</a-button>
                <a-input-number
                  v-model:value="record.assessQuantity"
                  :min="0"
                  :max="9999"
                  size="small"
                  class="quantity-input"
                />
                <a-button size="small" @click="incrementQuantity(record)">+</a-button>
              </div>
            </template>
            <template v-if="column.dataIndex === 'pourTime'">
              <a-input
                v-model:value="record.pourTime"
                placeholder="HH:mm"
                size="small"
                class="pour-time-input"
              />
            </template>
          </template>
        </a-table>
        <div class="assess-modal-footer">
          <a-button type="primary" @click="handleAssessSave">确定</a-button>
          <a-button @click="handleAssessCancel">取消</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 底部统计卡片 -->
    <div class="bottom-section">
      <!-- 计划准时率 -->
      <div class="section-card half-width">
        <div class="rate-header">
          <a-tag color="blue" class="rate-tag">材料形成中心计划准时率</a-tag>
          <span class="rate-value">80%</span>
        </div>
        <a-table
          :columns="punctualityColumns"
          :data-source="punctualityData"
          :pagination="false"
          bordered
          size="small"
          class="data-table"
          :row-key="(record: any) => record.key"
        />
      </div>

      <!-- 计划完成率 -->
      <div class="section-card half-width">
        <div class="rate-header">
          <a-tag color="blue" class="rate-tag">材料形成中心计划完成率</a-tag>
          <span class="rate-value">80%</span>
        </div>
        <a-table
          :columns="completionColumns"
          :data-source="completionData"
          :pagination="false"
          bordered
          size="small"
          class="data-table"
          :row-key="(record: any) => record.key"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons-vue'

// 日期范围
const dateRange = ref<[Dayjs | null, Dayjs | null] | null>(null)

// 查询/重置
const handleQuery = () => {
  message.success('查询成功')
}

const handleReset = () => {
  dateRange.value = null
  message.info('已重置')
}

// 考核设置弹框
const assessModalVisible = ref(false)

// 考核设置表格列
const assessColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60, align: 'center' as const },
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 180 },
  { title: '考核数量', dataIndex: 'assessQuantity', key: 'assessQuantity', width: 160, align: 'center' as const },
  { title: '浇注准时时间', dataIndex: 'pourTime', key: 'pourTime', width: 140, align: 'center' as const }
]

// 考核设置数据
const assessData = ref([
  { key: '1', index: 1, productionLine: '造型一线中件造型', assessQuantity: 0, pourTime: '07:30' },
  { key: '2', index: 2, productionLine: '造型一线大件造型', assessQuantity: 0, pourTime: '07:30' },
  { key: '3', index: 3, productionLine: '造型二线中件造型', assessQuantity: 0, pourTime: '07:30' },
  { key: '4', index: 4, productionLine: '造型二线大件造型', assessQuantity: 0, pourTime: '07:30' },
  { key: '5', index: 5, productionLine: '造型三线KW造型', assessQuantity: 0, pourTime: '07:30' },
  { key: '6', index: 6, productionLine: '造型三线HWS造型', assessQuantity: 0, pourTime: '07:30' }
])

// 增加数量
const incrementQuantity = (record: any) => {
  record.assessQuantity = (record.assessQuantity || 0) + 1
}

// 减少数量
const decrementQuantity = (record: any) => {
  if (record.assessQuantity > 0) {
    record.assessQuantity = record.assessQuantity - 1
  }
}

// 考核设置
const handleAssessSetting = () => {
  assessModalVisible.value = true
}

// 保存考核设置
const handleAssessSave = () => {
  message.success('考核设置保存成功')
  assessModalVisible.value = false
}

// 取消考核设置
const handleAssessCancel = () => {
  assessModalVisible.value = false
}

// 生产数据表格列
const productionColumns = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 110,
    rowSpan: 3,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  },
  {
    title: '产线',
    dataIndex: 'productionLine',
    key: 'productionLine',
    width: 140,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  },
  {
    title: '首浇时间',
    dataIndex: 'firstPourTime',
    key: 'firstPourTime',
    width: 170,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  },
  {
    title: '末浇时间',
    dataIndex: 'lastPourTime',
    key: 'lastPourTime',
    width: 170,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  },
  {
    title: '生产效率',
    dataIndex: 'efficiency',
    key: 'efficiency',
    width: 100,
    align: 'center' as const,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  },
  { title: '产品系列', dataIndex: 'productSeries', key: 'productSeries', width: 100, align: 'center' as const },
  { title: '毛坯件号', dataIndex: 'partNo', key: 'partNo', width: 150 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' as const },
  {
    title: '合计',
    dataIndex: 'total',
    key: 'total',
    width: 80,
    align: 'center' as const,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  },
  {
    title: '考核数量',
    dataIndex: 'assessQuantity',
    key: 'assessQuantity',
    width: 100,
    align: 'center' as const,
    customCell: (_: any, index: number) => {
      if (index % 3 === 0) {
        return { rowSpan: 3 }
      }
      return { rowSpan: 0 }
    }
  }
]

// 生产数据模拟数据（3行一组，每组同一天同一产线）
let rowKey = 0
const productionData = ref([
  { key: ++rowKey, date: '2026-06-30', productionLine: '造型三线HWS造型', firstPourTime: '2026-07-01 07:36:29', lastPourTime: '2026-07-01 08:41:18', efficiency: '16.67', productSeries: 'WP10N', partNo: '21232443R', quantity: 10, total: 45, assessQuantity: 40 },
  { key: ++rowKey, date: '2026-06-30', productionLine: '造型三线HWS造型', firstPourTime: '2026-07-01 07:36:29', lastPourTime: '2026-07-01 08:41:18', efficiency: '16.67', productSeries: 'WP10N', partNo: '2343435454R', quantity: 15, total: 45, assessQuantity: 40 },
  { key: ++rowKey, date: '2026-06-30', productionLine: '造型三线HWS造型', firstPourTime: '2026-07-01 07:36:29', lastPourTime: '2026-07-01 08:41:18', efficiency: '16.67', productSeries: 'WP10N', partNo: '102843547883R', quantity: 20, total: 45, assessQuantity: 40 },
  { key: ++rowKey, date: '2026-06-29', productionLine: '造型二线大件造型', firstPourTime: '2026-06-29 08:00:00', lastPourTime: '2026-06-29 16:30:00', efficiency: '87.50', productSeries: 'WP12', partNo: 'WP12-001', quantity: 25, total: 60, assessQuantity: 55 },
  { key: ++rowKey, date: '2026-06-29', productionLine: '造型二线大件造型', firstPourTime: '2026-06-29 08:00:00', lastPourTime: '2026-06-29 16:30:00', efficiency: '87.50', productSeries: 'WP12', partNo: 'WP12-002', quantity: 20, total: 60, assessQuantity: 55 },
  { key: ++rowKey, date: '2026-06-29', productionLine: '造型二线大件造型', firstPourTime: '2026-06-29 08:00:00', lastPourTime: '2026-06-29 16:30:00', efficiency: '87.50', productSeries: 'WP12', partNo: 'WP12-003', quantity: 15, total: 60, assessQuantity: 55 }
])

// 准时率表格列
const punctualityColumns = [
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 140 },
  { title: '准时天数', dataIndex: 'punctualDays', key: 'punctualDays', width: 100, align: 'center' as const },
  { title: '统计天数', dataIndex: 'totalDays', key: 'totalDays', width: 100, align: 'center' as const },
  { title: '生产准时率', dataIndex: 'punctualRate', key: 'punctualRate', width: 100, align: 'center' as const }
]

// 准时率数据
const punctualityData = ref([
  { key: '1', productionLine: '造型二线大件造型', punctualDays: 20, totalDays: 25, punctualRate: '80%' },
  { key: '2', productionLine: '造型二线中件造型', punctualDays: '-', totalDays: '-', punctualRate: '-' },
  { key: '3', productionLine: '造型一线中件造型', punctualDays: '-', totalDays: '-', punctualRate: '-' },
  { key: '4', productionLine: '造型一线大件造型', punctualDays: '-', totalDays: '-', punctualRate: '-' },
  { key: '5', productionLine: '造型三线KW造型', punctualDays: '-', totalDays: '-', punctualRate: '-' },
  { key: '6', productionLine: '造型三线HWS造型', punctualDays: '-', totalDays: '-', punctualRate: '-' },
  { key: '7', productionLine: '合计', punctualDays: 20, totalDays: 25, punctualRate: '80%' }
])

// 完成率表格列
const completionColumns = [
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 140 },
  { title: '完成天数', dataIndex: 'completedDays', key: 'completedDays', width: 100, align: 'center' as const },
  { title: '计划天数', dataIndex: 'plannedDays', key: 'plannedDays', width: 100, align: 'center' as const },
  { title: '计划完成率', dataIndex: 'completionRate', key: 'completionRate', width: 100, align: 'center' as const }
]

// 完成率数据
const completionData = ref([
  { key: '1', productionLine: '造型二线大件造型', completedDays: 20, plannedDays: 25, completionRate: '80%' },
  { key: '2', productionLine: '造型二线中件造型', completedDays: '-', plannedDays: '-', completionRate: '-' },
  { key: '3', productionLine: '造型一线中件造型', completedDays: '-', plannedDays: '-', completionRate: '-' },
  { key: '4', productionLine: '造型一线大件造型', completedDays: '-', plannedDays: '-', completionRate: '-' },
  { key: '5', productionLine: '造型三线KW造型', completedDays: '-', plannedDays: '-', completionRate: '-' },
  { key: '6', productionLine: '造型三线HWS造型', completedDays: '-', plannedDays: '-', completionRate: '-' },
  { key: '7', productionLine: '合计', completedDays: 20, plannedDays: 25, completionRate: '80%' }
])
</script>

<style scoped>
.monthly-production-storage {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.action-card {
  margin-bottom: 16px;
}

.data-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

/* 底部统计卡片 */
.bottom-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.half-width {
  flex: 1;
  min-width: 0;
}

.rate-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.rate-tag {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
}

.rate-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

/* 考核设置弹框样式 */
.assess-modal-content {
  padding: 8px 0;
}

.assess-modal-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.quantity-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.quantity-input {
  width: 60px;
  text-align: center;
}

.pour-time-input {
  width: 100px;
  text-align: center;
}

.assess-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}
</style>
