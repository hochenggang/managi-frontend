<template>
    <Transition name="fade-width">
      <slot />
    </Transition>
  </template>
  
  <style scoped>
  .fade-width-enter-active,
  .fade-width-leave-active {
    transition: opacity 0.15s ease-in;
  }
  
  .fade-width-enter-from {
    opacity: 0;
    width: 0;
  }
  .fade-width-leave-to {
    opacity: 0;
    width: 0;
  }
  </style>