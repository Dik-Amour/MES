<template>
  <div class="equipment-data-import">
    <!-- 指标与维度筛选 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="数据指标">
          <a-radio-group v-model:value="metricType" button-style="solid">
            <a-radio-button value="repair">吨均设备维修费用分析</a-radio-button>
            <a-radio-button value="spare">备件库存金额</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="单位">
          <a-tag color="blue">{{ currentUnit }}</a-tag>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 数据明细 -->
    <a-card :bordered="false" class="table-card">
      <a-tabs v-model:activeKey="dimKey">
        <a-tab-pane key="factory-year" tab="分厂年度趋势" />
        <a-tab-pane key="factory-month" tab="分厂月度趋势" />
        <a-tab-pane key="line-month" tab="产线月度趋势" />
        <template #rightExtra>
          <a-space :size="12">
            <span class="table-unit">单位：{{ currentUnit }}</span>
            <a-space :size="8">
              <a-button @click="handleDownloadTemplate">
                <DownloadOutlined />
                下载模板
              </a-button>
              <a-button @click="handleExport">
                <ExportOutlined />
                导出
              </a-button>
              <a-button type="primary" @click="handleImport">
                <UploadOutlined />
                导入
              </a-button>
            </a-space>
          </a-space>
        </template>
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :pagination="false"
        row-key="key"
        :scroll="{ x: 1400 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key.startsWith('c')">
            <span :class="{ 'cell-zero': record[column.key] === 0 }">{{ record[column.key] }}</span>
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
        :description="importTip"
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
          <div class="upload-tip">仅支持 .xlsx、.xls 格式文件，导入后将覆盖当前维度的全部数据</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  DownloadOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'
import * as XLSX from 'xlsx'

// ========== 常量 ==========
const yearLabels = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027']
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const lineNames = [
  '熔炼一线', '熔炼二线', '熔炼三线',
  '造型一线大件', '造型一线中件',
  '造型二线大件', '造型二线中件',
  '造型三线HWS', '造型三线KW'
]

// 分厂维度（安丘厂区 / 寒亭厂区）
const factoryNames = ['安丘厂区', '寒亭厂区']

// 吨均设备维修费用（元/吨）各产线基准值
const repairLineBases = [140, 125, 158, 110, 96, 132, 105, 168, 148]
// 备件库存金额（万元）各产线基准值
const spareLineBases = [105, 82, 138, 74, 96, 118, 132, 88, 110]

// 按基准值生成产线月度数据（与设备大屏算法一致）
const buildLineMonth = (bases: number[], ampRatio: number) => {
  const out: Record<string, number[]> = {}
  lineNames.forEach((name, i) => {
    const base = bases[i]
    const amp = base * ampRatio
    const phase = i * 0.8
    out[name] = monthLabels.map((_, m) =>
      Math.max(0, Math.round(base + Math.sin(phase + m * 0.9) * amp + (m % 3 === 0 ? amp * 0.3 : 0)))
    )
  })
  return out
}

// ========== 状态 ==========
type MetricKey = 'repair' | 'spare'
type DimKey = 'factory-year' | 'factory-month' | 'line-month'

const metricType = ref<MetricKey>('repair')
const dimKey = ref<DimKey>('factory-year')

// 数据存储：指标 → 维度 → 数据
// 分厂维度为「厂区 → 数值数组」，产线维度为「产线 → 12个月数值数组」
const dataStore = reactive({
  repair: {
    'factory-year': {
      '安丘厂区': [102, 140, 230, 101, 110, 129, 160, 222],
      '寒亭厂区': [88, 126, 205, 118, 132, 108, 145, 196]
    },
    'factory-month': {
      '安丘厂区': [120, 135, 118, 142, 128, 155, 138, 126, 148, 132, 158, 144],
      '寒亭厂区': [105, 122, 140, 118, 146, 128, 152, 138, 120, 145, 136, 130]
    },
    'line-month': buildLineMonth(repairLineBases, 0.16)
  } as Record<DimKey, any>,
  spare: {
    'factory-year': {
      '安丘厂区': [820, 910, 1060, 880, 940, 1020, 1180, 1090],
      '寒亭厂区': [640, 720, 860, 790, 830, 880, 960, 900]
    },
    'factory-month': {
      '安丘厂区': [95, 102, 88, 115, 108, 126, 98, 112, 132, 105, 121, 118],
      '寒亭厂区': [68, 75, 82, 71, 88, 79, 92, 84, 74, 90, 81, 86]
    },
    'line-month': buildLineMonth(spareLineBases, 0.16)
  } as Record<DimKey, any>
})

const currentUnit = computed(() => (metricType.value === 'repair' ? '元/吨' : '万元'))
const currentMetricLabel = computed(() =>
  metricType.value === 'repair' ? '吨均设备维修费用分析' : '备件库存金额'
)

