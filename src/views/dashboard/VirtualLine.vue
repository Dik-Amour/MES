<template>
  <div class="virtual-line">
    <!-- 本地标题栏（不引用公共样式） -->
    <div class="page-header">
      <div class="page-header-logo">
        <img src="@/assets/image/logo.png" alt="" class="page-logo-img" />
      </div>
      <h1 class="page-header-title">虚拟产线</h1>
    </div>

    <div class="vl-body">
      <div class="btn-grid">
        <button
          v-for="name in devices"
          :key="name"
          class="vl-btn"
          :class="{ active: activeDevice === name }"
          @click="openDevice(name)"
        >
          {{ name }}
        </button>
      </div>

      <!-- 设备弹框（内容为制芯机弹框的副本，每个按钮均可打开） -->
      <DeviceModal v-model:open="modalOpen" :device-name="activeModalDevice" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DeviceModal from './DeviceModal.vue'

const devices = [
  '电炉',
  '制芯机',
  '浇注机',
  '表干窑',
  '砂芯立库',
  '退火炉',
  '抛丸机',
  '振芯机',
  '打磨中心',
  '喷粉烘干炉',
  '冲天炉'
]

const activeDevice = ref('')

// 设备弹框（每个按钮共用；内容为制芯机弹框的副本，后续可按设备名分支修改字段）
const activeModalDevice = ref('')
const modalOpen = computed({
  get: () => activeModalDevice.value !== '',
  set: (v: boolean) => {
    if (!v) activeModalDevice.value = ''
  }
})

const openDevice = (name: string) => {
  activeDevice.value = name
  activeModalDevice.value = name
  modalOpen.value = true
}
</script>

<style scoped>
.virtual-line {
  padding: 8px;
  background: #f0f2f5;
  min-height: calc(100vh - 90px);
  overflow-x: auto;
}

.vl-body {
  margin-top: 12px;
  padding: 24px;
  background: #f2f2f2;
  border-radius: 4px;
  min-height: 420px;
}

.btn-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.vl-btn {
  min-width: 140px;
  padding: 14px 22px;
  font-size: 14px;
  color: #333;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.vl-btn:hover {
  color: #4472c4;
  border-color: #4472c4;
}

.vl-btn.active {
  color: #fff;
  background: #4472c4;
  border-color: #4472c4;
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
