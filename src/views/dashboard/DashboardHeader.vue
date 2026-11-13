<template>
  <div class="dash-header" :class="{ 'fui-header': variant === 'fui' }">
    <div class="header-left">
      <span class="hd-time">{{ timeStr }}</span>
      <span class="header-divider"></span>
      <span class="hd-date">{{ dateStr }}</span>
      <span class="header-divider"></span>
      <span class="hd-weather">{{ weather }}</span>
    </div>
    <div class="header-center">
      <span v-if="variant === 'fui'" class="title-wing title-wing-left">◆ ◆ ◆</span>
      <span class="title-text">{{ title }}</span>
      <span v-if="variant === 'fui'" class="title-wing title-wing-right">◆ ◆ ◆</span>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'

import logoUrl from '@/assets/image/logo.png'

withDefaults(
  defineProps<{
    title: string
    weather?: string
    logoSrc?: string
    logoAlt?: string
    variant?: 'default' | 'fui'
  }>(),
  {
    weather: '晴 23℃',
    logoSrc: '',
    logoAlt: 'LOGO',
    variant: 'default'
  }
)

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

<style scoped>
.dash-header {
  position: relative;
  border: 1px solid #eee;
  border-radius: 2px;
  padding: 10px 20px 10px 20px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.fui-header {
  min-height: 64px;
  padding: 8px 20px;
  overflow: hidden;
  color: #dff8ff;
  background:
    linear-gradient(90deg, rgba(0, 166, 216, 0.14), rgba(4, 22, 31, 0.96) 34%, rgba(4, 22, 31, 0.96) 66%, rgba(0, 166, 216, 0.14)),
    #06141d;
  border: 1px solid rgba(0, 190, 236, 0.75);
  border-radius: 4px;
  box-shadow:
    inset 0 0 24px rgba(0, 166, 216, 0.08),
    0 0 14px rgba(0, 166, 216, 0.16);
}

.fui-header::before,
.fui-header::after {
  content: '';
  position: absolute;
  top: 0;
  width: 28%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #10d5ff, transparent);
}

.fui-header::before {
  left: 18%;
}

.fui-header::after {
  right: 18%;
}

.fui-header .header-left {
  gap: 12px;
  color: #a9d8e7;
}

.fui-header .hd-time {
  min-width: 72px;
  color: #43e5ff;
  font-size: 17px;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(67, 229, 255, 0.55);
}

.fui-header .hd-date,
.fui-header .hd-weather {
  color: #a9d8e7;
  font-size: 12px;
  white-space: nowrap;
}

.header-divider {
  width: 1px;
  height: 16px;
  background: rgba(88, 211, 245, 0.38);
}

.fui-header .header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #f5fcff;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 4px;
  text-shadow: 0 0 14px rgba(31, 204, 255, 0.55);
}

.title-wing {
  color: #20cfff;
  font-size: 12px;
  letter-spacing: 8px;
  text-shadow: 0 0 9px rgba(32, 207, 255, 0.85);
}

.title-wing-right {
  transform: scaleX(-1);
}

.header-left {
  flex: 1;
  display: flex;
  gap: 14px;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.hd-time {
  font-size: 18px;
  font-weight: 700;
  color: #222;
  font-variant-numeric: tabular-nums;
}

.hd-date {
  color: #555;
}

.hd-weather {
  color: #4472c4;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* fui 标题栏右上角 logo */
.fui-logo {
  display: flex;
  align-items: center;
  height: 40px;
}

.fui-logo-image {
  height: 100%;
  width: auto;
  object-fit: contain;
}

.logo-box {
  width: 100px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  letter-spacing: 2px;
  background: #fff
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><line x1="0" y1="0" x2="100%" y2="100%" stroke="%23eee" stroke-width="1"/><line x1="100%" y1="0" x2="0" y2="100%" stroke="%23eee" stroke-width="1"/></svg>');
}
</style>
