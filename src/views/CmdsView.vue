<template>
  <main class="panel">
    <div v-if="Object.keys(nodesStore.nodes).length > 0">
      <div class="bar">
        <div v-auto-animate class="buttons shortcuts">
          <span class="shortcuts-note shortcut">{{ t("cmdPanel.shortcut") }}</span>
          <button class="small-button shortcut" v-for="(shortcut, index) in shortcuts" :key="index"
            @click="fillCommand(shortcut.label, shortcut.cmd)"
            @contextmenu.prevent="showContextMenu($event, index)">
            {{ shortcut.label }}
          </button>
          <button class="small-button shortcut" @click="startAddShortcut">+</button>
        </div>
      </div>
      <div class="command-container">

        <textarea v-model="command" :placeholder="t('cmdPanel.commandPlaceholder')" class="command-input"></textarea>

        <Modal @close="showAddShortcutModal = false" v-if="showAddShortcutModal">
          <main class="modal-content">

            <h2>{{ t("cmdPanel.saveShortCut") }}</h2>
            <input class="shortcut-input" v-model="newShortcutLabel"
              :placeholder="t('cmdPanel.saveShortCutPlaceholder')" autofocus />
            <div class="buttons">
              <button class="sucess" @click="confirmAddShortcut">{{ t("cmdPanel.confirmAddShortcut") }}</button>
              <button @click="showAddShortcutModal = false">{{ t("cmdPanel.cancelShortCut") }}</button>
            </div>
          </main>
        </Modal>

        <div v-if="showContextMenuFlag" class="context-menu" :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }">
          <div class="context-menu-item" @click="renameShortcut(contextMenuIndex)">{{ t("cmdPanel.rename") || "Rename" }}</div>
          <div class="context-menu-item danger" @click="deleteShortcut(contextMenuIndex)">{{ t("cmdPanel.delete") || "Delete" }}</div>
        </div>
        <div v-if="showContextMenuFlag" class="context-menu-overlay" @click="closeContextMenu"></div>

        <div class="action-bar">
          <ButtonWithSpinner class="execute-button" :loading="isExecuting" :action="executeCommand">
            {{ isExecuting ? t("cmdPanel.executing") : t("cmdPanel.executeCommand") }}
          </ButtonWithSpinner>
          
        </div>
        <ul v-auto-animate class="results">
          <li v-for="(result, index) in executionResults" :key="generateNodeId(result.node)" class="result">
            <div class="result-header">
              <strong :class="{ 'success': result.success, 'failed': !result.success }">
                {{ nodesStore.getNodeById(generateNodeId(result.node))?.name || result.node.host }}
              </strong>
              <span class="execution-time">{{ result.time_elapsed }}s</span>
            </div>
            <div class="output-block" v-show="result.output && result.output.length > 0">
              <pre><code>{{ result.output.join('\n') }}</code><button class="small-button copy-button" @click="copyCode(result.output.join(''))">Copy</button></pre>
            </div>
            <div class="output-block error-block" v-show="result.error && result.error.length > 0">
              <pre><code>{{ result.error.join('\n') }}</code><button class="small-button copy-button" @click="copyCode(result.error.join(''))">Copy</button></pre>
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
import { ref, computed } from 'vue';

import Modal from "@/components/Modal.vue";
import ButtonWithSpinner from "@/components/ButtonWithSpinner.vue";
import { useNodesStore, generateNodeId } from '@/stores/nodesStore';
import { handleError, handleMsg } from "@/helper";
import { batchSSH } from '@/api';
import type { typeCmdsTestResult, typeApiNode } from '@/api';


import { useI18n } from 'vue-i18n'

const { t } = useI18n()


const nodesStore = useNodesStore();


const command = ref('');
const executionResults = ref<typeCmdsTestResult[]>([]);
const shortcuts = ref<{ label: string; cmd: string }[]>([]);
const newShortcutLabel = ref('');
const showAddShortcutModal = ref(false);
const showContextMenuFlag = ref(false);
const contextMenuIndex = ref(-1);
const contextMenuPosition = ref({ x: 0, y: 0 });
const isExecuting = ref(false);

const totalCount = computed(() => nodesStore.getSelectedNodes.length);
const completedCount = ref(0);

