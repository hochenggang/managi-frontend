<template>
  <div>
    <div class="wave"></div>
    <div class="wave"></div>
    <div class="wave"></div>
  </div>
</template>

<script lang="ts" setup>


</script>

<style>
/* body {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: var(--color-background-1);
} */

@keyframes gradient {
  0% {
    background-position: 0% 0%;
  }

  50% {
    background-position: 100% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}

.wave {
  background: rgb(1 1 1 / 15%);
  border-radius: 500% 500% 0 0;
  position: fixed;
  width: 200%;
  height: 3rem;
  animation: wave 10s -3s linear infinite;
  transform: translate3d(0, 0, 0);
  bottom: 0;
  left: 0;
  z-index: -1;
  opacity: 0.5;

}

.wave:nth-of-type(2) {
  bottom: -1.25em;
  animation: wave 10s linear reverse infinite;
  opacity: 0.7;
}

.wave:nth-of-type(3) {
  bottom: -2em;
  animation: wave 30s -1s reverse infinite;
  opacity: 0.9;
}

@keyframes wave {
  2% {
    transform: translateX(1);
  }

  25% {
    transform: translateX(-25%);
  }

  50% {
    transform: translateX(-50%);
  }

  75% {
    transform: translateX(-25%);
  }

  100% {
    transform: translateX(1);
  }
}
</style>
