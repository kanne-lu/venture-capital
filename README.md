# 启峰创投 Venture Link Demo

启峰创投项目连接平台 Demo：投资机构、FA、政府招商部门和项目方可以进入对应身份工作台，浏览项目、申请查看 BP、审批授权，并提交新项目进入审核队列。

## 技术栈

- Next.js 16（Webpack）
- React 19
- TypeScript
- 原生 CSS（蓝白数据平台视觉，响应式布局）

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://127.0.0.1:3000>。

生产构建与启动：

```bash
npm run build
npm run start -- -p 3200
```

## Demo 范围

- 项目市场：关键词、行业、阶段、城市筛选
- 身份入口：投资机构、FA、政府招商、项目方
- 项目详情与 BP 查看申请
- 项目方工作台：申请审批、通知、项目发布审核状态
- 本地 BP 文件选择：PDF / PPT / PPTX，单文件最大 50MB
- 桌面端与移动端响应式页面

Demo 数据仅保存在当前浏览器会话，不连接真实数据库或文件存储。
