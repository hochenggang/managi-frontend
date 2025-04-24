<template>
  <Modal @close="emits('close')">
    <h2>{{ t("addNode.title") }}</h2>
    <form @submit.prevent="handleSubmit">
      <label>
        {{ t("addNode.name") }}
        <input v-model="newNode.name" :placeholder="t('addNode.namePlaceholder')" required />
      </label>
      <label>
        {{ t("addNode.host") }}
        <input v-model="newNode.host" :placeholder="t('addNode.hostPlaceholder')" required />
      </label>
      <label>
        {{ t("addNode.port") }}
        <input v-model="newNode.port" type="number" :placeholder="t('addNode.portPlaceholder')" required />
      </label>
      <label>
        {{ t("addNode.username") }}
        <input v-model="newNode.username" :placeholder="t('addNode.usernamePlaceholder')" required />
      </label>
      <label>
        {{ t("addNode.authType") }}
        <select v-model="newNode.auth_type" required>
          <option value="password">{{ t("addNode.authTypePassword") }}</option>
          <option value="key">{{ t("addNode.authTypePrivateKey") }}</option>
        </select>
      </label>
      <label>
        {{ t("addNode.authValue") }}

        <textarea v-model="newNode.auth_value" placeholder=""
          required></textarea>
      </label>
      <button type="submit">{{ t("addNode.actions.save") }}</button>
      <button type="button" @click="$emit('close')">{{ t("addNode.actions.cancel") }}</button>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import Modal from "@/components/Modal.vue";
import type { typeApiNode } from "@/api";
import { useI18n } from 'vue-i18n'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'global'
})


const emits = defineEmits(['addNode', 'close']);
const props = defineProps({
  node: {
    type: Object as () => typeApiNode,
    default: () => ({
      name: '',
      host: '',
      port: 22,
      username: 'root',
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