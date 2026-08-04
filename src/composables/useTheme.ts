import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'mes-theme'

export function useTheme() {
  const theme = ref<Theme>('light')

  // 从本地存储加载主题
  const loadTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme
    if (savedTheme) {
      theme.value = savedTheme
    }
  }

  // 保存主题到本地存储
  const saveTheme = (newTheme: Theme) => {
    localStorage.setItem(THEME_KEY, newTheme)
  }

  // 切换主题
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    saveTheme(theme.value)
    applyTheme()
  }

  // 应用主题到文档
  const applyTheme = () => {
    const html = document.documentElement
    if (theme.value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // 设置特定主题
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    saveTheme(newTheme)
    applyTheme()
  }

  // 监听主题变化
  watch(theme, () => {
    applyTheme()
  })

  // 初始化
  loadTheme()
  applyTheme()

  return {
    theme,
    toggleTheme,
    setTheme
  }
}
