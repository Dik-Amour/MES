<template>
  <div class="spare-part-data-import">
    <!-- 搜索栏：仅年度范围 -->
    <a-card :bordered="false" class="filter-card">
      <a-row align="middle" justify="space-between">
        <a-col>
          <a-form layout="inline">
            <a-form-item label="年度范围">
              <a-space :size="8">
                <a-select
                  v-model:value="yearFrom"
                  placeholder="开始年份"
                  style="width: 140px"
                >
                  <a-select-option v-for="y in yearOptions" :key="y" :value="y">
                    {{ y }}年
                  </a-select-option>
                </a-select>
                <span>至</span>
                <a-select
                  v-model:value="yearTo"
                  placeholder="结束年份"
                  style="width: 140px"
                >
                  <a-select-option v-for="y in yearOptions" :key="y" :value="y">
                    {{ y }}年
                  </a-select-option>
                </a-select>
              </a-space>
            </a-form-item>
          </a-form>
        </a-col>
        <a-col>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              搜索
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据明细：厂区 / 产线 -->
    <a-card :bordered="false" class="table-card">
      <div class="table-toolbar">
        <a-tabs v-model:activeKey="dimKey" class="inline-tabs">
          <a-tab-pane key="month" tab="厂区" />
          <a-tab-pane key="line-month" tab="产线" />
        </a-tabs>
        <a-space :size="12">
          <span class="table-unit">单位：{{ unit }}</span>
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
      </div>

      <!-- 厂区：年份 × 1~12月 + 年汇总 -->
      <a-table
        v-if="dimKey === 'month'"
        :columns="monthColumns"
        :data-source="monthTableData"
        :pagination="false"
        row-key="key"
        :scroll="{ x: 1400 }"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key.startsWith('c')">
            <span :class="{ 'cell-zero': !record[column.key] }">{{ formatValue(record[column.key]) }}</span>
          </template>
          <template v-else-if="column.key === 'sum'">
            <strong>{{ formatValue(record.sum) }}</strong>
          </template>
        </template>
      </a-table>

      <!-- 产线：产线 × 1~12月 + 年汇总 -->
      <a-table
        v-else
        :columns="lineColumns"
        :data-source="lineTableData"
        :pagination="false"
        row-key="key"
        :scroll="{ x: 1400 }"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key.startsWith('c')">
            <span :class="{ 'cell-zero': !record[column.key] }">{{ formatValue(record[column.key]) }}</span>
          </template>
          <template v-else-if="column.key === 'sum'">
            <strong>{{ formatValue(record.sum) }}</strong>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      :title="`${metricLabel} - Excel批量导入`"
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
  ExportOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'
import * as XLSX from 'xlsx'

// ========== 常量：与设备大屏「备件库存金额」一致 ==========
const unit = '万元'
const metricLabel = '备件库存金额'

const monthLabels = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]
const lineNames = [
  '熔炼一线', '熔炼二线', '熔炼三线',
  '造型一线大件', '造型一线中件',
  '造型二线大件', '造型二线中件',
  '造型三线HWS', '造型三线KW'
]
// 各产线基准库存金额（万元），与大屏算法一致
const spareLineBases = [105, 82, 138, 74, 96, 118, 132, 88, 110]

const yearOptions = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => String(y - 4 + i))
})()

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

// ========== 查询 ==========
const yearFrom = ref(yearOptions[0])
const yearTo = ref(yearOptions[yearOptions.length - 1])

const activeYears = computed(() => {
  const from = yearOptions.indexOf(yearFrom.value)
  const to = yearOptions.indexOf(yearTo.value)
  const [a, b] = from >= 0 && to >= 0 && from <= to ? [from, to] : [0, yearOptions.length - 1]
  return yearOptions.slice(a, b + 1)
})

const handleSearch = () => {
  // 年度范围变化后由 computed activeYears 自动刷新表格
}

const handleReset = () => {
  yearFrom.value = yearOptions[0]
  yearTo.value = yearOptions[yearOptions.length - 1]
  handleSearch()
}

// ========== 数据存储（无厂区：组织由全局切换） ==========
type DimKey = 'month' | 'line-month'
const dimKey = ref<DimKey>('month')

/**
 * monthly[year][monthIndex] = 备件库存金额(万元)
 * lineMonthly[产线][monthIndex] = 备件库存金额(万元)
 */
const store = reactive({
  monthly: {
    2022: [95, 102, 88, 115, 108, 126, 98, 112, 132, 105, 121, 118],
    2023: [68, 75, 82, 71, 88, 79, 92, 84, 74, 90, 81, 86],
    2024: [72, 80, 86, 78, 92, 84, 96, 88, 79, 94, 85, 90],
    2025: [78, 85, 90, 82, 96, 88, 100, 92, 84, 98, 90, 95],
    2026: [82, 88, 94, 86, 100, 92, 104, 96, 88, 102, 94, 98]
  } as Record<string, number[]>,
  lineMonthly: buildLineMonth(spareLineBases, 0.16)
} as {
  monthly: Record<string, number[]>
  lineMonthly: Record<string, number[]>
})

const dimLabel = computed(() =>
  dimKey.value === 'month' ? '厂区' : '产线'
)

// ========== 表格 ==========
const sumRow = (values: number[]) =>
  values.reduce((s, v) => s + (v || 0), 0)

