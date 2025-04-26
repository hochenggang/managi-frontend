<template>
  <Modal @close="emit('close')">
    <div class="file-manager" :class="{ progress: uploadCurrentParts > 0 || downloadCurrentParts > 0 }">
      <!-- 顶部操作栏 -->
      <div class="toolbar">
        <div class="path-navigator">
          <span v-for="(part, index) in currentPathParts" :key="index" @click="navigateTo(index)"
            class="path-part small-button">
            {{ part }}
          </span>
        </div>
        <div class="actions">
          <button class="small-button" @click="refresh" :title="t('finder.actions.reflush')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
          <button class="small-button" @click="createFolder" :title="t('finder.actions.newDir')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z" />
            </svg>
          </button>
          <button class="small-button" @click="uploadFile" :disabled="uploadCurrentParts > 0"
            :class="{ uploading: uploadCurrentParts }" :title="t('finder.actions.upload')">
            <svg v-if="uploadCurrentParts === 0" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <CirclePercent v-else :percent="(uploadCurrentParts - uploadTotalParts) / uploadTotalParts" />

          </button>
          <button class="small-button" @click="downloadSelected"
            :disabled="!selectedFile || selectedFile.is_dir || !!downloadCurrentParts"
            :title="t('finder.actions.download')">
            <svg v-if="downloadCurrentParts === 0" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            <CirclePercent v-else :percent="(downloadTotalParts - downloadCurrentParts) / downloadTotalParts" />
          </button>
          <button class="small-button" @click="deleteSelected" :disabled="!selectedFile"
            :title="t('finder.actions.delete')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" @click.prevent="clearSelection">
        <div class="file-list-header">
          <div class="file-name">{{ t('finder.filename') }}</div>
          <div class="file-size">{{ t('finder.size') }}</div>
          <div class="file-modified">{{ t('finder.mtime') }}</div>
        </div>

        <div v-if="loading" class="loading">
          {{ t('finder.loading') }}
        </div>

        <div v-else-if="files.length === 0" class="empty-folder">
          {{ t('finder.empty') }}
        </div>

        <div v-else class="file-items">
          <!-- 上级目录 -->
          <div v-show="currentPath.length > 1" class="file-item directory" @dblclick="navigateUp">
            <div class="file-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
              </svg>
            </div>
            <div class="file-name">{{ t('finder.upDir') }}</div>
            <div class="file-size">-</div>
            <div class="file-modified">-</div>
          </div>

          <!-- 文件列表项 -->
          <div v-for="file in files" :key="file.filename" class="file-item" :class="{
            'selected': selectedFile && selectedFile.filename === file.filename,
            'directory': file.is_dir
          }" @click.stop="selectFile(file)" @dblclick.stop="handleFileDoubleClick(file)">
            <div class="file-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path v-if="file.is_dir"
                  d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                <path v-else
                  d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div class="file-name">{{ file.filename }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
            <div class="file-modified">{{ formatDate(file.mtime) }}</div>
          </div>
        </div>
      </div>

      <!-- 状态栏 -->
      <div class="status-bar">
        <div class="status-info">
          {{ t("finder.total") }} {{ files.length }} {{ t("finder.item") }}

          {{ selectedFile ? `${t("finder.current")}${selectedFile.is_dir ? t("finder.dir") : t("finder.file")}
          ${(currentPath === '/' ? '/' : (currentPath + '/')) + selectedFile.filename}` : "" }}
        </div>
        <div class="selected-info">
          {{ props.node.name }}
        </div>
      </div>

      <!-- 新建文件夹对话框 -->
      <div v-if="showCreateFolderDialog" class="dialog-overlay">
        <div class="dialog">
          <div class="dialog-header">
            {{ t("finder.newDir") }}
            <button class="small-button close-btn" @click="showCreateFolderDialog = false">×</button>
          </div>
          <div class="dialog-body">
            <input v-model="newFolderName" type="text" :placeholder="t('finder.newDirPlaceholder')"
              @keyup.enter="confirmCreateFolder" />
          </div>
          <div class="dialog-footer">
            <button @click="showCreateFolderDialog = false">{{ t("finder.cancle") }}</button>
            <button @click="confirmCreateFolder" :disabled="!newFolderName">{{ t("finder.ok") }}</button>
          </div>
        </div>
      </div>

      <!-- 上传文件输入 -->
      <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" multiple />
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useNodesStore } from '@/stores/nodesStore';
import { handleError, handleMsg } from "@/helper";
import { useI18n } from 'vue-i18n';
import { apiHost, type typeApiNode } from '@/api';
import Modal from "@/components/Modal.vue";
import CirclePercent from "@/components/CirclePercent.vue";

