<template>
  <div class="dash-header" :class="{ 'fui-header': variant === 'fui', 'has-nav': showNav }">
    <!-- 寒亭：左侧时间/日期；有导航时标题固定，切换大屏不改标题 -->
    <template v-if="showNav">
      <div class="header-brand">
        <span class="hd-time">{{ timeStr }}</span>
        <span class="header-divider"></span>
        <span class="hd-date">{{ dateStr }}</span>
        <template v-if="showWeather">
          <span class="header-divider"></span>
          <span class="hd-weather">{{ weather }}</span>
        </template>
      </div>

      <div class="header-center" :class="{ 'header-center-wide': hasTeams }">
        <template v-if="hasLeftTeams || hasRightTeams">
          <div class="teams-side teams-side-left">
            <slot name="headerTeamsLeft" />
          </div>
          <div class="title-block">
            <span v-if="variant === 'fui'" class="title-wing title-wing-left">◆ ◆ ◆</span>
            <span class="title-text">{{ unifiedTitle }}</span>
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
            <span class="title-text">{{ unifiedTitle }}</span>
            <span v-if="variant === 'fui'" class="title-wing title-wing-right">◆ ◆ ◆</span>
          </div>
        </template>
        <template v-else>
          <span v-if="variant === 'fui'" class="title-wing title-wing-left">◆ ◆ ◆</span>
          <span class="title-text">{{ unifiedTitle }}</span>
          <span v-if="variant === 'fui'" class="title-wing title-wing-right">◆ ◆ ◆</span>
        </template>
      </div>

      <nav class="header-nav" aria-label="大屏导航">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="nav-btn"
          :class="{ active: isActive(item.path) }"
          @click="go(item.path)"
        >{{ item.label }}</button>
      </nav>
    </template>

    <!-- 滨海等：保持原结构（日期左、logo 右） -->
    <template v-else>
      <div class="header-left" :class="{ 'header-left-minimal': variant === 'fui' }">
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

      <div class="header-center" :class="{ 'header-center-wide': hasTeams }">
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
          <img :src="logoUrl" alt="" class="fui-logo-image" />
        </div>
        <div v-else class="logo-box">
          <img v-if="logoSrc" :src="logoSrc" :alt="logoAlt" class="logo-image" />
          <span v-else>LOGO</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, useSlots } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import logoUrl from '@/assets/image/logo.png'

const props = withDefaults(
  defineProps<{
    title: string
    weather?: string
    showWeather?: boolean
    logoSrc?: string
    logoAlt?: string
    variant?: 'default' | 'fui'
    /** 寒亭：logo 最左 + 右侧导航 */
    showNav?: boolean
  }>(),
  {
    weather: '晴 23℃',
    showWeather: true,
    logoSrc: logoUrl,
    logoAlt: 'LOGO',
    variant: 'default',
    showNav: false
  }
)

const route = useRoute()
const router = useRouter()

/** 有导航时统一标题，切换大屏不随页面变化 */
const unifiedTitle = '材料成型中心运营大屏'

/** 寒亭大屏导航：首页 / 生产 / 质量 / 设备 / 人力 / 安环 */
const navItems = [
  { key: 'home', label: '首页', path: '/dashboard/plant' },
  { key: 'production', label: '生产', path: '/dashboard/production' },
  { key: 'quality', label: '质量', path: '/dashboard/quality' },
  { key: 'equipment', label: '设备', path: '/dashboard/equipment' },
  { key: 'personnel', label: '人力', path: '/dashboard/personnel' },
  { key: 'safety', label: '安环', path: '/dashboard/safety' }
] as const

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')

const go = (path: string) => {
  if (route.path !== path) router.push(path)
}

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

<!-- 寒亭白底标题栏；滨海深色由 binhai common 在 .dashboard-container 内覆盖 -->
<style src="./dashboard-header.css"></style>
