<template>
  <div class="dash-header" :class="{ 'fui-header': variant === 'fui' }">
    <div class="header-left" :class="{ 'header-left-minimal': variant === 'fui' }">
      <!-- 滨海 FUI 大屏：左侧不展示时间、天气，仅保留日期 -->
      <template v-if="variant !== 'fui'">
        <span class="hd-time">{{ timeStr }}</span>
        <span class="header-divider"></span>
      </template>
      <span class="hd-date">{{ dateStr }}</span>
      <template v-if="showWeather && variant !== 'fui'">
        <span class="header-divider"></span>
        <span class="hd-weather">{{ weather }}</span>
      </template>
    </div>

    <!-- 中部：默认居中标题；有班组时在中间区左右分置，避免压到日期天气 -->
    <div
      class="header-center"
      :class="{ 'header-center-wide': hasTeams }"
    >
      <template v-if="hasLeftTeams || hasRightTeams">
        <div class="teams-side teams-side-left">
          <slot name="headerTeamsLeft" />
        </div>
        <div class="title-block">
          <span v-if="variant === 'fui'" class="title-wing title-wing-left">◆ ◆ ◆</span>
          <span class="title-text">{{ title }}</span>
          <span v-if="variant === 'fui'" class="title-wing title-wing-right">◆ ◆ ◆</span>
        </div>
        <div class="teams-side teams-side-right">
          <slot name="headerTeamsRight" />
        </div>
      </template>
      <template v-else-if="$slots.headerTeams">
        <slot name="headerTeams" />
        <div class="title-block">
          <span v-if="variant === 'fui'" class="title-wing title-wing-left">◆ ◆ ◆</span>
          <span class="title-text">{{ title }}</span>
          <span v-if="variant === 'fui'" class="title-wing title-wing-right">◆ ◆ ◆</span>
        </div>
      </template>
      <template v-else>
        <span v-if="variant === 'fui'" class="title-wing title-wing-left">◆ ◆ ◆</span>
        <span class="title-text">{{ title }}</span>
        <span v-if="variant === 'fui'" class="title-wing title-wing-right">◆ ◆ ◆</span>
      </template>
    </div>

    <div class="header-right">
      <div v-if="variant === 'fui'" class="fui-logo">
        <!-- 纯装饰：页面标题已表达语义，空 alt 避免读屏重复播报 -->
        <img :src="logoUrl" alt="" class="fui-logo-image" />
      </div>
      <div v-else class="logo-box">
        <img v-if="logoSrc" :src="logoSrc" :alt="logoAlt" class="logo-image" />
        <span v-else>LOGO</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, useSlots } from 'vue'

import logoUrl from '@/assets/image/logo.png'

const props = withDefaults(
  defineProps<{
    title: string
    weather?: string
    showWeather?: boolean
    logoSrc?: string
    logoAlt?: string
    variant?: 'default' | 'fui'
  }>(),
  {
    weather: '晴 23℃',
    showWeather: true,
    logoSrc: logoUrl,
    logoAlt: 'LOGO',
    variant: 'default'
  }
)

const slots = useSlots()
const hasLeftTeams = computed(() => !!slots.headerTeamsLeft)
const hasRightTeams = computed(() => !!slots.headerTeamsRight)
const hasTeams = computed(() => hasLeftTeams.value || hasRightTeams.value || !!slots.headerTeams)

const timeStr = ref('')
const dateStr = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const tick = () => {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  timeStr.value = `${h}:${m}:${s}`
  dateStr.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style src="@/views/binhai-dashboard/dashboard-common.css"></style>
