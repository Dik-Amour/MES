<template>
  <div class="wip-summary">
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
        <a-form-item label="日期">
          <a-range-picker
            v-model:value="searchForm.dateRange"
            :allow-clear="true"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            style="width: 260px"
            @change="handleSearch"
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

    <!-- 产线Tab + 汇总数据列表 -->
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
            :scroll="{ x: 2100 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="quantityKeys.includes(column.key)">
                <span :class="{ 'zero-value': record[column.key] === 0 }">
                  {{ formatNumber(record[column.key]) }}
                </span>
              </template>
              <template v-else-if="weightKeys.includes(column.key)">
                <span :class="{ 'zero-value': record[column.key] === 0 }">
                  {{ formatWeight(record[column.key]) }}
                </span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button
                  v-if="activeLine === 'ALL'"
                  type="link"
                  size="small"
                  @click="handleViewAllDetail(record)"
                >
                  明细
                </a-button>
                <a-button v-else type="link" size="small" @click="handleViewDetail(record)">
                  明细
                </a-button>
              </template>
            </template>
            <template #summary>
              <a-table-summary fixed>
                <a-table-summary-row>
                  <template v-for="(col, index) in columns" :key="col.key">
                    <a-table-summary-cell
                      :index="index"
                      :align="quantityKeys.includes(col.key) || weightKeys.includes(col.key) ? 'right' : 'left'"
                    >
                      <template v-if="index === 0">合计</template>
                      <template v-else-if="quantityKeys.includes(col.key)">
                        {{ formatNumber(summaryData[col.key]) }}
                      </template>
                      <template v-else-if="weightKeys.includes(col.key)">
                        {{ formatWeight(summaryData[col.key]) }}
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

    <!-- 汇总明细弹窗 -->
    <a-modal
      v-model:open="detailModalVisible"
      :title="detailTitle"
      :width="1300"
      @cancel="handleDetailClose"
    >
      <a-table
        :columns="detailColumns"
        :data-source="detailDataList"
        :pagination="false"
        :scroll="{ x: 1400 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="detailQuantityKeys.includes(column.key)">
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

    <!-- 总览Tab明细弹窗（各产线汇总） -->
    <a-modal
      v-model:open="allDetailModalVisible"
      :title="allDetailTitle"
      :width="1600"
      @cancel="handleAllDetailClose"
    >
      <a-table
        :columns="allDetailColumns"
        :data-source="allDetailDataList"
        :pagination="false"
        :scroll="{ x: 1600 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="allDetailQuantityKeys.includes(column.key)">
            <span :class="{ 'zero-value': record[column.key] === 0 }">
              {{ formatNumber(record[column.key]) }}
            </span>
          </template>
          <template v-else-if="allDetailWeightKeys.includes(column.key)">
            <span :class="{ 'zero-value': record[column.key] === 0 }">
              {{ formatWeight(record[column.key]) }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleAllDetailRowDetail(record)">
              明细
            </a-button>
          </template>
        </template>
      </a-table>
      <template #footer>
        <a-button type="primary" @click="handleAllDetailClose">关闭</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

dayjs.locale('zh-cn')

interface WipSummaryData {
  key: string
  lineCode: string
  lineName: string
  productSeries: string
  blankPartNo: string
  blankName: string
  cumulativeOutput: number
  qualifiedOutput: number
  cumulativeInbound: number
  qualifiedInbound: number
  cumulativeFineClean: number
  cumulativeInternalScrap: number
  cumulativeExternalScrap: number
  cumulativeBuyBack: number
  cumulativeReinspectionScrap: number
  wipQuantity: number
  finishedQuantity: number
  wipWeightKg: number
  finishedWeightKg: number
  processWipQuantity: number
  processWipWeightKg: number
}

// 汇总明细弹窗数据（按日期）
interface WipSummaryDetail {
  key: string
  date: string
  productSeries: string
  blankPartNo: string
  blankName: string
  outputQuantity: number
  qualifiedOutput: number
  inboundQuantity: number
  qualifiedInbound: number
  fineCleanQuantity: number
  internalScrapQuantity: number
  externalScrapQuantity: number
  buyBackQuantity: number
  reinspectionScrapQuantity: number
}

// 总览Tab明细弹窗数据（各产线汇总）
interface OverviewDetail {
  key: string
  lineCode: string
  lineName: string
  productSeries: string
  blankPartNo: string
  blankName: string
  cumulativeOutput: number
  qualifiedOutput: number
  cumulativeInbound: number
  qualifiedInbound: number
  cumulativeFineClean: number
  cumulativeInternalScrap: number
  cumulativeExternalScrap: number
  cumulativeBuyBack: number
  cumulativeReinspectionScrap: number
  wipQuantity: number
  wipWeightKg: number
  finishedWeightKg: number
  processWipQuantity: number
  processWipWeightKg: number
}

// 产线Tab配置（与在制品明细一致）
const lineOptions = [
  { label: '造型一线大件清理', value: 'LINE-01' },
  { label: '造型三线KW清理', value: 'LINE-02' },
  { label: '造型三线HWS清理', value: 'LINE-03' },
  { label: '总览', value: 'ALL' }
]

// 系列名称选项
const seriesOptions = ['WP12', 'WP13']

// 毛坯基础数据（件号-名称-系列-单件重量kg）
interface BlankPart {
  partNo: string
  name: string
  series: string
  unitWeightKg: number
}

const blankPartOptions: BlankPart[] = [
  { partNo: '1003449788R', name: '气缸体毛坯', series: 'WP13', unitWeightKg: 245 },
  { partNo: '1012995998R', name: '机体毛坯', series: 'WP12', unitWeightKg: 180 },
  { partNo: '612630010001R', name: '气缸体毛坯', series: 'WP12', unitWeightKg: 230 },
  { partNo: '612630020001R', name: '气缸盖毛坯', series: 'WP12', unitWeightKg: 95 },
  { partNo: '1003449801R', name: '飞轮壳毛坯', series: 'WP13', unitWeightKg: 48 },
  { partNo: '1003449777R', name: '齿轮室毛坯', series: 'WP13', unitWeightKg: 35 }
]

// 毛坯件号选项（搜索栏用，全部）
const partNoOptions = blankPartOptions.map(item => item.partNo)

const activeLine = ref<string>('LINE-01')
const loading = ref(false)
const dataSource = ref<WipSummaryData[]>([])

const searchForm = reactive({
  productSeries: '',
  blankPartNo: '',
  blankName: '',
  dateRange: [] as Dayjs[]
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
  'cumulativeOutput',
  'qualifiedOutput',
  'cumulativeInbound',
  'qualifiedInbound',
  'cumulativeFineClean',
  'cumulativeInternalScrap',
  'cumulativeExternalScrap',
  'cumulativeBuyBack',
  'cumulativeReinspectionScrap',
  'wipQuantity',
  'finishedQuantity',
  'processWipQuantity'
]

// 重量列 key（统一格式化显示，保留2位小数）
const weightKeys = ['wipWeightKg', 'finishedWeightKg', 'processWipWeightKg']

// 底部合计数据（对当前Tab数据源的数值列求和）
const summaryData = computed<Record<string, number>>(() => {
  const totals: Record<string, number> = {}
  ;[...quantityKeys, ...weightKeys].forEach(key => {
    totals[key] = dataSource.value.reduce((sum, item) => sum + ((item as any)[key] || 0), 0)
  })
  return totals
})

const columns = [
  { title: '产品系列', dataIndex: 'productSeries', key: 'productSeries', width: 110, fixed: 'left' as const },
  { title: '毛坯件号', dataIndex: 'blankPartNo', key: 'blankPartNo', width: 150 },
  { title: '毛坯名称', dataIndex: 'blankName', key: 'blankName', width: 130 },
  { title: '累计出产', dataIndex: 'cumulativeOutput', key: 'cumulativeOutput', width: 110 },
  { title: '合格出产', dataIndex: 'qualifiedOutput', key: 'qualifiedOutput', width: 110 },
  { title: '累计入库', dataIndex: 'cumulativeInbound', key: 'cumulativeInbound', width: 110 },
  { title: '合格入库', dataIndex: 'qualifiedInbound', key: 'qualifiedInbound', width: 110 },
  { title: '累计细清', dataIndex: 'cumulativeFineClean', key: 'cumulativeFineClean', width: 110 },
  { title: '累计内废', dataIndex: 'cumulativeInternalScrap', key: 'cumulativeInternalScrap', width: 110 },
  { title: '累计外废', dataIndex: 'cumulativeExternalScrap', key: 'cumulativeExternalScrap', width: 110 },
  { title: '累计回购', dataIndex: 'cumulativeBuyBack', key: 'cumulativeBuyBack', width: 110 },
  { title: '累计二次检验报废', dataIndex: 'cumulativeReinspectionScrap', key: 'cumulativeReinspectionScrap', width: 150 },
  { title: '在制品数量', dataIndex: 'wipQuantity', key: 'wipQuantity', width: 120 },
  { title: '成品数量', dataIndex: 'finishedQuantity', key: 'finishedQuantity', width: 110 },
  { title: '在制重量(kg)', dataIndex: 'wipWeightKg', key: 'wipWeightKg', width: 130 },
  { title: '成品重量(kg)', dataIndex: 'finishedWeightKg', key: 'finishedWeightKg', width: 130 },
  { title: '工序在制数量', dataIndex: 'processWipQuantity', key: 'processWipQuantity', width: 130 },
  { title: '工序在制重量(kg)', dataIndex: 'processWipWeightKg', key: 'processWipWeightKg', width: 150 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const }
]

// 模拟数据（按产线分组）
const mockDataByLine: Record<string, WipSummaryData[]> = {
  'LINE-01': [
    {
      key: 'L1-1',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      productSeries: 'WP13',
      blankPartNo: '1003449788R',
      blankName: '气缸体毛坯',
      cumulativeOutput: 320,
      qualifiedOutput: 310,
      cumulativeInbound: 354,
      qualifiedInbound: 350,
      cumulativeFineClean: 0,
      cumulativeInternalScrap: 0,
      cumulativeExternalScrap: 0,
      cumulativeBuyBack: 0,
      cumulativeReinspectionScrap: 0,
      wipQuantity: 34,
      finishedQuantity: 286,
      wipWeightKg: 8330,
      finishedWeightKg: 70070,
      processWipQuantity: 12,
      processWipWeightKg: 2940
    },
    {
      key: 'L1-2',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      productSeries: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      cumulativeOutput: 18,
      qualifiedOutput: 18,
      cumulativeInbound: 20,
      qualifiedInbound: 20,
      cumulativeFineClean: 0,
      cumulativeInternalScrap: 0,
      cumulativeExternalScrap: 0,
      cumulativeBuyBack: 0,
      cumulativeReinspectionScrap: 0,
      wipQuantity: 2,
      finishedQuantity: 16,
      wipWeightKg: 360,
      finishedWeightKg: 2880,
      processWipQuantity: 2,
      processWipWeightKg: 360
    },
    {
      key: 'L1-3',
      lineCode: 'LINE-01',
      lineName: '造型一线大件清理',
      productSeries: 'WP12',
      blankPartNo: '612630010001R',
      blankName: '气缸体毛坯',
      cumulativeOutput: 58,
      qualifiedOutput: 56,
      cumulativeInbound: 60,
      qualifiedInbound: 58,
      cumulativeFineClean: 0,
      cumulativeInternalScrap: 0,
      cumulativeExternalScrap: 0,
      cumulativeBuyBack: 0,
      cumulativeReinspectionScrap: 0,
      wipQuantity: 2,
      finishedQuantity: 56,
      wipWeightKg: 460,
      finishedWeightKg: 12880,
      processWipQuantity: 2,
      processWipWeightKg: 460
    }
  ],
  'LINE-02': [
    {
      key: 'L2-1',
      lineCode: 'LINE-02',
      lineName: '造型三线KW清理',
      productSeries: 'WP12',
      blankPartNo: '612630020001R',
      blankName: '气缸盖毛坯',
      cumulativeOutput: 120,
      qualifiedOutput: 118,
      cumulativeInbound: 128,
      qualifiedInbound: 124,
      cumulativeFineClean: 98,
      cumulativeInternalScrap: 2,
      cumulativeExternalScrap: 0,
      cumulativeBuyBack: 5,
      cumulativeReinspectionScrap: 1,
      wipQuantity: 8,
      finishedQuantity: 118,
      wipWeightKg: 760,
      finishedWeightKg: 11210,
      processWipQuantity: 3,
      processWipWeightKg: 285
    },
    {
      key: 'L2-2',
      lineCode: 'LINE-02',
      lineName: '造型三线KW清理',
      productSeries: 'WP13',
      blankPartNo: '1003449801R',
      blankName: '飞轮壳毛坯',
      cumulativeOutput: 45,
      qualifiedOutput: 44,
      cumulativeInbound: 46,
      qualifiedInbound: 45,
      cumulativeFineClean: 40,
      cumulativeInternalScrap: 0,
      cumulativeExternalScrap: 1,
      cumulativeBuyBack: 0,
      cumulativeReinspectionScrap: 0,
      wipQuantity: 1,
      finishedQuantity: 44,
      wipWeightKg: 48,
      finishedWeightKg: 2112,
      processWipQuantity: 1,
      processWipWeightKg: 48
    }
  ],
  'LINE-03': [
    {
      key: 'L3-1',
      lineCode: 'LINE-03',
      lineName: '造型三线HWS清理',
      productSeries: 'WP13',
      blankPartNo: '1003449777R',
      blankName: '齿轮室毛坯',
      cumulativeOutput: 200,
      qualifiedOutput: 195,
      cumulativeInbound: 210,
      qualifiedInbound: 205,
      cumulativeFineClean: 185,
      cumulativeInternalScrap: 3,
      cumulativeExternalScrap: 4,
      cumulativeBuyBack: 8,
      cumulativeReinspectionScrap: 2,
      wipQuantity: 12,
      finishedQuantity: 188,
      wipWeightKg: 420,
      finishedWeightKg: 6580,
      processWipQuantity: 5,
      processWipWeightKg: 175
    },
    {
      key: 'L3-2',
      lineCode: 'LINE-03',
      lineName: '造型三线HWS清理',
      productSeries: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      cumulativeOutput: 88,
      qualifiedOutput: 87,
      cumulativeInbound: 90,
      qualifiedInbound: 88,
      cumulativeFineClean: 80,
      cumulativeInternalScrap: 1,
      cumulativeExternalScrap: 0,
      cumulativeBuyBack: 2,
      cumulativeReinspectionScrap: 0,
      wipQuantity: 2,
      finishedQuantity: 85,
      wipWeightKg: 360,
      finishedWeightKg: 15300,
      processWipQuantity: 2,
      processWipWeightKg: 360
    }
  ]
}

// 汇总明细弹窗模拟数据（按产线+毛坯件号、按日期）
const detailMockByLinePart: Record<string, WipSummaryDetail[]> = {
  'LINE-01_1003449788R': [
    {
      key: 'd1-1',
      date: '2026-08-08',
      productSeries: 'WP13',
      blankPartNo: '1003449788R',
      blankName: '气缸体毛坯',
      outputQuantity: 90,
      qualifiedOutput: 88,
      inboundQuantity: 96,
      qualifiedInbound: 94,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd1-2',
      date: '2026-08-09',
      productSeries: 'WP13',
      blankPartNo: '1003449788R',
      blankName: '气缸体毛坯',
      outputQuantity: 110,
      qualifiedOutput: 106,
      inboundQuantity: 118,
      qualifiedInbound: 116,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd1-3',
      date: '2026-08-10',
      productSeries: 'WP13',
      blankPartNo: '1003449788R',
      blankName: '气缸体毛坯',
      outputQuantity: 120,
      qualifiedOutput: 116,
      inboundQuantity: 140,
      qualifiedInbound: 140,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    }
  ],
  'LINE-01_1012995998R': [
    {
      key: 'd2-1',
      date: '2026-08-08',
      productSeries: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      outputQuantity: 8,
      qualifiedOutput: 8,
      inboundQuantity: 10,
      qualifiedInbound: 10,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd2-2',
      date: '2026-08-09',
      productSeries: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      outputQuantity: 10,
      qualifiedOutput: 10,
      inboundQuantity: 10,
      qualifiedInbound: 10,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    }
  ],
  'LINE-01_612630010001R': [
    {
      key: 'd3-1',
      date: '2026-08-08',
      productSeries: 'WP12',
      blankPartNo: '612630010001R',
      blankName: '气缸体毛坯',
      outputQuantity: 28,
      qualifiedOutput: 27,
      inboundQuantity: 30,
      qualifiedInbound: 29,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd3-2',
      date: '2026-08-09',
      productSeries: 'WP12',
      blankPartNo: '612630010001R',
      blankName: '气缸体毛坯',
      outputQuantity: 30,
      qualifiedOutput: 29,
      inboundQuantity: 30,
      qualifiedInbound: 29,
      fineCleanQuantity: 0,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    }
  ],
  'LINE-02_612630020001R': [
    {
      key: 'd4-1',
      date: '2026-08-08',
      productSeries: 'WP12',
      blankPartNo: '612630020001R',
      blankName: '气缸盖毛坯',
      outputQuantity: 40,
      qualifiedOutput: 39,
      inboundQuantity: 42,
      qualifiedInbound: 40,
      fineCleanQuantity: 30,
      internalScrapQuantity: 1,
      externalScrapQuantity: 0,
      buyBackQuantity: 2,
      reinspectionScrapQuantity: 1
    },
    {
      key: 'd4-2',
      date: '2026-08-09',
      productSeries: 'WP12',
      blankPartNo: '612630020001R',
      blankName: '气缸盖毛坯',
      outputQuantity: 42,
      qualifiedOutput: 41,
      inboundQuantity: 44,
      qualifiedInbound: 42,
      fineCleanQuantity: 36,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 1,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd4-3',
      date: '2026-08-10',
      productSeries: 'WP12',
      blankPartNo: '612630020001R',
      blankName: '气缸盖毛坯',
      outputQuantity: 38,
      qualifiedOutput: 38,
      inboundQuantity: 42,
      qualifiedInbound: 42,
      fineCleanQuantity: 32,
      internalScrapQuantity: 1,
      externalScrapQuantity: 0,
      buyBackQuantity: 2,
      reinspectionScrapQuantity: 0
    }
  ],
  'LINE-02_1003449801R': [
    {
      key: 'd5-1',
      date: '2026-08-08',
      productSeries: 'WP13',
      blankPartNo: '1003449801R',
      blankName: '飞轮壳毛坯',
      outputQuantity: 22,
      qualifiedOutput: 21,
      inboundQuantity: 23,
      qualifiedInbound: 22,
      fineCleanQuantity: 18,
      internalScrapQuantity: 0,
      externalScrapQuantity: 1,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd5-2',
      date: '2026-08-09',
      productSeries: 'WP13',
      blankPartNo: '1003449801R',
      blankName: '飞轮壳毛坯',
      outputQuantity: 23,
      qualifiedOutput: 23,
      inboundQuantity: 23,
      qualifiedInbound: 23,
      fineCleanQuantity: 22,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 0,
      reinspectionScrapQuantity: 0
    }
  ],
  'LINE-03_1003449777R': [
    {
      key: 'd6-1',
      date: '2026-08-08',
      productSeries: 'WP13',
      blankPartNo: '1003449777R',
      blankName: '齿轮室毛坯',
      outputQuantity: 65,
      qualifiedOutput: 63,
      inboundQuantity: 70,
      qualifiedInbound: 68,
      fineCleanQuantity: 60,
      internalScrapQuantity: 1,
      externalScrapQuantity: 1,
      buyBackQuantity: 3,
      reinspectionScrapQuantity: 1
    },
    {
      key: 'd6-2',
      date: '2026-08-09',
      productSeries: 'WP13',
      blankPartNo: '1003449777R',
      blankName: '齿轮室毛坯',
      outputQuantity: 68,
      qualifiedOutput: 66,
      inboundQuantity: 70,
      qualifiedInbound: 69,
      fineCleanQuantity: 64,
      internalScrapQuantity: 1,
      externalScrapQuantity: 2,
      buyBackQuantity: 2,
      reinspectionScrapQuantity: 1
    },
    {
      key: 'd6-3',
      date: '2026-08-10',
      productSeries: 'WP13',
      blankPartNo: '1003449777R',
      blankName: '齿轮室毛坯',
      outputQuantity: 67,
      qualifiedOutput: 66,
      inboundQuantity: 70,
      qualifiedInbound: 68,
      fineCleanQuantity: 61,
      internalScrapQuantity: 1,
      externalScrapQuantity: 1,
      buyBackQuantity: 3,
      reinspectionScrapQuantity: 0
    }
  ],
  'LINE-03_1012995998R': [
    {
      key: 'd7-1',
      date: '2026-08-08',
      productSeries: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      outputQuantity: 42,
      qualifiedOutput: 41,
      inboundQuantity: 45,
      qualifiedInbound: 44,
      fineCleanQuantity: 40,
      internalScrapQuantity: 0,
      externalScrapQuantity: 0,
      buyBackQuantity: 1,
      reinspectionScrapQuantity: 0
    },
    {
      key: 'd7-2',
      date: '2026-08-09',
      productSeries: 'WP12',
      blankPartNo: '1012995998R',
      blankName: '机体毛坯',
      outputQuantity: 46,
      qualifiedOutput: 46,
      inboundQuantity: 45,
      qualifiedInbound: 44,
      fineCleanQuantity: 40,
      internalScrapQuantity: 1,
      externalScrapQuantity: 0,
      buyBackQuantity: 1,
      reinspectionScrapQuantity: 0
    }
  ]
}

// 汇总明细弹窗
const detailModalVisible = ref(false)
const detailTitle = ref('汇总明细')
const detailDataList = ref<WipSummaryDetail[]>([])
const detailColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
  { title: '产品系列', dataIndex: 'productSeries', key: 'productSeries', width: 100 },
  { title: '毛坯件号', dataIndex: 'blankPartNo', key: 'blankPartNo', width: 150 },
  { title: '毛坯名称', dataIndex: 'blankName', key: 'blankName', width: 130 },
  { title: '出产数量', dataIndex: 'outputQuantity', key: 'outputQuantity', width: 110 },
  { title: '合格出产数量', dataIndex: 'qualifiedOutput', key: 'qualifiedOutput', width: 120 },
  { title: '入库数量', dataIndex: 'inboundQuantity', key: 'inboundQuantity', width: 110 },
  { title: '合格入库数量', dataIndex: 'qualifiedInbound', key: 'qualifiedInbound', width: 120 },
  { title: '细清数量', dataIndex: 'fineCleanQuantity', key: 'fineCleanQuantity', width: 110 },
  { title: '内废数量', dataIndex: 'internalScrapQuantity', key: 'internalScrapQuantity', width: 110 },
  { title: '外废数量', dataIndex: 'externalScrapQuantity', key: 'externalScrapQuantity', width: 110 },
  { title: '回购数量', dataIndex: 'buyBackQuantity', key: 'buyBackQuantity', width: 110 },
  { title: '二次检验报废数量', dataIndex: 'reinspectionScrapQuantity', key: 'reinspectionScrapQuantity', width: 150 }
]
const detailQuantityKeys = [
  'outputQuantity',
  'qualifiedOutput',
  'inboundQuantity',
  'qualifiedInbound',
  'fineCleanQuantity',
  'internalScrapQuantity',
  'externalScrapQuantity',
  'buyBackQuantity',
  'reinspectionScrapQuantity'
]

// 总览Tab明细弹窗
const allDetailModalVisible = ref(false)
const allDetailTitle = ref('各产线汇总明细')
const allDetailDataList = ref<OverviewDetail[]>([])
const allDetailColumns = [
  { title: '产线名称', dataIndex: 'lineName', key: 'lineName', width: 170 },
  { title: '产品系列', dataIndex: 'productSeries', key: 'productSeries', width: 100 },
  { title: '毛坯件号', dataIndex: 'blankPartNo', key: 'blankPartNo', width: 150 },
  { title: '毛坯名称', dataIndex: 'blankName', key: 'blankName', width: 130 },
  { title: '累计出产数量', dataIndex: 'cumulativeOutput', key: 'cumulativeOutput', width: 120 },
  { title: '合格出产数量', dataIndex: 'qualifiedOutput', key: 'qualifiedOutput', width: 120 },
  { title: '累计入库数量', dataIndex: 'cumulativeInbound', key: 'cumulativeInbound', width: 120 },
  { title: '合格入库数量', dataIndex: 'qualifiedInbound', key: 'qualifiedInbound', width: 120 },
  { title: '累计细清数量', dataIndex: 'cumulativeFineClean', key: 'cumulativeFineClean', width: 120 },
  { title: '累计内废数量', dataIndex: 'cumulativeInternalScrap', key: 'cumulativeInternalScrap', width: 120 },
  { title: '累计外废数量', dataIndex: 'cumulativeExternalScrap', key: 'cumulativeExternalScrap', width: 120 },
  { title: '累计回购数量', dataIndex: 'cumulativeBuyBack', key: 'cumulativeBuyBack', width: 120 },
  { title: '累计二次检验报废数量', dataIndex: 'cumulativeReinspectionScrap', key: 'cumulativeReinspectionScrap', width: 170 },
  { title: '在制品数量', dataIndex: 'wipQuantity', key: 'wipQuantity', width: 120 },
  { title: '在制重量(kg)', dataIndex: 'wipWeightKg', key: 'wipWeightKg', width: 130 },
  { title: '成品重量(kg)', dataIndex: 'finishedWeightKg', key: 'finishedWeightKg', width: 130 },
  { title: '工序在制数量', dataIndex: 'processWipQuantity', key: 'processWipQuantity', width: 130 },
  { title: '工序在制重量(kg)', dataIndex: 'processWipWeightKg', key: 'processWipWeightKg', width: 150 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const }
]
const allDetailQuantityKeys = [
  'cumulativeOutput',
  'qualifiedOutput',
  'cumulativeInbound',
  'qualifiedInbound',
  'cumulativeFineClean',
  'cumulativeInternalScrap',
  'cumulativeExternalScrap',
  'cumulativeBuyBack',
  'cumulativeReinspectionScrap',
  'wipQuantity',
  'processWipQuantity'
]
const allDetailWeightKeys = ['wipWeightKg', 'finishedWeightKg', 'processWipWeightKg']

onMounted(() => {
  loadData()
})

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    let allData: WipSummaryData[] = []
    if (activeLine.value === 'ALL') {
      Object.values(mockDataByLine).forEach(items => {
        allData = allData.concat(items)
      })
    } else {
      allData = mockDataByLine[activeLine.value] || []
    }
    const { productSeries, blankPartNo, blankName } = searchForm
    const filtered = allData.filter(item => {
      const matchSeries = !productSeries || item.productSeries === productSeries
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
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.productSeries = ''
  searchForm.blankPartNo = ''
  searchForm.blankName = ''
  searchForm.dateRange = []
  handleSearch()
}

const handleLineChange = () => {
  pagination.current = 1
  loadData()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const handleViewDetail = (record: WipSummaryData) => {
  detailDataList.value = detailMockByLinePart[`${record.lineCode}_${record.blankPartNo}`] || []
  detailTitle.value = `${record.blankPartNo}（${record.blankName}）汇总明细`
  detailModalVisible.value = true
}

// 总览Tab明细弹框内的行明细（各产线按日期明细）
const handleAllDetailRowDetail = (record: OverviewDetail) => {
  detailDataList.value = detailMockByLinePart[`${record.lineCode}_${record.blankPartNo}`] || []
  detailTitle.value = `${record.lineName} · ${record.blankPartNo}（${record.blankName}）汇总明细`
  detailModalVisible.value = true
}

const handleDetailClose = () => {
  detailModalVisible.value = false
}

// 查看某毛坯件号在各产线的汇总明细（总览Tab）
const handleViewAllDetail = (record: WipSummaryData) => {
  const list: OverviewDetail[] = []
  Object.values(mockDataByLine).forEach(items => {
    items.forEach(item => {
      if (item.blankPartNo === record.blankPartNo) {
        list.push({
          key: item.key,
          lineCode: item.lineCode,
          lineName: item.lineName,
          productSeries: item.productSeries,
          blankPartNo: item.blankPartNo,
          blankName: item.blankName,
          cumulativeOutput: item.cumulativeOutput,
          qualifiedOutput: item.qualifiedOutput,
          cumulativeInbound: item.cumulativeInbound,
          qualifiedInbound: item.qualifiedInbound,
          cumulativeFineClean: item.cumulativeFineClean,
          cumulativeInternalScrap: item.cumulativeInternalScrap,
          cumulativeExternalScrap: item.cumulativeExternalScrap,
          cumulativeBuyBack: item.cumulativeBuyBack,
          cumulativeReinspectionScrap: item.cumulativeReinspectionScrap,
          wipQuantity: item.wipQuantity,
          wipWeightKg: item.wipWeightKg,
          finishedWeightKg: item.finishedWeightKg,
          processWipQuantity: item.processWipQuantity,
          processWipWeightKg: item.processWipWeightKg
        })
      }
    })
  })
  allDetailDataList.value = list
  allDetailTitle.value = `${record.blankPartNo}（${record.blankName}）各产线汇总明细`
  allDetailModalVisible.value = true
}

const handleAllDetailClose = () => {
  allDetailModalVisible.value = false
}

const formatNumber = (value: number) => {
  return value.toLocaleString('zh-CN')
}

const formatWeight = (value: number) => {
  return value.toFixed(2)
}

const filterOption = (input: string, option: any) => {
  return (option.value || '').toLowerCase().includes(input.toLowerCase())
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.zero-value {
  color: #bfbfbf;
}
</style>