const monthColumns = computed(() => [
  { title: '序号', key: 'index', dataIndex: 'index', width: 70, align: 'center' },
  { title: '年份', key: 'name', dataIndex: 'name', width: 100, fixed: 'left' },
  ...monthLabels.map((label, i) => ({
    title: label,
    key: `c${i + 1}`,
    dataIndex: `c${i + 1}`,
    width: 90,
    align: 'center'
  })),
  { title: '年汇总', key: 'sum', dataIndex: 'sum', width: 110, align: 'center' }
])

const lineColumns = computed(() => [
  { title: '序号', key: 'index', dataIndex: 'index', width: 70, align: 'center' },
  { title: '产线', key: 'name', dataIndex: 'name', width: 150, fixed: 'left' },
  ...monthLabels.map((label, i) => ({
    title: label,
    key: `c${i + 1}`,
    dataIndex: `c${i + 1}`,
    width: 90,
    align: 'center'
  })),
  { title: '年汇总', key: 'sum', dataIndex: 'sum', width: 110, align: 'center' }
])

const monthTableData = computed(() => {
  return activeYears.value.map((y, idx) => {
    const values = store.monthly[y] ?? monthLabels.map(() => 0)
    const row: Record<string, any> = {
      key: y,
      index: idx + 1,
      name: `${y}年`,
      sum: sumRow(values)
    }
    values.forEach((v, i) => {
      row[`c${i + 1}`] = v ?? 0
    })
    return row
  })
})

const lineTableData = computed(() => {
  return lineNames.map((name, idx) => {
    const values = store.lineMonthly[name] ?? monthLabels.map(() => 0)
    const row: Record<string, any> = {
      key: name,
      index: idx + 1,
      name,
      sum: sumRow(values)
    }
    values.forEach((v, i) => {
      row[`c${i + 1}`] = v ?? 0
    })
    return row
  })
})

const formatValue = (v: number | undefined) => {
  if (v === undefined || v === null || v === 0) return '-'
  return v
}

// ========== 导入 ==========
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

const importTip = computed(() => {
  if (dimKey.value === 'month') {
    return `导入将覆盖【${metricLabel} - 厂区】范围 ${activeYears.value[0]}年~${activeYears.value[activeYears.value.length - 1]}年 的各月数据。列格式：年份、${monthLabels.join('、')}（${unit}）。`
  }
  return `导入将覆盖【${metricLabel} - 产线】全部产线数据。列格式：产线、${monthLabels.join('、')}（${unit}）。`
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

const parseYear = (row: any): string =>
  String(row['年份'] || row['年度'] || row['year'] || '')
    .replace(/年$/, '')
    .trim()

const handleImportConfirm = () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要导入的文件')
    return
  }
  const file = fileList.value[0]
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const workbook = XLSX.read(e.target?.result, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      if (rows.length === 0) {
        message.warning('导入文件无有效数据')
        return
      }

      if (dimKey.value === 'month') {
        const years = activeYears.value
        years.forEach(y => {
          if (!store.monthly[y]) store.monthly[y] = monthLabels.map(() => 0)
        })
        rows.forEach(row => {
          const year = parseYear(row)
          if (!years.includes(year)) return
          if (!store.monthly[year]) store.monthly[year] = monthLabels.map(() => 0)
          store.monthly[year] = monthLabels.map(
            m => Number(row[m]) || Number(row[m.replace('月', '')]) || 0
          )
        })
      } else {
        const next: Record<string, number[]> = {}
        lineNames.forEach(name => (next[name] = monthLabels.map(() => 0)))
        rows.forEach(row => {
          const lineName = String(row['产线'] || row['产线名称'] || '').trim()
          if (!next[lineName]) return
          next[lineName] = monthLabels.map(m => Number(row[m]) || Number(row[m.replace('月', '')]) || 0)
        })
        store.lineMonthly = next
      }

      message.success(`导入成功，共处理 ${rows.length} 行数据`)
      importModalVisible.value = false
      fileList.value = []
    } catch {
      message.error('文件解析失败，请检查文件格式是否正确')
    }
  }
  reader.readAsArrayBuffer(file)
}

// ========== 模板下载 / 导出 ==========
const buildSheetRows = () => {
  const header = ['年份', ...monthLabels]
  if (dimKey.value === 'month') {
    const body = activeYears.value.map(y => {
      const values = store.monthly[y] ?? monthLabels.map(() => 0)
      return [`${y}年`, ...values]
    })
    return { header, body }
  }
  const lineHeader = ['产线', ...monthLabels]
  const lineBody = lineNames.map(name => {
    const values = store.lineMonthly[name] ?? monthLabels.map(() => 0)
    return [name, ...values]
  })
  return { header: lineHeader, body: lineBody }
}

const handleDownloadTemplate = () => {
  const { header, body } = buildSheetRows()
  const emptyBody = body.map(row => row.map((cell, i) => (i === 0 ? cell : '')))
  const ws = XLSX.utils.aoa_to_sheet([header, ...emptyBody])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dimLabel.value.slice(0, 20))
  XLSX.writeFile(wb, `${metricLabel}_${dimLabel.value}_导入模板.xlsx`)
  message.success('模板下载成功')
}

const handleExport = () => {
  const { header, body } = buildSheetRows()
  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dimLabel.value.slice(0, 20))
  XLSX.writeFile(
    wb,
    `${metricLabel}_${dimLabel.value}_${new Date().toISOString().slice(0, 10)}.xlsx`
  )
  message.success('导出成功')
}
</script>

<style scoped>
.spare-part-data-import {
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

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.inline-tabs {
  flex: 1;
}

.inline-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.table-unit {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.cell-zero {
  color: #bfbfbf;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>
