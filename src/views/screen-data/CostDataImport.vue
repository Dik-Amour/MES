<template>
  <div class="cost-data-import">
    <!-- 查询条件（与实际项目一致：隶属组织切换，各厂区只维护自己的数据） -->
    <div class="query-card">
      <div class="query-header">
        <span class="query-header-title">查询条件</span>
        <div class="query-header-org">
          <span class="org-label">隶属组织</span>
          <a-select
            v-model:value="currentSite"
            class="org-select"
            :options="siteOptions"
            show-search
            option-filter-prop="label"
          />
        </div>
      </div>
      <div class="query-body">
        <div class="query-row">
          <span class="query-label">年度范围</span>
          <div class="range-box">
            <a-select
              v-model:value="yearFrom"
              class="year-select"
              :options="yearOptions"
            />
            <span class="range-sep">至</span>
            <a-select
              v-model:value="yearTo"
              class="year-select"
              :options="yearOptions"
            />
          </div>
        </div>
        <div class="query-actions">
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
        </div>
      </div>
    </div>

    <!-- 数据明细：仅当前隶属组织的数据 -->
    <a-card :bordered="false" class="table-card">
      <a-tabs v-model:activeKey="dimKey">
        <a-tab-pane key="year" tab="年度成本" />
        <a-tab-pane key="fee" tab="费用构成明细" />
        <template #rightExtra>
          <a-space :size="12">
            <a-select
              v-if="dimKey === 'fee'"
              v-model:value="feeYearSelect"
              style="width: 110px"
              :options="feeYearOptions"
            />
            <span class="table-unit">
              当前组织：{{ currentSite }}　单位：{{ unit }}
            </span>
          </a-space>
        </template>
      </a-tabs>

      <!-- 年度成本：当前厂区 × 年度范围 -->
      <a-table
        v-if="dimKey === 'year'"
        :columns="yearColumns"
        :data-source="yearTableData"
        :pagination="false"
        row-key="key"
        :scroll="{ x: 900 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key.startsWith('c')">
            <span :class="{ 'cell-zero': record[column.key] === 0 }">{{ record[column.key] }}</span>
          </template>
        </template>
      </a-table>

      <!-- 费用构成：当前厂区 + 当前年 -->
      <a-table
        v-else
        :columns="feeColumns"
        :data-source="feeTableData"
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
      :title="`成本数据导入 - ${currentSite}`"
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
        <a-form-item label="隶属组织">
          <a-tag color="blue">{{ currentSite }}</a-tag>
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
          <div class="upload-tip">仅支持 .xlsx、.xls；只覆盖当前隶属组织的数据，不影响其他厂区</div>
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
const unit = '元/吨'

/** 隶属组织（对应实际项目厂区切换）；不含材料成型（其为寒亭+安丘合计，非独立维护主体） */
const siteOptions = [
  { value: '寒亭', label: '寒亭' },
  { value: '安丘厂区', label: '安丘厂区' }
]
/** 内部存储 key */
const siteKeyMap: Record<string, string> = {
  寒亭: '寒亭',
  安丘厂区: '安丘厂区'
}

const yearLabels = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => String(y - 4 + i))
})()

const yearOptions = yearLabels.map(y => ({ value: y, label: `${y}年` }))

type DimKey = 'year' | 'fee'
const dimKey = ref<DimKey>('year')

// ========== 状态：隶属组织 + 年度范围 ==========
const currentSite = ref(siteOptions[0].value)
const yearFrom = ref(yearLabels[0])
const yearTo = ref(yearLabels[yearLabels.length - 1])

/** 内部 key：当前组织对应的成本中心厂区 */
const currentSiteKey = computed(() => siteKeyMap[currentSite.value] ?? currentSite.value)

/**
 * 各厂区独立数据（只维护自己的；材料成型=合计，不在此维护）：
 * siteYearData[厂区][year] = 元/吨
 */
const siteYearData = reactive<Record<string, Record<string, number>>>({
  寒亭: { 2022: 232, 2023: 245, 2024: 238, 2025: 249, 2026: 236 },
  安丘厂区: { 2022: 255, 2023: 261, 2024: 247, 2025: 258, 2026: 244 }
})