const { t } = useI18n();

const props = defineProps<{
  node: typeApiNode;
}>()

const emit = defineEmits(['close'])

interface typeSFTPFile {
  filename: string;
  size: number;
  mode: number;
  is_dir: boolean;
  mtime: number;
}

interface typeSFTPResponse {
  success: boolean;
  message?: string;
  path?: string;
  files?: typeSFTPFile[];
  filename?: string;
  size?: number;
  complete?: boolean;
}

const ws = ref<WebSocket | null>(null);
const currentPath = ref('/');
const files = ref<typeSFTPFile[]>([]);
const selectedFile = ref<typeSFTPFile | null>(null);
const loading = ref(false);
const showCreateFolderDialog = ref(false);
const newFolderName = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const isClosing = ref(false);
const downloadCurrentParts = ref(0);
const downloadTotalParts = ref(0);
const uploadCurrentParts = ref(0);
const uploadTotalParts = ref(0);

// WebSocket 连接管理
const connectWebSocket = () => {
  if (ws.value) { return }
  loading.value = true
  handleMsg(t("finder.connectting"))
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws.value = new WebSocket(`${protocol}//${apiHost}/ws/sftp`);

  ws.value.onopen = () => {
    console.log('SFTP WebSocket connected');
    // 发送节点信息
    if (ws.value) {
      ws.value.send(JSON.stringify(props.node));
      listDirectory(currentPath.value);
    }
  };

  ws.value.onclose = () => {
    handleError(t("finder.disconnected"));
    if (!isClosing) {
      handleMsg(t("finder.reconnecting"))
      setTimeout(() => {
        connectWebSocket();
      }, 2000);

    }
  };

  ws.value.onerror = (error) => {
    console.log("error", error)
    handleError(`${t("finder.error")}`);
  };

  ws.value.onmessage = (event) => {
    const response: typeSFTPResponse = JSON.parse(event.data);

    if (response.success) {
      if (response.files) {
        // 目录列表响应
        files.value = response.files;
        loading.value = false;
      } else if (response.complete) {
        // 下载完成
        handleMsg(t("finder.downloaded"));
      } else if (response.message) {
        if (response.message.includes("uploaded")) {
          handleMsg(t("finder.uploaded"));
          uploadCurrentParts.value = 0
          refresh()
        }

      }
    } else {
      handleError(response.message || t("finder.error"));
      loading.value = false;
    }
  };
};

// 列出目录内容
const listDirectory = (path: string) => {
  if (!ws.value) return;
  console.log('listDirectory', path)
  selectedFile.value = null;

  loading.value = true;
  currentPath.value = path;

  const request = {
    operation: 'list',
    remote_path: path
  };

  ws.value.send(JSON.stringify(request));
};

// 导航到上级目录
const navigateUp = () => {
  if (currentPath.value === '/') return;

  const newPath = currentPath.value.split('/').slice(0, -1).join('/') || '/';
  listDirectory(newPath);
};

