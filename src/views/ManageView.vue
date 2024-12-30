<script setup lang="ts">
import { ref, onBeforeMount, provide, watch } from "vue";
import { useRouter } from 'vue-router';

import FullCenter from '../components/FullCenter.vue';
import Spinner from '../components/Spinner.vue';
import NodeList from '@/components/NodeList.vue';
import OperationPanel from '@/components/OperationPanel.vue';

import { handleError, handleMsg } from "@/helper";
import { getTokenInfo, setCachedNodes, getCachedNodes } from "@/api";
import type { typeApiTokenInfoResult, typeApiNode } from "@/api";

const router = useRouter();
const tokenInfo = ref<typeApiTokenInfoResult>();

onBeforeMount(() => {
  getTokenInfo().then((value) => {
    tokenInfo.value = value as typeApiTokenInfoResult;
  }).catch((err) => {
    handleError(err);
    if (err.indexOf('401') > 0) {
      router.push('/');
    }
  });
});


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
    <FullCenter v-if="!tokenInfo">
      <Spinner :size="30" />
    </FullCenter>
    <div class="container scroll" v-if="tokenInfo">
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