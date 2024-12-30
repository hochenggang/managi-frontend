<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Bg from './components/Bg.vue'
// import Notifications from '@kyvg/vue3-notification'
</script>

<template>
  <notifications position="top right" />
  <RouterView />
  <Bg />
</template>

<style>
select,
button,
input,
textarea {
  display: inline-block;
  line-height: 1.2rem;
  font-size: 1rem;
  text-align: center;
  color: var(--color-font-1);
  border-radius: 0.2rem;
  border: 1.25px solid var(--color-blue);
  padding: 0.25rem 0.5rem;
  min-width: 5rem;
  width: 100%;
  background-color: var(--color-background-1);
  background-repeat: no-repeat;
  background-position: center;
  text-decoration: none;
  box-sizing: border-box;
  cursor: pointer;
  overflow: visible;
  outline: none;
}


button:hover {
  color: var(--color-blue);
  text-decoration: none;
}

input,
textarea {
  cursor: text;
}

textarea {
  text-align: left;
}

h2 {
  font-size: 1.25rem;
  color: var(--color-font-2);
  font-weight: bold;
  text-align: center;
}

.buttons {
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}
</style>
