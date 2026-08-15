<template>
  <div class="molding-schedule">
    <!-- 筛选操作区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="6">
          <a-form-item label="选择日期" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-range-picker
              v-model:value="selectedDateRange"
              placeholder="请选择日期区间"
              format="YYYY-MM-DD"
              @change="handleDateChange"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-form-item label="视图类型" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-radio-group v-model:value="viewType" @change="handleViewTypeChange">
              <a-radio-button value="daily">日明细</a-radio-button>
              <a-radio-button value="weekly">周统计</a-radio-button>
              <a-radio-button value="monthly">月汇总</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-form-item label="产品系列" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-select
              v-model:value="productSeries"
              placeholder="请选择产品系列"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="A系列">A系列</a-select-option>
              <a-select-option value="B系列">B系列</a-select-option>
              <a-select-option value="C系列">C系列</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-form-item label="毛坯件号" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-input
              v-model:value="partNo"
              placeholder="请输入毛坯件号"
              allow-clear
              @pressEnter="handleSearch"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-space :size="8" wrap>
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <!-- 功能操作区 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button @click="handleExport">
          <ExportOutlined />
          导出
        </a-button>
      </a-space>
    </a-card>

    <!-- 数据列表区 -->
    <a-card :bordered="false" class="table-card">
      <template #title>
        <a-space>
          <span>{{ viewTitle }}</span>
          <span v-if="selectedDateRange && selectedDateRange.length === 2">
            {{ getDateRangeLabel() }}
          </span>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <span>计划总量：</span>
          <a-statistic
            :value="totalStats.planQuantity"
            :value-style="{ fontSize: '16px' }"
          />
          <a-divider type="vertical" />
          <span>实际打箱总量：</span>
          <a-statistic
            :value="totalStats.actualQuantity"
            :value-style="{ fontSize: '16px' }"
          />
          <a-divider type="vertical" />
          <span>完成率：</span>
          <a-statistic
            :value="totalStats.completionRate"
            :precision="2"
            suffix="%"
            :value-style="{ fontSize: '16px' }"
          />
        </a-space>
      </template>

      <a-table
        :columns="currentColumns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'productSeries'">
            <span>{{ record.productSeries }}</span>
          </template>
          <template v-else-if="column.key === 'completionRate'">
            <span>{{ record.completionRate.toFixed(2) }}%</span>
          </template>
          <template v-else-if="column.key === 'planDate' && viewType !== 'daily'">
            <span>{{ getDateRangeLabel() }}</span>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 计划生成说明弹窗 -->
    <a-modal
      v-model:open="planInfoVisible"
      title="计划生成说明"
      :footer="null"
    >
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="执行时间">每日早上 6:00</a-descriptions-item>
        <a-descriptions-item label="数据来源">浇注完工台账</a-descriptions-item>
        <a-descriptions-item label="筛选条件">全部浇注结束的毛坯批次</a-descriptions-item>
        <a-descriptions-item label="计算逻辑">匹配件号标准冷却时长，计算冷却结束时间</a-descriptions-item>
        <a-descriptions-item label="生成规则">筛选冷却结束时间在当日 00:00-24:00 的毛坯，按件号聚合数量</a-descriptions-item>
        <a-descriptions-item label="手动生成">支持手动一键生成当日计划，用于定时任务异常补单</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'

interface MoldingScheduleData {
  key: string
  planDate: string
  productSeries: string
  partNo: string
  blankName: string
  specification: string
  materialGrade: string
  planQuantity: number
  actualQuantity: number
  completionRate: number
}

