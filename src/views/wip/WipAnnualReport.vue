<template>
  <div class="annual-report">
    <!-- 报表卡片 -->
    <a-card :bordered="false" class="report-card">
      <div class="report-title">
        材料成型中心（工业园区）年度产线统计表
      </div>
      <a-table
        :columns="annualColumns"
        :data-source="annualRows"
        :pagination="false"
        :scroll="{ x: 1900 }"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key && column.key.startsWith('month')">
            {{ formatNumber2(record.values[Number(column.key.slice(5)) - 1]) }}
          </template>
          <template v-else-if="column.key === 'q1'">
            {{ formatNumber2(record.quarter1) }}
          </template>
          <template v-else-if="column.key === 'q2'">
            {{ formatNumber2(record.quarter2) }}
          </template>
          <template v-else-if="column.key === 'q3'">
            {{ formatNumber2(record.quarter3) }}
          </template>
          <template v-else-if="column.key === 'q4'">
            {{ formatNumber2(record.quarter4) }}
          </template>
          <template v-else-if="column.key === 'total'">
            <strong>{{ formatNumber2(record.total) }}</strong>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AnnualData {
  year: number
  production: number[] // 出产 12个月
  sales: number[] // 销售 12个月
}

interface AnnualRow {
  key: string
  year: number
  category: string
  values: number[]
  quarter1: number
  quarter2: number
  quarter3: number
  quarter4: number
  total: number
  yearSpan: number
}

// 年度模拟数据（出产/销售各12个月）
const annualMock: AnnualData[] = [
  {
    year: 2025,
    production: [4108.5, 3852.6, 4521.3, 4789.2, 4235.7, 3861.4, 4498.2, 4027.5, 4356.8, 4612.3, 4056.9, 3734.1],
    sales: [3962.4, 3718.9, 4387.6, 4623.5, 4098.2, 3726.5, 4351.8, 3892.6, 4208.3, 4456.7, 3917.5, 3605.8]
  },
  {
    year: 2026,
    production: [4512.6, 3703.84, 4813.3, 5076.59, 4457.54, 4105.36, 4726.8, 4218.5, 4598.7, 4896.2, 4312.4, 4021.6],
    sales: [4368.2, 3587.9, 4669.5, 4921.7, 4318.6, 3978.2, 4581.4, 4086.9, 4452.3, 4741.8, 4176.5, 3895.3]
  },
  {
    year: 2027,
    production: [4812.9, 4203.6, 5105.2, 5387.4, 4736.8, 4352.1, 5012.6, 4475.3, 4890.7, 5189.4, 4571.8, 4289.2],
    sales: [4665.8, 4068.2, 4947.6, 5221.9, 4589.4, 4216.8, 4856.3, 4337.6, 4738.5, 5026.1, 4427.9, 4152.6]
  }
]

const formatNumber2 = (value: number) => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 年度统计表格列
const annualColumns = computed(() => {
  // 生成连续3个月列
  const monthGroup = (first: number) =>
    [0, 1, 2].map(offset => ({
      title: `${first + offset}月`,
      key: `month${first + offset}`,
      width: 100,
      align: 'right' as const
    }))

  return [
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 100,
      fixed: 'left' as const,
      customCell: (record: AnnualRow) => ({ rowSpan: record.yearSpan })
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 90,
      fixed: 'left' as const
    },
    ...monthGroup(1),
    { title: '一季度', key: 'q1', width: 110, align: 'right' as const },
    ...monthGroup(4),
    { title: '二季度', key: 'q2', width: 110, align: 'right' as const },
    ...monthGroup(7),
    { title: '三季度', key: 'q3', width: 110, align: 'right' as const },
    ...monthGroup(10),
    { title: '四季度', key: 'q4', width: 110, align: 'right' as const },
    { title: '年合计', key: 'total', width: 130, align: 'right' as const }
  ]
})

// 年度报表行：每个年度生成 出产/销售 两行，年度列纵向合并
const annualRows = computed<AnnualRow[]>(() => {
  const rows: AnnualRow[] = []
  annualMock.forEach(data => {
    const year = data.year
    const categories = [
      { name: '出产', values: data.production },
      { name: '销售', values: data.sales }
    ]
    categories.forEach((cat, idx) => {
      const sumQuarter = (startIdx: number) =>
        cat.values[startIdx] + cat.values[startIdx + 1] + cat.values[startIdx + 2]
      rows.push({
        key: `${year}-${cat.name}`,
        year,
        category: cat.name,
        values: cat.values,
        quarter1: sumQuarter(0),
        quarter2: sumQuarter(3),
        quarter3: sumQuarter(6),
        quarter4: sumQuarter(9),
        total: cat.values.reduce((sum, v) => sum + v, 0),
        yearSpan: idx === 0 ? 2 : 0
      })
    })
  })
  return rows
})
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
