<template>
  <div class="monthly-cleaning-plan">
    <!-- 筛选操作区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :xs="24" :sm="12" :md="6">
          <a-form-item label="选择月份" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-month-picker
              v-model:value="selectedMonth"
              placeholder="请选择月份"
              format="YYYY-MM"
              @change="handleMonthChange"
              style="width: 100%"
            />
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
              v-model:value="blankPartNo"
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
          <span>月度清理计划明细</span>
          <a-tag v-if="selectedMonth" color="blue">{{ selectedMonth.format('YYYY-MM') }}</a-tag>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <span>总计：</span>
          <a-statistic
            :value="totalStats.planTonnage"
            :precision="2"
            suffix="吨"
            :value-style="{ fontSize: '16px' }"
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
        :columns="columns"
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
          <template v-else-if="column.key === 'weight'">
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      title="Excel批量导入"
      :width="600"
      @ok="handleImportConfirm"
      @cancel="handleImportCancel"
    >
      <a-alert
        message="导入说明"
        description="同一月份重复导入文件，系统将直接全量覆盖当月所有历史计划数据，请谨慎操作！"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="选择月份" required>
          <a-month-picker
            v-model:value="importMonth"
            placeholder="请选择导入月份"
            format="YYYY-MM"
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

    <!-- 确认覆盖弹窗 -->
    <a-modal
      v-model:open="confirmOverwriteVisible"
      title="确认覆盖"
      @ok="handleOverwriteConfirm"
      @cancel="handleOverwriteCancel"
      :ok-button-props="{ danger: true }"
    >
      <a-alert
        message="警告"
        :description="`月份 ${importMonth?.format('YYYY-MM')} 已存在计划数据，导入后将全量覆盖现有数据，此操作不可恢复！是否继续？`"
        type="error"
        show-icon
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'

// 设置dayjs为中文
dayjs.locale('zh-cn')

interface MonthlyPlanData {
  key: string
  productSeries: string
  blankPartNo: string
  blankName: string
  specification: string
  materialGrade: string
  weight: number
  monthlyPlanQuantity: number
  planTonnage: number
  cumulativeDeliveryQuantity: number
  deliveryTonnage: number
  completionRate: number
}

