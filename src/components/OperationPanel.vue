<template>
  <div class="operation-panel " v-if="Object.keys(nodes).length > 0">
    <div class="shortcuts buttons">
      <span class="shortcuts-note">快捷命令</span>
      <button class="shortcut" v-for="(shortcut, index) in shortcuts" :key="index"
        @click="fillCommand(shortcut.label, shortcut.cmd)" @mouseover="hoverIndex = index"
        @mouseleave="hoverIndex = -1">
        {{ shortcut.label }}
        <Fade>
          <span class="delete-icon" v-if="hoverIndex === index" @click.stop="deleteShortcut(index)">❌</span>
        </Fade>
      </button>
      <button class="shortcut" @click="startAddShortcut">+</button>
    </div>
    <textarea v-model="command" placeholder="在此输入 Shell 命令行" class="command-input"></textarea>

    <Modal @close="showAddShortcutModal = false" v-if="showAddShortcutModal">
      <h2>保存当前命令为</h2>
      <input class="shortcut-input" v-model="newShortcutLabel" placeholder="输入快捷命令名称" autofocus />
      <div class="buttons">
        <button @click="confirmAddShortcut">确认</button>
        <button @click="showAddShortcutModal = false">取消</button>
      </div>
    </Modal>

    <ButtonWithSpinner class="execute-button" :action="executeCommand">
      开始执行
    </ButtonWithSpinner>
    <ul class="results">
      <li v-for="result in executionResults" :key="result.node.ip" class="result">
        <strong :class="{ 'success': result.success, 'failed': !result.success }">
          {{ result.node.name }}[{{ result.node.ip }}]
        </strong>
        <div class="output-block" v-show="result.output.join('').length > 0">
          <pre><code>{{ result.output.join('') }}</code><button class="copy-button" @click="copyCode(result.output.join(''))">Copy</button></pre>
        </div>
        <div class="output-block error-block" v-show="result.error.join('').length > 0">
          <pre><code>{{ result.error.join('') }}</code><button class="copy-button" @click="copyCode(result.error.join(''))">Copy</button></pre>
        </div>
      </li>
    </ul>
  </div>
  <div class="operation-panel full-center" v-if="Object.keys(nodes).length === 0">
    <p>添加一个节点以继续</p>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue';
import type { Ref } from 'vue';

import Modal from "@/components/Modal.vue";
import ButtonWithSpinner from "@/components/ButtonWithSpinner.vue";
import { handleError, handleMsg } from "@/helper";
import { testSSH } from '@/api';
import type { typeCmdsTestResult, typeApiNode } from '@/api';
import Fade from "@/components/Fade.vue";

const nodes = inject('nodes') as Ref<Record<string, typeApiNode>>;
const selectedNodes = inject('selectedNodes') as Ref<string[]>;
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
    shortcuts.value = [{ "label": "获取状态", "cmd": "# 获取系统信息\nsystem_info=$(uname -a | awk '{print $1, $2, $3}')\ncpu_info=$(grep -m 1 \"model name\" /proc/cpuinfo | cut -d ':' -f 2 | sed 's/^ *//')\ncpu_cores=$(grep -c ^processor /proc/cpuinfo)\ncpu_usage=$(top -bn1 | grep \"Cpu(s)\" | sed \"s/.*, *\\([0-9.]*\\)%* id.*/\\1/\" | awk '{print 100 - $1\"%\"}')\n\n# 获取所有 /dev/ 开头的磁盘信息\ndisk_info=$(df -h | awk '/^\\/dev\\// {print $1, $3\"/\"$2, \"(\"$5\")\"}' | tr '\\n' ';' | sed 's/;$/ /')\n\n# 获取内存信息\nmemory_total=$(free -m | awk '/Mem:/ {print $2}')\nmemory_used=$(free -m | awk '/Mem:/ {print $3}')\nmemory_percent=$(free -m | awk '/Mem:/ {printf \"%.2f%%\", ($3/$2)*100}')\n\n\n# 获取所有网卡的流量信息，并找到流量最大的网卡\nmax_network_info=$(awk 'NR > 2 {rx+=$2; tx+=$10} END {printf \"%.2fG|%.2fG\", rx/1024/1024/1024, tx/1024/1024/1024}' /proc/net/dev)\n\n# 拆分最大流量的接收和发送部分\nnetwork_in=$(echo \"$max_network_info\" | cut -d '|' -f1)\nnetwork_out=$(echo \"$max_network_info\" | cut -d '|' -f2)\n\n# 获取系统负载\nload_info=$(awk '{printf \"%.2f/%.2f/%.2f\", $1, $2, $3}' /proc/loadavg)\n\n# 获取进程数\nprocess_count=$(ps -e | wc -l)\n\n# 获取连接数\ntcp_connections=$(ss -t | grep -c ESTAB)\nudp_connections=$(ss -u | grep -c UNCONN)\n\n# 获取在线时间\nuptime_seconds=$(awk '{print int($1)}' /proc/uptime)\nuptime_days=$((uptime_seconds / 86400))\n\n# 输出信息\necho \"系统: $system_info\"\necho \"CPU: $cpu_info $cpu_cores Virtual Core ($cpu_usage)\"\necho \"硬盘: $disk_info\"\necho \"内存: $memory_used\"M\"/$memory_total\"M\" ($memory_percent)\"\necho \"流量: IN $network_in OUT $network_out\"\necho \"负载: $load_info\"\necho \"进程数: $process_count\"\necho \"连接数: TCP $tcp_connections UDP $udp_connections\"\necho \"在线: $uptime_days 天\"" }, { "label": "改密码", "cmd": "# 修改当前用户的密码为 Aabbcc\necho \"$(whoami):Aabbcc\" | sudo chpasswd" }]
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
  }
});

const fillCommand = (label: string, cmd: string) => {
  command.value = cmd;
};

const startAddShortcut = () => {
  if (command.value.length < 2) {
    handleError('输入框里面似乎没东西，无法保存为快捷命令');
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
    handleError('请输入快捷命令名称');
  }
};

const deleteShortcut = (index: number) => {
  const yes = confirm('确定要删除该快捷命令吗？');
  if (yes) {
    shortcuts.value.splice(index, 1);
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
  }
};

const executeCommand = async () => {
  if (command.value.length < 2) {
    throw '输入框里面似乎没东西';
  }
  if (selectedNodes.value.length === 0) {
    throw '似乎还没有选择节点';
  }
  executionResults.value = [];
  for (const ip of selectedNodes.value) {
    try {
      const node = nodes.value[ip] as typeApiNode;
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
    handleMsg('已复制')
  }).catch(err => {
    handleError('复制失败: ' + err);
  });
};
</script>

<style scoped>
.operation-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: calc(100% - 20rem);
  padding: 1rem;
  z-index: 2;
  height: 100%;
  overflow: auto;
}



.command-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  background-color: var(--color-background-3);
  font-size: 0.8rem;
}

.shortcuts {
  margin: 0.5rem 0;
  justify-content: left;
}

.shortcuts-note {
  font-size: 0.85rem;
  font-weight: lighter;
}

.shortcut {
  width: auto;
  min-width: 0.5rem;
  font-size: 0.8rem;
  line-height: 1rem;
  transition: all 0.2s ease-in-out;
}

.shortcut-input {
  margin: 0.5rem 0;
  line-height: 1.5rem;
}

.delete-icon {
  cursor: pointer;
  font-size: 12px;
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
  margin: 0;
  padding: 0;
  width: auto;
  min-width: 0.5rem;
  background: transparent;
  padding: 0.15rem 0.25rem;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
}
</style>