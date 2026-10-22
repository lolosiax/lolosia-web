<div align="center">

<img src="public/logo-gradient.png" width="128" alt="洛洛希雅" />

# lolosia-web

**洛洛希雅的午后梦乡 · 前端**

Vue 3 单页应用 —— 与 [lolosia-backend](https://github.com/lolosiax/lolosia-backend) 配套，构建产物由后端的 `viteJar` 内嵌进原生可执行文件

[快速开始](#快速开始) · [特性](#特性) · [目录结构](#目录结构) · [环境变量](#环境变量) · [接口约定](#接口约定) · [文档](#延伸阅读)

[![Vue](https://img.shields.io/badge/Vue-3.5.44-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.14.7-409EFF)](https://element-plus.org)
[![Pinia](https://img.shields.io/badge/Pinia-4.1.0-FFD859?logo=pinia&logoColor=333)](https://pinia.vuejs.org)
[![UnoCSS](https://img.shields.io/badge/UnoCSS-66.11.0-333333?logo=unocss&logoColor=white)](https://unocss.dev)
[![License](https://img.shields.io/badge/License-MIT-3DA639)](LICENSE)

</div>

- **运行形态**：构建产物部署在 `/home/`，默认由后端作为静态资源直接提供；开发时前端跑 5005、后端跑 7129，跨端口直连
- **结构**：`core/` 只放布局、路由、请求、状态与 UI 原语，业务全部在 `modules/<域>/`，依赖方向单向

> 第三方数据与在线服务声明见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) · 上线前验收清单见 [doc/test-checklist.md](doc/test-checklist.md)

## 特性

**结构与路由**

- `core` / `modules` 单向依赖：`core` 不反向引用业务模块，路由表在组合根 [`src/router.ts`](src/router.ts) 拼装
- 布局按 `meta.bare` 切换：常规页走 `LiquidLayout`（桌面侧栏 + 移动端顶栏 / 底部 Tab），入口页与个人主页整页呈现
- 路由 `meta.roles` 同时决定**菜单可见性**与**能否访问**（`owner` 直通），后端 `/menu/config` 只控制菜单显隐
- 未登录访问受限页会带 `redirect` 回登录页；用户信息与角色在首次进入时并行拉取
- 首屏占位在 [`boot.ts`](src/boot.ts) 里先渲染 logo + 标题 + 进度条，再动态加载应用

**请求与实时**

- axios 统一解后端信封 `{code,msg,data}`，`Bearer` 会话，`401/403` 自动清会话并跳登录
- 错误提示可开关（调试面板里控制「是否弹出后端错误」）
- SSE：先 `POST /api/sse`（`x-upgrade: event-source`）换 id，再开原生 `EventSource`；登录态用 `/api/sse/registry` 补绑，断线 5 秒重连

**界面与构建**

- UnoCSS（`presetWind4`）+ SCSS 设计令牌（[`core/theme/base-theme.scss`](src/core/theme/base-theme.scss)），Element Plus 只作控件层
- Element Plus 组件由 `unplugin-vue-components` 按需解析；构建按 `vue` / `element-plus` / `vendor` 三组切分
- 资源路径不写死：`@` 指向 `src`，静态资源前缀由 `settings.viteBasePath` 与 `window.NGINX_BASE_URL` 决定
- 构建信息（版本 / 提交号 / 构建时间）由后端 `viteJar` 注入，登录页与调试面板直接展示

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5.44（`<script setup>` + TypeScript strict） |
| 构建 | Vite 8.3.5（生产构建按依赖分组切 chunk） |
| 语言 | TypeScript 5.9.3 + vue-tsc |
| 路由 | vue-router 4.6.4（HTML5 history，base = `/home/`） |
| 状态 | Pinia 4.1.0 + pinia-plugin-persistedstate |
| 组件 | Element Plus 2.14.7（按需引入） |
| 样式 | UnoCSS 66（`presetWind4`）+ SCSS |
| 图标 | bootstrap-icons |
| 请求 | axios（统一信封、401 处理、调试开关） |
| 图形 / 动效 | GSAP、three（主页场景与视差） |
| 其它 | gcoord（坐标转换）、lunar-calendar、moment-mini、nprogress |
| 包管理 | pnpm 10.17.0（Node ≥ 22） |

## 目录结构

```
src/
├── core/                     # 与业务无关的基础设施
│   ├── api/                  # 接口封装：user / role / menu / permission / setting / router
│   ├── composables/          # 通用组合式函数：dialog / form / mobile / resize / keyboard
│   ├── config/               # settings（标题、basePath、默认尺寸）、env、类型
│   ├── layout/               # liquid 布局 + shared（顶栏 / 主区 / 头像 / 调试器）
│   ├── lib/                  # http / sse / permission / clipboard / format / path / transition / validate
│   ├── router/               # 建路由、守卫、角色可见性、后端组件注册表
│   ├── stores/               # auth / layout / debug / route-cache
│   ├── styles/ theme/ ui/    # 全局样式、设计令牌、基础组件（AppPage / LiquidBox / SvgIcon …）
│   └── pages/error/          # 401 / 404 / 500
├── modules/                  # 按功能域拆分，每域自带上 pages / components / composables / api
│   ├── site/                 # 入口页与个人主页（Hero 场景、照片墙、门户卡片）
│   ├── auth/                 # 登录 / 注册
│   ├── dashboard/            # 仪表板（指标、热力、推荐、最近动态）
│   ├── files/                # 在线文件管理器与媒体查看
│   ├── footprint/            # 足迹地图（高德 JS API）
│   ├── anime/                # 番组表与关注
│   └── system/               # 用户 / 角色权限 / 菜单 / 个人中心
├── App.vue
├── boot.ts                   # 首屏占位，随后 import('./main')
├── main.ts                   # 创建应用、Pinia、路由，注入会话失效回调
└── router.ts                 # 路由组合根：core 机制 + 各模块页面
```

## 快速开始

### 环境

- Node ≥ 22
- pnpm 10.17.0（`corepack enable` 会自动读取 `packageManager`）

### 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:5005
```

`pnpm dev` 走 `.env.serve-dev`：`VITE_APP_BASE_MODE=port`、`VITE_APP_BASE_PORT=7129`，也就是前端 5005 直连本机后端 7129。后端按自己的文档启动（`gradlew runDebug`）即可。

### 构建与校验

```bash
pnpm build       # 产物在 dist/（mode=build）
pnpm preview     # 本地预览产物，http://localhost:5006
pnpm verify      # eslint + eslint(hard) + vue-tsc，提交前跑这个
pnpm format      # prettier --write
```

### 与后端一起打包

后端 [`platforms.json`](https://github.com/lolosiax/lolosia-backend) 的 `webPath` 指向本目录后，`viteJar` 会执行构建并把 `dist/` 并进 `classpath.zip`。注意两处必须一致：

- 本仓库 [`src/core/config/settings.ts`](src/core/config/settings.ts) 的 `viteBasePath`（默认 `/home/`）
- 后端 vite 配置的 `contextPath`

改了一边不改另一边，路由与静态资源都会 404。

## 路由与模块

| 路径 | 页面 | 可见角色 |
| --- | --- | --- |
| `/` | 入口页（公开） | 所有人 |
| `/lolosia` | 个人主页（公开） | 所有人 |
| `/login` | 登录 / 注册 | 所有人 |
| `/dashboard` | 仪表板 | 登录用户 |
| `/files/**` | 文件管理（URL 即目录路径） | `owner` / `admin` |
| `/footprint` | 足迹地图 | `owner` / `admin` |
| `/anime` | 番组表 | `owner` / `admin` / `user` |
| `/system/{user,role,menu}` | 系统管理 | `admin` |
| `/profile` | 个人中心（头像入口，不占侧栏） | 登录用户 |
| `/401` `/404` `/500` | 错误页 | 所有人 |

新增页面 = 在 `modules/<域>/` 下写页面 + `routes.ts` 导出路由，再到 [`src/router.ts`](src/router.ts) 里拼进 `menuRoutes`；隐藏页面加 `meta.hidden`，需要缓存加 `meta.cachePage`。

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `VITE_APP_ENV` | `dev` / `prod`，`isProd` 据此判断 |
| `VITE_APP_BASE_MODE` | 后端地址来源：`local` 同源（默认）、`port` 指定端口、`url` 指定完整地址 |
| `VITE_APP_BASE_PORT` | `port` 模式下的后端端口 |
| `VITE_APP_BASE_URL` | `url` 模式下的后端根地址 |
| `VITE_AMAP_KEY` | 高德 JS API 的 Web 端 key（足迹地图） |
| `VITE_AMAP_SECURITY_CODE` | 高德安全密钥 |

地址优先级：`window.NGINX_BASE_URL`（反向代理注入）> `VITE_APP_BASE_MODE` 配置 > 当前页面 origin。
`.env.build` / `.env.serve-dev` 只放占位值，真实 key 不要提交。

## 接口约定

- 所有请求都落在 `{root}/api/`，响应是 `{code,msg,data}`；成功码 `0` / `200` / `20000`，其余按失败处理
- 鉴权头 `Authorization: Bearer <sessionId>`（登录返回的 `data.Authorization` 即会话 id）
- `401` / `403` 一律清会话并回登录页（`auth.reset()` + `redirect`）
- 头像走 `<img src>` 直连 `/api/user/avatar/get/{id}`；文件缩略图 / 原图由后端下发带 `exp` + `sig` 的签名直链
- SSE 事件名如 `anime.release`，订阅入口在 [`core/lib/sse.ts`](src/core/lib/sse.ts) 的 `onSseEvent`
- 权限串判定 [`core/lib/permission.ts`](src/core/lib/permission.ts) 与后端同语义：`a.b.c` 允许、`-a.b.c` 拒绝、`a.b.*` 前缀通配、`*` 全部，负号优先

## 部署

默认不单独托管：`pnpm build` 的产物由后端 `viteJar` 打进二进制，访问 `http://<host>:7129/home/`。

如果要把前端单独放到 Nginx：

- `base` 与后端保持一致（`/home/`），history 回退交给 Nginx `try_files`
- 页面里注入 `window.NGINX_BASE_URL` 指定 API 根地址，或改用 `VITE_APP_BASE_URL` 的 `url` 模式
- 跨域时后端要放行对应 Origin；同域反代（`/api` 转发到 7129）最省事

## 延伸阅读

| 文档 | 内容 |
| --- | --- |
| [doc/test-checklist.md](doc/test-checklist.md) | 上线前的验收清单 |
| [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) | 行政区划数据来源、高德 JS API 与依赖声明 |
| [lolosia-backend](https://github.com/lolosiax/lolosia-backend) | 后端：接口、鉴权、配置与部署 |

## License

[MIT](LICENSE) © 洛洛希雅Lolosia
