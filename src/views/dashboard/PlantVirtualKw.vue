<template>
  <div class="kw-dashboard">
    <!-- 本地标题栏（不引用公共样式） -->
    <div class="page-header">
      <div class="page-header-logo">
        <img src="@/assets/image/logo.png" alt="" class="page-logo-img" />
      </div>
      <h1 class="page-header-title">厂区虚拟产线大屏—造型三线KW</h1>
    </div>

    <!-- 产线图例 -->
    <div class="flow-legend">
      <span class="fl-item" v-for="l in flowLegends" :key="l.name">
        <i class="fl-line" :class="'fl-' + l.type" :style="{ '--c': l.color }"></i>
        <span class="fl-name">{{ l.name }}</span>
      </span>
    </div>

    <div class="kw-grid">
      <!-- 左侧：一个模块 -->
      <div class="col col-left">
        <div class="chart-card">
          <div class="chart-header"><span class="chart-title">熔炼</span></div>
          <div class="chart-body img-body">
            <img :src="meltingImg" class="proc-img" alt="熔炼工序图" />
          </div>
        </div>
      </div>

      <!-- 中间：上下结构（上 3:1 两模块 + 下一个模块） -->
      <div class="col col-mid">
        <div class="mid-row">
          <div class="chart-card">
            <div class="chart-header"><span class="chart-title">造型</span></div>
            <div class="chart-body img-body">
              <img :src="moldingImg" class="proc-img" alt="造型工序图" />
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header"><span class="chart-title">砂处理</span></div>
            <div class="chart-body img-body">
              <img :src="sandImg" class="proc-img" alt="砂处理工序图" />
            </div>
          </div>
        </div>
        <div class="chart-card mid-bottom">
          <div class="chart-header"><span class="chart-title">制芯</span></div>
          <div class="chart-body img-body">
            <img :src="coreImg" class="proc-img" alt="制芯工序图" />
          </div>
        </div>
      </div>

      <!-- 右侧：一个模块 -->
      <div class="col col-right">
        <div class="chart-card">
          <div class="chart-header"><span class="chart-title">清理</span></div>
          <div class="chart-body img-body">
            <img :src="cleaningImg" class="proc-img" alt="清理工序图" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import meltingImg from '@/assets/image/熔炼工序-完整图.png'
import moldingImg from '@/assets/image/造型-完整图.png'
import sandImg from '@/assets/image/砂处理.png'
import coreImg from '@/assets/image/制芯-完整图.png'
import cleaningImg from '@/assets/image/清理.png'

// 产线图例（线型 + 含义）
const flowLegends = [
  { name: '轨道线', type: 'solid', color: '#333333' },
  { name: 'AGV转运线', type: 'dashed', color: '#333333' },
  { name: '行车线', type: 'dashdot', color: '#4472c4' },
  { name: '异常线', type: 'dashed', color: '#ff4d4f' },
  { name: '人工转运线', type: 'dotted', color: '#70ad47' }
]
</script>

<style scoped>
.kw-dashboard {
  padding: 8px;
  background: #f0f2f5;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}

/* 产线图例 */
.flow-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 38px;
  padding: 6px 0 10px;
}

.fl-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fl-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}

/* 线型示例 */
.fl-line {
  display: inline-block;
  width: 52px;
  height: 0;
}

.fl-solid {
  height: 2px;
  background: var(--c);
}

.fl-dashed {
  border-top: 2px dashed var(--c);
}

.fl-dotted {
  border-top: 2px dotted var(--c);
}

.fl-dashdot {
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    var(--c) 0 9px,
    transparent 9px 14px,
    var(--c) 14px 16px,
    transparent 16px 21px
  );
}

/* 左中右三栏 */
.kw-grid {
  display: grid;
  grid-template-columns: 2fr 6fr 4fr;
  gap: 8px;
  height: calc(100vh - 160px);
  min-height: 560px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

/* 左右列的单个模块撑满整列高度 */
.col > .chart-card {
  flex: 1;
  min-height: 0;
}

/* 中间：上排 3:1 两个模块 */
.mid-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

/* 中间：下面一个模块占满剩余高度 */
.mid-bottom {
  flex: 1;
  min-height: 0;
}

.chart-card {
  background: #fff;
  border-radius: 4px;
  padding: 8px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chart-header {
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.chart-title {
  background: #fff;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  border-radius: 2px;
  white-space: nowrap;
}

.chart-body {
  flex: 1;
  min-height: 0;
}

/* 工序图片容器：图片等比完整展示 */
.img-body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border-radius: 3px;
}

.proc-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* 本地标题栏（独立，不依赖公共样式） */
.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  position: relative;
}

.page-header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 4px 12px;
  flex-shrink: 0;
  background: #06141d;
  border: 1px solid rgba(0, 190, 236, 0.35);
  border-radius: 4px;
  box-sizing: border-box;
  overflow: hidden;
}

.page-logo-img {
  display: block;
  height: 100%;
  width: auto;
  max-width: 150px;
  object-fit: contain;
  object-position: center;
}

.page-header-title {
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 2px;
  white-space: nowrap;
}
</style>
