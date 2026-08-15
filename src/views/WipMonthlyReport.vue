<template>
  <div class="wip-report">
    <!-- 筛选操作区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle" justify="space-between">
        <a-col>
          <a-form layout="inline" :model="searchForm">
            <a-form-item label="统计年份">
              <a-select
                v-model:value="searchForm.year"
                placeholder="请选择统计年份"
                style="width: 160px"
                @change="handleSearch"
              >
                <a-select-option v-for="y in yearOptions" :key="y" :value="y">
                  {{ y }}年
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click="handleSearch">
                  <SearchOutlined />
                  查询
                </a-button>
                <a-button @click="handleReset">
                  <ReloadOutlined />
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-col>
        <a-col>
          <a-button type="primary" ghost @click="openSettlementModal">
            <CalendarOutlined />
            生产结算周期配置
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 报表卡片 -->
    <a-card :bordered="false" class="report-card">
      <div class="report-title">
        材料成型中心（工业园区）{{ searchForm.year }}年各月产线统计表
      </div>
      <a-table
        :columns="monthColumns"
        :data-source="monthlyRows"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1700 }"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key && column.key.startsWith('month')">
            <span v-if="record.values[Number(column.key.slice(5)) - 1] !== 0">
              {{ formatNumber2(record.values[Number(column.key.slice(5)) - 1]) }}
            </span>
          </template>
          <template v-else-if="column.key === 'total'">
            <strong>{{ formatNumber2(record.total) }}</strong>
          </template>
          <template v-else-if="column.key === 'metricName'">
            <span :class="{ 'summary-metric': record.isSummary }">{{ record.metricName }}</span>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 生产结算周期配置弹框 -->
    <a-modal
      v-model:open="settlementModalVisible"
      title="生产结算周期配置"
      :width="520"
      @ok="handleSettlementOk"
      @cancel="handleSettlementCancel"
    >
      <a-form
        ref="settlementFormRef"
        :model="settlementForm"
        :rules="settlementRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="年份月份" name="periodMonth">
          <a-date-picker
            v-model:value="settlementForm.periodMonth"
            picker="month"
            :allow-clear="false"
            format="YYYY年MM月"
            style="width: 100%"
            @change="handlePeriodMonthChange"
          />
        </a-form-item>
        <a-form-item label="起始日期" name="startDate">
          <a-date-picker
            v-model:value="settlementForm.startDate"
            :allow-clear="false"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="结算日期" name="endDate">
          <a-date-picker
            v-model:value="settlementForm.endDate"
            :allow-clear="false"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { SearchOutlined, ReloadOutlined, CalendarOutlined } from '@ant-design/icons-vue'

dayjs.locale('zh-cn')

interface MetricStat {
  name: string
  values: number[] // 12个月
}

interface LineStat {
  lineName: string
  year: number
  metrics: MetricStat[]
}

interface ReportRow {
  key: string
  lineName: string
  metricName: string
  values: number[]
  total: number
  lineSpan: number
  isSummary?: boolean
}

