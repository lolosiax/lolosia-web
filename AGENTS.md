# AGENTS.md —— 前端工程风格与硬性约定

> 在本仓库动手前先读本文。它是**规范性**文档（约定，不是教程）：写代码、改结构、加依赖都按这里来。
> 与代码冲突时以代码为准，并顺手回来修本文。
> 深度材料（模块设计、3D 场景、角色/动画、动骨物理、验收清单）见 [`doc/README.md`](doc/README.md)。
>
> 面向对象：AI agent 与人类协作者一视同仁 —— 约定就是约定。

## 0. 项目定位

- **Vue 3.5 + Vite 8 + TypeScript 5.9** 的单页应用；UI 用 Element Plus + UnoCSS，状态用 Pinia（持久化插件），
  3D 用 three.js 0.186（WebGL2），动画用 GSAP。
- 构建产物部署在 `/home/` 子路径下，由后端作为静态资源提供；开发时前端 `pnpm dev`（5005），
  后端另起（7129），跨端口直连。
- 前端仓库是独立 git 仓库（`E:\Dev\Node\lolosia-web`）；工作区里的 `web/` 是指向它的 Junction。
  **工作区根目录不是仓库**，git 操作要带上 `-C` 或用仓库绝对路径。
- 项目本身是 MIT；角色模型/动画等美术资源**不随仓库分发**，授权另算（见 §7）。

## 1. 目录与依赖方向

```
src/
  core/                 基础设施，只提供机制，不认识任何业务
    api/                资源级 HTTP 客户端（user / role / menu / setting …）
    composables/        跨模块复用组合式函数
    config/             settings.ts（viteBasePath 等）、env.ts、types.ts
    icons/ layout/      图标注册、布局壳
    lib/                http（axios 实例）/ sse / path / format / validate / clipboard / transition / permission
    router/             createAppRouter / 守卫 / 菜单 / component-registry（只提供机制，不 import modules）
    stores/             auth / layout / route-cache / debug
    styles/ theme/      SCSS 与主题变量
    ui/                 通用组件：AppPage / NavContainer / SvgIcon / LiquidBox / MenuIcon / ElSvgIcon
  modules/              业务域，每个域自带 pages / components / composables / routes.ts / api.ts / store.ts
    anime/ auth/ dashboard/ files/ footprint/ site/ system/
  App.vue  main.ts  router.ts  boot.ts
```

- **依赖方向单向：`modules/* → core/*`**。`core` 里**不许** import `modules`；页面由组合根 `src/router.ts` 拼进来。
- 应用级装配只放在 `src/main.ts`（Pinia、路由、`setMenuRoutes`、`setUnauthorizedHandler`）与 `src/router.ts`
  （`registerRouteComponents` + `menuRoutes`）；不要在别处再建一个 router / pinia。
- 新的业务页面归 `modules/<域>/pages/`，路由写在该域的 `routes.ts`（返回 `RouteRecordRaw[]`），
  再在 `src/router.ts` 的 `menuRoutes` 里挂上；后端菜单下发 `component` 字符串时还要在
  `registerRouteComponents` 登记，**未登记会直接报错**。
- 一个模块内的文件命名：
  - 组件 `PascalCase.vue`（`FootprintMap.vue`），按角色加前缀：页面 `XxxPage.vue`、
    容器 `XxxPanel.vue` / `XxxView.vue`、展示 `XxxToolbar.vue` / `XxxList.vue` / `XxxCard.vue` / `XxxDialog.vue`；
  - 组合式函数 `use-xxx.ts`（`use-files-listing.ts`）；
  - 其余 `.ts` 用 kebab-case，固定角色名保留：`routes.ts` / `store.ts` / `api.ts` / `types.ts` / `lib.ts`。
- 3D 相关代码只放在 `modules/site/`（`gpu/` 场景与着色器、`scenery/` 程序化树木、`character/` 角色与动骨）；
  `core` 与轻量页面**不要** import three，避免把 3D 依赖带进基础页。

## 2. 代码风格

1. **Vue 只用 `<script setup lang="ts">`**（`vue/component-api-style` 为 error）。
   SFC 块顺序固定 `script → template → style`；`defineOptions/defineProps/defineEmits/defineModel` 按此顺序。
2. **props / emits 一律类型声明**（`defineProps<Props>()` / `defineEmits<{ ... }>()`），不写运行时对象。
3. **组件必须显式 import**：`unplugin-vue-components` 的 `dirs` 为空，只自动解析 Element Plus；
   自定义组件漏 import 会被 `vue/no-undef-components` 直接判 error（`El*` 除外）。
