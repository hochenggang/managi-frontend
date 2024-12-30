import router from "./router"



const hello = 'api 方法合集'

// 定义API接口
interface typeApiUris {
    ping: string,
    login: string,
    adminInit: string,
    tokenInfo: string,
    getNodes: string,
    addNode: string,
    sshTest: string,
}

// 配置API接口信息
const apiUris: typeApiUris = {
    ping: '/api/ping',
    login: '/api/login',
    adminInit: '/api/admin/init',
    tokenInfo: '/api/token/info',
    getNodes: '/api/nodes',
    addNode: '/api/node',
    sshTest: '/api/ssh/test',
}

interface typeApiPingResult {
    pong: number
}

interface typeApiUser {
    username: string
    password: string
}

interface typeApiAdminLoginResult {
    "access_token": string, "token_type": string
}

interface typeApiTokenInfoResult { "user_name": string, "create_at": string, "expire_at": string }


interface typeApiNode {
    name: string
    ip: string
    port: number
    ssh_username: string
    auth_type: string
    auth_value: string
}

type typeCmds = string[]


// 获取缓存的后端主机地址，可能在前后端分离时使用
const getCachedApiHost = () => {
    const host = localStorage.getItem('cached-api-host')
    if (host === null) {
        return window.location.origin
    } else {
        return host
    }
}

const setCachedApiHost = (value: string) => localStorage.setItem('cached-api-host', value)

if (getCachedApiHost() === null) {
    setCachedApiHost(window.location.origin)
}


const getCachedToken = () => localStorage.getItem('cached-api-token')
const setCachedToken = (value: string) => localStorage.setItem('cached-api-token', value)

const getCachedNodes = (): Record<string, typeApiNode> => {
    const cachedNodes = localStorage.getItem('cached-nodes');
    return cachedNodes ? JSON.parse(cachedNodes) : {};
};

const setCachedNodes = (value: Record<string, typeApiNode>) => localStorage.setItem('cached-nodes', JSON.stringify(value));


// 检测API主机对应的 ping 接口能否正常请求
const checkApiHost = async (apiHost: string | null): Promise<typeApiPingResult | null> => {
    try {
        const resp = await fetch(`${apiHost}${apiUris.ping}`);
        // 检查响应状态码
        if (!resp.ok) {
            return null; // 如果状态码不是 2xx，返回 false
        }
        const json = await resp.json() as typeApiPingResult; // 尝试解析 JSON
        console.log(apiUris.ping, json);
        return json;
    } catch (error) {
        return null;
    }
};


// 请求管理员初始化接口
const initAdmin = async (user: typeApiUser): Promise<string> => {

    return new Promise(async (resolve, reject) => {
        try {
            console.log(user)
            const resp = await fetch(`${getCachedApiHost()}${apiUris.adminInit}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });
            // 检查响应状态码
            if (resp.ok) {
                resolve('注册成功');
            } else {
                // 后端会直接返回错误原因
                reject(await resp.text());
            }
        } catch (error) {
            reject('请求失败');
        }
    });
}



// 请求管理员登录接口
const loginAdmin = async (user: typeApiUser): Promise<string | typeApiAdminLoginResult> => {

    return new Promise(async (resolve, reject) => {
        try {
            console.log(user)
            const resp = await fetch(`${getCachedApiHost()}${apiUris.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });
            if (resp.ok) {
                resolve(await resp.json() as typeApiAdminLoginResult);
            } else {
                reject(`错误代码 ${resp.status}`);
            }
        } catch (error) {
            reject('请求失败');
        }
    });
}



// 请求管理员登录接口
const getTokenInfo = async (): Promise<string | typeApiTokenInfoResult> => {

    return new Promise(async (resolve, reject) => {
        try {
            const resp = await fetch(`${getCachedApiHost()}${apiUris.tokenInfo}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getCachedToken(),
                },
            });
            if (resp.ok) {
                try {
                    resolve(await resp.json() as typeApiTokenInfoResult);
                } catch (error) {
                    reject('控制平面 返回错误的数据格式')
                    router.push('/')
                }
            } else {
                reject(`控制平面 返回错误代码 ${resp.status}`);
            }
        } catch (error) {
            reject('当前设备 网络通信失败');
        }
    });
}


interface typeCmdsTestResult {
    time_elapsed: number
    success: boolean
    output: string[]
    error: string[]
    node: typeApiNode
}


// 请求管理员登录接口
const testSSH = async (node: typeApiNode, cmds: typeCmds): Promise<string | typeCmdsTestResult> => {

    return new Promise(async (resolve, reject) => {
        try {
            const resp = await fetch(`${getCachedApiHost()}${apiUris.sshTest}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getCachedToken(),
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


export { hello, checkApiHost, getCachedApiHost, setCachedApiHost, initAdmin, loginAdmin, getCachedToken, setCachedToken, getTokenInfo, testSSH, setCachedNodes, getCachedNodes }
export type { typeApiUris, typeApiPingResult, typeApiUser, typeApiAdminLoginResult, typeApiTokenInfoResult, typeCmds, typeApiNode, typeCmdsTestResult }