/** 费用构成（弹框）：厂区 → 年 → 费用项 → 12月 */
const feeCategories = ['原材料', '辅料', '动能', '废品损失', '设备维修', '工具工装', '外部加工费']
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function genFeeBase(): number[][] {
  return [
    [175, 198, 208, 230, 195, 220, 180, 200, 228, 210, 225, 205],
    [150, 130, 200, 210, 230, 190, 215, 225, 228, 220, 170, 180],
    [145, 100, 125, 100, 140, 105, 135, 120, 105, 115, 160, 145],
    [225, 195, 130, 195, 190, 178, 220, 110, 180, 230, 175, 130],
    [170, 160, 175, 155, 150, 150, 140, 115, 165, 185, 180, 145],
    [198, 140, 170, 175, 130, 220, 180, 110, 165, 230, 185, 228],
    [100, 175, 195, 118, 175, 105, 185, 128, 195, 158, 120, 182]
  ]
}

function buildFeeData(siteKey: string, year: string): Record<string, number[]> {
  const siteIdx = ['寒亭', '安丘厂区'].indexOf(siteKey)
  const seed = Math.max(0, siteIdx) * 3 + (parseInt(year, 10) % 3)
  const base = genFeeBase()
  const out: Record<string, number[]> = {}
  feeCategories.forEach((cat, ci) => {
    out[cat] = base[ci].map((v, i) => Math.round(v + Math.sin(seed + i * 0.7) * 12))
  })
  return out
}

const feeData = reactive<Record<string, Record<string, Record<string, number[]>>>>({})
const ensureFee = (siteKey: string, year: string) => {
  if (!feeData[siteKey]) feeData[siteKey] = {}
  if (!feeData[siteKey][year]) feeData[siteKey][year] = buildFeeData(siteKey, year)
  return feeData[siteKey][year]
}

/** 年度 Tab 用的费用年份：取范围末年 */
const feeYear = computed(() => yearTo.value)
/** 费用 Tab 可选年份：范围内 */
const feeYearOptions = computed(() => {
  const from = yearLabels.indexOf(yearFrom.value)
  const to = yearLabels.indexOf(yearTo.value)
  const [a, b] = from <= to ? [from, to] : [to, from]
  return yearLabels.slice(a, b + 1).map(y => ({ value: y, label: `${y}年` }))
})
const feeYearSelect = ref(yearLabels[yearLabels.length - 1])

// 组织/年份切换时保证费用数据存在
const currentFee = computed(() => ensureFee(currentSiteKey.value, feeYearSelect.value))

/** 当前年份范围（from <= to） */
const activeYears = computed(() => {
  const from = yearLabels.indexOf(yearFrom.value)
  const to = yearLabels.indexOf(yearTo.value)
  const [a, b] = from <= to ? [from, to] : [to, from]
  return yearLabels.slice(a, b + 1)
})

// ========== 表格 ==========
const yearColumns = computed(() => [
  { title: '序号', key: 'index', dataIndex: 'index', width: 70, align: 'center' },
  { title: '隶属组织', key: 'name', dataIndex: 'name', width: 180, fixed: 'left' },
  ...activeYears.value.map((y, i) => ({
    title: `${y}年`,
    key: `c${i + 1}`,
    dataIndex: `c${i + 1}`,
    width: 110,
    align: 'center'
  }))
])

const yearTableData = computed(() => {
  const key = currentSiteKey.value
  const row: Record<string, any> = {
    key,
    index: 1,
    name: currentSite.value
  }
  activeYears.value.forEach((y, i) => {
    row[`c${i + 1}`] = siteYearData[key]?.[y] ?? 0
  })
  return [row]
})

const feeColumns = computed(() => [
  { title: '序号', key: 'index', dataIndex: 'index', width: 70, align: 'center' },
  { title: '费用项', key: 'name', dataIndex: 'name', width: 130, fixed: 'left' },
  ...monthLabels.map((label, i) => ({
    title: label,
    key: `c${i + 1}`,
    dataIndex: `c${i + 1}`,
    width: 90,
    align: 'center'
  }))
])

const feeTableData = computed(() => {
  const fee = currentFee.value
  return feeCategories.map((cat, idx) => {
    const row: Record<string, any> = { key: cat, index: idx + 1, name: cat }
    monthLabels.forEach((_, i) => {
      row[`c${i + 1}`] = fee[cat]?.[i] ?? 0
    })
    return row
  })
})

// ========== 导入 ==========
const importModalVisible = ref(false)
const fileList = ref<any[]>([])

const dimLabel = computed(() => (dimKey.value === 'year' ? '年度成本' : '费用构成明细'))

