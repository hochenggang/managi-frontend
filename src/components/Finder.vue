<template>
  <Modal @close="emit('close')">
    <div class="file-manager" :class="{ progress: isUploading || isDownloading }">
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
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
          <button class="small-button" @click="createFolder" :title="t('finder.actions.newDir')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z" />
            </svg>
          </button>
          <button class="small-button" @click="uploadFile" :disabled="isUploading"
            :class="{ uploading: isUploading }" :title="t('finder.actions.upload')">
            <svg v-if="!isUploading" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <CirclePercent v-else :percent="uploadProgress" />
          </button>
          <button class="small-button" @click="downloadSelected"
            :disabled="!selectedFile || selectedFile.is_dir || isDownloading"
            :title="t('finder.actions.download')">
            <svg v-if="!isDownloading" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            <CirclePercent v-else :percent="downloadProgress" />
          </button>
          <button class="small-button" @click="deleteSelected" :disabled="!selectedFile"
            :title="t('finder.actions.delete')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>

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
          <div v-show="currentPath.length > 1" class="file-item directory" @dblclick="navigateUp">
            <div class="file-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
              </svg>
            </div>
            <div class="file-name">{{ t('finder.upDir') }}</div>
            <div class="file-size">-</div>
            <div class="file-modified">-</div>
          </div>

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

      <div class="status-bar">
        <div class="status-info">
          {{ t("finder.total") }} {{ files.length }} {{ t("finder.item") }}
          {{ selectedFile ? `${t("finder.current")}${selectedFile.is_dir ? t("finder.dir") : t("finder.file")} ${getFullPath(selectedFile.filename)}` : "" }}
        </div>
        <div class="selected-info">
          {{ props.node.name }}
        </div>
      </div>

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
            <button class="sucess" @click="confirmCreateFolder" :disabled="!newFolderName">{{ t("finder.ok") }}</button>
          </div>
        </div>
      </div>

      <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" multiple />
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from "@/components/Modal.vue";
import CirclePercent from "@/components/CirclePercent.vue";
import { getWsUrl } from '@/api';
import { handleError, handleMsg } from "@/helper";
import type { typeApiNode } from '@/api';

const { t } = useI18n();

const props = defineProps<{
  node: typeApiNode;
}>();

const emit = defineEmits(['close']);

interface SFTPFile {
  filename: string;
  size: number;
  mode: number;
  is_dir: boolean;
  mtime: number;
}

interface SFTPResponse {
  type?: string;
  success: boolean;
  message?: string;
  path?: string;
  files?: SFTPFile[];
  filename?: string;
  size?: number;
  complete?: boolean;
  progress?: number;
  operation?: string;
}

const ws = ref<WebSocket | null>(null);
const currentPath = ref('/');
const files = ref<SFTPFile[]>([]);
const selectedFile = ref<SFTPFile | null>(null);
const loading = ref(false);
const showCreateFolderDialog = ref(false);
const newFolderName = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const isUploading = ref(false);
const isDownloading = ref(false);
const uploadProgress = ref(0);
const downloadProgress = ref(0);
const downloadFilename = ref('');
const downloadBuffer: Uint8Array[] = [];
let downloadTotalSize = 0;
let downloadReceivedSize = 0;

const uploadQueue: Array<{ file: File; path: string }> = [];
const isConnected = ref(false);

let pendingResponse: {
  resolve: (value: SFTPResponse) => void;
  reject: (reason?: any) => void;
  timeout: ReturnType<typeof setTimeout>;
} | null = null;