// 导航到指定路径
const navigateTo = (index: number) => {
  console.log("navigateTo", currentPathParts.value.slice(0, index + 1))
  const newPath = currentPathParts.value.slice(0, index + 1).join('/');
  listDirectory(newPath);
};

// 处理文件双击
const handleFileDoubleClick = (file: typeSFTPFile) => {
  console.log('handleFileDoubleClick', file);
  if (file.is_dir) {
    const newPath = currentPath.value === '/' ? `/${file.filename}` : `${currentPath.value}/${file.filename}`
    listDirectory(newPath);
  } else {

    // downloadFile(file);
  }
};

// 选择文件
const selectFile = (file: typeSFTPFile) => {
  console.log('selectFile', file)
  selectedFile.value = file;
};

const clearSelection = () => {
  console.log('clearSelection')
  selectedFile.value = null;
};

// 刷新当前目录
const refresh = () => {
  listDirectory(currentPath.value);
};

// 创建文件夹
const createFolder = () => {
  showCreateFolderDialog.value = true;
  newFolderName.value = '';
};

// 确认创建文件夹
const confirmCreateFolder = () => {
  if (!ws.value || !newFolderName.value) return;

  const path = currentPath.value === '/'
    ? `/${newFolderName.value}`
    : `${currentPath.value}/${newFolderName.value}`;

  const request = {
    operation: 'mkdir',
    remote_path: path
  };

  ws.value.send(JSON.stringify(request));
  showCreateFolderDialog.value = false;

  // 刷新目录
  setTimeout(refresh, 500);
};

// 上传文件
const uploadFile = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};



// 处理文件上传
const handleFileUpload = async (event: Event) => {
  if (!ws.value) return;


  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  uploadCurrentParts.value = 0

  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const path = currentPath.value === '/'
        ? `/${file.name}`
        : `${currentPath.value}/${file.name}`;

      // 先发送操作请求
      const request = {
        operation: 'upload',
        remote_path: path
      };

      ws.value?.send(JSON.stringify(request));

      // 然后发送文件数据
      if (e.target?.result) {
        const fileData = e.target.result as ArrayBuffer;
        uploadTotalParts.value = Math.ceil(fileData.byteLength);
        ws.value?.send(fileData);
        // 如果网络层大小，大于总量的 0.1%，实时更新数据
        while (ws.value && ws.value.bufferedAmount > uploadTotalParts.value * 0.1) {
          uploadCurrentParts.value = ws.value.bufferedAmount;
          await new Promise(resolve => setTimeout(resolve, 100));
        }


      }
    };

    reader.readAsArrayBuffer(file);
  }

  // 清空输入以便可以重复选择同一文件
  input.value = '';
};

// 下载选中的文件
const downloadSelected = () => {
  if (selectedFile.value && !selectedFile.value.is_dir) {
    downloadFile(selectedFile.value);
  }
};


// 下载文件
const downloadFile = (file: typeSFTPFile) => {
  if (!ws.value) return;

  const path = currentPath.value === '/'
    ? `/${file.filename}`
    : `${currentPath.value}/${file.filename}`;

  const request = {
    operation: 'download',
    remote_path: path
  };

  ws.value.send(JSON.stringify(request));

  ws.value.binaryType = 'arraybuffer';

  // 临时保存文件名
  const downloadFilename = file.filename;

  // 创建一个数组来存储接收到的二进制数据块
  const chunks: ArrayBuffer[] = [];

  // 标记是否正在接收数据
  downloadCurrentParts.value = Math.round(file.size / 8096);
  downloadTotalParts.value = downloadCurrentParts.value;


  // 保存原始的消息处理器
  const originalOnMessage = ws.value.onmessage;

  // 自定义消息处理器
  ws.value.onmessage = (event) => {
    if (typeof event.data === 'string') {
      const response = JSON.parse(event.data);
      if (response.complete) {
        // 下载成功，处理所有接收到的数据
        downloadCurrentParts.value = 0;
        console.log('chunks', chunks)

        // 拼接所有数据块
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const concatenated = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(new Uint8Array(chunk), offset);
          offset += chunk.byteLength;
        }

        // 生成 Blob 并触发下载
        const blob = new Blob([concatenated], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 恢复原始消息处理器
        ws.value!.onmessage = originalOnMessage;

      }
    } else {
      // 接收到二进制数据块
      chunks.push(event.data);
      downloadCurrentParts.value -= 1;
    }
  };
};

