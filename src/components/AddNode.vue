<template>
  <Modal @close="emits('close')">
    <h2>添加节点</h2>
    <form @submit.prevent="handleSubmit">
      <label>
        备注:
        <input v-model="newNode.name" placeholder="输入服务器别名" required />
      </label>
      <label>
        域名或IP地址:
        <input v-model="newNode.ip" placeholder="输入服务器地址: IPV4/IPV6/DOMAIN" required />
      </label>
      <label>
        SSH 端口:
        <input v-model="newNode.port" type="number" placeholder="输入SSH端口" required />
      </label>
      <label>
        SSH 用户名:
        <input v-model="newNode.ssh_username" placeholder="输入用户名" required />
      </label>
      <label>
        认证类型:
        <select v-model="newNode.auth_type" required>
          <option value="password">密码认证</option>
          <option value="key">密钥认证</option>
        </select>
      </label>
      <label>
        密码或密钥:
        <textarea v-model="newNode.auth_value" :placeholder="newNode.auth_type === 'password' ? '输入密码' : '输入密钥'"
          required></textarea>
      </label>
      <button type="submit">保存</button>
      <button type="button" @click="$emit('close')">取消</button>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import Modal from "@/components/Modal.vue";
import type { typeApiNode } from "@/api";

const emits = defineEmits(['addNode', 'close']);
const props = defineProps({
  node: {
    type: Object as () => typeApiNode,
    default: () => ({
      name: '',
      ip: '',
      port: 22,
      ssh_username: 'root',
      auth_type: 'password',
      auth_value: '',
    })
  }
});

const newNode = ref<typeApiNode>(JSON.parse(JSON.stringify(props.node)));

const handleSubmit = () => {
  emits('addNode', newNode.value);
};
</script>

<style scoped>
h2 {
  width: 100%;
  text-align: center;
  font-size: 1rem;
}

form {
  display: flex;
  flex-direction: column;
}


input,
select,
button {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}

label {
  font-size: 0.7rem;
  color: #555;
}
</style>