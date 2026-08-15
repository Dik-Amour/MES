<template>
  <div class="wip-detail">
    <!-- 搜索栏 -->
        <a-card :bordered="false" class="filter-card">
          <a-form layout="inline" :model="searchForm">
            <a-form-item label="产品系列">
              <a-select
                v-model:value="searchForm.productSeries"
                placeholder="请选择产品系列"
                allow-clear
                style="width: 180px"
                @change="handleSearch"
              >
                <a-select-option v-for="s in seriesOptions" :key="s" :value="s">
                  {{ s }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="毛坯件号">
              <a-select
                v-model:value="searchForm.blankPartNo"
                placeholder="请选择毛坯件号"
                allow-clear
                show-search
                :filter-option="filterOption"
                style="width: 180px"
                @change="handleSearch"
              >
                <a-select-option v-for="p in partNoOptions" :key="p" :value="p">
                  {{ p }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="毛坯名称">
              <a-input
                v-model:value="searchForm.blankName"
                placeholder="请输入毛坯名称"
                allow-clear
                style="width: 180px"
                @pressEnter="handleSearch"
              />
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
        </a-card>

        <!-- 功能按钮区 + 日期快捷条 -->
        <a-card :bordered="false" class="action-card">
          <a-row :gutter="16" align="middle" justify="space-between">
            <a-col>
              <a-space :size="8" wrap>
                <a-button type="primary" @click="handleAdd">
                  <PlusOutlined />
                  新增
                </a-button>
                <a-button type="primary" ghost @click="handleImport">
                  <UploadOutlined />
                  导入
                </a-button>
                <a-button
                  type="primary"
                  danger
                  ghost
                  @click="handleBatchDelete"
                  :disabled="selectedRowKeys.length === 0"
                >
                  <DeleteOutlined />
                  批量删除
                </a-button>
              </a-space>
            </a-col>
            <a-col>
              <a-space :size="8" wrap>
                <a-button
                  size="small"
                  :type="selectedDateKey === 'today' ? 'primary' : 'default'"
                  @click="handleQuickDate('today')"
                >
                  当天
                </a-button>
                <a-button size="small" @click="handleQuickDate('yesterday')">
                  <LeftOutlined />
                  昨天
                </a-button>
                <a-date-picker
                  v-model:value="selectedDate"
                  format="YYYY-MM-DD"
                  :allow-clear="false"
                  style="width: 140px"
                  @change="handleDateChange"
                />
                <a-button size="small" @click="handleQuickDate('tomorrow')">
                  明天
                  <RightOutlined />
                </a-button>
              </a-space>
            </a-col>
          </a-row>
        </a-card>

        <!-- 产线Tab + 数据列表 -->
        <a-card :bordered="false" class="table-card">
          <a-tabs v-model:activeKey="activeLine" @change="handleLineChange">
            <a-tab-pane
              v-for="line in lineOptions"
              :key="line.value"
              :tab="line.label"
            >
              <a-table
                :columns="columns"
                :data-source="dataSource"
                :loading="loading"
                :pagination="pagination"
                :row-key="rowKey"
                :row-selection="rowSelection"
                :scroll="{ x: 1700 }"
                @change="handleTableChange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="quantityKeys.includes(column.key)">
                    <span :class="{ 'zero-value': record[column.key] === 0 }">
                      {{ formatNumber(record[column.key]) }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <template v-if="activeLine === 'ALL'">
                      <a-button type="link" size="small" @click="handleViewDetail(record)">明细</a-button>
                    </template>
                    <template v-else>
                      <a-space>
                        <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                        <a-popconfirm
                          title="确定删除该条记录吗？"
                          @confirm="handleDelete(record)"
                        >
                          <a-button type="link" size="small" danger>删除</a-button>
                        </a-popconfirm>
                        <a-button type="link" size="small" @click="handleViewFeed(record)">查看投料记录</a-button>
                      </a-space>
                    </template>
                  </template>
                </template>
                <template #summary>
                  <a-table-summary fixed>
                    <a-table-summary-row>
                      <!-- 勾选列占位 -->
                      <a-table-summary-cell :index="0" :align="'left'"></a-table-summary-cell>
                      <template v-for="(col, index) in columns" :key="col.key">
                        <a-table-summary-cell
                          :index="index + 1"
                          :align="quantityKeys.includes(col.key) ? 'right' : 'left'"
                        >
                          <template v-if="index === 0">合计</template>
                          <template v-else-if="quantityKeys.includes(col.key)">
                            {{ formatNumber(summaryData[col.key]) }}
                          </template>
                        </a-table-summary-cell>
                      </template>
                    </a-table-summary-row>
                  </a-table-summary>
                </template>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="formModalVisible"
      :title="formModalTitle"
      :width="720"
      @ok="handleFormSubmit"
      @cancel="handleFormCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="产线" name="lineCode">
          <a-select v-model:value="formData.lineCode" placeholder="请选择产线">
            <a-select-option v-for="line in formLineOptions" :key="line.value" :value="line.value">
              {{ line.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="系列名称" name="seriesName">
          <a-select
            v-model:value="formData.seriesName"
            placeholder="请选择系列名称"
            @change="handleFormSeriesChange"
          >
            <a-select-option v-for="s in seriesOptions" :key="s" :value="s">
              {{ s }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯件号" name="blankPartNo">
          <a-select
            v-model:value="formData.blankPartNo"
            placeholder="请选择毛坯件号"
            show-search
            :filter-option="filterOption"
            @change="handleFormPartNoChange"
          >
            <a-select-option v-for="p in formPartNoOptions" :key="p" :value="p">
              {{ p }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯名称" name="blankName">
          <a-input v-model:value="formData.blankName" placeholder="选择毛坯件号后自动回显" disabled />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="出产数量" name="outputQuantity">
              <a-input-number v-model:value="formData.outputQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="细清数量" name="fineCleanQuantity">
              <a-input-number v-model:value="formData.fineCleanQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="内废数量" name="internalScrapQuantity">
              <a-input-number v-model:value="formData.internalScrapQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="入库/投料数量" name="inFeedQuantity">
              <a-input-number v-model:value="formData.inFeedQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="外废数量" name="externalScrapQuantity">
              <a-input-number v-model:value="formData.externalScrapQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="回购数量" name="buyBackQuantity">
              <a-input-number v-model:value="formData.buyBackQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="二次检验报废数量" name="reinspectionScrapQuantity">
              <a-input-number v-model:value="formData.reinspectionScrapQuantity" :min="0" :precision="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      title="Excel批量导入"
      :width="560"
      @ok="handleImportConfirm"
      @cancel="handleImportCancel"
    >
      <a-alert
        message="导入说明"
        description="导入文件将按当前产线覆盖在制品明细数据，请先下载模板按格式填写！"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
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

    <!-- 明细列表弹窗（总览Tab） -->
    <a-modal
      v-model:open="detailModalVisible"
      title="明细列表"
      :width="1100"
      @cancel="handleDetailClose"
    >
      <a-table
        :columns="detailColumns"
        :data-source="detailDataList"
        :pagination="false"
        :scroll="{ x: 800 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="['outputQuantity', 'fineCleanQuantity', 'internalScrapQuantity', 'inQuantity', 'externalScrapQuantity', 'buyBackQuantity', 'reinspectionScrapQuantity'].includes(column.key)">
            <span :class="{ 'zero-value': record[column.key] === 0 }">
              {{ formatNumber(record[column.key]) }}
            </span>
          </template>
        </template>
      </a-table>
      <template #footer>
        <a-button type="primary" @click="handleDetailClose">关闭</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

dayjs.locale('zh-cn')

interface WipDetailData {
  key: string
  lineCode: string
  lineName: string
  seriesName: string
  blankPartNo: string
  blankName: string
  outputQuantity: number
  fineCleanQuantity: number
  internalScrapQuantity: number
  inFeedQuantity: number
  externalScrapQuantity: number
  buyBackQuantity: number
  reinspectionScrapQuantity: number
  creator: string
  createTime: string
}

// 明细列表数据（总览Tab弹窗）
interface DetailData {
  key: string
  date: string
  lineName: string
  seriesName: string
  blankPartNo: string
  blankName: string
  outputQuantity: number
  fineCleanQuantity: number
  internalScrapQuantity: number
  inQuantity: number
  externalScrapQuantity: number
  buyBackQuantity: number
  reinspectionScrapQuantity: number
}

// 产线Tab配置
const lineOptions = [
  { label: '造型一线大件清理', value: 'LINE-01' },
  { label: '造型三线KW清理', value: 'LINE-02' },
  { label: '造型三线HWS清理', value: 'LINE-03' },
  { label: '总览', value: 'ALL' }
]

const lineNameMap: Record<string, string> = Object.fromEntries(
  lineOptions.map(line => [line.value, line.label])
)

// 系列名称选项
const seriesOptions = ['WP12', 'WP13']

// 毛坯基础数据（件号-名称-系列映射）
interface BlankPart {
  partNo: string
  name: string
  series: string
}

const blankPartOptions: BlankPart[] = [
  { partNo: '1003449788R', name: '气缸体毛坯', series: 'WP13' },
  { partNo: '1012995998R', name: '机体毛坯', series: 'WP12' },
  { partNo: '612630010001R', name: '气缸体毛坯', series: 'WP12' },
  { partNo: '612630020001R', name: '气缸盖毛坯', series: 'WP12' },
  { partNo: '1003449801R', name: '飞轮壳毛坯', series: 'WP13' },
  { partNo: '1003449777R', name: '齿轮室毛坯', series: 'WP13' }
]

// 毛坯件号选项（搜索栏用，全部）
const partNoOptions = blankPartOptions.map(item => item.partNo)

const activeLine = ref<string>('LINE-01')
const loading = ref(false)
const dataSource = ref<WipDetailData[]>([])
const selectedRowKeys = ref<Array<string | number>>([])

// 行唯一标识（产线+行号，避免总览Tab合并后不同产线重复 key 冲突）
const rowKey = (record: WipDetailData) => `${record.lineCode}::${record.key}`

// 表格勾选配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => {
    selectedRowKeys.value = keys
  }
}))

const selectedDateKey = ref<string>('today')
const selectedDate = ref<Dayjs>(dayjs())

const searchForm = reactive({
  productSeries: '',
  blankPartNo: '',
  blankName: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 数量列 key（统一格式化显示）
const quantityKeys = [
  'outputQuantity',
  'fineCleanQuantity',
  'internalScrapQuantity',
  'inFeedQuantity',
  'externalScrapQuantity',
  'buyBackQuantity',
  'reinspectionScrapQuantity'
]

// 底部合计数据（对当前Tab数据源的数值列求和）
const summaryData = computed<Record<string, number>>(() => {
  const totals: Record<string, number> = {}
  quantityKeys.forEach(key => {
    totals[key] = dataSource.value.reduce((sum, item) => sum + ((item as any)[key] || 0), 0)
  })
  return totals
})

const columns = [
  { title: '系列名称', dataIndex: 'seriesName', key: 'seriesName', width: 110, fixed: 'left' as const },
  { title: '毛坯件号', dataIndex: 'blankPartNo', key: 'blankPartNo', width: 150 },
  { title: '毛坯名称', dataIndex: 'blankName', key: 'blankName', width: 140 },
  { title: '出产数量', dataIndex: 'outputQuantity', key: 'outputQuantity', width: 110 },
  { title: '细清数量', dataIndex: 'fineCleanQuantity', key: 'fineCleanQuantity', width: 110 },
  { title: '内废数量', dataIndex: 'internalScrapQuantity', key: 'internalScrapQuantity', width: 110 },
  { title: '入库/投料数量', dataIndex: 'inFeedQuantity', key: 'inFeedQuantity', width: 130 },
  { title: '外废数量', dataIndex: 'externalScrapQuantity', key: 'externalScrapQuantity', width: 110 },
  { title: '回购数量', dataIndex: 'buyBackQuantity', key: 'buyBackQuantity', width: 110 },
  { title: '二次检验报废数量', dataIndex: 'reinspectionScrapQuantity', key: 'reinspectionScrapQuantity', width: 150 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 210, fixed: 'right' as const }
]

// 模拟数据（按产线分组）
const mockDataByLine: Record<string, WipDetailData[]> = {
  'LINE-01': [
    {
      key: '1',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      seriesName: 'WP13',
      blankPartNo: '1003449788R',
      blankName: '气缸体毛坯',
      outputQuantity: 0,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      inFeedQuantity: 354,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0,
      creator: '张三',
      createTime: '2026-08-05 07:05:59'
    },
    {
      key: '2',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      seriesName: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      outputQuantity: 0,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      inFeedQuantity: 20,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0,
      creator: '张三',
      createTime: '2026-08-05 07:05:45'
    },
    {
      key: '3',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      seriesName: 'WP12',
      blankPartNo: '612630010001R',
      blankName: '气缸体毛坯',
      outputQuantity: 0,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      inFeedQuantity: 60,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0,
      creator: '张三',
      createTime: '2026-08-05 07:05:30'
    }
  ],
  'LINE-02': [
    {
      key: '1',
      lineCode: 'LINE-02',
      lineName: '造型三线KW清理',
      seriesName: 'WP12',
      blankPartNo: '612630020001R',
      blankName: '气缸盖毛坯',
      outputQuantity: 120,
      fineCleanQuantity: 98,
      internalScrapQuantity: 2,
      inFeedQuantity: 128,
      externalScrapQuantity: 0,
      buyBackQuantity: 5,
      reinspectionScrapQuantity: 1,
      creator: '张三',
      createTime: '2026-08-05 07:06:12'
    },
    {
      key: '2',
      lineCode: 'LINE-02',
      lineName: '造型三线KW清理',
      seriesName: 'WP13',
      blankPartNo: '1003449801R',
      blankName: '飞轮壳毛坯',
      outputQuantity: 45,
      fineCleanQuantity: 40,
      internalScrapQuantity: 0,
      inFeedQuantity: 46,
      externalScrapQuantity: 1,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0,
      creator: '王芳',
      createTime: '2026-08-05 07:07:00'
    }
  ],
  'LINE-03': [
    {
      key: '1',
      lineCode: 'LINE-03',
      lineName: '造型三线HWS清理',
      seriesName: 'WP13',
      blankPartNo: '1003449777R',
      blankName: '齿轮室毛坯',
      outputQuantity: 200,
      fineCleanQuantity: 185,
      internalScrapQuantity: 3,
      inFeedQuantity: 210,
      externalScrapQuantity: 4,
      buyBackQuantity: 8,
      reinspectionScrapQuantity: 2,
      creator: '李强',
      createTime: '2026-08-05 07:08:20'
    },
    {
      key: '2',
      lineCode: 'LINE-03',
      lineName: '造型三线HWS清理',
      seriesName: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      outputQuantity: 88,
      fineCleanQuantity: 80,
      internalScrapQuantity: 1,
      inFeedQuantity: 90,
      externalScrapQuantity: 0,
      buyBackQuantity: 2,
      reinspectionScrapQuantity: 0,
      creator: '李强',
      createTime: '2026-08-05 07:09:05'
    }
  ]
}

// 新增/编辑弹窗
const formRef = ref<FormInstance>()
const formModalVisible = ref(false)
const formModalTitle = ref('新增在制品明细')
const editingRecord = ref<WipDetailData | null>(null)
const formData = reactive({
  lineCode: 'LINE-01',
  seriesName: '',
  blankPartNo: '',
  blankName: '',
  outputQuantity: 0,
  fineCleanQuantity: 0,
  internalScrapQuantity: 0,
  inFeedQuantity: 0,
  externalScrapQuantity: 0,
  buyBackQuantity: 0,
  reinspectionScrapQuantity: 0
})
const formRules = {
  seriesName: [{ required: true, message: '请选择系列名称', trigger: 'change' }],
  blankPartNo: [{ required: true, message: '请选择毛坯件号', trigger: 'change' }],
  blankName: [{ required: true, message: '请输入毛坯名称', trigger: 'blur' }]
}

// 弹窗内毛坯件号选项（按所选系列联动过滤，未选系列时展示全部）
const formPartNoOptions = computed(() => {
  if (!formData.seriesName) {
    return blankPartOptions.map(item => item.partNo)
  }
  return blankPartOptions
    .filter(item => item.series === formData.seriesName)
    .map(item => item.partNo)
})

// 弹窗内产线选项（不含总览）
const formLineOptions = computed(() =>
  lineOptions.filter(line => line.value !== 'ALL')
)

// 导入弹窗
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

onMounted(() => {
  loadData()
})

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    let allData: WipDetailData[] = []
    if (activeLine.value === 'ALL') {
      Object.values(mockDataByLine).forEach(items => {
        allData = allData.concat(items)
      })
    } else {
      allData = mockDataByLine[activeLine.value] || []
    }
    const { productSeries, blankPartNo, blankName } = searchForm
    const filtered = allData.filter(item => {
      const matchSeries = !productSeries || item.seriesName === productSeries
      const matchPartNo = !blankPartNo || item.blankPartNo === blankPartNo
      const matchName = !blankName || item.blankName.includes(blankName)
      return matchSeries && matchPartNo && matchName
    })
    dataSource.value = filtered
    pagination.total = filtered.length
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  selectedRowKeys.value = []
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.productSeries = ''
  searchForm.blankPartNo = ''
  searchForm.blankName = ''
  handleSearch()
}

const handleLineChange = () => {
  selectedRowKeys.value = []
  pagination.current = 1
  loadData()
}

// 日期快捷选择
const handleQuickDate = (key: string) => {
  selectedDateKey.value = key
  if (key === 'today') {
    selectedDate.value = dayjs()
  } else if (key === 'yesterday') {
    selectedDate.value = dayjs().subtract(1, 'day')
  } else if (key === 'tomorrow') {
    selectedDate.value = dayjs().add(1, 'day')
  }
}

// 日期选择器选择日期（取消快捷按钮高亮）
const handleDateChange = (date: Dayjs | null) => {
  selectedDateKey.value = ''
  if (date) {
    selectedDate.value = date
  }
}

const handleAdd = () => {
  editingRecord.value = null
  formModalTitle.value = '新增在制品明细'
  formData.lineCode = activeLine.value === 'ALL' ? 'LINE-01' : activeLine.value
  formData.seriesName = ''
  formData.blankPartNo = ''
  formData.blankName = ''
  formData.outputQuantity = 0
  formData.fineCleanQuantity = 0
  formData.internalScrapQuantity = 0
  formData.inFeedQuantity = 0
  formData.externalScrapQuantity = 0
  formData.buyBackQuantity = 0
  formData.reinspectionScrapQuantity = 0
  formModalVisible.value = true
}

const handleEdit = (record: WipDetailData) => {
  editingRecord.value = record
  formModalTitle.value = '编辑在制品明细'
  formData.lineCode = record.lineCode
  formData.seriesName = record.seriesName
  formData.blankPartNo = record.blankPartNo
  formData.blankName = record.blankName
  formData.outputQuantity = record.outputQuantity
  formData.fineCleanQuantity = record.fineCleanQuantity
  formData.internalScrapQuantity = record.internalScrapQuantity
  formData.inFeedQuantity = record.inFeedQuantity
  formData.externalScrapQuantity = record.externalScrapQuantity
  formData.buyBackQuantity = record.buyBackQuantity
  formData.reinspectionScrapQuantity = record.reinspectionScrapQuantity
  // 与新增逻辑一致：按毛坯件号联动回显毛坯名称
  handleFormPartNoChange()
  formModalVisible.value = true
}

const handleFormSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const now = '2026-08-06 12:00:00'
  const currentUser = '当前用户'
  if (editingRecord.value) {
    const record = editingRecord.value
    record.lineCode = formData.lineCode
    record.lineName = lineNameMap[formData.lineCode] || formData.lineCode
    record.seriesName = formData.seriesName
    record.blankPartNo = formData.blankPartNo
    record.blankName = formData.blankName
    record.outputQuantity = formData.outputQuantity
    record.fineCleanQuantity = formData.fineCleanQuantity
    record.internalScrapQuantity = formData.internalScrapQuantity
    record.inFeedQuantity = formData.inFeedQuantity
    record.externalScrapQuantity = formData.externalScrapQuantity
    record.buyBackQuantity = formData.buyBackQuantity
    record.reinspectionScrapQuantity = formData.reinspectionScrapQuantity
    message.success('修改成功')
  } else {
    const lineData = mockDataByLine[formData.lineCode]
    if (lineData) {
      lineData.unshift({
        key: String(Date.now()),
        lineCode: formData.lineCode,
        lineName: lineNameMap[formData.lineCode] || formData.lineCode,
        seriesName: formData.seriesName,
        blankPartNo: formData.blankPartNo,
        blankName: formData.blankName,
        outputQuantity: formData.outputQuantity,
        fineCleanQuantity: formData.fineCleanQuantity,
        internalScrapQuantity: formData.internalScrapQuantity,
        inFeedQuantity: formData.inFeedQuantity,
        externalScrapQuantity: formData.externalScrapQuantity,
        buyBackQuantity: formData.buyBackQuantity,
        reinspectionScrapQuantity: formData.reinspectionScrapQuantity,
        creator: currentUser,
        createTime: now
      })
    }
    message.success('新增成功')
  }
  formModalVisible.value = false
  loadData()
}

const handleFormCancel = () => {
  formModalVisible.value = false
}

// 系列变更时清空毛坯件号与名称
const handleFormSeriesChange = () => {
  formData.blankPartNo = ''
  formData.blankName = ''
}

// 毛坯件号变更时联动回显毛坯名称
const handleFormPartNoChange = () => {
  const part = blankPartOptions.find(item => item.partNo === formData.blankPartNo)
  formData.blankName = part ? part.name : ''
}

const handleDelete = (record: WipDetailData) => {
  const lineData = mockDataByLine[record.lineCode]
  if (lineData) {
    const index = lineData.findIndex(item => item.key === record.key)
    if (index !== -1) {
      lineData.splice(index, 1)
    }
  }
  dataSource.value = dataSource.value.filter(item => item.key !== record.key)
  selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== rowKey(record))
  pagination.total = dataSource.value.length
  message.success('删除成功')
}

// 批量删除
const handleBatchDelete = () => {
  const keys = selectedRowKeys.value
  if (keys.length === 0) {
    message.warning('请先勾选要删除的记录')
    return
  }
  Modal.confirm({
    title: '批量删除',
    content: `确定删除选中的 ${keys.length} 条记录吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      const keySet = new Set(keys)
      Object.values(mockDataByLine).forEach(lineData => {
        for (let i = lineData.length - 1; i >= 0; i--) {
          if (keySet.has(rowKey(lineData[i]))) {
            lineData.splice(i, 1)
          }
        }
      })
      dataSource.value = dataSource.value.filter(item => !keySet.has(rowKey(item)))
      pagination.total = dataSource.value.length
      selectedRowKeys.value = []
      message.success('批量删除成功')
    }
  })
}

const handleViewFeed = (record: WipDetailData) => {
  message.info(`查看 ${record.blankPartNo} 的投料记录`)
}

// 明细列表弹窗
const detailModalVisible = ref(false)
const detailDataList = ref<DetailData[]>([])
const detailColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
  { title: '产线', dataIndex: 'lineName', key: 'lineName', width: 160 },
  { title: '产品系列', dataIndex: 'seriesName', key: 'seriesName', width: 100 },
  { title: '毛坯件号', dataIndex: 'blankPartNo', key: 'blankPartNo', width: 150 },
  { title: '毛坯名称', dataIndex: 'blankName', key: 'blankName', width: 120 },
  { title: '出产数量', dataIndex: 'outputQuantity', key: 'outputQuantity', width: 110 },
  { title: '细清数量', dataIndex: 'fineCleanQuantity', key: 'fineCleanQuantity', width: 110 },
  { title: '内废数量', dataIndex: 'internalScrapQuantity', key: 'internalScrapQuantity', width: 110 },
  { title: '入库数量', dataIndex: 'inQuantity', key: 'inQuantity', width: 110 },
  { title: '外废数量', dataIndex: 'externalScrapQuantity', key: 'externalScrapQuantity', width: 110 },
  { title: '回购数量', dataIndex: 'buyBackQuantity', key: 'buyBackQuantity', width: 110 },
  { title: '二次检验报废数量', dataIndex: 'reinspectionScrapQuantity', key: 'reinspectionScrapQuantity', width: 150 }
]

// 查看某毛坯件号在各产线的明细
const handleViewDetail = (record: WipDetailData) => {
  const list: DetailData[] = []
  Object.values(mockDataByLine).forEach(items => {
    items.forEach(item => {
      if (item.blankPartNo === record.blankPartNo) {
        list.push({
          key: item.key,
          date: item.createTime.slice(0, 10),
          lineName: item.lineName,
          seriesName: item.seriesName,
          blankPartNo: item.blankPartNo,
          blankName: item.blankName,
          outputQuantity: item.outputQuantity,
          fineCleanQuantity: item.fineCleanQuantity,
          internalScrapQuantity: item.internalScrapQuantity,
          inQuantity: item.inFeedQuantity,
          externalScrapQuantity: item.externalScrapQuantity,
          buyBackQuantity: item.buyBackQuantity,
          reinspectionScrapQuantity: item.reinspectionScrapQuantity
        })
      }
    })
  })
  detailDataList.value = list
  detailModalVisible.value = true
}

const handleDetailClose = () => {
  detailModalVisible.value = false
}

const handleImport = () => {
  fileList.value = []
  importModalVisible.value = true
}

const handleImportConfirm = () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要导入的文件')
    return
  }
  message.success('导入成功')
  importModalVisible.value = false
  fileList.value = []
  loadData()
}

const handleImportCancel = () => {
  fileList.value = []
}

const beforeUpload = (file: any) => {
  fileList.value = [file]
  return false
}

const handleRemoveFile = () => {
  fileList.value = []
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const formatNumber = (value: number) => {
  return value.toLocaleString('zh-CN')
}

const filterOption = (input: string, option: any) => {
  return (option.value || '').toLowerCase().includes(input.toLowerCase())
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.action-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.zero-value {
  color: #bfbfbf;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
</style>
