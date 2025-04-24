<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Bg from './components/Bg.vue'
import NodeList from './components/NodeList.vue'

</script>

<template>
  <notifications position="top right" />

  <div class="container scroll">
    <NodeList />
    <RouterView v-auto-animate></RouterView>
  </div>

  <Bg />
</template>

<style>

</style>