4. **Element Plus**：组件与样式由 resolver 按需注入；`ElMessage` / `ElMessageBox` / `ElNotification` /
   `ElLoading` 这类**脚本式调用**的样式要手动引入（已在 `main.ts` 统一处理，新增同类服务时记得补）。
5. **TS 严格模式全开**：`strict`、`noUncheckedIndexedAccess`、`noUnusedLocals/Parameters`、
   `noImplicitOverride`、`verbatimModuleSyntax`（类型导入写 `import type`）。
   数组下标访问要判空；`any` 只允许在隔离的边界适配层出现（且会 warn）。
6. **路径别名**：统一 `@/*` → `src/*`；不要写 `../../../`。
7. **格式化交给 Prettier**：无分号、单引号、行宽 120、无尾逗号、`arrowParens: avoid`、LF。
8. **控制台**：`no-console` 只放行 `warn` / `error`；调试输出不要留在提交里。
9. **注释写约束，不写历史**：说明「为什么必须这样」「不变量是什么」；
   改动历史、迁移来源、方案第几节属于 git 与 `doc/`，不要写进代码。
10. 面向用户的文案用中文；代码标识符用英文。
11. **数据流**：props down / events up；展示组件（`*Toolbar/*List/*Card/*Dialog`）不直接调 API，只发事件；
    `v-model` 只用于真正的双向契约（输入框、开关、弹窗显隐）。
12. **composable 提取条件**：被复用、有状态、有副作用，或单段逻辑超过 80 行；纯计算放 `lib`，不要包装成 composable。

## 3. 数据与状态

- **HTTP 只走 `core/lib/http.ts` 的实例**（统一的 baseURL、信封解包、401 回调）。
  资源级接口按域放在 `core/api/*.ts` 或 `modules/<域>/api.ts`，组件里不要直接 `axios(...)`。
- **Pinia**：跨页面/跨组件共享才建 store；模块内临时状态放组件或 composable。
  持久化用 `pinia-plugin-persistedstate` 的 `persist`，**显式写 `pick`**（例如 `pick: ['characterPose']`），
  不要整仓持久化。
- **SSE** 走 `core/lib/sse.ts`；不要在组件里手写 `EventSource`。
- **权限**：菜单与按钮的可见性走 `core/lib/permission.ts`；不要在前端硬编码角色名。
- **接口契约以前端调用点为准**（后端 AGENTS 第 8 节）；改契约前先 grep 调用点。

## 4. 路由与页面

- 路由元信息约定：`title`（菜单文案）、`icon`（bootstrap-icons 名）、`hidden`（不进菜单）、
  `public`（免登录）、`bare`（不套布局壳）。守卫在 `core/router/guards.ts`。
- 页面组件只做「组装」：数据与副作用抽到 `composables/`，纯计算抽到 `lib.ts`；单文件超阈值就拆（见 §6）。
- 页面进入才 `import()`（现有页面全部懒加载）；大依赖（three、地图、编辑器）不要出现在首屏 chunk。

## 5. 3D 与性能

- 渲染入口是 `modules/site/composables/use-petal-scene.ts`（生命周期 / ResizeObserver / 指针 / 销毁），
  场景装配在 `modules/site/gpu/petal-scene.ts`；新增子系统按 `createXxx()` 工厂函数挂进去。
- 资源释放：`dispose()` 里逐一释放 geometry / material / texture / renderTarget；监听器与 rAF 必须解绑。
- 3D 场景默认按「软件渲染也能跑」设计：控制 draw call、反射降分辨率并隔帧、避免后处理堆叠。
- 细节与参数见 [doc/landing-scene.md](doc/landing-scene.md)。

## 6. 硬性门槛

`pnpm lint:hard`（`eslint.hard.config.mjs`，全部 **error**，**不允许 `eslint-disable`**）：

| 规则 | 上限 |
|---|---|
| `max-lines`（文件） | 600（跳过空行与注释） |
| `vue/max-lines-per-block` | script 400 / template 240 / style 400 |
| `max-lines-per-function` | 120 |
| `complexity` | 20 |
| `max-params` | 8 |
| `vue/max-template-depth` | 5 |
| `vue/max-props` | 16 |

两层阈值：`pnpm lint` 是 1x（warn，超过时在提交说明里解释为什么暂不拆），
`pnpm lint:hard` 是 2x（error，超过必须拆）；两者都不允许 `eslint-disable`。
拆法优先级：抽到模块级函数 → 抽 composable → 抽子组件 → 拆独立模块文件。

