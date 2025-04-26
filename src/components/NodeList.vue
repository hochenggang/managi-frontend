<template>
    <Finder v-if="finderNode" :node="finderNode" @close="finderNode = null" />
    <AddNode v-if="showAddNodeModal" :node="newNode" @close="showAddNodeModal = false" @add-node="handleAddNode" />
    <div class="node-list-container">
        <div class="node-list">
            <div class="bar">
                <span class="header-title" v-if="nodesStore.selectedNodes.length <= 0">{{ t("header.total") }} {{
                    nodesLength }} {{ t("header.nodes") }}</span>
                <span class="header-title" v-if="nodesStore.selectedNodes.length > 0">{{ t("header.choosed") }} {{
                    nodesStore.selectedNodes.length }} {{ t("header.nodes") }}</span>
                <div class="buttons">
                    <button class="small-button" @click="selectAll" v-show="!isSelectAll && nodesLength > 0">{{
                        t("header.actions.all") }}</button>
                    <button class="small-button" @click="deselectAll" v-show="isSelectAll && nodesLength > 0">{{
                        t("header.actions.none") }}</button>
                    <button class="small-button" @click="showAddNodeModal = true">{{ t("header.actions.add") }}</button>
                </div>
            </div>

            <ul v-auto-animate class="nodes" v-if="nodesLength > 0">
                <li :class="{ 'node': 1, 'ssh-active': currentNode ? generateNodeId(currentNode) == generateNodeId(node) : false }"
                    v-for="node in Object.values(nodesStore.nodes).sort((a, b) => a.name > b.name ? 1 : -1)"
                    :key="generateNodeId(node)" @click="toggleNodeSelection(node)">
                    <div class="node-info">
                        <input type="checkbox" :checked="nodesStore.selectedNodes.includes(generateNodeId(node))" />
                        <div class="node-info-name" :title="`${node.name}[${node.host}:${node.port}]`"
                            :class="{ selected: nodesStore.selectedNodes.includes(generateNodeId(node)) }">
                            {{ node.name }}
                        </div>
                    </div>
                    <div class="buttons node-actions">
                        <IconFinder title="文件管理" @click.stop="openFinder(node)" />
                        <IconTerm title="终端" @click.stop="connectNode(node)" />
                        <IconEdit title="编辑节点" @click.stop="editNode(node)" />
                        <IconDelete title="删除节点" @click.stop="confirmDelete(node)" />
                    </div>
                </li>
            </ul>

            <div class="bar ">
                <span class="footer-title">
                    @Managi
                </span>
                <div class="buttons ">
                    <select value="" class="small-button" @change="handleLangChange">
                        <option :disabled="true" value="">Language</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                    <button class="small-button" v-show="nodesLength > 0" @click="exploreNodes">{{
                        t("footer.actions.export") }}</button>
                    <button class="small-button" @click="importNodes">{{ t("footer.actions.import") }}</button>
                </div>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import AddNode from '@/components/AddNode.vue';
import IconDelete from '@/components/icons/IconDelete.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconTerm from '@/components/icons/IconTerm.vue'
import IconFinder from '@/components/icons/IconFinder.vue'
import Finder from '@/components/Finder.vue'


import { useI18n } from 'vue-i18n'
import { handleError, handleMsg } from "@/helper";
import { setCachedNodes, getCachedNodes, oldNodesToNewNodes } from "@/api";
import type { typeApiNode } from "@/api";
import { useNodesStore, generateNodeId } from '@/stores/nodesStore';


const router = useRouter();
const nodesStore = useNodesStore();
const finderNode = ref<typeApiNode | null>(null);

const { t, locale } = useI18n()


const setLanguage = (lang: string) => locale.value = lang
const nodesLength = computed(() => Object.keys(nodesStore.nodes).length);
const showAddNodeModal = ref(false);


const handleLangChange = (event: Event) => {
    const taget = event.target as HTMLSelectElement
    localStorage.setItem('lang', taget.value)
    setLanguage(taget.value)
}


