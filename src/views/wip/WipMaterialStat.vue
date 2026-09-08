<template>
  <div class="material-stat">
    <!-- 报表卡片 -->
    <a-card :bordered="false" class="report-card">
      <div class="report-title">材料成型中心（工业园区）毛坯材质生产统计表</div>
      <a-table
        :columns="columns"
        :data-source="rows"
        :pagination="false"
        :scroll="{ x: 1800 }"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key && column.key.endsWith('Rate')">
            {{ formatPercent(record[column.dataIndex]) }}
          </template>
          <template v-else-if="column.key === 'prodTotal' || column.key === 'inTotal'">
            <strong>{{ formatNumber2(record[column.dataIndex]) }}</strong>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MaterialYearData {
  year: number
  production: {
    gray: number // 灰铁
    vermicular: number // 蠕铁
    nodular: number // 球铁
  }
  warehousing: {
    gray: number
    vermicular: number
    nodular: number
  }
}

interface MaterialRow {
  key: string
  year: number
  prodGray: number
  prodGrayRate: number
  prodVermicular: number
  prodVermicularRate: number
  prodNodular: number
  prodNodularRate: number
  prodTotal: number
  inGray: number
  inGrayRate: number
  inVermicular: number
  inVermicularRate: number
  inNodular: number
  inNodularRate: number
  inTotal: number
}

// 毛坯材质年度模拟数据（吨）
const materialMock: MaterialYearData[] = [
  {
    year: 2025,
    production: { gray: 23560, vermicular: 18420, nodular: 9650 },
    warehousing: { gray: 22680, vermicular: 17950, nodular: 9180 }
  },
  {
    year: 2026,
    production: { gray: 25180, vermicular: 19760, nodular: 10540 },
    warehousing: { gray: 24350, vermicular: 19120, nodular: 10130 }
  },
  {
    year: 2027,
    production: { gray: 26940, vermicular: 21230, nodular: 11380 },
    warehousing: { gray: 26020, vermicular: 20560, nodular: 10980 }
  }
]

const formatNumber2 = (value: number) => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`
}

// 报表行：每个年度一行，占比按该材质占三类合计的百分比计算
const rows = computed<MaterialRow[]>(() => {
  return materialMock.map(item => {
    const pGray = item.production.gray
    const pVermicular = item.production.vermicular
    const pNodular = item.production.nodular
    const prodTotal = pGray + pVermicular + pNodular
    const iGray = item.warehousing.gray
    const iVermicular = item.warehousing.vermicular
    const iNodular = item.warehousing.nodular
    const inTotal = iGray + iVermicular + iNodular
    const pct = (v: number, total: number) => (total > 0 ? (v / total) * 100 : 0)
    return {
      key: `${item.year}`,
      year: item.year,
      prodGray: pGray,
      prodGrayRate: pct(pGray, prodTotal),
      prodVermicular: pVermicular,
      prodVermicularRate: pct(pVermicular, prodTotal),
      prodNodular: pNodular,
      prodNodularRate: pct(pNodular, prodTotal),
      prodTotal,
      inGray: iGray,
      inGrayRate: pct(iGray, inTotal),
      inVermicular: iVermicular,
      inVermicularRate: pct(iVermicular, inTotal),
      inNodular: iNodular,
      inNodularRate: pct(iNodular, inTotal),
      inTotal
    }
  })
})

// 生成某一大栏（出产/入库）下的明细子表头
const materialGroupChildren = (prefix: 'prod' | 'in'): any[] => [
  { title: '灰铁', dataIndex: `${prefix}Gray`, key: `${prefix}Gray`, width: 120, align: 'right' as const },
  { title: '占比', dataIndex: `${prefix}GrayRate`, key: `${prefix}GrayRate`, width: 90, align: 'right' as const },
  { title: '蠕铁', dataIndex: `${prefix}Vermicular`, key: `${prefix}Vermicular`, width: 120, align: 'right' as const },
  { title: '占比', dataIndex: `${prefix}VermicularRate`, key: `${prefix}VermicularRate`, width: 90, align: 'right' as const },
  { title: '球铁', dataIndex: `${prefix}Nodular`, key: `${prefix}Nodular`, width: 120, align: 'right' as const },
  { title: '占比', dataIndex: `${prefix}NodularRate`, key: `${prefix}NodularRate`, width: 90, align: 'right' as const },
  { title: '全年合计', dataIndex: `${prefix}Total`, key: `${prefix}Total`, width: 130, align: 'right' as const }
]

// 两级表头：年份纵向通栏；出产（吨）/入库（吨）作为两大主栏各带7列明细子表头
const columns: any[] = [
  {
    title: '年份',
    dataIndex: 'year',
    key: 'year',
    width: 100,
    fixed: 'left' as const,
    align: 'center' as const
  },
  {
    title: '出产（吨）',
    key: 'production',
    align: 'center' as const,
    children: materialGroupChildren('prod')
  },
  {
    title: '入库（吨）',
    key: 'warehousing',
    align: 'center' as const,
    children: materialGroupChildren('in')
  }
]
</script>

<style scoped>
.report-card {
  margin-bottom: 16px;
}

.report-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}
</style>
