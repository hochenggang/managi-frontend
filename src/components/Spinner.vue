<template>
  <div class="loading-container" :style="{
    'width': props.size + 'px',
    'height': props.size + 'px',
  }">
    <div class="loading-spinner" :style="{
      'border': props.thicknesses + 'px solid var(--color-loading-1)',
      'border-top': props.thicknesses + 'px solid var(--color-border-1)',
    }"></div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  size: {
    type: Number,
    default: 20,
  },
  thicknesses: {
    type: Number,
    default: 4,
  }
});
</script>

<style scoped>
.loading-container {
  position: relative;
}

.loading-spinner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>