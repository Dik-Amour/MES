<template>
  <div class="pda-page">
    <!-- 顶部标题栏 -->
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">砂芯出库</div>
      <div class="pda-header-right"></div>
    </div>

    <!-- 内容区域 -->
    <div class="pda-content">
      <div class="empty-state">
        <ExportOutlined class="empty-icon" />
        <div class="empty-text">砂芯出库页面开发中...</div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="pda-footer">
      <a-button type="primary" block size="large" class="submit-btn" disabled>
        <CheckOutlined /> 确认出库
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ExportOutlined
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
  background: linear-gradient(135deg, #52c41a, #389e0d);
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

.pda-header-left:active {
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
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #ccc;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.pda-footer {
  background: #fff;
  padding: 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  bottom: 0;
}

.submit-btn {
  height: 44px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
}
</style>
