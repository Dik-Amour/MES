<template>
  <div class="fine-cleaning-schedule">
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
          <a-form-item label="计划类型" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <a-select
              v-model:value="planType"
              placeholder="请选择计划类型"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="fixed">固定清单</a-select-option>
              <a-select-option value="temporary">临时新增</a-select-option>
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
        <a-button type="primary" @click="handleAddTemporary">
          <PlusOutlined />
          新增临时任务
        </a-button>
        <a-button @click="handleOpenFixedConfig">
          <SettingOutlined />
          固定细清配置
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
          <span>实际细清总量：</span>
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
          <template v-else-if="column.key === 'planType'">
            <a-tag :color="record.planType === 'fixed' ? 'blue' : 'orange'">
              {{ record.planType === 'fixed' ? '固定清单' : '临时新增' }}
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

    <!-- 新增临时任务弹窗 -->
    <a-modal
      v-model:open="addModalVisible"
      title="新增临时细清任务"
      :width="600"
      @ok="handleAddConfirm"
      @cancel="handleAddCancel"
    >
      <a-alert
        message="临时任务说明"
        description="临时新增任务适用于计划外的特殊情况，需手动选择日期、件号和数量。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="计划日期" required>
          <a-date-picker
            v-model:value="addFormData.planDate"
            placeholder="请选择计划日期"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="产品系列" required>
          <a-select
            v-model:value="addFormData.productSeries"
            placeholder="请选择产品系列"
            style="width: 100%"
            @change="handleAddProductSeriesChange"
          >
            <a-select-option value="A系列">A系列</a-select-option>
            <a-select-option value="B系列">B系列</a-select-option>
            <a-select-option value="C系列">C系列</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="毛坯件号" required>
          <a-select
            v-model:value="addFormData.partNo"
            placeholder="请先选择产品系列，再选择件号"
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
            placeholder="选择件号后自动回显"
            disabled
          />
        </a-form-item>
        <a-form-item label="牌号材质">
          <a-input
            v-model:value="addFormData.materialGrade"
            placeholder="选择件号后自动回显"
            disabled
          />
        </a-form-item>
        <a-form-item label="计划数量" required>
          <a-input-number
            v-model:value="addFormData.planQuantity"
            placeholder="请输入计划细清数量"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 固定清单配置弹窗 -->
    <a-modal
      v-model:open="fixedConfigVisible"
      title="每日固定细清清单配置"
      :width="900"
      :style="{ height: '520px' }"
      @ok="handleFixedConfigSave"
      @cancel="handleFixedConfigCancel"
    >
      <a-alert
        message="配置说明"
        description="维护车间每日固定需要细清的常规件号，配置后系统每日凌晨自动生成当日细清计划，无需人工重复新增。配置保存后次日自动生效，当日已生成的细清计划不回溯变更。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <!-- 操作按钮区 -->
      <div class="config-actions">
        <a-space>
          <a-button type="primary" @click="handleAddFixedRow">
            <PlusOutlined />
            新增行
          </a-button>
          <a-button @click="handleBatchDeleteFixed">
            <DeleteOutlined />
            批量删除
          </a-button>
          <a-button @click="handleRefreshFixedConfig">
            <ReloadOutlined />
            刷新
          </a-button>
          <a-button @click="handleImportFixedConfig">
            <ImportOutlined />
            导入
          </a-button>
        </a-space>
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          style="display: none"
          @change="handleFileChange"
        />
      </div>

      <!-- 主体表格编辑区 -->
      <div class="config-table-container">
        <a-table
          :columns="fixedConfigColumns"
          :data-source="fixedConfigData"
          :pagination="false"
          :scroll="{ y: 300 }"
          row-key="key"
          :row-selection="{
            selectedRowKeys: selectedFixedRowKeys,
            onChange: onFixedRowSelectionChange
          }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'productSeries'">
              <a-select
                v-model:value="record.productSeries"
                placeholder="请选择产品系列"
                style="width: 100%"
                @change="(value: string) => handleProductSeriesChange(value, record)"
              >
                <a-select-option value="A系列">A系列</a-select-option>
                <a-select-option value="B系列">B系列</a-select-option>
                <a-select-option value="C系列">C系列</a-select-option>
              </a-select>
            </template>
            <template v-else-if="column.key === 'partNo'">
              <a-select
                v-model:value="record.partNo"
                placeholder="请选择件号"
                style="width: 100%"
                show-search
                :filter-option="filterOption"
                :disabled="!record.productSeries"
                @change="(value: string) => handlePartNoChange(value, record)"
              >
                <a-select-option
                  v-for="part in filteredPartOptions(record.productSeries)"
                  :key="part.partNo"
                  :value="part.partNo"
                >
                  {{ part.partNo }} - {{ part.blankName }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="column.key === 'blankName'">
              <span>{{ record.blankName }}</span>
            </template>
            <template v-else-if="column.key === 'materialGrade'">
              <span>{{ record.materialGrade }}</span>
            </template>
            <template v-else-if="column.key === 'dailyQuantity'">
              <a-input-number
                v-model:value="record.dailyQuantity"
                placeholder="请输入每日计划数量"
                :min="1"
                style="width: 100%"
                @change="() => calculateCleaningTonnage(record)"
              />
            </template>
            <template v-else-if="column.key === 'cleaningTonnage'">
              <span>{{ record.cleaningTonnage.toFixed(3) }}</span>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button
                type="link"
                danger
                size="small"
                @click="handleDeleteFixedRow(index)"
              >
                删除
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </a-modal>

    <!-- 计划生成说明弹窗 -->
    <a-modal
      v-model:open="planInfoVisible"
      title="计划生成说明"
      :footer="null"
    >
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="固定清单">每日凌晨自动生成，基于后台配置的固定件号和数量</a-descriptions-item>
        <a-descriptions-item label="临时新增">计划员手动创建，适用于计划外的特殊情况</a-descriptions-item>
        <a-descriptions-item label="实际数量">对接成品检验台账，检验合格自动累加实际细清数量</a-descriptions-item>
        <a-descriptions-item label="完成率计算">实际细清数量 / 计划细清数量 × 100%</a-descriptions-item>
      </a-descriptions>
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
  ExportOutlined,
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
  ImportOutlined
} from '@ant-design/icons-vue'