const loadShortcuts = () => {
  const savedShortcuts = localStorage.getItem('shortcuts');
  if (savedShortcuts) {
    shortcuts.value = JSON.parse(savedShortcuts);
  } else {
    shortcuts.value = [{ "label": "Status", "cmd": "system_info=$(uname -a | awk '{print $1, $2, $3}')\ncpu_info=$(grep -m 1 \"model name\" /proc/cpuinfo | cut -d ':' -f 2 | sed 's/^ *//')\ncpu_cores=$(grep -c ^processor /proc/cpuinfo)\ncpu_usage=$(top -bn1 | grep \"Cpu(s)\" | sed \"s/.*, *\\([0-9.]*\\)%* id.*/\\1/\" | awk '{print 100 - $1\"%\"}')\ndisk_info=$(df -h | awk '/^\\/dev\\// {print $1, $3\"/\"$2, \"(\"$5\")\"}' | tr '\\n' ';' | sed 's/;$/ /')\nmemory_total=$(free -m | awk '/Mem:/ {print $2}')\nmemory_used=$(free -m | awk '/Mem:/ {print $3}')\nmemory_percent=$(free -m | awk '/Mem:/ {printf \"%.2f%%\", ($3/$2)*100}')\n\nmax_network_info=$(awk 'NR > 2 {rx+=$2; tx+=$10} END {printf \"%.2fG|%.2fG\", rx/1024/1024/1024, tx/1024/1024/1024}' /proc/net/dev)\nnetwork_in=$(echo \"$max_network_info\" | cut -d '|' -f1)\nnetwork_out=$(echo \"$max_network_info\" | cut -d '|' -f2)\nload_info=$(awk '{printf \"%.2f/%.2f/%.2f\", $1, $2, $3}' /proc/loadavg)\nprocess_count=$(ps -e | wc -l)\ntcp_connections=$(ss -t | grep -c ESTAB)\nudp_connections=$(ss -u | grep -c UNCONN)\nuptime_seconds=$(awk '{print int($1)}' /proc/uptime)\nuptime_days=$((uptime_seconds / 86400))\necho \"System: $system_info\"\necho \"CPU: $cpu_info $cpu_cores Virtual Core ($cpu_usage)\"\necho \"Disk: $disk_info\"\necho \"Memery: $memory_used\"M\"/$memory_total\"M\" ($memory_percent)\"\necho \"Trafic: IN $network_in OUT $network_out\"\necho \"Load: $load_info\"\necho \"Process Num: $process_count\"\necho \"Connections: TCP $tcp_connections UDP $udp_connections\"\necho \"Uptime: $uptime_days Days\"" }, { "label": "Change Password", "cmd": "echo \"$(whoami):Aabbcc\" | sudo chpasswd" }]
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
  }
};

loadShortcuts();


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
  closeContextMenu();
};

const showContextMenu = (event: MouseEvent, index: number) => {
  contextMenuIndex.value = index;
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  showContextMenuFlag.value = true;
};

const closeContextMenu = () => {
  showContextMenuFlag.value = false;
  contextMenuIndex.value = -1;
};

const renameShortcut = (index: number) => {
  const shortcut = shortcuts.value[index];
  const newLabel = prompt(t("cmdPanel.renameShortcut") || "Enter new name:", shortcut.label);
  if (newLabel && newLabel.trim()) {
    shortcuts.value[index].label = newLabel.trim();
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
  }
  closeContextMenu();
};

const executeCommand = async () => {
  if (command.value.length < 2) {
    throw t("cmdPanel.emptyCmd");
  }
  if (nodesStore.selectedNodes.length === 0) {
    throw t("cmdPanel.nothingSelected");
  }

  isExecuting.value = true;
  completedCount.value = 0;
  executionResults.value = [];

  const selectedNodes = nodesStore.getSelectedNodes;
  const cmds = command.value.split('\n');

  try {
    const results = await batchSSH(selectedNodes, cmds);
    executionResults.value = results;
    completedCount.value = results.length;
  } catch (error: any) {
    console.log(error);
    handleError(error);
  } finally {
    isExecuting.value = false;
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
  position: relative;
  flex-shrink: 0;
  width: auto;
  transition: all 0.2s ease-in-out;
}

.shortcut-input {
  margin: 0.5rem 0;
  line-height: 1.5rem;
}

.command-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  background-color: var(--color-background-3);
  font-size: 0.8rem;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
}

.execute-button {
  font-size: 0.8rem;
}

.execution-info {
  font-size: 0.85rem;
  color: var(--color-font-1);
}

.results {
  margin: 0;
  padding: 0;
  margin-top: 0.5rem;
  list-style: none;
}

.full-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 20rem);
  height: 100%;
}

.result {
  padding: 0.5rem;
  background-color: var(--color-background-3);
  border-radius: 5px;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.execution-time {
  font-size: 0.75rem;
  color: var(--color-font-1);
}

.success {
  font-weight: bold;
  color: var(--color-green);
}

.failed {
  font-weight: bold;
  color: var(--color-red);
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

.modal-content {
  width: 25rem;
  padding: 2rem;
}

.context-menu {
  position: fixed;
  background: var(--color-while);
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 100px;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.85rem;
}

.context-menu-item:hover {
  background: var(--color-bg);
}

.context-menu-item.danger {
  color: var(--color-red);
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.command-container {
  padding: 0.5rem;
}
</style>
