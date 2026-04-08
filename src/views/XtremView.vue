<template>
  <div class="panel">
    <div class="bar">
      <button class="small-button" @click="handleBack">{{ t("xtermPanel.back") }}</button>
    </div>
    <div class="terminal-wrapper">
      <div ref="terminalContainer" class="terminal-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { getWsUrl } from '@/api';
import { handleError, handleMsg } from "@/helper";
import type { typeApiNode } from '@/api';
import { useRouter } from 'vue-router';
import { useNodesStore } from '@/stores/nodesStore';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const nodesStore = useNodesStore();
const { t } = useI18n();

const terminalContainer = ref<HTMLElement | null>(null);

let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;

const MAX_CONNECTION_ATTEMPTS = 3;
let connectionAttempts = 0;
let isConnecting = false;

const HEARTBEAT_INTERVAL = 30000;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const generateGreenText = (text: string) => `\x1B[32m${text}\x1B[0m`;
const generateRedText = (text: string) => `\x1B[31m${text}\x1B[0m`;

const handleBack = () => {
  cleanup();
  router.push({ name: 'cmds' });
};

const fitTerminal = () => {
  if (fitAddon && terminal) {
    try {
      fitAddon.fit();
      const cols = terminal.cols;
      const rows = terminal.rows;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(`\x1b[8;${rows};${cols}t`);
      }
    } catch (e) {
      console.error('Fit error:', e);
    }
  }
};

const initTerminal = () => {
  if (!terminalContainer.value) return;

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#002b36',
      foreground: '#cce4f5',
      cursor: '#839496',
    },
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalContainer.value);

  setTimeout(() => {
    fitTerminal();
    terminal?.focus();
  }, 0);

  if (!nodesStore.currentXtremNode) {
    terminal.writeln(generateGreenText(t("xtermPanel.hello")));
  }

  terminal.onData((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  terminal.onSelectionChange(() => {
    const selection = terminal?.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection).then(() => {
        handleMsg(t("cmdPanel.copied"));
      }).catch(() => {});
    }
  });
};

const connect = (node: typeApiNode) => {
  if (!node) {
    handleError("xtermPanel.noNodeSelected");
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  if (isConnecting && ws) {
    ws.close();
  }

  isConnecting = true;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${getWsUrl()}/ws`;
  ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    isConnecting = false;
    connectionAttempts = 0;
    terminal?.writeln(generateGreenText(`\r\nConnected to ${node.host}\r`));
    ws?.send(JSON.stringify(node));
    startHeartbeat();
  };

  ws.onmessage = (event) => {
    if (!terminal) return;
    if (typeof event.data === 'string') {
      terminal.write(event.data);
    } else if (event.data instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      terminal.write(decoder.decode(event.data));
    }
  };

  ws.onclose = (event) => {
    isConnecting = false;
    stopHeartbeat();

    if (!event.wasClean && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      connectionAttempts++;
      terminal?.writeln(generateRedText(`\r\nDisconnected. Reconnecting (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`));
      setTimeout(() => {
        if (nodesStore.currentXtremNode) {
          connect(nodesStore.currentXtremNode);
        }
      }, 2000);
    } else {
      terminal?.writeln(generateRedText('\r\nConnection closed.'));
    }
  };

  ws.onerror = () => {
    isConnecting = false;
    stopHeartbeat();
  };
};

const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('\x00');
    }
  }, HEARTBEAT_INTERVAL);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

const onResize = () => {
  fitTerminal();
};

const cleanup = () => {
  stopHeartbeat();
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
    ws = null;
  }
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
  fitAddon = null;
  isConnecting = false;
};

onMounted(() => {
  initTerminal();

  if (nodesStore.currentXtremNode) {
    connect(nodesStore.currentXtremNode);
  }

  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  cleanup();
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.panel {
  background-color: #002b36;
  color: #cce4f5;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bar {
  border-bottom: 1px solid #073642;
  padding: 0.5rem;
  flex-shrink: 0;
}

.terminal-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
}

.terminal-container {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

.small-button {
  color: #cce4f5;
  background-color: transparent;
  border: 1px solid #cce4f5;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.small-button:hover {
  background-color: rgba(204, 228, 245, 0.1);
}
</style>
