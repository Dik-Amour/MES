<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">砂芯虚拟库测试</div>
      <div class="pda-header-right"></div>
    </div>

    <div class="pda-content test-content">
      <div class="test-card">
        <h3>砂芯虚拟库修改测试</h3>
        <div class="change-list">
          <div v-for="item in changes" :key="item" class="change-item">
            <CheckCircleOutlined />
            <span>{{ item }}</span>
          </div>
        </div>
      </div>

      <div class="test-card">
        <h3>测试入口</h3>
        <a-button type="primary" block size="large" @click="router.push('/pda/manual-transfer')">
          打开人工流转页面
        </a-button>
        <a-button block size="large" @click="router.push('/pda/menu')">
          返回PDA菜单
        </a-button>
      </div>

      <div class="test-card">
        <h3>功能说明</h3>
        <p>芯架编码规则：PGE-FR-001 ~ PGE-FR-008</p>
        <p>人工流转页面支持上盖芯、挺杆芯选择和芯架绑定。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const changes = [
  '芯架编码规则已更新',
  '人工流转页面支持上盖芯、挺杆芯',
  '新增芯架层级展示'
]

const goBack = () => router.back()
</script>

<style scoped>
.test-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-card {
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.test-card h3 {
  margin: 0 0 12px;
  color: #333;
  font-size: 16px;
}

.test-card p {
  margin: 8px 0;
  color: #666;
  font-size: 13px;
  line-height: 1.7;
}

.change-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 14px;
}

.change-item .anticon {
  color: #52c41a;
}

.test-card .ant-btn + .ant-btn {
  margin-top: 10px;
}
</style>
