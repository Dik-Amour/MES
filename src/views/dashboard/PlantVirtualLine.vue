<template>
  <div class="plant-virtual">
    <!-- 顶部导航 + 标题 -->
    <DashboardHeader title="厂区虚拟产线大屏" />
    <div class="top-nav">
      <button
        v-for="n in lineNavs"
        :key="n"
        class="nav-btn"
        @click="goLine(n)"
      >{{ n }}</button>
    </div>

    <!-- 产线工序工位图（整图展示） -->
    <img :src="flowImg" class="flow-img" alt="材料成型工序工位图" />
  </div>
</template>

<script setup lang="ts">
import DashboardHeader from './DashboardHeader.vue'
import flowImg from '@/assets/image/材料成型工序工位图260228.jpg'
import { useRouter } from 'vue-router'

const router = useRouter()

// 八个产线跳转按钮（目标页面待创建）
const lineNavs = [
  '造型一线大件',
  '造型一线中件',
  '造型二线大件',
  '造型二线中件',
  '造型三线KW',
  '造型三线HWS',
  '造型四线中件',
  '造型四线大件'
]

const goLine = (line: string) => {
  if (line === '造型三线KW') {
    router.push('/dashboard/plant-virtual-kw')
  }
}
</script>

<style scoped>
.plant-virtual {
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
  min-width: 1760px;
}

/* 顶部导航（与厂区大屏一致） */
.top-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 40px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.nav-btn {
  background: #fff;
  border: 1px solid #4472c4;
  color: #4472c4;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 28px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(68, 114, 196, 0.12);
}

.nav-btn:hover {
  background: #4472c4;
  color: #fff;
  box-shadow: 0 2px 8px rgba(68, 114, 196, 0.35);
  transform: translateY(-1px);
}

/* 整图展示 */
.flow-img {
  display: block;
  width: 100%;
  border: 1px solid #4472c4;
  border-radius: 4px;
}

</style>
