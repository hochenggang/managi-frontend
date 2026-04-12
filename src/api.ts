
const apiUris = {
    ping: '/api/ping',
    getNodes: '/api/nodes',
    addNode: '/api/node',
    sshTest: '/api/ssh/test',
    sshBatch: '/api/ssh/batch',
};

export interface typeApiUris {
    ping: string,
    getNodes: string,
    addNode: string,
    sshTest: string,
    sshBatch: string,
}

export interface typeApiPingResult {
    pong: number
}

export interface typeApiNode {
    name: string;
    host: string;
    port: number;
    username: string;
    auth_type: string;
    auth_value: string;
}

export interface typeOldApiNode {
    name: string;
    ip: string;
    port: number;
    ssh_username: string;
    auth_type: string;
    auth_value: string;
}

export interface typeCmdsTestResult {
    time_elapsed: number
    success: boolean
    output: string[]
    error: string[]
    node: typeApiNode
    cmds: string
}

export type typeCmds = string[]

const oldApiNodeConvert = (node: typeOldApiNode): typeApiNode => {
    return {
        name: node.name,
        host: node.ip,
        port: node.port,
        username: node.ssh_username,
        auth_type: node.auth_type,
        auth_value: node.auth_value,
    };
};

export const oldNodesToNewNodes = (cachedNodes: Record<string, typeApiNode | typeOldApiNode>) => {
    const nodes: Record<string, typeApiNode> = {};

    if (cachedNodes) {
        Object.keys(cachedNodes).forEach((key) => {
            const node = cachedNodes[key];
            if ('ip' in node) {
                nodes[key] = oldApiNodeConvert(node as typeOldApiNode);
            } else {
                nodes[key] = node as typeApiNode;
            }
        });
    }

    return nodes;
};

export const getCachedNodes = (): Record<string, typeApiNode> => {
    const cachedNodesRaw = localStorage.getItem('cached-nodes');
    const cachedNodes: Record<string, typeApiNode | typeOldApiNode> =
        cachedNodesRaw ? JSON.parse(cachedNodesRaw) : {};
    const nodes = oldNodesToNewNodes(cachedNodes);
    setCachedNodes(nodes);
    return nodes;
};

export const setCachedNodes = (nodes: Record<string, typeApiNode>) => {
    localStorage.setItem('cached-nodes', JSON.stringify(oldNodesToNewNodes(nodes)))
};

let apiHostValue = '';

export const initApiHost = () => {
    if (!apiHostValue) {
        const stored = localStorage.getItem('managi-api-host');
        if (stored) {
            apiHostValue = stored;
        } else {
            const { protocol, hostname, port } = window.location;
            const isHttps = protocol === 'https:';
            apiHostValue = isHttps ? hostname : `${hostname}${port ? ':' + port : ''}`;
        }
    }
};

export const setApiHost = (host: string) => {
    apiHostValue = host;
    localStorage.setItem('managi-api-host', host);
};

export const getApiHost = (): string => {
    initApiHost();
    return apiHostValue;
};

export const getWsUrl = (): string => {
    initApiHost();
    return apiHostValue;
};

export const getApiUrl = (): string => {
    initApiHost();
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${apiHostValue}`;
};

export const testSSH = async (node: typeApiNode, cmds: typeCmds): Promise<typeCmdsTestResult> => {
    const resp = await fetch(`${getApiUrl()}${apiUris.sshTest}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node, cmds }),
    });
    if (!resp.ok) {
        throw new Error(`Error code ${resp.status}`);
    }
    return await resp.json() as typeCmdsTestResult;
};

export const batchSSH = async (nodes: typeApiNode[], cmds: typeCmds): Promise<typeCmdsTestResult[]> => {
    const resp = await fetch(`${getApiUrl()}${apiUris.sshBatch}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, cmds }),
    });
    if (!resp.ok) {
        throw new Error(`Error code ${resp.status}`);
    }
    return await resp.json() as typeCmdsTestResult[];
};

initApiHost();
