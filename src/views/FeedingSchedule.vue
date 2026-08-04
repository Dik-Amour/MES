<template>
  <div class="feeding-schedule">
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
              <a-radio-button value="weekly">周汇总</a-radio-button>
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
        <a-button type="primary" @click="handleDownloadTemplate">
          <DownloadOutlined />
          模板下载
        </a-button>
        <a-button type="primary" @click="handleImport">
          <UploadOutlined />
          导入
        </a-button>
        <a-button type="primary" @click="handleSyncWMS" :loading="syncLoading">
          <SyncOutlined />
          手动同步
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
          <span>{{ viewType === 'daily' ? '日明细视图' : '周汇总视图' }}</span>
          <a-tag v-if="selectedDate" color="blue">
            {{ viewType === 'daily' ? selectedDate.format('YYYY-MM-DD') : getWeekRange() }}
          </a-tag>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <span>计划吨位：</span>
          <a-statistic
            :value="totalStats.planTonnage"
            :precision="2"
            suffix="吨"
            :value-style="{ fontSize: '16px' }"
          />
          <a-divider type="vertical" />
          <span>交付吨位：</span>
          <a-statistic
            :value="totalStats.deliveryTonnage"
            :precision="2"
            suffix="吨"
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
        :scroll="{ x: 1600 }"
        @change="handleTableChange"
        :row-class-name="getRowClassName"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'productSeries'">
            <a-tag :color="getSeriesColor(record.productSeries)">
              {{ record.productSeries }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'planTonnage'">
            <span>{{ formatNumber(record.planTonnage) }}</span>
          </template>
          <template v-else-if="column.key === 'deliveryTonnage'">
            <span>{{ formatNumber(record.deliveryTonnage) }}</span>
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

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      title="导入计划"
      :width="600"
      @ok="handleImportConfirm"
      @cancel="handleImportCancel"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="计划类型" required>
          <a-radio-group v-model:value="importType">
            <a-radio value="daily">日计划</a-radio>
            <a-radio value="weekly">周计划</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="选择日期" required>
          <a-date-picker
            v-model:value="importDate"
            :placeholder="importType === 'daily' ? '请选择日期' : '请选择周起始日期'"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="选择文件" required>
          <a-upload
            :file-list="fileList"
            :before-upload="beforeUpload"
            @remove="handleRemoveFile"
            :accept="'.xlsx,.xls'"
          >
            <a-button>
              <UploadOutlined />
              选择Excel文件
            </a-button>
          </a-upload>
          <div class="upload-tip">仅支持.xlsx、.xls格式文件</div>
        </a-form-item>
      </a-form>
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
  DownloadOutlined,
  UploadOutlined,
  ExportOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'

interface FeedingScheduleData {
  key: string
  planDate: string
  productSeries: string
  partNo: string
  blankName: string
  specification: string
  materialGrade: string
  weight: number
  planQuantity: number
  planTonnage: number
  deliveryQuantity: number
  deliveryTonnage: number
  completionRate: number
}

const selectedDate = ref<Dayjs>(dayjs())
const viewType = ref<'daily' | 'weekly'>('daily')
const productSeries = ref<string>('')
const partNo = ref<string>('')
const loading = ref(false)
const syncLoading = ref(false)
const dataSource = ref<FeedingScheduleData[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

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
    title: '铸件重量（kg）',
    dataIndex: 'weight',
    key: 'weight',
    width: 140,
    align: 'right'
  },
  {
    title: '计划数量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 120,
    align: 'right'
  },
  {
    title: '计划吨位',
    dataIndex: 'planTonnage',
    key: 'planTonnage',
    width: 120,
    align: 'right'
  },
  {
    title: '当日交付数量',
    dataIndex: 'deliveryQuantity',
    key: 'deliveryQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '当日交付吨位',
    dataIndex: 'deliveryTonnage',
    key: 'deliveryTonnage',
    width: 140,
    align: 'right'
  },
  {
    title: '当日计划完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 180,
    align: 'center'
  }
]

