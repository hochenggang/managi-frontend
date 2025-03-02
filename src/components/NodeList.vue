<template>
    <AddNode v-if="showAddNodeModal" :node="newNode" @close="showAddNodeModal = false" @add-node="handleAddNode" />
    <div class="node-list-container">
        <div class="node-list">
            <div class="node-list-body">
                <div class="header">
                    <span class="header-title">{{ nodesLength }}个节点</span>
                    <div class="header-actions buttons">
                        <button @click="selectAll" v-show="!isSelectAll && nodesLength > 0">全选</button>
                        <button @click="deselectAll" v-show="isSelectAll && nodesLength > 0">全不选</button>
                        <button @click="showAddNodeModal = true">添加节点</button>
                    </div>
                </div>
                <ul class="nodes" v-if="nodesLength > 0">
                    <li :class="{ 'node': 1, 'ssh-active': currentNode?.ip == node.ip }"
                        v-for="node in Object.values(nodes)" :key="node.ip" @click="toggleNodeSelection(node.ip)">
                        <div class="node-info">
                            <input type="checkbox" :checked="selectedNodes.includes(node.ip)" />
                            <span :title="`${node.name}[${node.ip}:${node.port}]`"
                                :class="{ selected: selectedNodes.includes(node.ip) }">
                                {{ node.name }}
                            </span>
                        </div>
                        <Fade>
                            <div class="node-actions">
                                <span class="node-action-item" @click.stop="connectNode(node)">💻</span>
                                <span class="node-action-item" @click.stop="editNode(node)">✏️</span>
                                <span class="node-action-item" @click.stop="confirmDelete(node.ip)">❌</span>
                            </div>
                        </Fade>
                    </li>
                </ul>

            </div>
            <div class="node-list-footer buttons">
                <button @click="exploreNodes">导出节点</button>
                <button @click="importNodes">导入节点</button>
            </div>
        </div>
    </div>

    <OperationXTerm v-if="currentNode" @close="currentNode = null" :node="currentNode" />
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import type { Ref } from "vue";

import { handleError, handleMsg } from "@/helper";

import AddNode from '@/components/AddNode.vue';
import { setCachedNodes } from "@/api";
import type { typeApiNode } from "@/api";
import OperationXTerm from '@/components/OperationXTerm.vue'
import Fade from "@/components/Fade.vue";


const router = useRouter();
const nodes = inject('nodes') as Ref<Record<string, typeApiNode>>;
const nodesLength = computed(() => Object.keys(nodes.value).length);
const selectedNodes = inject('selectedNodes') as Ref<string[]>;
const showAddNodeModal = ref(false);
const newNode = ref<typeApiNode>({
    name: '',
    ip: '',
    port: 22,
    ssh_username: '',
    auth_type: 'password',
    auth_value: ''
});

const isSelectAll = computed(() => {
    if (nodes.value) {
        return Object.keys(nodes.value).length === selectedNodes.value.length;
    }
    return false;
});
const selectAll = () => {
    selectedNodes.value = Object.keys(nodes.value);
};

const deselectAll = () => {
    selectedNodes.value = [];
};

const toggleNodeSelection = (ip: string) => {
    const index = selectedNodes.value.indexOf(ip);
    if (index === -1) {
        selectedNodes.value.push(ip);
    } else {
        selectedNodes.value.splice(index, 1);
    }
};

const handleAddNode = (newNode: typeApiNode) => {
    nodes.value[newNode.ip] = newNode;
    showAddNodeModal.value = false;
};

const editNode = (node: typeApiNode) => {
    newNode.value = node;
    showAddNodeModal.value = true;
};



const currentNode = ref<null | typeApiNode>(null)
const connectNode = (node: typeApiNode) => {
    if (currentNode.value && node.ip === currentNode.value.ip) {
        return
    }
    currentNode.value = null
    setTimeout(() => {
        currentNode.value = node
    }, 50)
};


const exploreNodes = () => {
    if (nodesLength.value === 0) {
        handleError('没有节点数据可以导出');
        return
    }
    // 导出 nodes 为json文件
    const blob = new Blob([JSON.stringify(nodes.value)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nodes.json';
    a.click();
    URL.revokeObjectURL(url);
    handleMsg('节点导出成功');
}

const importNodes = () => {
    console.log('import start')
    // 导出json文件 为nodes 
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.click()
    input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const inputNodes = JSON.parse(reader.result as string);
                    // 进行数据校验，nodes需要是一个字典，key为string，值为 typeApiNode
                    if (typeof inputNodes === 'object') {
                        console.log(inputNodes)
                        for (const ip in inputNodes) {
                            // nodes[key] 为包含[name, ip, port, ssh_username, auth_type, auth_value]的对象
                            const requiredKeys = ['name', 'ip', 'port', 'ssh_username', 'auth_type', 'auth_value'];
                            for (const key of requiredKeys) {
                                if (!inputNodes[ip].hasOwnProperty(key)) {
                                    handleError(`数据错误，节点 [${ip}] 缺失 ${key} 字段`);
                                    return;
                                }
                            }
                        }
                        nodes.value = inputNodes;
                        handleMsg('节点导入成功');
                    }
                } catch (error) {
                    handleError(`无法导入，${error}`);

                }
            };
            reader.readAsText(file);
        }
    };



};

const confirmDelete = (ip: string) => {
    if (confirm('确定要删除该节点吗？')) {
        delete nodes.value[ip];
        const index = selectedNodes.value.indexOf(ip);
        if (index !== -1) {
            selectedNodes.value.splice(index, 1);
        }
    }
};

</script>

<style scoped>
.node-list-container {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 20rem;
    z-index: 2;
    background: transparent;
}

.node-list {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem;
    border-right: 1px solid var(--color-border-1);
    height: 100%;
    width: 20rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid #ddd;
    padding: 0.5rem 0.15rem;
}

.header-title {
    font-weight: bold;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.header-actions button {
    min-width: 0.5rem;
    width: auto;
    font-size: 0.8rem;
    line-height: 1rem;
}

.nodes {
    list-style: none;
    padding: 0;
    max-height: 30rem;
    overflow: auto;
}

.node {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    background-color: var(--color-background-3);
}

.node:hover {
    background-color: var(--color-border-1);
}

.node-info {
    display: flex;
    align-items: center;
}

.node-info>input {
    min-width: 0;
    width: 1rem;
    flex-shrink: 0;
    cursor: pointer;
    margin-right: 0.15rem;
}

.node-info>span {
    width: 100%;
    white-space: nowrap;
    font-size: clamp(0.6rem, 0.9rem, 1rem);
    overflow: hidden;
}

.node-actions {
    display: none;
    color: #ff4d4f;
    position: absolute;
    width: 0;
    right: 0;
    opacity: 0;
    transition: opacity 0.5s ease, width 0.5s ease;
    background-color: var(--color-border-1);

}

.node-action-item {
    margin: 0 0.15rem;
}

.node:hover .node-actions {
    display: block;
    width: auto;
    opacity: 1;
}

.selected {
    font-weight: bold;
    color: var(--color-green);
}


.node-list-footer>button {
    background: transparent;
    font-size: 0.8rem;
}

.ssh-active {
    background-color: var(--color-border-1);
}

* {
    overflow: hidden;
}
</style>