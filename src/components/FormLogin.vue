<script setup lang="ts">

import { ref, computed, reactive } from 'vue'


import { initAdmin, loginAdmin, getCachedToken, setCachedToken } from "@/api";
import type { typeApiUser, typeApiAdminLoginResult } from "@/api";

import ButtonWithSpinner from "@/components/ButtonWithSpinner.vue";

import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  adminCount: {
    type: Number,
    default: 1
  }
})

const adminCount = ref(props.adminCount)

const title = computed(() => {
  return adminCount.value > 0 ? '登录到控制平面' : '注册为管理员'
})

const user = reactive<typeApiUser>({ 'username': '', 'password': '' })

const handleInit = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    if (user.username.length < 3 || user.password.length < 6) {
      reject('用户名或密码长度太短')
      return
    }
    initAdmin(user)
      .then((msg) => {
        adminCount.value = 1
        resolve('注册成功')
      })
      .catch((err) => {
        reject(err)
      })
  });
}



const handleLogin = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    if (user.username.length < 3 || user.password.length < 6) {
      reject('用户名或密码长度太短')
      return
    }
    loginAdmin(user)
      .then((value) => {
        value = value as typeApiAdminLoginResult
        // 保存 token ,重定向到 /#/manage
        setCachedToken(value.access_token)
        resolve('登录成功 ')
        router.push('/manage')
      })
      .catch((err) => {
        if(err.indexOf('401') > 0){
          reject('用户名或密码错误')
        }else{
          reject(err)
        }
      })
  });
}

</script>

<template>
  <div class="inputs">
    <h2 class="inputs-title">{{ title }}</h2>
    <div class="inputs-box">
      <input class="inputs-input" :class="{ 'inputs-input-alert': user.username.length < 3 }" type="text"
        placeholder="输入用户名" v-model="user.username" autofocus>
      <input class="inputs-input" :class="{ 'inputs-input-alert': user.password.length < 6 }" type="text"
        placeholder="输入密码" v-model="user.password">
    </div>
    <div class="inputs-buttons">
      <ButtonWithSpinner v-if="adminCount > 0" class="inputs-button" :action="handleLogin">
        登录</ButtonWithSpinner>
      <ButtonWithSpinner v-else class="inputs-button" :action="handleInit">
        注册</ButtonWithSpinner>
    </div>
  </div>
</template>


<style>
.inputs {
  display: flex;
  justify-content: baseline;
  align-items: center;
}

.inputs-box {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: baseline;
}

.inputs-input {
  margin: 0.15rem 0;
  background: transparent;
  padding: 0.25rem;
  text-align: left;
  width: 100%;
  font-size: 1rem;
  font-weight: lighter;
}

.inputs-input-alert {
  color: var(--color-accent);
}
</style>