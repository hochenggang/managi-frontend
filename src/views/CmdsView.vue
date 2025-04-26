<template>
  <main class="panel ">
    <div v-if="Object.keys(nodesStore.nodes).length > 0">
      <div class="bar ">
        <div v-auto-animate class="buttons shortcuts ">
          <span class="shortcuts-note shortcut">{{ t("cmdPanel.shortcut") }}</span>
          <button class="small-button shortcut" v-for="(shortcut, index) in shortcuts" :key="index"
            @click="fillCommand(shortcut.label, shortcut.cmd)" @mouseover="hoverIndex = index"
            @mouseleave="hoverIndex = -1">
            {{ shortcut.label }}
            <Fade>
              <IconDelete class="delete-icon" v-if="hoverIndex === index" @click.stop="deleteShortcut(index)" />
            </Fade>
          </button>
          <button class="small-button shortcut" @click="startAddShortcut">+</button>
        </div>
      </div>
      <div class="command-container ">

        <textarea v-model="command" :placeholder="t('cmdPanel.commandPlaceholder')" class="command-input"></textarea>

        <Modal @close="showAddShortcutModal = false" v-if="showAddShortcutModal">
          <h2>{{ t("cmdPanel.saveShortCut") }}</h2>
          <input class="shortcut-input" v-model="newShortcutLabel"
            :placeholder="t('cmdPanel.saveShortCutPlaceholder')" />
          <div class="buttons">
            <button @click="confirmAddShortcut">{{ t("cmdPanel.confirmAddShortcut") }}</button>
            <button @click="showAddShortcutModal = false">{{ t("cmdPanel.cancelShortCut") }}</button>
          </div>
        </Modal>

        <ButtonWithSpinner class="execute-button" :action="executeCommand">

          {{ t("cmdPanel.executeCommand") }}
        </ButtonWithSpinner>
        <ul v-auto-animate class="results">
          <li v-for="result in executionResults" :key="generateNodeId(result.node)" class="result">
            <strong :class="{ 'success': result.success, 'failed': !result.success }">
              {{ nodesStore.getNodeById(generateNodeId(result.node)).name }}
            </strong>
            <div class="output-block" v-show="result.output.join('').length > 0">
              <pre><code>{{ result.output.join('\n') }}</code><button class=" small-button copy-button" @click="copyCode(result.output.join(''))">Copy</button></pre>
            </div>
            <div class="output-block error-block" v-show="result.error.join('').length > 0">
              <pre><code>{{ result.error.join('\n') }}</code><button class=" small-button copy-button" @click="copyCode(result.error.join(''))">Copy</button></pre>
            </div>
          </li>
        </ul>
      </div>

    </div>
    <div class="full-center" v-if="nodesStore.nodes && Object.keys(nodesStore.nodes).length === 0">
      <p>{{ t("cmdPanel.addNodeToContinue") }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import Modal from "@/components/Modal.vue";
import ButtonWithSpinner from "@/components/ButtonWithSpinner.vue";
import IconDelete from "@/components/icons/IconDelete.vue";
import Fade from "@/components/Fade.vue";
import { useNodesStore, generateNodeId } from '@/stores/nodesStore';
import { handleError, handleMsg } from "@/helper";
import { testSSH } from '@/api';
import type { typeCmdsTestResult, typeApiNode } from '@/api';


import { useI18n } from 'vue-i18n'

const { t } = useI18n()


const nodesStore = useNodesStore();


const command = ref('');
const executionResults = ref<typeCmdsTestResult[]>();
const shortcuts = ref<{ label: string; cmd: string }[]>([]);
const newShortcutLabel = ref('');
const showAddShortcutModal = ref(false);
const hoverIndex = ref(-1);


onMounted(() => {
  const savedShortcuts = localStorage.getItem('shortcuts');
  if (savedShortcuts) {
    shortcuts.value = JSON.parse(savedShortcuts);
  } else {
    // 设置初始化的一些快捷命令
    shortcuts.value = [{ "label": "Status", "cmd": "system_info=$(uname -a | awk '{print $1, $2, $3}')\ncpu_info=$(grep -m 1 \"model name\" /proc/cpuinfo | cut -d ':' -f 2 | sed 's/^ *//')\ncpu_cores=$(grep -c ^processor /proc/cpuinfo)\ncpu_usage=$(top -bn1 | grep \"Cpu(s)\" | sed \"s/.*, *\\([0-9.]*\\)%* id.*/\\1/\" | awk '{print 100 - $1\"%\"}')\ndisk_info=$(df -h | awk '/^\\/dev\\// {print $1, $3\"/\"$2, \"(\"$5\")\"}' | tr '\\n' ';' | sed 's/;$/ /')\nmemory_total=$(free -m | awk '/Mem:/ {print $2}')\nmemory_used=$(free -m | awk '/Mem:/ {print $3}')\nmemory_percent=$(free -m | awk '/Mem:/ {printf \"%.2f%%\", ($3/$2)*100}')\n\nmax_network_info=$(awk 'NR > 2 {rx+=$2; tx+=$10} END {printf \"%.2fG|%.2fG\", rx/1024/1024/1024, tx/1024/1024/1024}' /proc/net/dev)\nnetwork_in=$(echo \"$max_network_info\" | cut -d '|' -f1)\nnetwork_out=$(echo \"$max_network_info\" | cut -d '|' -f2)\nload_info=$(awk '{printf \"%.2f/%.2f/%.2f\", $1, $2, $3}' /proc/loadavg)\nprocess_count=$(ps -e | wc -l)\ntcp_connections=$(ss -t | grep -c ESTAB)\nudp_connections=$(ss -u | grep -c UNCONN)\nuptime_seconds=$(awk '{print int($1)}' /proc/uptime)\nuptime_days=$((uptime_seconds / 86400))\necho \"System: $system_info\"\necho \"CPU: $cpu_info $cpu_cores Virtual Core ($cpu_usage)\"\necho \"Disk: $disk_info\"\necho \"Memery: $memory_used\"M\"/$memory_total\"M\" ($memory_percent)\"\necho \"Trafic: IN $network_in OUT $network_out\"\necho \"Load: $load_info\"\necho \"Process Num: $process_count\"\necho \"Connections: TCP $tcp_connections UDP $udp_connections\"\necho \"Uptime: $uptime_days Days\"" }, { "label": "Change Password", "cmd": "# Change current user's password to Aabbcc\necho \"$(whoami):Aabbcc\" | sudo chpasswd" }]
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
  }
});


const fillCommand = (label: string, cmd: string) => {
  command.value = cmd;
};

const startAddShortcut = () => {
  if (command.value.length < 2) {
    handleError(t("cmdPanel.noCmd"));
  } else {
    showAddShortcutModal.value = true;
  }
};

const confirmAddShortcut = () => {
  if (newShortcutLabel.value && command.value) {
    const newShortcut = { label: newShortcutLabel.value, cmd: command.value };
    shortcuts.value.push(newShortcut);
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
    newShortcutLabel.value = '';
    showAddShortcutModal.value = false;
  } else {
    handleError(t("cmdPanel.shortcutNameRequired"));
  }
};

const deleteShortcut = (index: number) => {
  const yes = confirm(t("cmdPanel.shortcutDeleteConfirm"));
  if (yes) {
    shortcuts.value.splice(index, 1);
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
  }
};

const executeCommand = async () => {
  if (command.value.length < 2) {
    throw t("cmdPanel.emptyCmd");
  }
  if (nodesStore.selectedNodes.length === 0) {
    throw t("cmdPanel.nothingSelected");
  }
  executionResults.value = [];
  for (const node of nodesStore.getSelectedNodes) {
    try {
      const result = await testSSH(node, command.value.split('\n')) as typeCmdsTestResult;
      executionResults.value.push(result);
    } catch (error: any) {
      console.log(error);
      handleError(error);
    }
  }
};


const copyCode = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    handleMsg(t("cmdPanel.copied"))
  }).catch(err => {
    handleError(t("cmdPanel.copyError") + err);
  });
};
</script>

