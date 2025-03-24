<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Bg from './components/Bg.vue'

</script>

<template>
  <notifications position="top right" />
  <RouterView />
  <Bg />
</template>

<style>

</style>