## 7. 资源、构建与环境

- **base 路径唯一来源**是 `src/core/config/settings.ts`（`viteBasePath`），构建时由
  `window.NGINX_BASE_URL` 参与运行时拼接；**不要写死域名、端口或 `/home`**。
- 环境变量：`.env.build` / `.env.serve-dev` 受版本控制，**本机的地址与端口只写进
  `.env.serve-dev.local`**（命中 `.gitignore` 的 `*.local`），不要改受控文件里的值。
  新增变量写进对应的 `.env.*` 并在 `core/config/env.ts` 里收敛类型，不要在代码里散落
  `import.meta.env.X`。
- 角色模型地址可用 `VITE_APP_AVATAR_URL` 覆盖，默认 `${BASE_URL}res/characters/moe/Moe.glb`。
- **美术资源不入库**：`public/res/characters/`、`public/res/animations/` 已在 `.gitignore` 里，
  由部署服务器单独提供；模型/动画的授权（VN3 等）与仓库 MIT 无关，详见
  [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
- 构建产物路径固定：`static/js/index.js`、`static/js/chunk-*.js`、`static/assets/**`；
  改 `build.rollupOptions` 前先确认为什么（后端按这些路径做缓存与内嵌）。
- 构建元信息（`VITE_APP_BASE_MODE`、`VITE_PROJECT_VERSION`、`VITE_BUILD_TIMESTAMP`、`VITE_GIT_COMMIT`）
  由后端 `gradlew viteJar` 注入，本地不要覆盖或硬编码。
- 线上 / 共享环境的凭据（域名、公网 IP、口令、签名 key）一律不入库，也不写进 `doc/`。

## 8. 验证与提交

```powershell
pnpm dev                          # 5005
pnpm verify                       # = lint + lint:hard + vue-tsc --noEmit
pnpm build                        # 产物自检
pnpm exec eslint -c eslint.hard.config.mjs <file>   # 只查本次改动的文件
pnpm format:check                 # 或 pnpm format
```

- **没有自动化测试**；行为验证靠本地页面 + 截图（CDP 流程见 [doc/landing-scene.md](doc/landing-scene.md) 第 9 节）。
- 提交信息用中文 Conventional Commits：`feat(site): …` / `fix(site): …` / `docs: …` / `chore(repo): …`；
  标题一句话说「为什么」，正文列改动点（参考 `git log`）。
- 只提交本次改动涉及的文件；**不要**把 `.env.serve-dev`、素材、构建产物、临时脚本带进提交。
- 提交前自检：`git status` 里没有意外文件；改了文档就顺手确认相对链接还能打开。

## 9. 常见坑（先看这里再排查）

- `vite.config.ts` 一改 dev server 会重启，端口可能从 5005 漂到 5006；先看监听端口。
- `pnpm lint:hard` 会连 `ts-out-dir/` 一起报错；判断本次改动时对单文件跑。
- 模型缺失不会白屏，只在控制台报「角色载入失败」。
- three 在 `resolve.dedupe` 里；**不要**再引第二个 three 副本（`three/addons` 必须走同名依赖）。
- 浏览器面板的 webview 截图可能是 0×0；用 CDP 截图，不要耗在这里。

更细的模块坑位：

| 主题 | 文档 |
|---|---|
| 场景 / 水面 / 反射 / 截图 | [doc/landing-scene.md](doc/landing-scene.md) |
| 角色 / 动画 / Toon / AFK | [doc/character-animation.md](doc/character-animation.md) |
| 动骨物理 / Unity 对标 | [doc/hair-physics.md](doc/hair-physics.md) |

## 10. 深度材料

| 文档 | 内容 |
|---|---|
| [doc/README.md](doc/README.md) | 文档导航与维护约定 |
| [doc/landing-scene.md](doc/landing-scene.md) | 3D 场景与页面：路由、three.js 装配、水面/反射/花瓣/树/锦鲤、性能、截图、代码规范 |
| [doc/character-animation.md](doc/character-animation.md) | 角色与动画：FBX→GLB、Toon、idle/walk、脚部对齐、AFK 剪辑烘焙与播放器 |
| [doc/hair-physics.md](doc/hair-physics.md) | 动骨物理：弹簧骨算法、20 条链参数、Unity↔Web 对标与调试手册 |
| [doc/test-checklist.md](doc/test-checklist.md) | 上线前验收清单 |
| [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) | 第三方数据、在线服务、VRChat 参数兼容与素材授权声明 |
