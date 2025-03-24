<template>
  <button @click="handleClick" :disabled="isLoading">
    <componentSpinner v-if="isLoading" :size="props.size" :thicknesses="props.thicknesses" />
    <slot v-else></slot>
  </button>
</template>

<style scoped>
button {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<script lang="ts" setup>
import { ref } from 'vue';
import componentSpinner from "@/components/Spinner.vue";
import { handleError,handleMsg } from "@/helper";


// 注意：action 参数为一个异步函数，点击后会尝试执行并 await ，action函数内需要进行reject(string 报错信息)或resolve(string 成功信息)处理
const props = defineProps({
  action: {
    type: Function,
    required: true,
  },
  size: {
    type: Number,
    default: 16,
  },
  thicknesses: {
    type: Number,
    default: 3,
  },
});


const isLoading = ref(false);

const handleClick = async () => {
  return new Promise(async (resolve, reject) => {
    console.log("ButtonWithSpinner.handleClick");
    // 验证 props.action 是否为函数
    if (typeof props.action !== 'function') {
      handleError(`props.action is not a function`);
      return;
    }
    isLoading.value = true;
    try {
      const sucess_message = await props.action()
      if (sucess_message) {
        handleMsg(sucess_message)
      }
    } catch (error) {
      handleError(error as string);
    } finally {
      isLoading.value = false;
      resolve(null)
    }
  })
};
</script>