const importTip = computed(() => {
  if (dimKey.value === 'year') {
    return `仅导入隶属组织【${currentSite.value}】的年度成本，覆盖该组织在 ${activeYears.value[0]}年~${activeYears.value[activeYears.value.length - 1]}年 的数据；不影响其他厂区。列格式：年份、成本（${unit}）。`
  }
  return `仅导入隶属组织【${currentSite.value}】${feeYearSelect.value}年 的费用构成（对应成本中心弹框），不影响其他厂区/年份。列格式：费用项、${monthLabels.join('、')}（${unit}）。`
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
      const siteKey = currentSiteKey.value

      if (dimKey.value === 'year') {
        if (!siteYearData[siteKey]) siteYearData[siteKey] = {}
        rows.forEach(row => {
          const year = String(row['年份'] || row['年度'] || row['year'] || '')
            .replace(/年$/, '')
            .trim()
          if (!yearLabels.includes(year)) return
          // 只写当前范围年份
          if (!activeYears.value.includes(year)) return
          siteYearData[siteKey][year] = Number(row['成本'] ?? row['吨均成本'] ?? row[unit] ?? Object.values(row).find(v => typeof v === 'number') ?? 0) || 0
        })
        // 也支持宽表：一行组织 + 多年列
        if (rows.length === 1) {
          const r = rows[0]
          activeYears.value.forEach(y => {
            const v = Number(r[`${y}年`] ?? r[y])
            if (!Number.isNaN(v) && (r[`${y}年`] !== undefined || r[y] !== undefined)) {
              siteYearData[siteKey][y] = v || 0
            }
          })
        }
      } else {
        const fee = ensureFee(siteKey, feeYearSelect.value)
        const next: Record<string, number[]> = {}
        feeCategories.forEach(cat => (next[cat] = monthLabels.map(() => 0)))
        rows.forEach(row => {
          const cat = String(row['费用项'] || row['项目'] || '').trim()
          if (!next[cat]) return
          next[cat] = monthLabels.map(m => Number(row[m]) || 0)
        })
        feeCategories.forEach(cat => {
          fee[cat] = next[cat]
        })
      }

      message.success(`导入成功（${currentSite.value}），共处理 ${rows.length} 行`)
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
  const siteKey = currentSiteKey.value
  if (dimKey.value === 'year') {
    const header = ['年份', '成本']
    const body = activeYears.value.map(y => [`${y}年`, siteYearData[siteKey]?.[y] ?? 0])
    return { header, body }
  }
  const fee = currentFee.value
  const header = ['费用项', ...monthLabels]
  const body = feeCategories.map(cat => [cat, ...(fee[cat] || monthLabels.map(() => 0))])
  return { header, body }
}

const handleDownloadTemplate = () => {
  const { header, body } = buildSheetRows()
  const emptyBody = body.map(row => row.map((cell, i) => (i === 0 ? cell : '')))
  const ws = XLSX.utils.aoa_to_sheet([header, ...emptyBody])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dimLabel.value.slice(0, 20))
  const org = currentSite.value
  const ySuffix = dimKey.value === 'fee' ? `_${feeYearSelect.value}年` : ''
  XLSX.writeFile(wb, `吨均成本_${org}_${dimLabel.value}${ySuffix}_导入模板.xlsx`)
  message.success('模板下载成功')
}

const handleExport = () => {
  const { header, body } = buildSheetRows()
  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dimLabel.value.slice(0, 20))
  const org = currentSite.value
  const ySuffix = dimKey.value === 'fee' ? `_${feeYearSelect.value}年` : ''
  XLSX.writeFile(wb, `吨均成本_${org}_${dimLabel.value}${ySuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  message.success('导出成功')
}
</script>

<style scoped>
.cost-data-import {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 查询条件：蓝条 + 组织下拉（对齐实际项目） */
.query-card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.query-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 16px;
  background: linear-gradient(90deg, #2b6de5 0%, #3d8bf5 100%);
  color: #fff;
}

.query-header-title {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1px;
}

.query-header-org {
  display: flex;
  align-items: center;
  gap: 10px;
}

.org-label {
  font-weight: 600;
  font-size: 14px;
}

.org-select {
  width: 200px;
}

.query-body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.query-label {
  width: 72px;
  flex-shrink: 0;
  font-weight: 500;
  color: #333;
  text-align: right;
}

.range-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.year-select {
  width: 120px;
}

.range-sep {
  color: #666;
}

.query-actions {
  display: flex;
  gap: 12px;
  padding-left: 88px;
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
