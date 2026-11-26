<template>
  <div class="external-scrap-report">
    <!-- 筛选操作区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row align="middle" justify="space-between">
        <a-col>
          <a-form layout="inline" :model="searchForm">
            <a-form-item label="年度范围">
              <a-space :size="8">
                <a-select
                  v-model:value="searchForm.yearFrom"
                  placeholder="开始年份"
                  style="width: 140px"
                >
                  <a-select-option v-for="y in yearOptions" :key="y" :value="y">
                    {{ y }}年
                  </a-select-option>
                </a-select>
                <span>至</span>
                <a-select
                  v-model:value="searchForm.yearTo"
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

    <!-- 报表卡片：操作按钮在表格上方 -->
    <a-card :bordered="false" class="report-card">
      <div class="table-toolbar">
        <a-space :size="8" class="table-actions">
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
        <span class="table-unit">单位：%</span>
      </div>
      <a-table
        :columns="columns"
        :data-source="tableData"
        :pagination="false"
        row-key="key"
        :scroll="{ x: 1400 }"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key.startsWith('c')">
            <span :class="{ 'zero-value': !record[column.key] }">
              {{ formatRate(record[column.key]) }}
            </span>
          </template>
          <template v-else-if="column.key === 'avg'">
            <strong>{{ formatRate(record.avg) }}</strong>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      title="内部废品率导入 - 每月内部废品率"
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
        <a-form-item label="统计维度">
          <a-tag color="blue">每月内部废品率</a-tag>
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
          <div class="upload-tip">
            仅支持 .xlsx、.xls；导入后覆盖年度范围内的各月数据
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'
import * as XLSX from 'xlsx'

// ========== 常量 ==========
const unit = '%'
const monthLabels = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

const yearOptions = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => String(y - 4 + i))
})()

// ========== 查询表单 ==========
const searchForm = reactive({
  yearFrom: yearOptions[0],
  yearTo: yearOptions[yearOptions.length - 1]
})

const activeYears = computed(() => {
  const from = yearOptions.indexOf(searchForm.yearFrom)
  const to = yearOptions.indexOf(searchForm.yearTo)
  const [a, b] = from >= 0 && to >= 0 && from <= to ? [from, to] : [0, yearOptions.length - 1]
  return yearOptions.slice(a, b + 1)
})

const handleSearch = () => {
  // 年度范围变化后由 computed 自动刷新表格
}

const handleReset = () => {
  searchForm.yearFrom = yearOptions[0]
  searchForm.yearTo = yearOptions[yearOptions.length - 1]
  handleSearch()
}

/**
 * 数据来源：Excel 导入后写入本地。
 * monthly[year][monthIndex] = 内部废品率(%)
 */
const STORAGE_KEY = 'mes_screen_data_internal_scrap_rate'

interface ScrapStore {
  monthly: Record<string, number[]>
}

function defaultStore(): ScrapStore {
  return {
    monthly: {
      2022: [1.42, 1.38, 1.45, 1.31, 1.29, 1.36, 1.4, 1.33, 1.28, 1.3, 1.34, 1.27],
      2023: [1.35, 1.3, 1.28, 1.32, 1.26, 1.24, 1.29, 1.25, 1.22, 1.27, 1.3, 1.24],
      2024: [1.28, 1.25, 1.22, 1.2, 1.19, 1.24, 1.26, 1.21, 1.18, 1.2, 1.23, 1.17],
      2025: [1.22, 1.19, 1.18, 1.15, 1.14, 1.17, 1.2, 1.16, 1.13, 1.15, 1.18, 1.12],
      2026: [1.18, 1.16, 1.15, 1.12, 1.1, 1.14, 1.16, 1.13, 1.11, 1.12, 1.15, 1.09]
    }
  }
}

function loadStore(): ScrapStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ScrapStore
      if (parsed && parsed.monthly) return { monthly: parsed.monthly }
    }
  } catch {
    // ignore
  }
  return defaultStore()
}

const store = reactive<ScrapStore>(loadStore())

function persistStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ monthly: store.monthly }))
}

// ========== 表格 ==========
const columns = computed(() => [
  { title: '序号', key: 'index', dataIndex: 'index', width: 70, align: 'center' },
  { title: '年份', key: 'name', dataIndex: 'name', width: 100, fixed: 'left' },
  ...monthLabels.map((label, i) => ({
    title: label,
    key: `c${i + 1}`,
    dataIndex: `c${i + 1}`,
    width: 90,
    align: 'center'
  })),
  { title: '年平均', key: 'avg', dataIndex: 'avg', width: 110, align: 'center' }
])

const tableData = computed(() => {
  return activeYears.value.map((y, idx) => {
    const values = store.monthly[y] ?? monthLabels.map(() => 0)
    const row: Record<string, any> = {
      key: y,
      index: idx + 1,
      name: `${y}年`,
      avg:
        values.length > 0
          ? Math.round(
              (values.reduce((s, v) => s + (v || 0), 0) / values.length) * 100
            ) / 100
          : 0
    }
    values.forEach((v, i) => {
      row[`c${i + 1}`] = v ?? 0
    })
    return row
  })
})

const formatRate = (v: number | undefined) => {
  if (v === undefined || v === null || v === 0) return '-'
  return Number(v).toFixed(2)
}

// ========== 导入 ==========
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

const importTip = computed(
  () =>
    `导入每月内部废品率，覆盖 ${activeYears.value[0]}年~${activeYears.value[activeYears.value.length - 1]}年 各月数据。列格式：年份、${monthLabels.join('、')}（${unit}）。`
)

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

const parseYear = (row: any): string => {
  return String(row['年份'] || row['年度'] || row['year'] || '')
    .replace(/年$/, '')
    .trim()
}

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

      persistStore()
      message.success(`导入成功，共处理 ${rows.length} 行`)
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
  const years = activeYears.value
  const header = ['年份', ...monthLabels]
  const body = years.map(y => {
    const values = store.monthly[y] ?? monthLabels.map(() => 0)
    return [`${y}年`, ...values]
  })
  return { header, body }
}

const handleDownloadTemplate = () => {
  const { header, body } = buildSheetRows()
  const emptyBody = body.map(row => row.map((cell, i) => (i === 0 ? cell : '')))
  const ws = XLSX.utils.aoa_to_sheet([header, ...emptyBody])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '每月内部废品率')
  XLSX.writeFile(wb, '内部废品率_每月内部废品率_导入模板.xlsx')
  message.success('模板下载成功')
}

const handleExport = () => {
  const { header, body } = buildSheetRows()
  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '每月内部废品率')
  XLSX.writeFile(
    wb,
    `内部废品率_每月内部废品率_${new Date().toISOString().slice(0, 10)}.xlsx`
  )
  message.success('导出成功')
}
</script>

<style scoped>
.external-scrap-report {
  /* 依赖 style.css 公共 filter-card / report-card / report-title */
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.table-actions {
  flex-shrink: 0;
}

.table-unit {
  flex-shrink: 0;
  font-size: 13px;
  color: #666;
  margin-left: auto;
}

.zero-value {
  color: #bfbfbf;
}
</style>