// 产线月度模拟数据（2026年，1-6月有数据，7-12月为0）
const monthlyMock: LineStat[] = [
  {
    lineName: '造型一线大件清理',
    year: 2026,
    metrics: [
      {
        name: '产出',
        values: [4512.6, 3703.84, 4813.3, 5076.59, 4457.54, 1015.56, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '合格出产',
        values: [4379.54, 3608.8, 4646.01, 4915.07, 4357.21, 927.28, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '入库',
        values: [4709.03, 2688.33, 5547.75, 5304.15, 2533.28, 3107.93, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '合格入库',
        values: [4702.63, 2679.36, 5541.47, 5290.87, 2519.7, 3093.27, 0, 0, 0, 0, 0, 0]
      }
    ]
  },
  {
    lineName: '造型三线KW清理',
    year: 2026,
    metrics: [
      {
        name: '产出',
        values: [3528.19, 2518.28, 3224.05, 3377.29, 2757.24, 566.76, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '合格出产',
        values: [3428.74, 2444.78, 3109.78, 3190.72, 2649.96, 498.42, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '入库',
        values: [2515.16, 2148.89, 3405.75, 3337.77, 2568.22, 1552.51, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '合格入库',
        values: [2508.98, 2140.22, 3382.99, 3327.66, 2558.13, 1544.39, 0, 0, 0, 0, 0, 0]
      }
    ]
  },
  {
    lineName: '造型三线HWS清理',
    year: 2026,
    metrics: [
      {
        name: '产出',
        values: [8040.79, 6222.13, 8037.35, 8384.35, 7214.78, 1582.32, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '合格出产',
        values: [7808.27, 6053.58, 7755.79, 8105.79, 7007.18, 1425.7, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '入库',
        values: [7224.2, 4837.22, 8953.49, 8641.92, 5099.52, 4660.43, 0, 0, 0, 0, 0, 0]
      },
      {
        name: '合格入库',
        values: [7211.62, 4819.58, 8954.46, 8618.55, 5077.83, 4637.67, 0, 0, 0, 0, 0, 0]
      }
    ]
  }
]

const loading = ref(false)
const yearOptions = [2025, 2026, 2027]
const searchForm = reactive({
  year: 2026
})

const formatNumber2 = (value: number) => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 当前年份的月度数据
const currentYearData = computed<LineStat[]>(() =>
  monthlyMock.filter(item => item.year === searchForm.year)
)

// 月据统计表格列
const monthColumns = computed(() => {
  const cols: any[] = [
    {
      title: '产线',
      dataIndex: 'lineName',
      key: 'lineName',
      width: 170,
      fixed: 'left' as const,
      customCell: (record: ReportRow) => ({ rowSpan: record.lineSpan })
    },
    {
      title: '指标',
      dataIndex: 'metricName',
      key: 'metricName',
      width: 110,
      fixed: 'left' as const
    }
  ]
  for (let i = 1; i <= 12; i++) {
    cols.push({ title: `${i}月`, key: `month${i}`, width: 110, align: 'right' as const })
  }
  cols.push({ title: '全年合计', dataIndex: 'total', key: 'total', width: 130, align: 'right' as const })
  return cols
})

// 月度报表行（含合计）
const monthlyRows = computed<ReportRow[]>(() => {
  const rows: ReportRow[] = []
  currentYearData.value.forEach(line => {
    line.metrics.forEach((metric, idx) => {
      rows.push({
        key: `${line.lineName}-${metric.name}`,
        lineName: line.lineName,
        metricName: metric.name,
        values: metric.values,
        total: metric.values.reduce((sum, v) => sum + v, 0),
        lineSpan: idx === 0 ? line.metrics.length : 0
      })
    })
  })
  if (currentYearData.value.length > 0) {
    const metricNames = currentYearData.value[0].metrics.map(m => m.name)
    metricNames.forEach((name, idx) => {
      const sumValues = currentYearData.value[0].metrics[idx].values.map((_, mi) =>
        currentYearData.value.reduce((sum, line) => sum + (line.metrics[idx].values[mi] || 0), 0)
      )
      rows.push({
        key: `合计-${name}`,
        lineName: '合计',
        metricName: name,
        values: sumValues,
        total: sumValues.reduce((sum, v) => sum + v, 0),
        lineSpan: idx === 0 ? metricNames.length : 0,
        isSummary: true
      })
    })
  }
  return rows
})

onMounted(() => {
  loadData()
})

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.year = 2026
  handleSearch()
}

// 生产结算周期配置弹框
const settlementModalVisible = ref(false)
const settlementFormRef = ref<FormInstance>()
const settlementForm = reactive<{
  periodMonth: Dayjs
  startDate: Dayjs
  endDate: Dayjs
}>({
  periodMonth: dayjs(),
  startDate: dayjs().startOf('month'),
  endDate: dayjs().endOf('month')
})
const settlementRules = {
  periodMonth: [{ required: true, message: '请选择年份月份', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择起始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结算日期', trigger: 'change' }]
}

const openSettlementModal = () => {
  // 打开时默认当前月份
  settlementForm.periodMonth = dayjs()
  settlementForm.startDate = dayjs().startOf('month')
  settlementForm.endDate = dayjs().endOf('month')
  settlementModalVisible.value = true
}

// 年份月份变更时联动更新起始/结算日期（当月第一天/最后一天）
const handlePeriodMonthChange = () => {
  settlementForm.startDate = settlementForm.periodMonth.startOf('month')
  settlementForm.endDate = settlementForm.periodMonth.endOf('month')
}

const handleSettlementOk = async () => {
  try {
    await settlementFormRef.value?.validate()
  } catch {
    return
  }
  message.success(
    `生产结算周期已配置：${settlementForm.periodMonth.format('YYYY年MM月')}（${settlementForm.startDate.format('YYYY-MM-DD')} 至 ${settlementForm.endDate.format('YYYY-MM-DD')}）`
  )
  settlementModalVisible.value = false
}

const handleSettlementCancel = () => {
  settlementModalVisible.value = false
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.report-card {
  margin-bottom: 16px;
}

.report-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.summary-metric {
  font-weight: 600;
}
</style>