interface FineCleaningScheduleData {
  key: string
  planDate: string
  productSeries: string
  partNo: string
  blankName: string
  specification: string
  materialGrade: string
  planType: 'fixed' | 'temporary'
  planQuantity: number
  actualQuantity: number
  completionRate: number
}

interface AddFormData {
  planDate: Dayjs | null
  productSeries: string
  partNo: string
  blankName: string
  materialGrade: string
  planQuantity: number | null
}

interface FixedConfigItem {
  key: string
  productSeries: string
  partNo: string
  blankName: string
  materialGrade: string
  dailyQuantity: number
  unitWeight: number
  cleaningTonnage: number
}

interface PartOption {
  partNo: string
  blankName: string
  productSeries: string
  materialGrade: string
  unitWeight: number
}

const selectedDate = ref<Dayjs>(dayjs())
const viewType = ref<'daily' | 'weekly'>('daily')
const planType = ref<string>('')
const partNo = ref<string>('')
const loading = ref(false)
const dataSource = ref<FineCleaningScheduleData[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 新增弹窗相关
const addModalVisible = ref(false)
const addFormData = reactive<AddFormData>({
  planDate: null,
  productSeries: '',
  partNo: '',
  blankName: '',
  materialGrade: '',
  planQuantity: null
})

// 计划说明弹窗
const planInfoVisible = ref(false)

// 固定清单配置相关
const fixedConfigVisible = ref(false)
const fixedConfigData = ref<FixedConfigItem[]>([])
const selectedFixedRowKeys = ref<string[]>([])
const partOptions = ref<PartOption[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// 固定清单配置表格列定义
const fixedConfigColumns = [
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
    width: 200
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
    title: '每日计划数量',
    dataIndex: 'dailyQuantity',
    key: 'dailyQuantity',
    width: 150,
    align: 'right'
  },
  {
    title: '细清吨数',
    dataIndex: 'cleaningTonnage',
    key: 'cleaningTonnage',
    width: 120,
    align: 'right'
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right'
  }
]

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
    title: '计划类型',
    dataIndex: 'planType',
    key: 'planType',
    width: 120
  },
  {
    title: '计划细清数量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '实际细清数量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '细清完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 150,
    align: 'right'
  }
]

// 周统计视图列定义
const weeklyColumns = [
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
    title: '计划类型',
    dataIndex: 'planType',
    key: 'planType',
    width: 120
  },
  {
    title: '周计划总量',
    dataIndex: 'planQuantity',
    key: 'planQuantity',
    width: 140,
    align: 'right'
  },
  {
    title: '周实际完成总量',
    dataIndex: 'actualQuantity',
    key: 'actualQuantity',
    width: 160,
    align: 'right'
  },
  {
    title: '周细清完成率',
    dataIndex: 'completionRate',
    key: 'completionRate',
    width: 150,
    align: 'right'
  }
]

