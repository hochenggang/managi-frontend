# Managi Frontend

轻量级网页版 SSH 管理工具前端

## 技术栈

| 技术 | 版本 |
|------|------|
| Vue 3 | 3.x |
| TypeScript | 5.x |
| Vite | - |
| Pinia | - |
| vue-i18n | - |
| xterm.js | - |

## 项目结构

```
managi-frontend-vue3/
├── src/
│   ├── api.ts              # API 封装 (HTTP/WebSocket)
│   ├── helper.ts           # 通用工具函数
│   ├── i18n.ts            # 国际化配置
│   ├── main.ts            # 应用入口
│   ├── App.vue            # 根组件
│   ├── assets/
│   │   ├── base.css      # CSS 变量定义
│   │   └── main.css      # 全局样式
│   ├── components/
│   │   ├── Finder.vue    # SFTP 文件管理器
│   │   ├── NodeList.vue  # 节点列表
│   │   ├── AddNode.vue   # 添加节点弹窗
│   │   ├── Modal.vue     # 通用弹窗
│   │   └── ...
│   ├── views/
│   │   ├── XtremView.vue # Web SSH 终端
│   │   └── CmdsView.vue  # 批量命令执行
│   ├── stores/
│   │   └── nodesStore.ts # 节点状态管理
│   ├── router/
│   │   └── index.ts      # 路由配置
│   └── locales/
│       ├── zh.json        # 中文翻译
│       └── en.json        # 英文翻译
└── package.json
```

## 核心功能

### 1. 批量命令执行
- 选择多个节点，一键执行命令
- 实时显示执行结果和耗时
- 支持命令快捷方式保存

### 2. Web SSH 终端
- 基于 xterm.js 的浏览器终端
- 支持终端尺寸自适应
- 心跳保活，自动重连

### 3. SFTP 文件管理
- 目录浏览、上传、下载
- 创建目录、删除、重命名
- 进度显示

## 数据存储

| Key | 说明 |
|-----|------|
| `cached-nodes` | 节点列表 (JSON) |
| `shortcuts` | 命令快捷方式 |
| `managi-api-host` | API 服务器地址 |

### 数据兼容
- 自动兼容旧版本数据结构 (`ip` → `host`, `ssh_username` → `username`)

## API 封装

```typescript
// 初始化 API 地址
initApiHost();

// 获取 API 地址
getApiHost()      // "127.0.0.1:18001"
getWsUrl()        // "127.0.0.1:18001"
getApiUrl()       // "http://127.0.0.1:18001"

// 设置 API 地址
setApiHost('192.168.1.100:8080');

// 命令执行
batchSSH(nodes, commands): Promise<CmdsTestResult[]>
testSSH(node, commands): Promise<CmdsTestResult>

// 节点管理
getCachedNodes(): Record<string, typeApiNode>
setCachedNodes(nodes): void
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **数据驱动**: 使用 Vue 响应式系统管理状态
- **TypeScript**: 强类型定义，提升代码可靠性
- **国际化**: 支持多语言切换

## 样式规范

使用 CSS 变量统一管理主题色：

```css
:root {
  --color-main: #9ec1eb;    /* 主色 */
  --color-sub: #d5e5f7;      /* 辅色 */
  --color-bg: #e4f0ff79;    /* 背景 */
  --color-green: #1cad70;   /* 成功 */
  --color-red: #eb4646;     /* 错误 */
  --color-orange: #f59b00;   /* 警告 */
  --color-font-1: #555555;  /* 主文字 */
  --color-font-2: #555555;  /* 次文字 */
}
```

## 许可证

MIT License