const connectWebSocket = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (ws.value?.readyState === WebSocket.OPEN && isConnected.value) {
      resolve();
      return;
    }

    loading.value = true;
    handleMsg(t("finder.connecting"));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${getWsUrl()}/ws/sftp`;
    ws.value = new WebSocket(wsUrl);
    console.log('[SFTP] WebSocket created, URL:', wsUrl);

    ws.value.onopen = () => {
      console.log('[SFTP] WebSocket connected, sending node info');
      ws.value?.send(JSON.stringify(props.node));
    };

    ws.value.onmessage = (event) => {
      console.log('[SFTP] Received message:', event.data);
      try {
        if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          if (event.data instanceof Blob) {
            event.data.arrayBuffer().then((buffer) => {
              const chunk = new Uint8Array(buffer);
              downloadBuffer.push(chunk);
              downloadReceivedSize += chunk.length;

              const progress = downloadTotalSize > 0 
                ? Math.round((downloadReceivedSize / downloadTotalSize) * 100) 
                : 0;
              downloadProgress.value = progress / 100;

              if (progress >= 100) {
                const fullData = new Uint8Array(downloadReceivedSize);
                let offset = 0;
                for (const chunk of downloadBuffer) {
                  fullData.set(chunk, offset);
                  offset += chunk.length;
                }

                const blob = new Blob([fullData], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = downloadFilename.value || 'download';
                a.click();
                URL.revokeObjectURL(url);
                handleMsg(t("finder.downloaded"));

                downloadBuffer.length = 0;
                downloadReceivedSize = 0;
                downloadTotalSize = 0;
                isDownloading.value = false;
                downloadProgress.value = 0;
              }
            });
          }
          return;
        }

        const data: SFTPResponse = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : {};

        if (data.type === 'connected') {
          isConnected.value = true;
          resolve();
          return;
        }

        if (data.type === 'progress') {
          if (data.operation === 'download') {
            downloadProgress.value = (data.progress || 0) / 100;
          }
          return;
        }

        if (!data.success && data.message) {
          handleError(data.message);
          loading.value = false;
          return;
        }

        if (pendingResponse) {
          clearTimeout(pendingResponse.timeout);
          pendingResponse.resolve(data);
          pendingResponse = null;
        }

        if (data.files) {
          files.value = data.files;
          loading.value = false;
        }

        if (data.message?.includes('uploaded')) {
          handleMsg(t("finder.uploaded"));
          isUploading.value = false;
          uploadProgress.value = 0;
          refresh();
        }

        if (data.complete) {
          isDownloading.value = false;
          downloadProgress.value = 0;
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      if (!isClosing) {
        handleError(t("finder.disconnected"));
      }
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error);
      handleError(t("finder.error"));
      reject(error);
    };
  });
};

let isClosing = false;

const sendRequest = async (operation: string, data: Record<string, unknown> = {}): Promise<SFTPResponse> => {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket not connected');
  }

  const message = { operation, ...data };
  console.log('[SFTP] sendRequest:', message);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('[SFTP] Request timeout');
      if (pendingResponse) {
        pendingResponse.reject(new Error('Request timeout'));
        pendingResponse = null;
      }
    }, 30000);

    pendingResponse = { resolve, reject, timeout };
    ws.value!.send(JSON.stringify(message));
  });
};

const getFullPath = (filename: string): string => {
  return currentPath.value === '/' ? `/${filename}` : `${currentPath.value}/${filename}`;
};

const listDirectory = async (path: string): Promise<void> => {
  selectedFile.value = null;
  loading.value = true;
  currentPath.value = path;

  console.log('[SFTP] Sending list request for:', path);

  try {
    const response = await sendRequest('list', { remote_path: path });
    console.log('[SFTP] List response:', response);
    if (response.files) {
      files.value = response.files;
    }
  } catch (e) {
    console.error('[SFTP] List error:', e);
    handleError(String(e));
  } finally {
    loading.value = false;
  }
};

const refresh = () => listDirectory(currentPath.value);

const navigateUp = () => {
  if (currentPath.value === '/') return;
  const newPath = currentPath.value.split('/').slice(0, -1).join('/') || '/';
  listDirectory(newPath);
};

const navigateTo = (index: number) => {
  const newPath = currentPathParts.value.slice(0, index + 1).join('/');
  listDirectory(newPath);
};

const handleFileDoubleClick = (file: SFTPFile) => {
  if (file.is_dir) {
    listDirectory(getFullPath(file.filename));
  }
};

const selectFile = (file: SFTPFile) => {
  selectedFile.value = file;
};

const clearSelection = () => {
  selectedFile.value = null;
};

const createFolder = () => {
  showCreateFolderDialog.value = true;
  newFolderName.value = '';
};

const confirmCreateFolder = async () => {
  if (!newFolderName.value) return;

  try {
    const path = currentPath.value === '/'
      ? `/${newFolderName.value}`
      : `${currentPath.value}/${newFolderName.value}`;

    await sendRequest('mkdir', { remote_path: path });
    showCreateFolderDialog.value = false;
    setTimeout(refresh, 300);
  } catch (e) {
    handleError(String(e));
  }
};

const uploadFile = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  uploadQueue.length = 0;
  for (const file of input.files) {
    const path = currentPath.value === '/'
      ? `/${file.name}`
      : `${currentPath.value}/${file.name}`;
    uploadQueue.push({ file, path });
  }

  input.value = '';
  await processUploadQueue();
};

const processUploadQueue = async (): Promise<void> => {
  if (uploadQueue.length === 0) return;

  isUploading.value = true;
  const { file, path } = uploadQueue.shift()!;

  try {
    uploadProgress.value = 0;
    await sendRequest('upload', { remote_path: path });

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result && ws.value?.readyState === WebSocket.OPEN) {
        const data = e.target.result as ArrayBuffer;
        ws.value.send(data);
        uploadProgress.value = 100;

        if (uploadQueue.length > 0) {
          await processUploadQueue();
        }
      }
    };
    reader.readAsArrayBuffer(file);
  } catch (e) {
    handleError(String(e));
    isUploading.value = false;
  }
};

const downloadSelected = async () => {
  if (!selectedFile.value || selectedFile.value.is_dir) return;

  isDownloading.value = true;
  downloadProgress.value = 0;
  downloadFilename.value = selectedFile.value.filename;
  downloadBuffer.length = 0;
  downloadReceivedSize = 0;
  downloadTotalSize = selectedFile.value.size || 0;

  const path = getFullPath(selectedFile.value.filename);

  try {
    const response = await sendRequest('download', { remote_path: path });

    if (!response.success) {
      handleError(response.message || 'Download failed');
      isDownloading.value = false;
      return;
    }
  } catch (e) {
    handleError(String(e));
    isDownloading.value = false;
  }
};

const deleteSelected = async () => {
  if (!selectedFile.value) return;

  if (confirm(`${t("finder.deleteConfire")}\n${selectedFile.value.filename}`)) {
    try {
      const path = getFullPath(selectedFile.value.filename);
      await sendRequest('delete', { remote_path: path });
      setTimeout(refresh, 300);
    } catch (e) {
      handleError(String(e));
    }
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

const currentPathParts = computed(() => {
  const parts = currentPath.value.split('/').filter(part => part !== '').map(part => `${part}/`);
  return ['/'].concat(parts);
});

const init = async () => {
  try {
    await connectWebSocket();
    await listDirectory('/');
  } catch (e) {
    console.error('Connection failed:', e);
  }
};

init();

onBeforeUnmount(() => {
  isClosing = true;
  if (ws.value) {
    ws.value.close();
    ws.value = null;
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


</style>
