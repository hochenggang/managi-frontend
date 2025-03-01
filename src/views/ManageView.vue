<script setup lang="ts">
import { ref, onBeforeMount, provide, watch } from "vue";
import { useRouter } from 'vue-router';

import FullCenter from '../components/FullCenter.vue';
import Spinner from '../components/Spinner.vue';
import NodeList from '@/components/NodeList.vue';
import OperationPanel from '@/components/OperationPanel.vue';

import { handleError, handleMsg } from "@/helper";
import {  setCachedNodes, getCachedNodes } from "@/api";
import type { typeApiNode } from "@/api";

const router = useRouter();


const nodes = ref<Record<string, typeApiNode>>(getCachedNodes());

watch(nodes, () => {
  setCachedNodes(nodes.value);
  handleMsg('节点数据已更新到浏览器 LocalStorage');
}, { deep: true });

const selectedNodes = ref<string[]>([]);
provide('selectedNodes', selectedNodes);
provide('nodes', nodes);
</script>

<template>
  <main>
    <div class="container scroll">
      <NodeList />
      <OperationPanel />
    </div>
  </main>
</template>

<style>
.container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
}
</style>