<script setup lang="ts">
import LineDashboardShell from './LineDashboardShell.vue'

/** 指标行：清理 / 入库 双口径，与生产运营大屏同款排布 */
const indicators = [
  { label: '当日清理', value: '96', unit: '吨', tone: 'output' },
  { label: '当日入库', value: '94', unit: '吨', tone: 'inbound' },
  { label: '当月清理', value: '2,760', unit: '吨', tone: 'output' },
  { label: '当月入库', value: '2,705', unit: '吨', tone: 'inbound' },
  { label: '年度清理', value: '32,400', unit: '吨', tone: 'output' },
  { label: '年度入库', value: '31,880', unit: '吨', tone: 'inbound' }
]

/** 六宫格：3 列 × 2 行，与生产运营大屏布局一致 */
const panels = [
  { title: '清理产量分析' },
  { title: '入库概况' },
  { title: '月度分析' },
  { title: '年度分析' },
  { title: '生产详情' },
  { title: '计划分析' }
]
</script>

<template>
  <LineDashboardShell title="清理产线可视化" :indicators="indicators" :panels="panels" />
</template>
