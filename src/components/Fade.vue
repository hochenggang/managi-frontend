<template>
  <Transition name="fade-opacity">
    <slot />
  </Transition>
</template>

<style scoped>
/* 定义进入和离开的过渡效果 */
.fade-opacity-enter-active,
.fade-opacity-leave-active {
  transition: opacity 0.25s ease-in-out;
}

/* 进入时的初始状态 */
.fade-opacity-enter-from {
  opacity: 0;
}

/* 离开时的最终状态 */
.fade-opacity-leave-to {
  opacity: 0;
}
</style>