const currentColumns = computed(() => {
  return viewType.value === 'daily' ? dailyColumns : weeklyColumns
})

// 统计数据
const totalStats = computed(() => {
  const totalPlan = dataSource.value.reduce((sum, item) => sum + item.planQuantity, 0)
  const totalActual = dataSource.value.reduce((sum, item) => sum + item.actualQuantity, 0)
  const completionRate = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0
  
  return {
    planQuantity: totalPlan,
    actualQuantity: totalActual,
    completionRate
  }
})

// 获取产品系列颜色
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

// 获取行样式
const getRowClassName = (record: FineCleaningScheduleData) => {
  if (record.completionRate >= 100) return 'row-completed'
  if (record.completionRate >= 80) return 'row-good'
  if (record.completionRate >= 60) return 'row-warning'
  return 'row-danger'
}

// 获取周范围
const getWeekRange = () => {
  const start = selectedDate.value.startOf('week')
  const end = selectedDate.value.endOf('week')
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
  selectedDate.value = dayjs()
  viewType.value = 'daily'
  planType.value = ''
  partNo.value = ''
  handleSearch()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  handleSearch()
}

// 新增临时任务
const handleAddTemporary = () => {
  addModalVisible.value = true
  addFormData.planDate = dayjs()
  addFormData.productSeries = ''
  addFormData.partNo = ''
  addFormData.blankName = ''
  addFormData.materialGrade = ''
  addFormData.planQuantity = null
  loadPartOptions()
}

// 新增弹窗：根据产品系列过滤件号选项
const addPartOptions = computed(() => {
  if (!addFormData.productSeries) {
    return []
  }
  return partOptions.value.filter(part => part.productSeries === addFormData.productSeries)
})

// 新增弹窗：产品系列变更时清空件号及相关字段
const handleAddProductSeriesChange = () => {
  addFormData.partNo = ''
  addFormData.blankName = ''
  addFormData.materialGrade = ''
}

// 新增弹窗：选择件号后自动回显毛坯名称和牌号材质
const handleAddPartNoChange = (value: string) => {
  const selectedPart = partOptions.value.find(part => part.partNo === value)
  if (selectedPart) {
    addFormData.blankName = selectedPart.blankName
    addFormData.materialGrade = selectedPart.materialGrade
  } else {
    addFormData.blankName = ''
    addFormData.materialGrade = ''
  }
}

// 新增确认
const handleAddConfirm = () => {
  if (!addFormData.planDate) {
    message.warning('请选择计划日期')
    return
  }
  if (!addFormData.productSeries) {
    message.warning('请选择产品系列')
    return
  }
  if (!addFormData.partNo) {
    message.warning('请输入毛坯件号')
    return
  }
  if (!addFormData.planQuantity || addFormData.planQuantity <= 0) {
    message.warning('请输入有效的计划数量')
    return
  }
  
  message.success('临时细清任务创建成功')
  addModalVisible.value = false
  handleSearch()
}

// 新增取消
const handleAddCancel = () => {
  addModalVisible.value = false
}

// 导出
const handleExport = () => {
  message.success('导出成功')
}

// 固定清单配置相关函数
const handleOpenFixedConfig = () => {
  fixedConfigVisible.value = true
  loadFixedConfig()
  loadPartOptions()
}

const loadFixedConfig = () => {
  // 模拟加载固定清单配置
  fixedConfigData.value = [
    {
      key: '1',
      productSeries: 'A系列',
      partNo: 'FC-0001',
      blankName: '细清件-1',
      materialGrade: 'QT450-10',
      dailyQuantity: 20,
      unitWeight: 12.5,
      cleaningTonnage: 0.25
    },
    {
      key: '2',
      productSeries: 'B系列',
      partNo: 'FC-0002',
      blankName: '细清件-2',
      materialGrade: 'HT250',
      dailyQuantity: 15,
      unitWeight: 8.3,
      cleaningTonnage: 0.1245
    }
  ]
  
  // 计算初始吨数
  fixedConfigData.value.forEach(item => {
    calculateCleaningTonnage(item)
  })
}

