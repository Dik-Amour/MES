<template>
  <a-empty :description="description">
    <template #image>
      <slot name="image">
        <a-image
          :preview="false"
          src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
          :width="imageWidth"
        />
      </slot>
    </template>
    <template v-if="$slots.extra" #extra>
      <slot name="extra"></slot>
    </template>
  </a-empty>
</template>

<script setup lang="ts">
interface Props {
  description?: string
  imageWidth?: number
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  imageWidth: 100
})
</script>

<style scoped>
</style>
