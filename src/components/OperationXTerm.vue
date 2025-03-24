<template>
  <div class="operation-panel">
    <div class="bar">
      <button class="small-button" @click="handleClose">返回</button>

    </div>
    <!-- 终端容器 -->
    <div ref="terminalContainer" class="terminal-container" contenteditable="true"></div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { apiHost } from '@/api';
import { handleError, handleMsg } from "@/helper";
import type { typeApiNode } from '@/api';

// 定义 props
const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};

const node = ref<typeApiNode | null>(props.node as typeApiNode);

// 终端实例
const terminal = new Terminal({
  theme: {
    background: '#002b36', // 背景色
    foreground: '#cce4f5', // 前景色（文字颜色）
    cursor: '#839496',     // 光标颜色
  },
});

// FitAddon 实例
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

const terminalContainer = ref<HTMLElement | null>(null);

// WebSocket 实例
let ws: WebSocket | null = null;

// 初始化 WebSocket 连接
const initWebSocket = () => {
  if (!node.value) return;

  const conn = node.value;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${apiHost}/ws`);

  ws.onopen = () => {
    // 发送连接信息
    ws?.send(
      JSON.stringify({
        host: conn.ip, // 从 props 中获取主机地址
        port: conn.port || 22, // 从 props 中获取端口
        username: conn.ssh_username, // 从 props 中获取用户名
        password: conn.auth_type === 'password' ? conn.auth_value : null, // 从 props 中获取密码
        privateKey: conn.auth_type !== 'password' ? conn.auth_value : null, // 从 props 中获取密钥
      })
    );
  };

  ws.onmessage = (event) => {
    // 将服务器返回的数据写入终端
    terminal.write(event.data);
  };

  ws.onclose = () => {
    terminal.writeln('\r\nWebSocket connection closed.\r\n');
  };

  ws.onerror = (error) => {
    terminal.writeln(`\r\nWebSocket error: ${error}\r\n`);
  };
};

// 初始化终端
const initTerminal = () => {
  if (terminalContainer.value) {
    terminal.open(terminalContainer.value);
    terminal.focus(); // 确保终端获得焦点

    // 自适应父容器大小
    fitAddon.fit();

    // 绑定输入事件
    terminal.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data); // 将用户输入发送到 WebSocket
      }
    });

    terminal.onSelectionChange(() => {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).then(() => {
          handleMsg('已复制');
        }).catch((err) => {
          console.error('自动复制失败:', err);
        });
      }
    });

    terminal.writeln('Connecting to SSH server...');
  }
};

// 组件挂载时初始化
onMounted(() => {
  initTerminal();
  initWebSocket();

  // 监听父容器的尺寸变化
  const resizeObserver = new ResizeObserver(() => {
    if (terminalContainer.value) {
      fitAddon.fit();
    }
  });

  if (terminalContainer.value) {
    resizeObserver.observe(terminalContainer.value);
  }

  // 在组件卸载时停止观察
  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});

// 组件卸载时关闭 WebSocket
onUnmounted(() => {
  if (ws) {
    ws.close();
  }
  terminal.dispose(); // 销毁终端实例
});
</script>


<style scoped>
.operation-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: calc(100% - 20rem);
  height: 100%;
  z-index: 10;
  overflow: auto;
  background-color: #002b36;
  color: var(--color-bg);
}

.terminal-container {
  box-shadow: rgba(237, 237, 237, 0.05) 0px 2px 4px 0px inset;
  padding: 0.5rem;
  width: 100%;
  height: calc(100% - 3rem);
  /* 减去顶部按钮的高度 */
  box-sizing: border-box;
}


.small-button {
  border: 1px solid var(--color-main);
  color: var(--color-main);
  background: transparent;
}
</style>