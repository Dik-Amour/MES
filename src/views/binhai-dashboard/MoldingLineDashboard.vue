<script setup lang="ts">
import LineDashboardShell from './LineDashboardShell.vue'

/** 指标行：造型 / 下线 双口径，与生产运营大屏同款排布 */
const indicators = [
  { label: '当日造型', value: '120', unit: '吨', tone: 'output' },
  { label: '当日下线', value: '118', unit: '吨', tone: 'inbound' },
  { label: '当月造型', value: '3,150', unit: '吨', tone: 'output' },
  { label: '当月下线', value: '3,080', unit: '吨', tone: 'inbound' },
  { label: '年度造型', value: '36,800', unit: '吨', tone: 'output' },
  { label: '年度下线', value: '35,960', unit: '吨', tone: 'inbound' }
]

/** 六宫格：3 列 × 2 行，与生产运营大屏布局一致 */
const panels = [
  { title: '造型产量分析' },
  { title: '下线概况' },
  { title: '月度分析' },
  { title: '年度分析' },
  { title: '生产详情' },
  { title: '计划分析' }
]
</script>

<template>
  <LineDashboardShell title="造型产线可视化" :indicators="indicators" :panels="panels" />
</template>
