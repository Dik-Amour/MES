<template>
  <div class="feeding-schedule">
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
              <a-radio-button value="weekly">周汇总</a-radio-button>
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
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增
        </a-button>
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
          <span>{{ viewTitle }}</span>
          <span v-if="selectedDateRange && selectedDateRange.length === 2">
            {{ getDateRangeLabel() }}
          </span>
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
        :columns="tableColumns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1700 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'weight'">
            <span>{{ formatNumber(record.weight) }}</span>
          </template>
          <template v-else-if="column.key === 'planTonnage'">
            <span>{{ formatNumber(record.planTonnage) }}</span>
          </template>
          <template v-else-if="column.key === 'deliveryTonnage'">
            <span>{{ formatNumber(record.deliveryTonnage) }}</span>
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

    <!-- 新增弹窗 -->
    <a-modal
      v-model:open="addModalVisible"
      title="新增投料排产"
      :width="600"
      @ok="handleAddConfirm"
      @cancel="handleAddCancel"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="产品系列" required>
          <a-select
            v-model:value="addFormData.productSeries"
            placeholder="请选择产品系列"
            style="width: 100%"
            @change="handleAddProductSeriesChange"
          >
            <a-select-option
              v-for="series in seriesOptions"
              :key="series"
              :value="series"
            >
              {{ series }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯件号" required>
          <a-select
            v-model:value="addFormData.partNo"
            placeholder="请先选择产品系列，再选择毛坯件号"
            style="width: 100%"
            show-search
            :filter-option="filterOption"
            :disabled="!addFormData.productSeries"
            @change="handleAddPartNoChange"
          >
            <a-select-option
              v-for="part in addPartOptions"
              :key="part.partNo"
              :value="part.partNo"
            >
              {{ part.partNo }} - {{ part.blankName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯名称">
          <a-input
            v-model:value="addFormData.blankName"
            placeholder="选择件号后自动同步"
            disabled
          />
        </a-form-item>
        <a-form-item label="计划数量" required>
          <a-input-number
            v-model:value="addFormData.planQuantity"
            placeholder="请输入计划数量"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="交付开始时间" required>
          <a-date-picker
            v-model:value="addFormData.deliveryStartDate"
            placeholder="请选择交付开始时间"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="交付结束时间" required>
          <a-date-picker
            v-model:value="addFormData.deliveryEndDate"
            placeholder="请选择交付结束时间"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="交付单位" required>
          <a-select
            v-model:value="addFormData.deliveryUnit"
            placeholder="请选择交付单位"
            style="width: 100%"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option
              v-for="unit in deliveryUnitOptions"
              :key="unit"
              :value="unit"
            >
              {{ unit }}
            </a-select-option>
          </a-select>
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
import * as XLSX from 'xlsx'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  ExportOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'

interface FeedingScheduleData {
  key: string
  productSeries: string
  partNo: string
  blankName: string
  specification: string
  materialGrade: string
  weight: number
  planQuantity: number
  planTonnage: number
  deliveryStartDate: string
  deliveryEndDate: string
  deliveryUnit: string
  deliveryQuantity: number
  deliveryTonnage: number
}

interface PartOption {
  partNo: string
  blankName: string
  productSeries: string
  specification: string
  materialGrade: string
  unitWeight: number
}

interface AddFormData {
  productSeries: string
  partNo: string
  blankName: string
  planQuantity: number | null
  deliveryStartDate: Dayjs | null
  deliveryEndDate: Dayjs | null
  deliveryUnit: string | null
}

// 产品系列选项
const seriesOptions = ['A系列', 'B系列', 'C系列']

// 交付单位选项
const deliveryUnitOptions = ['一车间', '二车间', '三车间', '成品库', '外协单位']

// 毛坯件号基础数据
const partOptions: PartOption[] = [
  { partNo: 'FD-0001', blankName: '投料件-1', productSeries: 'A系列', specification: 'φ200×300', materialGrade: 'QT450-10', unitWeight: 12.5 },
  { partNo: 'FD-0002', blankName: '投料件-2', productSeries: 'B系列', specification: 'φ150×250', materialGrade: 'HT250', unitWeight: 8.3 },
  { partNo: 'FD-0003', blankName: '投料件-3', productSeries: 'C系列', specification: 'φ180×280', materialGrade: 'QT500-7', unitWeight: 15.7 },
  { partNo: 'FD-0004', blankName: '投料件-4', productSeries: 'A系列', specification: 'φ220×350', materialGrade: 'HT300', unitWeight: 10.2 },
  { partNo: 'FD-0005', blankName: '投料件-5', productSeries: 'B系列', specification: 'φ200×300', materialGrade: 'QT450-10', unitWeight: 9.8 },
  { partNo: 'FD-0006', blankName: '投料件-6', productSeries: 'C系列', specification: 'φ150×250', materialGrade: 'HT250', unitWeight: 11.4 },
  { partNo: 'FD-0007', blankName: '投料件-7', productSeries: 'A系列', specification: 'φ180×280', materialGrade: 'QT500-7', unitWeight: 13.6 },
  { partNo: 'FD-0008', blankName: '投料件-8', productSeries: 'B系列', specification: 'φ220×350', materialGrade: 'HT300', unitWeight: 7.9 }
]

// 导入模板表头
const IMPORT_TEMPLATE_HEADERS = ['毛坯件号', '毛坯名称', '计划数量', '交付开始时间', '交付结束时间', '交付单位']

const selectedDateRange = ref<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])
const viewType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const productSeries = ref<string>('')
const partNo = ref<string>('')
const loading = ref(false)
const dataSource = ref<FeedingScheduleData[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列定义
const tableColumns = [
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
    width: 130
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
    width: 130,
    align: 'right'
  },
  {
    title: '计划数量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 110,
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
    title: '交付开始时间',
    dataIndex: 'deliveryStartDate',
    key: 'deliveryStartDate',
    width: 130,
    align: 'center'
  },
  {
    title: '交付结束时间',
    dataIndex: 'deliveryEndDate',
    key: 'deliveryEndDate',
    width: 130,
    align: 'center'
  },
  {
    title: '交付单位',
    dataIndex: 'deliveryUnit',
    key: 'deliveryUnit',
    width: 130
  },
  {
    title: '已交付数量',
    dataIndex: 'deliveryQuantity',
    key: 'deliveryQuantity',
    width: 120,
    align: 'right'
  },
  {
    title: '已交付吨位',
    dataIndex: 'deliveryTonnage',
    key: 'deliveryTonnage',
    width: 120,
    align: 'right'
  }
]

// 当前视图标题
const viewTitle = computed(() => {
  switch (viewType.value) {
    case 'daily':
      return '日明细视图'
    case 'weekly':
      return '周汇总视图'
    case 'monthly':
      return '月汇总视图'
  }
})

// 导入相关
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

// 新增弹窗相关
const addModalVisible = ref(false)
const addFormData = reactive<AddFormData>({
  productSeries: '',
  partNo: '',
  blankName: '',
  planQuantity: null,
  deliveryStartDate: null,
  deliveryEndDate: null,
  deliveryUnit: null
})

// 新增弹窗：按产品系列过滤件号选项
const addPartOptions = computed(() => {
  if (!addFormData.productSeries) return []
  return partOptions.filter(part => part.productSeries === addFormData.productSeries)
})

// 下拉搜索过滤
const filterOption = (input: string, option: any) => {
  return String(option.value ?? '').toLowerCase().includes(input.toLowerCase())
}

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

// 获取当前视图的日期范围标签
const getDateRangeLabel = () => {
  if (!selectedDateRange.value || selectedDateRange.value.length !== 2) return ''
  const [start, end] = selectedDateRange.value
  if (viewType.value === 'monthly') {
    return start.format('YYYY-MM')
  }
  return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toFixed(2)
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

// 生成模拟数据
const generateMockData = () => {
  const mockData: FeedingScheduleData[] = []
  const startDate = selectedDateRange.value[0]
  const rowCount = viewType.value === 'daily' ? 20 : (viewType.value === 'weekly' ? 15 : 10)
  const quantityBase = viewType.value === 'daily' ? 100 : (viewType.value === 'weekly' ? 500 : 2000)

  // 日明细 / 周汇总 / 月汇总数据
  for (let i = 1; i <= rowCount; i++) {
    const part = partOptions[(i - 1) % partOptions.length]
    const planQuantity = Math.floor(Math.random() * quantityBase) + Math.floor(quantityBase / 2)
    const deliveryQuantity = Math.floor(Math.random() * planQuantity)
    const deliveryStart = startDate.add(i - 1, 'day')
    const deliveryEnd = deliveryStart.add(2, 'day')

    mockData.push({
      key: String(i),
      productSeries: part.productSeries,
      partNo: part.partNo,
      blankName: part.blankName,
      specification: part.specification,
      materialGrade: part.materialGrade,
      weight: part.unitWeight,
      planQuantity: planQuantity,
      planTonnage: (planQuantity * part.unitWeight) / 1000,
      deliveryStartDate: deliveryStart.format('YYYY-MM-DD'),
      deliveryEndDate: deliveryEnd.format('YYYY-MM-DD'),
      deliveryUnit: deliveryUnitOptions[(i - 1) % deliveryUnitOptions.length],
      deliveryQuantity: deliveryQuantity,
      deliveryTonnage: (deliveryQuantity * part.unitWeight) / 1000
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

// 新增弹窗
const handleAdd = () => {
  addFormData.productSeries = ''
  addFormData.partNo = ''
  addFormData.blankName = ''
  addFormData.planQuantity = null
  addFormData.deliveryStartDate = null
  addFormData.deliveryEndDate = null
  addFormData.deliveryUnit = null
  addModalVisible.value = true
}

// 新增弹窗：产品系列变更时清空件号及毛坯名称
const handleAddProductSeriesChange = () => {
  addFormData.partNo = ''
  addFormData.blankName = ''
}

// 新增弹窗：选择件号后自动同步毛坯名称
const handleAddPartNoChange = (value: string) => {
  const selectedPart = partOptions.find(part => part.partNo === value)
  addFormData.blankName = selectedPart ? selectedPart.blankName : ''
}

// 新增确认
const handleAddConfirm = () => {
  const { productSeries, partNo, planQuantity, deliveryStartDate, deliveryEndDate, deliveryUnit } = addFormData

  if (!productSeries) {
    message.warning('请选择产品系列')
    return
  }
  if (!partNo) {
    message.warning('请选择毛坯件号')
    return
  }
  if (!planQuantity || planQuantity <= 0) {
    message.warning('请输入有效的计划数量')
    return
  }
  if (!deliveryStartDate) {
    message.warning('请选择交付开始时间')
    return
  }
  if (!deliveryEndDate) {
    message.warning('请选择交付结束时间')
    return
  }
  if (deliveryEndDate.isBefore(deliveryStartDate, 'day')) {
    message.warning('交付结束时间不能早于交付开始时间')
    return
  }
  if (!deliveryUnit) {
    message.warning('请选择交付单位')
    return
  }

  const selectedPart = partOptions.find(part => part.partNo === partNo)
  if (!selectedPart) {
    message.warning('未找到对应的毛坯件号')
    return
  }

  const weight = selectedPart.unitWeight
  dataSource.value.unshift({
    key: `new-${Date.now()}`,
    productSeries,
    partNo: selectedPart.partNo,
    blankName: selectedPart.blankName,
    specification: selectedPart.specification,
    materialGrade: selectedPart.materialGrade,
    weight,
    planQuantity,
    planTonnage: (planQuantity * weight) / 1000,
    deliveryStartDate: deliveryStartDate.format('YYYY-MM-DD'),
    deliveryEndDate: deliveryEndDate.format('YYYY-MM-DD'),
    deliveryUnit,
    deliveryQuantity: 0,
    deliveryTonnage: 0
  })
  pagination.total = dataSource.value.length
  addModalVisible.value = false
  message.success('投料排产新增成功')
}

// 新增取消
const handleAddCancel = () => {
  addModalVisible.value = false
}

// 模板下载
const handleDownloadTemplate = () => {
  const worksheet = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_HEADERS])
  worksheet['!cols'] = IMPORT_TEMPLATE_HEADERS.map(title => ({
    wch: title === '毛坯名称' ? 24 : 18
  }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '投料排产')
  XLSX.writeFile(workbook, '投料排产导入模板.xlsx')
  message.success('模板下载成功')
}

// 导入
const handleImport = () => {
  importModalVisible.value = true
  fileList.value = []
}

// 解析导入文件中的日期
const formatImportedDate = (value: any): string => {
  if (!value) return ''
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD')
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

// 导入确认
const handleImportConfirm = () => {
  if (fileList.value.length === 0) {
    message.error('请选择要导入的文件')
    return
  }

  loading.value = true
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target?.result, { type: 'array', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      if (rows.length === 0) {
        message.error('导入文件内容为空')
        return
      }

      const newRecords: FeedingScheduleData[] = []
      const errorRows: string[] = []

      rows.forEach((row, index) => {
        const line = index + 2 // 第 1 行为表头
        const partNo = String(row['毛坯件号'] ?? '').trim()
        const blankName = String(row['毛坯名称'] ?? '').trim()
        const planQuantity = Number(row['计划数量'])
        const deliveryStartDate = formatImportedDate(row['交付开始时间'])
        const deliveryEndDate = formatImportedDate(row['交付结束时间'])
        const deliveryUnit = String(row['交付单位'] ?? '').trim()

        if (!partNo) {
          errorRows.push(`第${line}行：毛坯件号不能为空`)
          return
        }
        if (!planQuantity || planQuantity <= 0 || Number.isNaN(planQuantity)) {
          errorRows.push(`第${line}行：计划数量无效`)
          return
        }
        if (!deliveryStartDate || !deliveryEndDate) {
          errorRows.push(`第${line}行：交付开始/结束时间不能为空`)
          return
        }
        if (!deliveryUnit) {
          errorRows.push(`第${line}行：交付单位不能为空`)
          return
        }

        const part = partOptions.find(item => item.partNo === partNo)
        const weight = part ? part.unitWeight : 0
        newRecords.push({
          key: `import-${Date.now()}-${index}`,
          productSeries: part ? part.productSeries : '',
          partNo,
          blankName: part ? part.blankName : blankName,
          specification: part ? part.specification : '',
          materialGrade: part ? part.materialGrade : '',
          weight,
          planQuantity,
          planTonnage: (planQuantity * weight) / 1000,
          deliveryStartDate,
          deliveryEndDate,
          deliveryUnit,
          deliveryQuantity: 0,
          deliveryTonnage: 0
        })
      })

      if (newRecords.length === 0) {
        message.error(`导入失败：${errorRows.slice(0, 3).join('；')}`)
        return
      }

      dataSource.value = [...newRecords, ...dataSource.value]
      pagination.total = dataSource.value.length
      importModalVisible.value = false
      fileList.value = []

      if (errorRows.length > 0) {
        message.warning(`已导入 ${newRecords.length} 条，跳过 ${errorRows.length} 条错误数据：${errorRows.slice(0, 3).join('；')}`)
      } else {
        message.success(`导入成功，共导入 ${newRecords.length} 条数据`)
      }
    } catch (error) {
      message.error('文件解析失败，请检查导入模板格式')
    } finally {
      loading.value = false
    }
  }
  reader.readAsArrayBuffer(fileList.value[0])
}

// 导入取消
const handleImportCancel = () => {
  importModalVisible.value = false
  fileList.value = []
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

</style>