const loadPartOptions = () => {
  // 模拟加载件号选项
  partOptions.value = [
    {
      partNo: 'FC-0001',
      blankName: '细清件-1',
      productSeries: 'A系列',
      materialGrade: 'QT450-10',
      unitWeight: 12.5
    },
    {
      partNo: 'FC-0002',
      blankName: '细清件-2',
      productSeries: 'B系列',
      materialGrade: 'HT250',
      unitWeight: 8.3
    },
    {
      partNo: 'FC-0003',
      blankName: '细清件-3',
      productSeries: 'C系列',
      materialGrade: 'QT500-7',
      unitWeight: 15.7
    },
    {
      partNo: 'FC-0004',
      blankName: '细清件-4',
      productSeries: 'A系列',
      materialGrade: 'HT300',
      unitWeight: 10.2
    },
    {
      partNo: 'FC-0005',
      blankName: '细清件-5',
      productSeries: 'B系列',
      materialGrade: 'QT450-10',
      unitWeight: 9.8
    },
    {
      partNo: 'FC-0006',
      blankName: '细清件-6',
      productSeries: 'C系列',
      materialGrade: 'HT250',
      unitWeight: 11.4
    }
  ]
}

const handleAddFixedRow = () => {
  const newKey = String(fixedConfigData.value.length + 1)
  fixedConfigData.value.push({
    key: newKey,
    productSeries: '',
    partNo: '',
    blankName: '',
    materialGrade: '',
    dailyQuantity: 0,
    unitWeight: 0,
    cleaningTonnage: 0
  })
}

const handleDeleteFixedRow = (index: number) => {
  fixedConfigData.value.splice(index, 1)
}

const handleBatchDeleteFixed = () => {
  if (selectedFixedRowKeys.value.length === 0) {
    message.warning('请选择要删除的行')
    return
  }
  
  fixedConfigData.value = fixedConfigData.value.filter(
    item => !selectedFixedRowKeys.value.includes(item.key)
  )
  selectedFixedRowKeys.value = []
  message.success('批量删除成功')
}

const handleRefreshFixedConfig = () => {
  loadFixedConfig()
  message.success('刷新成功')
}

// 导入固定清单配置
const handleImportFixedConfig = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      if (jsonData.length === 0) {
        message.warning('导入文件无有效数据')
        return
      }

      // 列名映射（支持中文列名）
      const importedData: FixedConfigItem[] = jsonData.map((row, index) => ({
        key: `imported_${Date.now()}_${index}`,
        productSeries: row['产品系列'] || row['productSeries'] || '',
        partNo: String(row['毛坯件号'] || row['partNo'] || ''),
        blankName: row['毛坯名称'] || row['blankName'] || '',
        materialGrade: row['牌号材质'] || row['materialGrade'] || '',
        dailyQuantity: Number(row['每日计划数量'] || row['dailyQuantity']) || 0,
        unitWeight: Number(row['单重'] || row['unitWeight']) || 0,
        cleaningTonnage: 0
      }))

      // 计算吨数
      importedData.forEach(item => calculateCleaningTonnage(item))

      // 追加到现有数据（去重：相同件号覆盖）
      const existingPartNos = new Set(fixedConfigData.value.map(item => item.partNo))
      const newItems = importedData.filter(item => !existingPartNos.has(item.partNo))
      const updatedItems = importedData.filter(item => existingPartNos.has(item.partNo))

      if (updatedItems.length > 0) {
        // 覆盖已存在的件号
        updatedItems.forEach(imported => {
          const idx = fixedConfigData.value.findIndex(item => item.partNo === imported.partNo)
          if (idx >= 0) {
            fixedConfigData.value[idx] = imported
          }
        })
      }

      fixedConfigData.value.push(...newItems)
      message.success(`导入成功：新增 ${newItems.length} 条，更新 ${updatedItems.length} 条`)
    } catch (err) {
      message.error('文件解析失败，请检查文件格式')
      console.error(err)
    }
  }
  reader.readAsArrayBuffer(file)

  // 重置 input 以便重复选择同一文件
  input.value = ''
}

const onFixedRowSelectionChange = (selectedKeys: string[]) => {
  selectedFixedRowKeys.value = selectedKeys
}

const handlePartNoChange = (value: string, record: FixedConfigItem) => {
  const selectedPart = partOptions.value.find(part => part.partNo === value)
  if (selectedPart) {
    record.blankName = selectedPart.blankName
    record.materialGrade = selectedPart.materialGrade
    record.unitWeight = selectedPart.unitWeight
    calculateCleaningTonnage(record)
  }
}

const handleProductSeriesChange = (value: string, record: FixedConfigItem) => {
  // 清空件号相关信息
  record.partNo = ''
  record.blankName = ''
  record.materialGrade = ''
  record.unitWeight = 0
  record.cleaningTonnage = 0
}

