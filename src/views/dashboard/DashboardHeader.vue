<template>
  <div class="dash-header">
    <div class="header-left">
      <span class="hd-time">{{ timeStr }}</span>
      <span class="hd-date">{{ dateStr }}</span>
      <span class="hd-weather">{{ weather }}</span>
    </div>
    <div class="header-center">{{ title }}</div>
    <div class="header-right">
      <div class="logo-box">LOGO</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps<{ title: string }>()

const timeStr = ref('')
const dateStr = ref('')
const weather = ref('晴 23℃')
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

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
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
