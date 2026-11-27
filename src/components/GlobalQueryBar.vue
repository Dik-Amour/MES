<template>
  <!-- 全局查询条：面包屑下方统一的组织切换（仅 UI 展示） -->
  <div class="global-query-bar">
    <span class="global-query-bar__title">查询条件</span>
    <div class="global-query-bar__org">
      <span class="global-query-bar__org-label">所属组织</span>
      <a-select
        v-model:value="currentOrg"
        class="global-query-bar__org-select"
        :options="orgOptions"
        show-search
        option-filter-prop="label"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/** 可选组织 */
const orgOptions = [
  { value: '安丘材料成型中心', label: '安丘材料成型中心' },
  { value: '寒亭材料成型中心', label: '寒亭材料成型中心' },
  { value: '滨海铸造厂', label: '滨海铸造厂' }
]

// 仅 UI 展示，暂不联动各页面查询
const currentOrg = ref('寒亭材料成型中心')
</script>
