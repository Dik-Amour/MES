import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  username: string
  token: string
  avatar?: string
  email?: string
  role?: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!userInfo.value)
  const username = computed(() => userInfo.value?.username || '')
  const token = computed(() => userInfo.value?.token || '')

  // 设置用户信息
  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    // 持久化到本地存储
    localStorage.setItem('user-info', JSON.stringify(info))
  }

  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = null
    localStorage.removeItem('user-info')
  }

  // 从本地存储恢复用户信息
  const restoreUserInfo = () => {
    const saved = localStorage.getItem('user-info')
    if (saved) {
      try {
        userInfo.value = JSON.parse(saved)
      } catch (error) {
        console.error('Failed to restore user info:', error)
        localStorage.removeItem('user-info')
      }
    }
  }

  // 登出
  const logout = () => {
    clearUserInfo()
  }

  // 初始化时恢复用户信息
  restoreUserInfo()

  return {
    userInfo,
    isLoggedIn,
    username,
    token,
    setUserInfo,
    clearUserInfo,
    logout,
    restoreUserInfo
  }
})
