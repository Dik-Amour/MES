<template>
  <div class="pda-page">
    <!-- 顶部标题栏 -->
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">砂芯入库</div>
      <div class="pda-header-right"></div>
    </div>

    <!-- 内容区域 -->
    <div class="pda-content">
      <div class="empty-state">
        <InboxOutlined class="empty-icon" />
        <div class="empty-text">砂芯入库页面开发中...</div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="pda-footer">
      <a-button type="primary" block size="large" class="submit-btn" disabled>
        <CheckOutlined /> 确认入库
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.pda-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
}

.pda-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 100;
}

.pda-header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.pda-header-left:hover {
  background: rgba(255, 255, 255, 0.2);
}

.pda-header-title {
  flex: 1;
  text-align: center;
}

.pda-header-right {
  width: 40px;
}

.pda-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #d9d9d9;
}

.empty-text {
  font-size: 16px;
}

.pda-footer {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}
</style>