<style scoped>
.panel {
  background-color: var(--color-bg);
}



.shortcuts {
  margin: 0.5rem 0;
  flex-wrap: no-wrap;
  justify-content: left;
}

.shortcuts-note {
  font-size: 0.85rem;
  color: var(--color-font-1);
}


.shortcut {
  flex-shrink: 0;
  width: auto;
  transition: all 0.2s ease-in-out;
}

.shortcut-input {
  margin: 0.5rem 0;
  line-height: 1.5rem;
}

.delete-icon {
  cursor: pointer;
  width: 0.65rem;
  height: 0.6rem;
}



.command-container {
  padding: 0.5rem;
}

.command-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  background-color: var(--color-background-3);
  font-size: 0.8rem;
}

.execute-button {
  font-size: 0.8rem;
}

.results {
  margin: 0;
  padding: 0;
  margin-top: 0.5rem;
  list-style: none;
}

.text-line {
  font-size: 0.8rem;
}

.full-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 20rem);
  height: 100%;
}

.success {
  font-weight: bold;
  color: var(--color-green);
}

.failed {
  font-weight: bold;
  color: var(--color-red);
}

.result {
  padding: 0.5rem;
  background-color: var(--color-background-3);
  border-radius: 5px;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.output-block {
  margin: 0.5rem 0;
  position: relative;
  background-color: #f4f4f4;
  border-radius: 5px;
  overflow-x: auto;
}

.output-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 0.75rem 0;
  padding-left: 1rem;
}

.output-block code {
  display: block;
  font-family: monospace;
  font-size: 0.8rem;
  line-height: 1;
}


.output-block::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 0.5rem;
  height: 100%;
  background-color: #e0e0e0;
  border-right: 1px solid #ccc;
}

.error-block::before {
  background-color: var(--color-orange);
}

.copy-button {
  width: auto;
  min-width: 0.5rem;

  position: absolute;
  top: 0.5rem;
  right: 0.5rem;


}
</style>