const selectedMonth = ref<Dayjs>(dayjs())
const productSeries = ref<string>('')
const blankPartNo = ref<string>('')
const loading = ref(false)
const dataSource = ref<MonthlyPlanData[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const columns = [
  {
    title: '产品系列',
    dataIndex: 'productSeries',
    key: 'productSeries',
    width: 120,
    fixed: 'left'
  },
  {
    title: '毛坯件号',
    dataIndex: 'blankPartNo',
    key: 'blankPartNo',
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
    width: 120,
    align: 'right'
  },
  {
    title: '月度计划数量',
    dataIndex: 'monthlyPlanQuantity',
    key: 'monthlyPlanQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '月度计划吨位',
    dataIndex: 'planTonnage',
    key: 'planTonnage',
    width: 140,
    align: 'right'
  },
  {
    title: '累计交付数量',
    dataIndex: 'cumulativeDeliveryQuantity',
    key: 'cumulativeDeliveryQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '累计交付吨位',
    dataIndex: 'deliveryTonnage',
    key: 'deliveryTonnage',
    width: 140,
    align: 'right'
  },
  {
    title: '月度计划完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 180,
    align: 'center'
  }
]

// 导入相关
const importModalVisible = ref(false)
const importMonth = ref<Dayjs>()
const fileList = ref<any[]>([])
const confirmOverwriteVisible = ref(false)

// 总计统计
const totalStats = computed(() => {
  if (dataSource.value.length === 0) {
    return { planTonnage: 0, completionRate: 0 }
  }
  
  const totalPlanTonnage = dataSource.value.reduce((sum, item) => sum + item.planTonnage, 0)
  const totalDeliveryQuantity = dataSource.value.reduce((sum, item) => sum + item.cumulativeDeliveryQuantity, 0)
  const totalPlanQuantity = dataSource.value.reduce((sum, item) => sum + item.monthlyPlanQuantity, 0)
  const completionRate = totalPlanQuantity > 0 ? (totalDeliveryQuantity / totalPlanQuantity) * 100 : 0
  
  return {
    planTonnage: totalPlanTonnage,
    completionRate: completionRate
  }
})

// 获取系列颜色
const getSeriesColor = (series: string) => {
  const colorMap: Record<string, string> = {
    'A系列': 'blue',
    'B系列': 'green',
    'C系列': 'orange'
  }
  return colorMap[series] || 'default'
}

// 获取进度条颜色
const getProgressColor = (percent: number) => {
  if (percent >= 100) return '#52c41a'
  if (percent >= 80) return '#1890ff'
  if (percent >= 60) return '#faad14'
  return '#ff4d4f'
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toFixed(2)
}

// 获取行样式
const getRowClassName = (record: MonthlyPlanData) => {
  if (record.completionRate >= 100) return 'row-completed'
  if (record.completionRate >= 80) return 'row-good'
  if (record.completionRate >= 60) return 'row-warning'
  return 'row-danger'
}

// 月份变化
const handleMonthChange = () => {
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
  selectedMonth.value = dayjs()
  productSeries.value = ''
  blankPartNo.value = ''
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
  const mockData: MonthlyPlanData[] = []
  const seriesList = ['A系列', 'B系列', 'C系列']
  const materialList = ['QT450-10', 'HT250', 'QT500-7', 'HT300']
  const specificationList = ['φ200×300', 'φ150×250', 'φ180×280', 'φ220×350']
  
  for (let i = 1; i <= 25; i++) {
    const planQuantity = Math.floor(Math.random() * 500) + 100
    const deliveryQuantity = Math.floor(Math.random() * planQuantity)
    const weight = Math.floor(Math.random() * 100) + 10
    
    mockData.push({
      key: String(i),
      productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
      blankPartNo: `MP-${String(i).padStart(4, '0')}`,
      blankName: `毛坯件-${i}`,
      specification: specificationList[Math.floor(Math.random() * specificationList.length)],
      materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
      weight: weight,
      monthlyPlanQuantity: planQuantity,
      planTonnage: (planQuantity * weight) / 1000, // 转换为吨
      cumulativeDeliveryQuantity: deliveryQuantity,
      deliveryTonnage: (deliveryQuantity * weight) / 1000,
      completionRate: planQuantity > 0 ? (deliveryQuantity / planQuantity) * 100 : 0
    })
  }
  
  // 筛选
  let filteredData = mockData
  
  if (productSeries.value) {
    filteredData = filteredData.filter(item => item.productSeries === productSeries.value)
  }
  
  if (blankPartNo.value) {
    filteredData = filteredData.filter(item => 
      item.blankPartNo.toLowerCase().includes(blankPartNo.value.toLowerCase())
    )
  }
  
  dataSource.value = filteredData
  pagination.total = dataSource.value.length
}

// 模板下载
const handleDownloadTemplate = () => {
  // 生成CSV格式的模板文件
  const headers = ['产品系列', '毛坯件号', '月度计划数量']
  const csvContent = [
    headers.join(','),
    'A系列,FC-0001,100',
    'B系列,FC-0002,150',
    'C系列,FC-0003,80'
  ].join('\n')
  
  // 添加BOM头以支持中文
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // 创建下载链接
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `月度清理计划模板_${dayjs().format('YYYY-MM-DD')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  message.success('模板下载成功')
}

// 导入
const handleImport = () => {
  importModalVisible.value = true
  importMonth.value = dayjs()
  fileList.value = []
}

// 导入确认
const handleImportConfirm = () => {
  if (!importMonth.value) {
    message.error('请选择导入月份')
    return
  }
  if (fileList.value.length === 0) {
    message.error('请选择要导入的文件')
    return
  }
  
  // 检查是否已存在该月份数据
  const hasExistingData = Math.random() > 0.5 // 模拟随机判断
  
  if (hasExistingData) {
    confirmOverwriteVisible.value = true
  } else {
    executeImport()
  }
}

// 执行导入
const executeImport = () => {
  loading.value = true
  setTimeout(() => {
    generateMockData()
    loading.value = false
    importModalVisible.value = false
    confirmOverwriteVisible.value = false
    message.success('导入成功')
  }, 1000)
}

// 导入取消
const handleImportCancel = () => {
  importModalVisible.value = false
  fileList.value = []
}

// 覆盖确认
const handleOverwriteConfirm = () => {
  executeImport()
}

// 覆盖取消
const handleOverwriteCancel = () => {
  confirmOverwriteVisible.value = false
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
  return false // 阻止自动上传
}

// 移除文件
const handleRemoveFile = () => {
  fileList.value = []
}

// 导出
const handleExport = () => {
  message.success('导出成功')
  // 实际项目中这里会调用导出API
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.monthly-cleaning-plan {
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
