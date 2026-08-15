<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <a-avatar :size="64" :style="{ backgroundColor: '#1890ff' }">
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
        </div>
        <h1 class="title">MES管理系统</h1>
        <p class="subtitle">现代化制造执行系统</p>
      </div>

      <a-form
        :model="formData"
        :rules="rules"
        @finish="handleLogin"
        layout="vertical"
        class="login-form"
      >
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="formData.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix>
              <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item name="remember">
          <a-checkbox v-model:checked="formData.remember">记住我</a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="demo-account">
        <a-alert type="info" show-icon>
          <template #message>
            <div class="demo-account-content">
              <span class="demo-label">演示账号</span>
              <span>
                账号：<b>admin</b>
                <a-tag
                  class="copy-tag"
                  color="blue"
                  @click="copyDemo('admin')"
                >
                  复制
                </a-tag>
              </span>
              <span>
                密码：<b>123456</b>
                <a-tag
                  class="copy-tag"
                  color="blue"
                  @click="copyDemo('123456')"
                >
                  复制
                </a-tag>
              </span>
              <a-button
                class="fill-btn"
                type="link"
                size="small"
                @click="fillDemo"
              >
                一键填入
              </a-button>
            </div>
          </template>
        </a-alert>
      </div>

      <div class="login-footer">
        <a-divider>其他登录方式</a-divider>
        <a-space :size="16">
          <a-button type="default" shape="circle" size="large">
            <WechatOutlined />
          </a-button>
          <a-button type="default" shape="circle" size="large">
            <QqOutlined />
          </a-button>
          <a-button type="default" shape="circle" size="large">
            <DingdingOutlined />
          </a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined, WechatOutlined, QqOutlined, DingdingOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const DEMO_ACCOUNT = {
  username: 'admin',
  password: '123456'
}

const formData = reactive({
  username: '',
  password: '',
  remember: false
})

// 一键填入演示账号
const fillDemo = () => {
  formData.username = DEMO_ACCOUNT.username
  formData.password = DEMO_ACCOUNT.password
  message.success('已填入演示账号')
}

// 复制文本到剪贴板
const copyDemo = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('复制成功')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  loading.value = true
  try {
    // 模拟登录请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 设置用户信息
    userStore.setUserInfo({
      username: formData.username,
      token: 'mock-token-' + Date.now()
    })
    
    message.success('登录成功')
    router.push('/')
  } catch (error) {
    message.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.demo-account {
  margin-bottom: 24px;
}

.demo-account-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.8;
}

.demo-label {
  font-weight: 600;
  color: #1677ff;
}

.copy-tag {
  margin-left: 6px;
  cursor: pointer;
}

.fill-btn {
  align-self: flex-start;
  padding-left: 0;
}

.login-footer {
  text-align: center;
}
</style>
