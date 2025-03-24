<template>
    <AddNode v-if="showAddNodeModal" :node="newNode" @close="showAddNodeModal = false" @add-node="handleAddNode" />
    <div class="node-list-container">
        <div class="node-list">
            <div class="bar">
                <span class="header-title" v-if="selectedNodes.length <= 0">共{{ nodesLength }}节点</span>
                <span class="header-title" v-if="selectedNodes.length > 0">已选择{{ selectedNodes.length }}节点</span>
                <div class="buttons">
                    <button class="small-button" @click="selectAll" v-show="!isSelectAll && nodesLength > 0">全选</button>
                    <button class="small-button" @click="deselectAll"
                        v-show="isSelectAll && nodesLength > 0">全不选</button>
                    <button class="small-button" @click="showAddNodeModal = true">添加节点</button>
                </div>
            </div>

            <ul class="nodes" v-if="nodesLength > 0">
                <li :class="{ 'node': 1, 'ssh-active': currentNode?.ip == node.ip }"
                    v-for="node in Object.values(nodes).sort((a, b) => a.name > b.name ? 1 : -1)" :key="node.ip"
                    @click="toggleNodeSelection(node.ip)">
                    <div class="node-info">
                        <input type="checkbox" :checked="selectedNodes.includes(node.ip)" />
                        <span class="node-info-name" :title="`${node.name}[${node.ip}:${node.port}]`"
                            :class="{ selected: selectedNodes.includes(node.ip) }">
                            {{ node.name }}
                        </span>
                    </div>
                    <div class="buttons node-actions">
                        <span class="small-button" @click.stop="connectNode(node)">
                            <IconTerm />
                        </span>
                        <span class="small-button" @click.stop="editNode(node)">
                            <IconEdit />
                        </span>
                        <span class="small-button" @click.stop="confirmDelete(node.ip)">
                            <IconDelete />
                        </span>
                    </div>
                </li>
            </ul>

            <div class="bar ">
                <span class="footer-title">
                    @Managi
                </span>
                <div class="buttons">
                    <button class="small-button" @click="exploreNodes">导出节点</button>
                    <button class="small-button" @click="importNodes">导入节点</button>
                </div>
            </div>
        </div>
    </div>
    <Fade>
        <OperationXTerm v-if="currentNode" @close="currentNode = null" :node="currentNode" />
    </Fade>
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
import IconDelete from '@/components/icons/IconDelete.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconTerm from '@/components/icons/IconTerm.vue'
import IconSetting from '@/components/icons/IconSetting.vue'



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
    background: var(--color-bg);

}

.node-list {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    /* padding: 1rem; */
    border-right: 1px solid var(--color-sub);
    height: 100%;
    width: 20rem;
}



.header-title {
    font-size: 0.9rem;
    flex-shrink: 0;
    color: var(--color-font-1);
}



.nodes {
    list-style: none;
    padding: 0.5rem 0.25rem;
    height: calc(100% - 6rem);
    overflow: auto;
    box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
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
    border: 1px solid var(--color-sub);
}

.node:hover {
    background-color: var(--color-sub);
    border: 1px solid var(--color-main);
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

.node-info-name {
    width: 100%;
    white-space: nowrap;
    font-size: clamp(0.6rem, 0.9rem, 1rem);
    overflow: hidden;
    color: var(--color-font-2);

}

.node-actions {
    display: none;
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    opacity: 0;
    transition: opacity 0.5s ease-in;
    background-color: var(--color-sub);

}

.node:hover .node-actions {
    display: flex;
    width: auto;
    opacity: 1;
    gap: 0.35rem;

}

.selected {
    color: var(--color-green);
}


.setting-icon {
    width: 1.5rem;
    height: 1.5rem;
}

.ssh-active {
    background-color: var(--color-border-1);
}

.footer-title {
    font-weight: lighter;
    color: var(--color-font-3);
}



* {
    overflow: hidden;
}
</style>