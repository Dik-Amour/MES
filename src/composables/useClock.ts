import { onBeforeUnmount, onMounted, ref } from 'vue'

const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

/**
 * 大屏顶部时钟：返回 HH:mm:ss 与中文日期，组件卸载时自动清理定时器。
 */
export function useClock() {
  const time = ref('')
  const date = ref('')
  let timer: number | undefined

  function tick() {
    const now = new Date()
    time.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    date.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${
      WEEK_DAYS[now.getDay()]
    }`
  }

  onMounted(() => {
    tick()
    timer = window.setInterval(tick, 1000)
  })

  onBeforeUnmount(() => {
    if (timer !== undefined) {
      window.clearInterval(timer)
    }
  })

  return { time, date }
}