// 删除选中的文件
const deleteSelected = () => {
  if (selectedFile.value) {
    if (confirm(`${t("finder.deleteConfire")} \n${selectedFile.value.filename}`)) {
      deleteFile(selectedFile.value);
    }
  }
};

// 删除文件
const deleteFile = (file: typeSFTPFile) => {
  if (!ws.value) return;

  const path = currentPath.value === '/'
    ? `/${file.filename}`
    : `${currentPath.value}/${file.filename}`;

  const request = {
    operation: 'delete',
    remote_path: path
  };

  ws.value.send(JSON.stringify(request));

  // 刷新目录
  setTimeout(refresh, 500);
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

// 计算当前路径的各个部分
const currentPathParts = computed(() => {
  // 需要把 / 单独作为一个 part 来便于回到根目录
  const parts = currentPath.value.split('/').filter(part => part !== '').map(part => `${part}/`);
  console.log('currentPathParts', parts)
  return ['/'].concat(parts)
});

onMounted(() => {
  connectWebSocket();
});

onBeforeUnmount(() => {
  isClosing.value = true;
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg);

  border-radius: 4px;
  overflow: auto;

  width: 100%;
  min-width: 50rem;
  height: 90%;
  min-height: 30rem;
  max-height: 90%;


}

.progress {
  cursor: progress;

}


.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3rem;
  width: 100%;

  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;

  color: var(--color-font-1);
  background-color: var(--color-while);
}

.path-navigator {
  flex: 1;
  display: flex;
  padding: 0 0.25rem;
  margin-right: 1rem;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  white-space: nowrap;
  overflow-x: scroll;
  min-width: 15rem;
  height: 1.75rem;
}

.path-part {
  flex-shrink: 0;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  margin-right: 2px;
}

.path-part:hover {
  box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px;
}

.actions {
  display: flex;
  gap: 8px;
  height: 1.75rem;

}

.actions button {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;

}

.actions button:hover {
  box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px;
}

.actions button:disabled {
  cursor: not-allowed;
}

.actions button svg {
  fill: var(--color-font-1);
}

.actions button:hover svg {
  fill: var(--color-main);
}


.uploading {
  cursor: progress;
}

.file-list {
  overflow-y: auto;
  border-bottom: 1px solid #e0e0e0;
  display: block;
  height: 30rem;
  background-color: var(--color-while);

}

.file-list-header {
  display: flex;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

.file-size {
  width: 120px;
  text-align: right;
  padding-right: 16px;
}

.file-modified {
  width: 180px;
}

.file-items {
  display: block;
  height: 28rem;
  padding-bottom: 3rem;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.file-item:hover {
  background-color: var(--color-bg);
}

.file-item.selected {
  background-color: var(--color-sub);
}

.file-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon svg {
  fill: var(--color-font-1);
}

.directory .file-icon svg {
  fill: var(--color-main);
}

.loading,
.empty-folder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
  color: var(--color-font-1);
}

.status-bar {
  position: absolute;
  height: 2rem;
  width: 100%;

  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--color-font-1);
  background-color: var(--color-while);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background-color: #fff;
  border-radius: 4px;
  width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #888;
}

.dialog-body {
  padding: 16px;
}

.dialog-body input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-footer {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-footer button {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer button:last-child {
  background-color: #2196f3;
  color: #fff;
  border: none;
}

.dialog-footer button:last-child:disabled {
  background-color: #bbdefb;
}
</style>