<template>
  <div class="operation-panel">
    <button class="back-button" @click="handleClose">返回</button>
    <!-- 终端容器 -->
    <div ref="terminalContainer" class="terminal-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { apiHost } from '@/api'
import { Terminal } from '@xterm/xterm';
import { handleError, handleMsg } from "@/helper";
import type { typeApiNode } from '@/api';
import '@xterm/xterm/css/xterm.css';

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


const terminalContainer = ref<HTMLElement | null>(null);

// WebSocket 实例
let ws: WebSocket | null = null;

// 初始化 WebSocket 连接
const initWebSocket = () => {
  if (node == null) {
    return
  }
  const conn = node.value!
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
          handleMsg('已复制')
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
  padding: 1rem;
  z-index: 10;
  height: 100%;
  overflow: auto;
  background-color: #002b36;
  color: #fff;
}

/* 
.terminal-container {
  width: 100%;
  background-color: #000;
  padding: 10px;
  box-sizing: border-box;
} */

.terminal {
  width: 100%;
  height: 100%;
}

.back-button {
  margin: 0.5rem 0rem;
  background: transparent;
  padding: 0.25rem 1rem;
  text-align: center;
  width: auto;
  font-weight: lighter;
  border: 1px solid #cce4f5;
  color: #cce4f5;
  min-width: 0.5rem;
  width: auto;
  font-size: 0.8rem;
  line-height: 1rem;
}
</style>