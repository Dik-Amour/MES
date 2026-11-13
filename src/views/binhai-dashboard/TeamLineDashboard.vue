<script setup lang="ts">
import DashboardHeader from '@/views/dashboard/DashboardHeader.vue'
</script>

<template>
  <!-- 班组产线可视化：暂未确定布局，先搭页面壳（标题栏 + 占位面板） -->
  <div class="dashboard-container">
    <DashboardHeader title="班组产线可视化" variant="fui" />

    <div class="data-panel" style="min-height: 420px">
      <div class="corner-tl"></div>
      <div class="corner-tr"></div>
      <div class="corner-bl"></div>
      <div class="corner-br"></div>
      <div class="panel-header">
        <div class="panel-icon">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H8a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h3 class="panel-title">班组产线可视化</h3>
      </div>

      <div class="chart-container team-placeholder">
        <span>页面建设中</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="./dashboard-theme.css"></style>

<style scoped>
.team-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: rgba(169, 201, 212, 0.72);
  font-size: 14px;
  letter-spacing: 3px;
}

.team-placeholder::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px dashed rgba(0, 191, 235, 0.35);
  border-radius: 4px;
  pointer-events: none;
}
</style>