// 周汇总视图列定义
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
    title: '铸件重量（kg）',
    dataIndex: 'weight',
    key: 'weight',
    width: 140,
    align: 'right'
  },
  {
    title: '周计划数量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 120,
    align: 'right'
  },
  {
    title: '周计划吨位',
    dataIndex: 'planTonnage',
    key: 'planTonnage',
    width: 120,
    align: 'right'
  },
  {
    title: '周累计交付数量',
    dataIndex: 'deliveryQuantity',
    key: 'deliveryQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '周累计交付吨位',
    dataIndex: 'deliveryTonnage',
    key: 'deliveryTonnage',
    width: 140,
    align: 'right'
  },
  {
    title: '周整体完成率',
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

// 导入相关
const importModalVisible = ref(false)
const importType = ref<'daily' | 'weekly'>('daily')
const importDate = ref<Dayjs>()
const fileList = ref<any[]>([])

// 总计统计
const totalStats = computed(() => {
  if (dataSource.value.length === 0) {
    return { planTonnage: 0, deliveryTonnage: 0, completionRate: 0 }
  }
  
  const totalPlanTonnage = dataSource.value.reduce((sum, item) => sum + item.planTonnage, 0)
  const totalDeliveryTonnage = dataSource.value.reduce((sum, item) => sum + item.deliveryTonnage, 0)
  const totalPlanQuantity = dataSource.value.reduce((sum, item) => sum + item.planQuantity, 0)
  const totalDeliveryQuantity = dataSource.value.reduce((sum, item) => sum + item.deliveryQuantity, 0)
  const completionRate = totalPlanQuantity > 0 ? (totalDeliveryQuantity / totalPlanQuantity) * 100 : 0
  
  return {
    planTonnage: totalPlanTonnage,
    deliveryTonnage: totalDeliveryTonnage,
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

// 格式化数字
const formatNumber = (num: number) => {
  return num.toFixed(2)
}

// 获取行样式
const getRowClassName = (record: FeedingScheduleData) => {
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
  // 模拟API调用
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

// 生成模拟数据
const generateMockData = () => {
  const mockData: FeedingScheduleData[] = []
  const seriesList = ['A系列', 'B系列', 'C系列']
  const materialList = ['QT450-10', 'HT250', 'QT500-7', 'HT300']
  const specificationList = ['φ200×300', 'φ150×250', 'φ180×280', 'φ220×350']
  
  if (viewType.value === 'daily') {
    // 日明细数据
    for (let i = 1; i <= 20; i++) {
      const planQuantity = Math.floor(Math.random() * 100) + 50
      const deliveryQuantity = Math.floor(Math.random() * planQuantity)
      const weight = Math.floor(Math.random() * 50) + 10
      
      mockData.push({
        key: String(i),
        planDate: selectedDate.value.format('YYYY-MM-DD'),
        productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
        partNo: `FD-${String(i).padStart(4, '0')}`,
        blankName: `投料件-${i}`,
        specification: specificationList[Math.floor(Math.random() * specificationList.length)],
        materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
        weight: weight,
        planQuantity: planQuantity,
        planTonnage: (planQuantity * weight) / 1000,
        deliveryQuantity: deliveryQuantity,
        deliveryTonnage: (deliveryQuantity * weight) / 1000,
        completionRate: planQuantity > 0 ? (deliveryQuantity / planQuantity) * 100 : 0
      })
    }
  } else {
    // 周汇总数据
    for (let i = 1; i <= 15; i++) {
      const planQuantity = Math.floor(Math.random() * 500) + 200
      const deliveryQuantity = Math.floor(Math.random() * planQuantity)
      const weight = Math.floor(Math.random() * 50) + 10
      
      mockData.push({
        key: String(i),
        planDate: selectedDate.value.format('YYYY-MM-DD'),
        productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
        partNo: `FD-${String(i).padStart(4, '0')}`,
        blankName: `投料件-${i}`,
        specification: specificationList[Math.floor(Math.random() * specificationList.length)],
        materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
        weight: weight,
        planQuantity: planQuantity,
        planTonnage: (planQuantity * weight) / 1000,
        deliveryQuantity: deliveryQuantity,
        deliveryTonnage: (deliveryQuantity * weight) / 1000,
        completionRate: planQuantity > 0 ? (deliveryQuantity / planQuantity) * 100 : 0
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

// 模板下载
const handleDownloadTemplate = () => {
  message.success('模板下载成功')
}

// 导入
const handleImport = () => {
  importModalVisible.value = true
  importDate.value = dayjs()
  fileList.value = []
}

// 导入确认
const handleImportConfirm = () => {
  if (!importDate.value) {
    message.error('请选择日期')
    return
  }
  if (fileList.value.length === 0) {
    message.error('请选择要导入的文件')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    generateMockData()
    loading.value = false
    importModalVisible.value = false
    message.success('导入成功')
  }, 1000)
}

// 导入取消
const handleImportCancel = () => {
  importModalVisible.value = false
  fileList.value = []
}

// 手动同步WMS
const handleSyncWMS = () => {
  syncLoading.value = true
  // 模拟WMS同步
  setTimeout(() => {
    syncLoading.value = false
    message.success('WMS数据同步成功')
    handleSearch()
  }, 2000)
}

// 文件上传前
const beforeUpload = (file: any) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    message.error('只能上传Excel文件')
    return false
  }
  fileList.value = [file]
  return false
}

// 移除文件
const handleRemoveFile = () => {
  fileList.value = []
}

// 导出
const handleExport = () => {
  message.success('导出成功')
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.feeding-schedule {
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

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
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
