<template>
  <div class="plant-virtual">
    <!-- 本地标题栏（不引用公共样式） -->
    <div class="page-header">
      <div class="page-header-logo">
        <img src="@/assets/image/logo.png" alt="" class="page-logo-img" />
      </div>
      <h1 class="page-header-title">厂区虚拟产线大屏</h1>
    </div>
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
  background: #f0f2f5;
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
