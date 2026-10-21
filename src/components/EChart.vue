<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * ECharts 通用容器。
 * 采用全量引入，骨架阶段优先保证可用性；若后续需减小体积，
 * 可改为 echarts/core + 按需注册图表与组件。
 */
const props = withDefaults(
  defineProps<{
    option: EChartsOption
    /** 容器高度，默认撑满父级 */
    height?: string
  }>(),
  {
    height: '100%'
  }
)

const container = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function render() {
  if (!chart) return
  chart.setOption(props.option, true)
}

onMounted(() => {
  if (!container.value) return
  chart = echarts.init(container.value)
  render()

  observer = new ResizeObserver(() => {
    chart?.resize()
  })
  observer.observe(container.value)
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart?.dispose()
  chart = null
})

defineExpose({
  /** 供父组件调用，如导出图片、主动 resize */
  getInstance: () => chart
})
</script>

<template>
  <div ref="container" class="w-full" :style="{ height }"></div>
</template>