onBeforeMount(() => {
    nodesStore.setAllNodes(getCachedNodes())
    const lang = localStorage.getItem('lang')
    if (lang) {
        setLanguage(lang)
    }
})


const newNode = ref<typeApiNode>({
    name: '',
    host: '',
    port: 22,
    username: '',
    auth_type: 'password',
    auth_value: ''
});

const isSelectAll = computed(() => {
    if (nodesStore.nodes) {
        return Object.keys(nodesStore.nodes).length === nodesStore.selectedNodes.length;
    }
    return false;
});
const selectAll = () => {
    nodesStore.selectAllNodes();
};

const deselectAll = () => {
    nodesStore.clearSelectedNodes()
};

const toggleNodeSelection = (node: typeApiNode) => {
    console.log(generateNodeId(node), nodesStore.selectedNodes.includes(generateNodeId(node)))
    if (nodesStore.selectedNodes.includes(generateNodeId(node))) {
        console.log('removeFromSelectedNodes')
        nodesStore.removeFromSelectedNodes(node)
    } else {
        nodesStore.addToSelectedNodes(node)
    }
};


const handleAddNode = (newNode: typeApiNode) => {
    nodesStore.setNode(newNode)
    showAddNodeModal.value = false;
};

const editNode = (node: typeApiNode) => {
    newNode.value = node;
    showAddNodeModal.value = true;
};



const currentNode = ref<null | typeApiNode>(null)
const connectNode = (node: typeApiNode) => {
    nodesStore.setXtermNode(node)
    router.push({ name: 'xterm' })
};

const openFinder = (node: typeApiNode) => {
    finderNode.value = node
}

const exploreNodes = () => {
    if (nodesLength.value === 0) {
        return
    }
    // 导出 nodes 为json文件
    const blob = new Blob([JSON.stringify(nodesStore.nodes)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nodes-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    handleMsg(t("addNode.exportSucess"));
}

const importNodes = () => {
    // 导入 json文件 为 nodes 
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
                    // 进行数据校验，nodes需要是一个字典，key为string，值为 typeApiNode or typeOldApiNode
                    if (typeof inputNodes === 'object') {
                        console.log(inputNodes)
                        for (const key1 in inputNodes) {
                            // nodes[key] 为包含[port, auth_type, auth_value]的对象
                            const requiredKeys = ['port', 'auth_type', 'auth_value'];
                            for (const key2 of requiredKeys) {
                                if (!inputNodes[key1].hasOwnProperty(key2)) {
                                    handleError(`${t("addNode.importError")} -> [${key1}].${key2} `);
                                    return;
                                }
                            }
                        }
                        nodesStore.setAllNodes(oldNodesToNewNodes(inputNodes));
                        setCachedNodes(nodesStore.nodes);
                        handleMsg(t("addNode.importSucess"));
                    }
                } catch (error) {
                    handleError(`${t("addNode.importError")} ${error}`);
                }
            };
            reader.readAsText(file);
        }
    };



};

const confirmDelete = (node: typeApiNode) => {
    if (confirm('确定要删除该节点吗？')) {
        nodesStore.removeNode(node)
    }
};



watch(nodesStore.nodes, () => {
    setCachedNodes(nodesStore.nodes);
}, { deep: true });


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
    gap: 0.35rem;
    width: auto;

    position: absolute;
    right: 0.5rem;
    opacity: 1;
    transition: opacity 0.5s ease-in;
    padding-left: 0.75rem;
    background: linear-gradient(to right, transparent, var(--color-sub) 0.5rem);

}


.node:hover .node-actions {
    display: flex;
    opacity: 1;
}

.selected {
    color: var(--color-green);
}


.setting-icon {
    width: 1.5rem;
    height: 1.5rem;
}

.ssh-active {
    background-color: var(--color-sub);
}

.footer-title {
    font-weight: lighter;
    color: var(--color-font-3);
}



* {
    overflow: hidden;
}
</style>