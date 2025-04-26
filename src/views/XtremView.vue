<template>
  <div class="panel">
    <div class="bar">
      <button class="small-button" @click="handleBack">{{ t("xtermPanel.back") }}</button>
    </div>
    <!-- 终端容器 -->
    <div ref="terminalContainer" class="terminal-container" contenteditable="true">
      <div v-if="!nodesStore.currentXtremNode">
        {{ t("xtermPanel.hello") }}
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, watch, onUnmounted, onMounted, getCurrentInstance } from 'vue';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';


import { apiHost } from '@/api';
import { handleError, handleMsg } from "@/helper";
import type { typeApiNode } from '@/api';
import { useRouter } from 'vue-router';
import { useNodesStore } from '@/stores/nodesStore';
import { useI18n } from 'vue-i18n'


const router = useRouter();
const nodesStore = useNodesStore();


const { t } = useI18n()

const handleBack = () => {
  router.push({ name: 'cmds' })
}


// 终端实例
const terminal = new Terminal({
  theme: {
    background: '#002b36', // 背景色
    foreground: '#cce4f5', // 前景色（文字颜色）
    cursor: '#839496',     // 光标颜色
  },
});

// 自动尺寸调整
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);


const terminalContainer = ref<HTMLElement | null>(null);

// WebSocket 实例
let ws: WebSocket | null = null;


// 初始化 WebSocket 连接
const initWebSocket = (node: typeApiNode) => {
  if (!node) return;

  terminal.writeln(generateGreenText(`\r\nConnecting to ${nodesStore.currentXtremNode?.host}\r`));

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${apiHost}/ws`);

  ws.onopen = () => {
    ws?.send(
      JSON.stringify(node)
    );
  };

  ws.onmessage = (event) => {
    terminal.write(event.data);
  };

  ws.onclose = () => {
    terminal.writeln(generateGreenText('\r\nConnection closed.\r'));
  };

  ws.onerror = (error) => {
    terminal.writeln(generateGreenText(`\r\nWebSocket error: ${error}\r`));
  };
};


const generateGreenText = (text: string) => {
  return `\x1B[32m${text}\x1B[0m`;
}
// 初始化终端
const initTerminal = () => {
  if (terminalContainer.value) {

    terminal.open(terminalContainer.value);
    fitAddon.fit();

    terminal.focus();

    // 绑定输入事件
    terminal.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    terminal.onSelectionChange(() => {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).then(() => {
          handleMsg(t("cmdPanel.copied"))
        }).catch((err) => {
          console.error('Error:', err);
        });
      }
    });

  }
};


const cleanWS = () => {
  if (ws) {
    ws.close()
  }
  if (terminal) {
    terminal.dispose(); // 销毁终端实例
  }
}


watch(() => nodesStore.currentXtremNode, () => {
  if (ws && nodesStore.currentXtremNode) {
    ws.onclose = () => {
      initWebSocket(nodesStore.currentXtremNode as typeApiNode)
    }
    ws.close();
  } else {
    initWebSocket(nodesStore.currentXtremNode as typeApiNode)

  }
});


onMounted(() => {
  initTerminal();
  if (nodesStore.currentXtremNode) {
    initWebSocket(nodesStore.currentXtremNode)
  }
})


// 组件卸载时关闭 WebSocket
onUnmounted(() => {
  cleanWS()
});

</script>



<style scoped>
.panel {
  background-color: #002b36;
  color: var(--color-bg);
}

.bar {
  border-bottom: 1px solid var(--color-bg);

}

.terminal-container {
  margin: 0.5rem;
  width: calc(100% - 1rem);
  height: calc(100% - 5rem);
  box-sizing: border-box;
  color: #cce4f5;
}


.small-button {
  color: #cce4f5;
}
</style>