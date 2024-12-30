<script setup lang="ts">

import { ref } from "vue";
import FormLogin from '../components/FormLogin.vue'
import FormApiBase from '../components/FormApiBase.vue'
import FullCenter from '../components/FullCenter.vue'
import Spinner from '../components/Spinner.vue'


import { checkApiHost, getCachedApiHost } from "@/api";
import type { typeApiPingResult } from "@/api";

import { handleError, handleMsg } from "@/helper";

const visibleApiHostForm = ref(false)
const apiPingResult = ref<typeApiPingResult>()

checkApiHost(getCachedApiHost()).then((value) => {
  if (value === null) {
    handleError(`默认的控制平面 ${getCachedApiHost()} 不可用，请手动指定`)
    visibleApiHostForm.value = true
  } else {
    apiPingResult.value = value
    if (apiPingResult.value.pong === 0) {
      handleMsg('请您注册为管理员')
    }
  }
})


// ApiHostForm 组件完成任务后的回调
const emitApiHostForm = (value: typeApiPingResult) => {
  apiPingResult.value = value
  visibleApiHostForm.value = false
  handleMsg('新的控制平面连接成功')
  if (apiPingResult.value.pong === 0) {
    handleMsg('请您注册为管理员')
  }
}

</script>

<template>
  <main>
    <FullCenter v-if="visibleApiHostForm">
      <FormApiBase @ok="emitApiHostForm" />
    </FullCenter>

    <FullCenter v-if="!visibleApiHostForm && !apiPingResult">
      <Spinner :size="30" />
    </FullCenter>

    <FullCenter v-if="!visibleApiHostForm && apiPingResult">
      <FormLogin :admin-count="apiPingResult?.pong" />
    </FullCenter>
  </main>
</template>


<style>
.inputs-title {
  width: 100%;
  text-align: center;
}

.inputs {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 15rem;
}

.inputs-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: baseline;
}

.inputs-input {
  margin-bottom: 0.2rem;
  background: transparent;
  padding: 0.5rem;
  text-align: left;
  width: 100%;
  font-size: 1rem;
  line-height: 1.2rem;

}

.inputs-input:focus {
  outline: none;
}


.inputs-buttons {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
}


.inputs-button {
  font-weight: lighter;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1.2rem;
  padding: 0.5rem;
}
</style>