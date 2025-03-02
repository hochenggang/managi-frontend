<template>
    <Transition name="fade-width">
      <slot />
    </Transition>
  </template>
  
  <style scoped>
  .fade-width-enter-active,
  .fade-width-leave-active {
    transition: opacity 0.25s ease, width 0.25s ease;
  }
  
  .fade-width-enter-from,
  .fade-width-leave-to {
    opacity: 0;
    width: 0;
  }
  </style>