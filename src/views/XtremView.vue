<template>
  <div class="panel">
    <div class="bar">
      <button class="small-button" @click="handleBack">{{ t("xtermPanel.back") }}</button>
    </div>
    <!-- 终端容器 -->
    <div class="terminal-container">
      <div ref="terminalContainer" class="terminal" contenteditable="true">
        <div v-if="!nodesStore.currentXtremNode">
          {{ t("xtermPanel.hello") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, onMounted } from 'vue';
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

// DOM引用
const terminalContainer = ref<HTMLElement | null>(null);

// 终端相关实例
const terminal = ref<Terminal | null>(null);
const fitAddon = ref<FitAddon | null>(null);

// WebSocket相关
const ws = ref<WebSocket | null>(null);
const connectionAttempts = ref(0);
const MAX_CONNECTION_ATTEMPTS = 3;

// 心跳机制相关
const HEARTBEAT_INTERVAL = 10000; // 10秒心跳间隔
const HEARTBEAT_TIMEOUT = 10000; // 10秒心跳超时
const HEARTBEAT_MESSAGE = "";
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let lastHeartbeatTime = 0;

// 生成带颜色的终端文本
const generateGreenText = (text: string) => `\x1B[32m${text}\x1B[0m`;
const generateRedText = (text: string) => `\x1B[31m${text}\x1B[0m`;

// 返回按钮处理
const handleBack = () => {
  cleanupResources();
  router.push({ name: 'cmds' });
};

// 初始化终端
const initializeTerminal = () => {
  try {
    terminal.value = new Terminal({
      theme: {
        background: '#002b36',
        foreground: '#cce4f5',
        cursor: '#839496',
      },
      allowProposedApi: true,
      disableStdin: false,
      convertEol: true,
      cursorBlink: true,
      scrollback: 1000
    });

    fitAddon.value = new FitAddon();
    terminal.value.loadAddon(fitAddon.value);

    if (terminalContainer.value) {
      terminal.value.open(terminalContainer.value);
      fitAddon.value.fit();

      // 显示欢迎信息
      // if (!nodesStore.currentXtremNode) {
      //   terminal.value.writeln(generateGreenText(t("xtermPanel.hello")));
      // }

      terminal.value.focus();

      // 绑定输入事件
      terminal.value.onData((data) => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
          ws.value.send(data);
        }
      });

      // 选择文本自动复制
      terminal.value.onSelectionChange(() => {
        const selection = terminal.value?.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection).then(() => {
            handleMsg(t("cmdPanel.copied"));
          }).catch((err) => {
            handleError(t("cmdPanel.copyFailed"));
            console.error('Clipboard error:', err);
          });
        }
      });

      // 终端尺寸变化处理
      // terminal.value.onResize((size) => {
        
      // });
    }
  } catch (error) {
    handleError(t("xtermPanel.initFailed"));
    console.error('Terminal initialization error:', error);
  }
};

// 初始化WebSocket连接
const initializeWebSocket = (node: typeApiNode) => {
  if (!node) {
    handleError(t("xtermPanel.noNodeSelected"));
    return;
  }

  cleanupWebSocket();

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.value = new WebSocket(`${protocol}//${apiHost}/ws`);

    ws.value.onopen = () => {
      connectionAttempts.value = 0;
      terminal.value?.writeln(generateGreenText(`\r\nConnected to ${node.host}\r`));
      ws.value?.send(JSON.stringify(node));

      // 启动心跳机制
      startHeartbeat();

    };

    ws.value.onmessage = (event) => {
      // console.log(event)
      terminal.value?.write(event.data);
    };

    ws.value.onclose = (event) => {
      stopHeartbeat();
      if (!event.wasClean && connectionAttempts.value < MAX_CONNECTION_ATTEMPTS) {
        connectionAttempts.value++;
        terminal.value?.writeln(generateRedText(`\r\nDisconnected. Reconnecting (${connectionAttempts.value}/${MAX_CONNECTION_ATTEMPTS})...\r`));
        setTimeout(() => initializeWebSocket(node), 2000);
      } else {
        terminal.value?.writeln(generateGreenText('\r\nConnection closed.\r'));
      }
    };

    ws.value.onerror = (error) => {
      handleError(t("xtermPanel.connectionError"));
      terminal.value?.writeln(generateRedText(`\r\nWebSocket error: ${error}\r`));
      console.error('WebSocket error:', error);
      stopHeartbeat();
    };
  } catch (error) {
    handleError(t("xtermPanel.connectionFailed"));
    console.error('WebSocket initialization error:', error);
  }
};