const filteredPartOptions = (productSeries: string) => {
  if (!productSeries) {
    return []
  }
  return partOptions.value.filter(part => part.productSeries === productSeries)
}

const calculateCleaningTonnage = (record: FixedConfigItem) => {
  if (record.dailyQuantity > 0 && record.unitWeight > 0) {
    // 细清吨数 = 数量 × 单重 / 1000 (转换为吨)
    record.cleaningTonnage = (record.dailyQuantity * record.unitWeight) / 1000
  } else {
    record.cleaningTonnage = 0
  }
}

const filterOption = (input: string, option: any) => {
  return option.value.toLowerCase().includes(input.toLowerCase())
}

const handleFixedConfigSave = () => {
  // 非空校验
  for (let i = 0; i < fixedConfigData.value.length; i++) {
    const item = fixedConfigData.value[i]
    if (!item.productSeries) {
      message.warning(`第 ${i + 1} 行产品系列不能为空`)
      return
    }
    if (!item.partNo) {
      message.warning(`第 ${i + 1} 行件号不能为空`)
      return
    }
    if (!item.dailyQuantity || item.dailyQuantity <= 0) {
      message.warning(`第 ${i + 1} 行每日计划数量必须大于0`)
      return
    }
  }

  // 全局唯一校验
  const partNoSet = new Set<string>()
  for (let i = 0; i < fixedConfigData.value.length; i++) {
    const item = fixedConfigData.value[i]
    if (partNoSet.has(item.partNo)) {
      message.warning(`件号 ${item.partNo} 已存在固定细清配置，无需重复添加`)
      return
    }
    partNoSet.add(item.partNo)
  }

  // 保存逻辑（覆盖式保存）
  message.success('固定清单配置保存成功，次日凌晨自动生效')
  fixedConfigVisible.value = false
  handleSearch()
}

const handleFixedConfigCancel = () => {
  fixedConfigVisible.value = false
}

// 生成模拟数据
const generateMockData = () => {
  const mockData: FineCleaningScheduleData[] = []
  const seriesList = ['A系列', 'B系列', 'C系列']
  const materialList = ['QT450-10', 'HT250', 'QT500-7', 'HT300']
  const specificationList = ['φ200×300', 'φ150×250', 'φ180×280', 'φ220×350']
  const planTypeList = ['fixed', 'temporary']
  
  if (viewType.value === 'daily') {
    // 日明细数据
    for (let i = 1; i <= 20; i++) {
      const planQuantity = Math.floor(Math.random() * 30) + 10
      const actualQuantity = Math.floor(Math.random() * planQuantity)
      const type = planType.value || planTypeList[Math.floor(Math.random() * planTypeList.length)]
      
      mockData.push({
        key: String(i),
        planDate: selectedDate.value.format('YYYY-MM-DD'),
        productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
        partNo: `FC-${String(i).padStart(4, '0')}`,
        blankName: `细清件-${i}`,
        specification: specificationList[Math.floor(Math.random() * specificationList.length)],
        materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
        planType: type as 'fixed' | 'temporary',
        planQuantity: planQuantity,
        actualQuantity: actualQuantity,
        completionRate: planQuantity > 0 ? (actualQuantity / planQuantity) * 100 : 0
      })
    }
  } else {
    // 周统计数据
    for (let i = 1; i <= 15; i++) {
      const planQuantity = Math.floor(Math.random() * 180) + 60
      const actualQuantity = Math.floor(Math.random() * planQuantity)
      const type = planType.value || planTypeList[Math.floor(Math.random() * planTypeList.length)]
      
      mockData.push({
        key: String(i),
        planDate: selectedDate.value.format('YYYY-MM-DD'),
        productSeries: seriesList[Math.floor(Math.random() * seriesList.length)],
        partNo: `FC-${String(i).padStart(4, '0')}`,
        blankName: `细清件-${i}`,
        specification: specificationList[Math.floor(Math.random() * specificationList.length)],
        materialGrade: materialList[Math.floor(Math.random() * materialList.length)],
        planType: type as 'fixed' | 'temporary',
        planQuantity: planQuantity,
        actualQuantity: actualQuantity,
        completionRate: planQuantity > 0 ? (actualQuantity / planQuantity) * 100 : 0
      })
    }
  }
  
  dataSource.value = mockData
  pagination.total = mockData.length
}

// 初始化
onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.fine-cleaning-schedule {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 固定清单配置弹窗样式 */
.config-actions {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.config-table-container {
  margin-top: 16px;
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
