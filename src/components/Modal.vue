<template>
  <div class="modal-overlay" @click="emits('close');">
    <div class="modal" @click.stop>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const emits = defineEmits(['close'])

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  cursor: pointer;
}

.modal {
  border-radius: 3px;
  position: absolute;
  background: var(--color-while);
}
</style>