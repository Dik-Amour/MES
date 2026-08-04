<template>
  <div class="heat-treatment-schedule">
    <!-- 筛选操作区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="6">
          <a-form-item label="选择日期" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-date-picker
              v-model:value="selectedDate"
              placeholder="请选择日期"
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
        <a-button type="primary" @click="handleGeneratePlan" :loading="generateLoading">
          <PlayCircleOutlined />
          一键生成当日计划
        </a-button>
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
          <span>{{ viewType === 'daily' ? '日明细视图' : '周统计视图' }}</span>
          <a-tag v-if="selectedDate" color="blue">
            {{ viewType === 'daily' ? selectedDate.format('YYYY-MM-DD') : getWeekRange() }}
          </a-tag>
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
          <span>实际热处理总量：</span>
          <a-statistic
            :value="totalStats.actualQuantity"
            :value-style="{ fontSize: '16px', color: '#1890ff' }"
          />
          <a-divider type="vertical" />
          <span>完成率：</span>
          <a-statistic
            :value="totalStats.completionRate"
            :precision="2"
            suffix="%"
            :value-style="{ fontSize: '16px', color: '#52c41a' }"
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
        :row-class-name="getRowClassName"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'productSeries'">
            <a-tag :color="getSeriesColor(record.productSeries)">
              {{ record.productSeries }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'completionRate'">
            <a-progress
              :percent="record.completionRate"
              :stroke-color="getProgressColor(record.completionRate)"
              :format="(percent: number) => `${percent.toFixed(2)}%`"
              size="small"
            />
          </template>
          <template v-else-if="column.key === 'planDate' && viewType === 'weekly'">
            <span>{{ getWeekRange() }}</span>
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
        <a-descriptions-item label="数据来源">前一日 00:00-24:00 全部打箱完工记录</a-descriptions-item>
        <a-descriptions-item label="计算逻辑">按件号汇总当日实际打箱数量</a-descriptions-item>
        <a-descriptions-item label="生成规则">直接作为当日热处理计划数量，自动生成当日热处理排产任务</a-descriptions-item>
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
  ExportOutlined,
  PlayCircleOutlined
} from '@ant-design/icons-vue'

interface HeatTreatmentScheduleData {
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

const selectedDate = ref<Dayjs>(dayjs())
const viewType = ref<'daily' | 'weekly'>('daily')
const productSeries = ref<string>('')
const partNo = ref<string>('')
const loading = ref(false)
const generateLoading = ref(false)
const dataSource = ref<HeatTreatmentScheduleData[]>([])

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
    title: '计划热处理数量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 160,
    align: 'right'
  },
  {
    title: '实际热处理数量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 160,
    align: 'right'
  },
  {
    title: '热处理完成率',
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
    title: '本周实际热处理总量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 180,
    align: 'right'
  },
  {
    title: '周热处理完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 180,
    align: 'center'
  }
]

// 当前视图列
const currentColumns = computed(() => {
  return viewType.value === 'daily' ? dailyColumns : weeklyColumns
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

// 获取周范围
const getWeekRange = () => {
  if (!selectedDate.value) return ''
  const start = selectedDate.value.startOf('week')
  const end = selectedDate.value.endOf('week')
  return `${start.format('MM-DD')} ~ ${end.format('MM-DD')}`
}

// 获取进度条颜色
const getProgressColor = (percent: number) => {
  if (percent >= 100) return '#52c41a'
  if (percent >= 80) return '#1890ff'
  if (percent >= 60) return '#faad14'
  return '#ff4d4f'
}

// 获取系列颜色
const getSeriesColor = (series: string) => {
  const colorMap: Record<string, string> = {
    'A系列': 'blue',
    'B系列': 'green',
    'C系列': 'orange'
  }
  return colorMap[series] || 'default'
}

// 获取行样式
const getRowClassName = (record: HeatTreatmentScheduleData) => {
  if (record.completionRate >= 100) return 'row-completed'
  if (record.completionRate >= 80) return 'row-good'
  if (record.completionRate >= 60) return 'row-warning'
  return 'row-danger'
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
  selectedDate.value = dayjs()
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

// 一键生成当日计划
const handleGeneratePlan = () => {
  generateLoading.value = true
  // 模拟计划生成过程
  setTimeout(() => {
    generateLoading.value = false
    message.success('当日热处理计划生成成功')
    handleSearch()
  }, 2000)
}

// 导出
const handleExport = () => {
  message.success('导出成功')
}

// 生成模拟数据
const generateMockData = () => {
  const mockData: HeatTreatmentScheduleData[] = []
  const seriesList = ['A系列', 'B系列', 'C系列']
  const materialList = ['QT450-10', 'HT250', 'QT500-7', 'HT300']
  const specificationList = ['φ200×300', 'φ150×250', 'φ180×280', 'φ220×350']
  
  if (viewType.value === 'daily') {
    // 日明细数据
    for (let i = 1; i <= 20; i++) {
      const planQuantity = Math.floor(Math.random() * 40) + 15
      const actualQuantity = Math.floor(Math.random() * planQuantity)
      
      mockData.push({
        key: String(i),
        planDate: selectedDate.value.format('YYYY-MM-DD'),
        productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
        partNo: `HT-${String(i).padStart(4, '0')}`,
        blankName: `热处理件-${i}`,
        specification: specificationList[Math.floor(Math.random() * specificationList.length)],
        materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
        planQuantity: planQuantity,
        actualQuantity: actualQuantity,
        completionRate: planQuantity > 0 ? (actualQuantity / planQuantity) * 100 : 0
      })
    }
  } else {
    // 周统计数据
    for (let i = 1; i <= 15; i++) {
      const planQuantity = Math.floor(Math.random() * 250) + 80
      const actualQuantity = Math.floor(Math.random() * planQuantity)
      
      mockData.push({
        key: String(i),
        planDate: selectedDate.value.format('YYYY-MM-DD'),
        productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
        partNo: `HT-${String(i).padStart(4, '0')}`,
        blankName: `热处理件-${i}`,
        specification: specificationList[Math.floor(Math.random() * specificationList.length)],
        materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
        planQuantity: planQuantity,
        actualQuantity: actualQuantity,
        completionRate: planQuantity > 0 ? (actualQuantity / planQuantity) * 100 : 0
      })
    }
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
.heat-treatment-schedule {
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

/* 完成状态行样式 */
:deep(.row-completed) {
  background-color: #f6ffed;
}

:deep(.row-good) {
  background-color: #e6f7ff;
}

:deep(.row-warning) {
  background-color: #fffbe6;
}

:deep(.row-danger) {
  background-color: #fff1f0;
}
</style>
