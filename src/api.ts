
// 定义API接口
interface typeApiUris {
    ping: string,
    getNodes: string,
    addNode: string,
    sshTest: string,
}

const apiUris: typeApiUris = {
    ping: '/api/ping',
    getNodes: '/api/nodes',
    addNode: '/api/node',
    sshTest: '/api/ssh/test',
}


interface typeApiPingResult {
    pong: number
}



type typeCmds = string[]
interface typeApiNode {
    name: string;
    host: string;
    port: number;
    username: string;
    auth_type: string;
    auth_value: string;
}

interface typeOldApiNode {
    name: string;
    ip: string; // 旧字段名
    port: number;
    ssh_username: string; // 旧字段名
    auth_type: string;
    auth_value: string;
}

// 转换函数：将旧版本节点转换为新版本节点
const oldApiNodeConvert = (node: typeOldApiNode): typeApiNode => {
    return {
        name: node.name,
        host: node.ip, // 将旧字段 ip 映射到新字段 host
        port: node.port,
        username: node.ssh_username, // 将旧字段 ssh_username 映射到新字段 username
        auth_type: node.auth_type,
        auth_value: node.auth_value,
    };
};


const oldNodesToNewNodes = (cachedNodes: Record<string, typeApiNode | typeOldApiNode>) => {
    const nodes: Record<string, typeApiNode> = {};

    if (cachedNodes) {
        Object.keys(cachedNodes).forEach((key) => {
            const node = cachedNodes[key];
            // 检查是否存在旧字段 ip，判断是否为旧版本节点
            if ('ip' in node) {
                // 类型断言：确保 TypeScript 知道 node 是 TypeOldApiNode
                nodes[key] = oldApiNodeConvert(node as typeOldApiNode);
            } else {
                // 类型断言：确保 TypeScript 知道 node 是 TypeApiNode
                nodes[key] = node as typeApiNode;
            }
        });
    }

    return nodes
}


// 获取缓存节点
const getCachedNodes = (): Record<string, typeApiNode> => {
    const cachedNodesRaw = localStorage.getItem('cached-nodes');
    const cachedNodes: Record<string, typeApiNode | typeOldApiNode> =
        cachedNodesRaw ? JSON.parse(cachedNodesRaw) : {};
    const nodes = oldNodesToNewNodes(cachedNodes)
    // 只要获取缓存节点，就触发一次转换保存
    setCachedNodes(nodes)
    return nodes;
};


const setCachedNodes = (nodes: Record<string, typeApiNode>) => {
    localStorage.setItem('cached-nodes', JSON.stringify(oldNodesToNewNodes(nodes)))
};


interface typeCmdsTestResult {
    time_elapsed: number
    success: boolean
    output: string[]
    error: string[]
    node: typeApiNode
}

const apiHost = location.host
const apiOrigin = location.origin
// const apiHost = '127.0.0.1:18001'
// const apiOrigin = 'http://127.0.0.1:18001'

// 请求管理员登录接口
const testSSH = async (node: typeApiNode, cmds: typeCmds): Promise<string | typeCmdsTestResult> => {

    return new Promise(async (resolve, reject) => {
        try {
            const resp = await fetch(`${apiOrigin}${apiUris.sshTest}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    node: node,
                    cmds: cmds,
                })
            });
            if (resp.ok) {
                resolve(await resp.json() as typeCmdsTestResult);
            } else {
                reject(`Error code ${resp.status}`);
            }
        } catch (error) {
            reject('Network error');
        }
    });
}


export { testSSH, setCachedNodes, getCachedNodes, apiHost, oldNodesToNewNodes }
export type { typeApiUris, typeApiPingResult, typeCmds, typeApiNode, typeCmdsTestResult }