const selectedDateRange = ref<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])
const viewType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const productSeries = ref<string>('')
const partNo = ref<string>('')
const loading = ref(false)
const dataSource = ref<MoldingScheduleData[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 计划说明弹窗
const planInfoVisible = ref(false)

// 日明细视图列定义
const dailyColumns = [
  {
    title: '计划日期',
    dataIndex: 'planDate',
    key: 'planDate',
    width: 120,
    fixed: 'left'
  },
  {
    title: '产品系列',
    dataIndex: 'productSeries',
    key: 'productSeries',
    width: 120
  },
  {
    title: '毛坯件号',
    dataIndex: 'partNo',
    key: 'partNo',
    width: 150
  },
  {
    title: '毛坯名称',
    dataIndex: 'blankName',
    key: 'blankName',
    width: 180
  },
  {
    title: '规格型号',
    dataIndex: 'specification',
    key: 'specification',
    width: 120
  },
  {
    title: '牌号材质',
    dataIndex: 'materialGrade',
    key: 'materialGrade',
    width: 120
  },
  {
    title: '计划打箱数量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '实际打箱数量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '打箱完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 180,
    align: 'center'
  }
]

// 周统计视图列定义
const weeklyColumns = [
  {
    title: '周次',
    dataIndex: 'planDate',
    key: 'planDate',
    width: 120,
    fixed: 'left'
  },
  {
    title: '产品系列',
    dataIndex: 'productSeries',
    key: 'productSeries',
    width: 120
  },
  {
    title: '毛坯件号',
    dataIndex: 'partNo',
    key: 'partNo',
    width: 150
  },
  {
    title: '毛坯名称',
    dataIndex: 'blankName',
    key: 'blankName',
    width: 180
  },
  {
    title: '规格型号',
    dataIndex: 'specification',
    key: 'specification',
    width: 120
  },
  {
    title: '牌号材质',
    dataIndex: 'materialGrade',
    key: 'materialGrade',
    width: 120
  },
  {
    title: '本周计划总量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '本周实际打箱总量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 160,
    align: 'right'
  },
  {
    title: '周打箱完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 180,
    align: 'center'
  }
]

// 月汇总视图列定义
const monthlyColumns = [
  {
    title: '月份',
    dataIndex: 'planDate',
    key: 'planDate',
    width: 120,
    fixed: 'left'
  },
  {
    title: '产品系列',
    dataIndex: 'productSeries',
    key: 'productSeries',
    width: 120
  },
  {
    title: '毛坯件号',
    dataIndex: 'partNo',
    key: 'partNo',
    width: 150
  },
  {
    title: '毛坯名称',
    dataIndex: 'blankName',
    key: 'blankName',
    width: 180
  },
  {
    title: '规格型号',
    dataIndex: 'specification',
    key: 'specification',
    width: 120
  },
  {
    title: '牌号材质',
    dataIndex: 'materialGrade',
    key: 'materialGrade',
    width: 120
  },
  {
    title: '本月计划总量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '本月实际打箱总量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 160,
    align: 'right'
  },
  {
    title: '月打箱完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 180,
    align: 'center'
  }
]

// 当前视图列
const currentColumns = computed(() => {
  switch (viewType.value) {
    case 'daily':
      return dailyColumns
    case 'weekly':
      return weeklyColumns
    case 'monthly':
      return monthlyColumns
  }
})

// 当前视图标题
const viewTitle = computed(() => {
  switch (viewType.value) {
    case 'daily':
      return '日明细视图'
    case 'weekly':
      return '周统计视图'
    case 'monthly':
      return '月汇总视图'
  }
})

// 总计统计
const totalStats = computed(() => {
  if (dataSource.value.length === 0) {
    return { planQuantity: 0, actualQuantity: 0, completionRate: 0 }
  }
  
  const totalPlanQuantity = dataSource.value.reduce((sum, item) => sum + item.planQuantity, 0)
  const totalActualQuantity = dataSource.value.reduce((sum, item) => sum + item.actualQuantity, 0)
  const completionRate = totalPlanQuantity > 0 ? (totalActualQuantity / totalPlanQuantity) * 100 : 0
  
  return {
    planQuantity: totalPlanQuantity,
    actualQuantity: totalActualQuantity,
    completionRate: completionRate
  }
})

// 获取当前视图的日期范围标签
const getDateRangeLabel = () => {
  if (!selectedDateRange.value || selectedDateRange.value.length !== 2) return ''
  const [start, end] = selectedDateRange.value
  if (viewType.value === 'monthly') {
    return start.format('YYYY-MM')
  }
  return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
}

// 日期变化
const handleDateChange = () => {
  handleSearch()
}

// 视图类型变化
const handleViewTypeChange = () => {
  handleSearch()
}

// 查询
const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    generateMockData()
    loading.value = false
  }, 500)
}

// 重置
const handleReset = () => {
  selectedDateRange.value = [dayjs().startOf('month'), dayjs()]
  viewType.value = 'daily'
  productSeries.value = ''
  partNo.value = ''
  handleSearch()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  handleSearch()
}

// 导出
const handleExport = () => {
  message.success('导出成功')
}

// 生成模拟数据
const generateMockData = () => {
  const mockData: MoldingScheduleData[] = []
  const seriesList = ['A系列', 'B系列', 'C系列']
  const materialList = ['QT450-10', 'HT250', 'QT500-7', 'HT300']
  const specificationList = ['φ200×300', 'φ150×250', 'φ180×280', 'φ220×350']
  
  const startDate = selectedDateRange.value[0]
  const planDate = viewType.value === 'monthly'
    ? startDate.format('YYYY-MM')
    : startDate.format('YYYY-MM-DD')
  
  const rowCount = viewType.value === 'daily' ? 20 : (viewType.value === 'weekly' ? 15 : 10)
  const quantityBase = viewType.value === 'daily' ? 50 : (viewType.value === 'weekly' ? 300 : 1200)
  
  // 日明细 / 周统计 / 月汇总数据
  for (let i = 1; i <= rowCount; i++) {
    const planQuantity = Math.floor(Math.random() * quantityBase) + Math.floor(quantityBase / 2)
    const actualQuantity = Math.floor(Math.random() * planQuantity)
    
    mockData.push({
      key: String(i),
      planDate: planDate,
      productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
      partNo: `MD-${String(i).padStart(4, '0')}`,
      blankName: `打箱件-${i}`,
      specification: specificationList[Math.floor(Math.random() * specificationList.length)],
      materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
      planQuantity: planQuantity,
      actualQuantity: actualQuantity,
      completionRate: planQuantity > 0 ? (actualQuantity / planQuantity) * 100 : 0
    })
  }
  
  // 筛选
  let filteredData = mockData
  
  if (productSeries.value) {
    filteredData = filteredData.filter(item => item.productSeries === productSeries.value)
  }
  
  if (partNo.value) {
    filteredData = filteredData.filter(item => 
      item.partNo.toLowerCase().includes(partNo.value.toLowerCase())
    )
  }
  
  dataSource.value = filteredData
  pagination.total = dataSource.value.length
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.molding-schedule {
  background: transparent;
}

.filter-card,
.action-card,
.table-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

</style>
