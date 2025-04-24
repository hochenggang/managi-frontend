// stores/nodesStore.ts
import { defineStore } from 'pinia';
import type { typeApiNode } from '@/api';

function generateNodeId(node: typeApiNode): string {
    return `${node.host}:${node.port}`;
}

export { generateNodeId };

export const useNodesStore = defineStore('nodes', {
    // 定义状态
    state: () => ({
        nodes: {} as Record<string, typeApiNode>, // 所有节点
        selectedNodes: [] as string[], // 选中的节点 ID 列表
        currentXtremNode: null as null | typeApiNode, // 正在进行 xterm 连接的节点
    }),

    // 定义 Getters
    getters: {
        // 获取所有节点
        allNodes(state): typeApiNode[] {
            return Object.values(state.nodes);
        },

        // 获取所有选中的节点
        getSelectedNodes(state): typeApiNode[] {
            return state.selectedNodes.map(id => state.nodes[id]).filter(Boolean); // 过滤掉无效的节点
        },
    },

    // 定义 Actions
    actions: {
        // 添加或更新单个节点
        setNode(node: typeApiNode) {
            this.nodes[generateNodeId(node)] = node;
        },

        getNodeById(id: string) {
            console.log('getNodeById', id, this.nodes[id])
            return this.nodes[id]
        },

        // 删除单个节点
        removeNode(node: typeApiNode) {
            delete this.nodes[generateNodeId(node)];
            this.removeFromSelectedNodes(node); // 如果删除的节点在选中列表中，也需要移除
        },

        // 清空所有节点
        clearNodes() {
            this.nodes = {};
            this.clearSelectedNodes(); // 同时清空选中节点
        },

        // 替换所有节点
        setAllNodes(newNodes: Record<string, typeApiNode>) {
            Object.values(newNodes).forEach(node => {
                if (node) {
                    this.setNode(node);
                }
            });
        },

        // 添加选中节点
        addToSelectedNodes(node: typeApiNode) {
            const id = generateNodeId(node)
            if (!this.selectedNodes.includes(id)) {
                this.selectedNodes.push(id); // 避免重复添加
            }
        },

        // 移除选中节点
        removeFromSelectedNodes(node: typeApiNode) {
            console.log('removeFromSelectedNodes called with node:', node, this.selectedNodes);
            this.selectedNodes = this.selectedNodes.filter(nodeId => nodeId !== generateNodeId(node));
            console.log('selectedNodes after removal:', this.selectedNodes)
        },

        // 清空所有选中节点
        clearSelectedNodes() {
            this.selectedNodes = [];
        },

        // 选中所有节点
        selectAllNodes() {
            this.selectedNodes = Object.keys(this.nodes);
        },


        setXtermNode(node: typeApiNode) {
            this.currentXtremNode = node;
        },

        removeXtermNode() {
            this.currentXtremNode = null;
        },
    },
});