// 心跳机制相关函数
const sendHeartbeat = () => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    try {
      ws.value.send(HEARTBEAT_MESSAGE);
      lastHeartbeatTime = Date.now();

      // 设置心跳超时检测
      if (heartbeatTimeoutTimer) {
        clearTimeout(heartbeatTimeoutTimer);
      }
      heartbeatTimeoutTimer = setTimeout(checkHeartbeat, HEARTBEAT_TIMEOUT);
    } catch (error) {
      handleError(t("xtermPanel.heartbeatFailed"));
      console.error('Heartbeat send error:', error);
      restartConnection();
    }
  }
};

const checkHeartbeat = () => {
  if (Date.now() - lastHeartbeatTime > HEARTBEAT_TIMEOUT) {
    handleError(t("xtermPanel.heartbeatTimeout"));
    terminal.value?.writeln(generateRedText('\r\nHeartbeat timeout, reconnecting...\r'));
    restartConnection();
  }
};

const startHeartbeat = () => {
  stopHeartbeat(); // 先停止已有的心跳
  lastHeartbeatTime = Date.now();
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (heartbeatTimeoutTimer) {
    clearTimeout(heartbeatTimeoutTimer);
    heartbeatTimeoutTimer = null;
  }
};

// 重启连接
const restartConnection = () => {
  cleanupWebSocket();
  if (nodesStore.currentXtremNode) {
    initializeWebSocket(nodesStore.currentXtremNode);
  }
};

// 清理WebSocket资源
const cleanupWebSocket = () => {
  stopHeartbeat();
  if (ws.value) {
    try {
      ws.value.onclose = null; // 防止触发重连
      ws.value.close();
    } catch (error) {
      console.error('Error closing WebSocket:', error);
    } finally {
      ws.value = null;
    }
  }
};

// 清理终端资源
const cleanupTerminal = () => {
  if (terminal.value) {
    try {
      terminal.value.dispose();
    } catch (error) {
      console.error('Error disposing terminal:', error);
    } finally {
      terminal.value = null;
    }
  }
};

// 清理所有资源
const cleanupResources = () => {
  cleanupWebSocket();
  cleanupTerminal();
};

// 监听当前节点变化
watch(() => nodesStore.currentXtremNode, (newNode) => {
  if (newNode) {
    initializeWebSocket(newNode);
  } else {
    cleanupWebSocket();
    terminal.value?.writeln(generateGreenText('\r\nNo node selected. Please select a node to connect.\r'));
  }
}, { immediate: true });

// 组件挂载时初始化
onMounted(() => {
  initializeTerminal();
  window.addEventListener('resize', () => {
    try {
      fitAddon.value?.fit();
    } catch (error) {
      console.error('Error resizing terminal:', error);
    }
  });
});

// 组件卸载时清理
onUnmounted(() => {
  cleanupResources();
  window.removeEventListener('resize', () => {
    fitAddon.value?.fit();
  });
});
</script>

<style scoped>
.panel {
  background-color: #002b36;
  color: var(--color-bg);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bar {
  border-bottom: 1px solid var(--color-bg);
  padding: 0.5rem;
}

.terminal-container {
  margin: 0.5rem;
  width: calc(100% - 1rem);
  height: calc(100% - 3rem);
  box-sizing: border-box;
  color: #cce4f5;
  flex-grow: 1;
}

.terminal-container .terminal {
  width: 100%;
  height: 100%;
}

.small-button {
  color: #cce4f5;
  background-color: transparent;
  border: 1px solid #cce4f5;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.small-button:hover {
  background-color: rgba(204, 228, 245, 0.1);
}
</style>