<script setup lang="ts">
// 本组件封装了输入后端地址的界面，进行测试正常后，回到父组件的ok方法，输入checkApiHost的结果

import { ref } from 'vue'
import { checkApiHost, getCachedApiHost, setCachedApiHost } from "@/api";

import ButtonWithSpinner from "@/components/ButtonWithSpinner.vue";


const emits = defineEmits(['ok'])

const title = ref('输入控制平面的地址')
const inputApiBase = ref<string>('')

const testApi = async () => {
  return new Promise(async (resolve, reject) => {
    if (inputApiBase.value.indexOf('http') != 0) {
      reject('请输入正确的 http(s) 地址')
      return
    }
    const value = await checkApiHost(inputApiBase.value)
    if (value === null) {
      reject(`${inputApiBase.value} 不可用，请重试`)
    } else {
      setCachedApiHost(inputApiBase.value)
      resolve(null)
      emits('ok', value)
    }
  });

}


</script>

<template>
  <div class="inputs">
    <h2 class="inputs-title">{{ title }}</h2>
    <div class="inputs-box">
      <input class="inputs-input" type="text" placeholder="输入Hostname[:port]" v-model="inputApiBase" autofocus>
    </div>

    <div class="inputs-buttons">
      <ButtonWithSpinner class="inputs-button" :action="testApi">
        测试
      </ButtonWithSpinner>
    </div>
  </div>
</template>