// ========== 表格 ==========
const columns = computed(() => {
  const labels = dimKey.value === 'factory-year' ? yearLabels : monthLabels
  const firstName = dimKey.value === 'line-month' ? '产线' : '厂区'
  return [
    { title: '序号', key: 'index', dataIndex: 'index', width: 70, align: 'center' },
    { title: firstName, key: 'name', dataIndex: 'name', width: 150, fixed: 'left' },
    ...labels.map((label, i) => ({
      title: label,
      key: `c${i + 1}`,
      dataIndex: `c${i + 1}`,
      width: 90,
      align: 'center'
    }))
  ]
})

// 行维度：分厂 → 厂区，产线月度 → 产线
const rowNames = computed(() =>
  dimKey.value === 'line-month' ? lineNames : factoryNames
)

const tableData = computed(() => {
  const labels = dimKey.value === 'factory-year' ? yearLabels : monthLabels
  const map = dataStore[metricType.value][dimKey.value] as Record<string, number[]>
  return rowNames.value.map((name, idx) => {
    const row: Record<string, any> = { key: name, index: idx + 1, name }
    labels.forEach((_, i) => {
      row[`c${i + 1}`] = map[name]?.[i] ?? 0
    })
    return row
  })
})

// ========== 导入 ==========
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

const importTip = computed(() => {
  const labels = dimKey.value === 'factory-year' ? '年份（2020~2027）' : '月份（1月~12月）'
  if (dimKey.value === 'line-month') {
    return `导入文件将覆盖【${currentMetricLabel.value} - 产线月度趋势】的全部数据，请先下载模板按格式填写！列格式：产线、1月 ~ 12月。`
  }
  return `导入文件将覆盖【${currentMetricLabel.value} - ${dimKey.value === 'factory-year' ? '分厂年度趋势' : '分厂月度趋势'}】的全部数据，请先下载模板按格式填写！列格式：厂区、${labels}（数值单位：${currentUnit.value}）。`
})

const handleImport = () => {
  fileList.value = []
  importModalVisible.value = true
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

const handleImportConfirm = () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要导入的文件')
    return
  }
  const file = fileList.value[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target?.result, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      if (rows.length === 0) {
        message.warning('导入文件无有效数据')
        return
      }

      if (dimKey.value === 'line-month') {
        const next: Record<string, number[]> = {}
        lineNames.forEach(name => (next[name] = monthLabels.map(() => 0)))
        rows.forEach(row => {
          const lineName = String(row['产线'] || row['产线名称'] || '').trim()
          if (!next[lineName]) return
          next[lineName] = monthLabels.map(m => Number(row[m]) || 0)
        })
        dataStore[metricType.value]['line-month'] = next
      } else {
        const labels = dimKey.value === 'factory-year' ? yearLabels : monthLabels
        const next: Record<string, number[]> = {}
        factoryNames.forEach(f => (next[f] = labels.map(() => 0)))
        rows.forEach(row => {
          const factoryName = String(row['厂区'] || row['厂区名称'] || '').trim()
          if (!next[factoryName]) return
          next[factoryName] = labels.map(label => Number(row[label]) || 0)
        })
        dataStore[metricType.value][dimKey.value] = next
      }

      message.success(`导入成功，共处理 ${rows.length} 行数据`)
      importModalVisible.value = false
      fileList.value = []
    } catch (err) {
      message.error('文件解析失败，请检查文件格式是否正确')
    }
  }
  reader.readAsArrayBuffer(file)
}

// ========== 模板下载 / 导出 ==========
const buildSheetRows = () => {
  const labels = dimKey.value === 'factory-year' ? yearLabels : monthLabels
  const firstName = dimKey.value === 'line-month' ? '产线' : '厂区'
  const names = dimKey.value === 'line-month' ? lineNames : factoryNames
  const map = dataStore[metricType.value][dimKey.value] as Record<string, number[]>
  const header = [firstName, ...labels]
  const body = names.map(name => [name, ...(map[name] || labels.map(() => 0))])
  return { header, body }
}

const dimLabel = computed(() => {
  if (dimKey.value === 'factory-year') return '分厂年度趋势'
  if (dimKey.value === 'factory-month') return '分厂月度趋势'
  return '产线月度趋势'
})

const handleDownloadTemplate = () => {
  const { header, body } = buildSheetRows()
  const emptyBody = body.map(row => row.map((cell, i) => (i === 0 ? cell : '')))
  const ws = XLSX.utils.aoa_to_sheet([header, ...emptyBody])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dimLabel.value.slice(0, 20))
  XLSX.writeFile(wb, `${currentMetricLabel.value}_${dimLabel.value}_导入模板.xlsx`)
  message.success('模板下载成功')
}

const handleExport = () => {
  const { header, body } = buildSheetRows()
  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dimLabel.value.slice(0, 20))
  XLSX.writeFile(wb, `${currentMetricLabel.value}_${dimLabel.value}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  message.success('导出成功')
}
</script>

<style scoped>
.equipment-data-import {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  margin-bottom: 0;
}

.filter-card :deep(.ant-form-item) {
  margin-bottom: 0;
}


.cell-value {
  font-weight: 600;
  color: #1a1a1a;
}

.cell-zero {
  color: #bfbfbf;
}

.table-unit {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>
