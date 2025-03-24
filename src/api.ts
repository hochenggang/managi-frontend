import router from "./router"



const hello = 'api 方法合集'

// 定义API接口
interface typeApiUris {
    ping: string,
    getNodes: string,
    addNode: string,
    sshTest: string,
}

// 配置API接口信息
const apiUris: typeApiUris = {
    ping: '/api/ping',
    getNodes: '/api/nodes',
    addNode: '/api/node',
    sshTest: '/api/ssh/test',
}

interface typeApiPingResult {
    pong: number
}


interface typeApiNode {
    name: string
    ip: string
    port: number
    ssh_username: string
    auth_type: string
    auth_value: string
}

type typeCmds = string[]

const getCachedNodes = (): Record<string, typeApiNode> => {
    const cachedNodes = localStorage.getItem('cached-nodes');
    
    return cachedNodes ? JSON.parse(cachedNodes) : {};
};

const setCachedNodes = (value: Record<string, typeApiNode>) => localStorage.setItem('cached-nodes', JSON.stringify(value));



interface typeCmdsTestResult {
    time_elapsed: number
    success: boolean
    output: string[]
    error: string[]
    node: typeApiNode
}

const apiHost = location.host
const apiOrigin = location.origin

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
                reject(`后端 返回错误代码 ${resp.status}`);
            }
        } catch (error) {
            reject('当前设备 网络通信失败');
        }
    });
}


export { hello, testSSH, setCachedNodes, getCachedNodes, apiHost }
export type { typeApiUris, typeApiPingResult, typeCmds, typeApiNode, typeCmdsTestResult }