# Landing 场景与页面（dev/webgpu-landing）

> 这是「3D 场景与页面」模块的工作记录，也是**后续会话的冷启动说明**。
> 文档已按模块拆分，导航见 [README.md](README.md)：
> 角色与动画 → [character-animation.md](character-animation.md)；
> 动骨物理 → [hair-physics.md](hair-physics.md)。
>
> 记录时间：2026-10-23（2026-10-25 更新拆分）
> 前端仓库：`E:\Dev\Node\lolosia-web`（工作区里的 `web` 是指向它的 Junction）
> 后端仓库：`E:\Dev\Kotlin\lolosia-backend`（本次未改动，已切到 `master`）

---

## 0. 一分钟速查

| 项目 | 值 |
|---|---|
| 前端仓库 | `E:\Dev\Node\lolosia-web` |
| 远程 | Gitee `origin` |
| 当前分支 | `dev/webgpu-landing`（基于 `dev/architecture-ddd`） |
| 启动 | `pnpm dev`（Vite，端口 **5005**，base `/home/`） |
| 场景页 | http://localhost:5005/home/lab |
| 基础页 | http://localhost:5005/home/ |
| 完整动效页 | http://localhost:5005/home/landing |
| 构建 / 类型检查 | `pnpm build`、`pnpm typecheck` |
| 硬性 lint | `pnpm lint:hard`（规则见第 10 节） |
| 3D 引擎 | three.js 0.186（WebGL2） |
| 角色与动画 | 见 [character-animation.md](character-animation.md) |
| 动骨物理 | 见 [hair-physics.md](hair-physics.md) |
| 素材授权 | 模型/动画按 Avatar 原授权（VN3 等）执行，与 MIT 无关；见 [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) |

---

## 1. 任务背景与目标

原始需求是一个「水面 + 花瓣飘落」的开屏场景：

- 开屏雾化过渡，倾斜视口拍水面
- 水面实时波纹，带反射/运镜/景深
- 花瓣飘落，照片与文字随水波移动
- 温馨、艺术感强，可长期扩展得更花哨

已落地的部分：水面、花瓣、角色、树、反射、雾化入场。
尚未落地：照片/文字贴在花瓣上、真实运镜与景深、镜头动画。

---

## 2. 仓库与分支状态

### 最近提交（2026-10-25）

```
4518fcd feat(site): 角色动骨改为 PhysBone 参数语义的弹簧骨求解器
0a8d8c3 feat(site): 锦鲤跃水、角色落点持久化与平面反射
dad9445 feat(site): 加入 Toon 角色、程序化远景树与脚步涟漪
a17ddc5 feat(site): 测试页改为 Three.js 花瓣水面场景
8e14bb5 fix(site): 路由切换补上完整动效页入口
864ef05 feat(site): 默认入口改为低负载导航页，新增 WebGPU 渲染测试页
00f6d60 feat(landing): 入口页对齐 master 设计并拆分组件
```

### 工作区

2026-10-25：除文档拆分外无未提交改动。

### 已废弃/被替换的实现

`864ef05` 里曾有三套手写渲染后端：`webgpu-scene.ts` / `webgl-scene.ts` / `canvas2d-scene.ts`，
在 `a17ddc5` 中改为 three.js 后删除。需要参考时可从 git 历史取回：

```
git show 864ef05:src/modules/site/gpu/webgpu-scene.ts
```

### 后端

`lolosia-backend` 已 fetch `--prune`，Gitee 仅剩 `origin/master` 与 `origin/dev/dashboard`；
本地已切 `master`（`4715371`）并删除 6 个遗留本地分支。

---

## 3. 本地运行与环境

```powershell
cd E:\Dev\Node\lolosia-web
pnpm dev          # vite --mode serve-dev，端口 5005
pnpm typecheck    # vue-tsc --noEmit
pnpm lint:hard    # 严格 ESLint
pnpm build        # vite build --mode build
```

- `vite.config.ts`：`base = settings.viteBasePath`，dev/preview 端口见该文件，`dedupe: ['three']`。
- 本地 `.env.serve-dev` 会指向开发后端；具体地址、域名与端口只保留在本机，**不要写进文档，也不要提交**。
- 本文件不记录任何部署域名、接口地址/端口、账号或密钥，可以安全进入公开仓库。
- 角色地址可用 `VITE_APP_AVATAR_URL` 覆盖，默认 `${BASE_URL}res/characters/moe/Moe.glb`。
- 模型与烘焙动画都不在 Git 中（见 `character-animation.md`），新机器上需要先放素材，
  否则场景其余部分正常、角色加载失败（控制台 warning）。

---

## 4. 路由与页面

`src/modules/site/routes.ts`：

| 路径 | name | 页面 | 说明 |
|---|---|---|---|
| `/` | Landing | `LandingLitePage.vue` | 基础页，无 canvas，低负载 |
| `/landing` | LandingFull | `LandingPage.vue` | 对齐 master 的完整动效页 |
| `/lab` | LandingLab | `LandingLabPage.vue` | 本次的 3D 场景页 |
| `/lolosia` | Hero | `HeroPage.vue` | 个人主页 |

右上角 `RouteSwitcher.vue` 固定三个入口：基础页 / 完整动效页 / GPU 测试页。
`/` 与 `/landing` 都挂了切换条；`/lab` 也有。

---

## 5. 场景架构（three.js）

数据流：

```
LandingLabPage.vue
  └─ usePetalScene(canvas)             // 挂载/尺寸/指针/销毁
       └─ createPetalScene(canvas)     // 渲染循环与场景装配
            ├─ createPetalField()      // 50 片 InstancedMesh 花瓣
            ├─ createWaterSurface()    // 水面 ShaderMaterial
            ├─ createWaterReflection() // 镜像相机 → 半分辨率 RT
            ├─ createTree()            // 程序化远景树
            ├─ createKoi()             // 随机跃水的锦鲤 + 水花
            ├─ createCharacter()       // GLTF + Toon + 状态机（落点存 Pinia）
            └─ createDust()            // 浮尘 Points
```

### 文件索引

| 文件 | 职责 |
|---|---|
| `src/modules/site/composables/use-petal-scene.ts` | 生命周期、ResizeObserver、pointer 事件、WebGL 能力检测 |
| `src/modules/site/store.ts` | 场景 Pinia store：角色落点（`localStorage` 持久化） |
| `src/modules/site/gpu/petal-scene.ts` | 场景装配、相机、灯光、帧循环、脚步涟漪、反射调用 |
| `src/modules/site/gpu/petal-field.ts` | `InstancedMesh` 花瓣，50 片，自定义 ShaderMaterial |
| `src/modules/site/gpu/water-surface.ts` | 水面：多重正弦波 + 涟漪 + 菲涅尔 + 平面反射采样 + 静水区 |
| `src/modules/site/gpu/water-reflection.ts` | 平面反射：镜像相机、纹理矩阵、半分辨率 RT、隔帧渲染 |
| `src/modules/site/gpu/koi.ts` | 跃水锦鲤：车削鱼身 + 抛物线 + 水珠/水柱/白环 |
| `src/modules/site/scenery/tree.ts` | 递归分叉树 + 根系 + 球形关节 + 点云树冠 |
| `src/modules/site/character/character.ts` | GLB 加载、Toon 材质、骨骼步态、idle/walk 状态机、落点恢复 |
| `src/modules/site/character/clip-animation.ts` | 外部剪辑播放器：按名匹配骨骼、世界增量 × 镜像换算、fps 插值循环 |
| `src/modules/site/character/hair-physics.ts` | 动骨链参数与 1/60 s 调度（求解器见 `physbone-solver.ts`） |
| `src/modules/site/character/physbone-solver.ts` | 弹簧骨求解器（pull/spring/stiffness/gravity/immobile/limit） |
| `src/modules/site/pages/LandingLabPage.vue` | 画布、标题、卡片、状态栏、雾化入场 |
| `src/modules/site/components/shared/RouteSwitcher.vue` | 三页切换胶囊按钮 |

角色与动骨的细节分别见 [character-animation.md](character-animation.md)、
[hair-physics.md](hair-physics.md)。

---

## 6. 关键参数

### 场景

| 常量 | 值 | 说明 |
|---|---|---|
| `WATER_Y` | `-1.9` | 水面、角色、树的统一基准高度 |
| `BASE_Y` | `0.35` | 相机高度 |
| `LOOK_Y` | `-0.4` | 相机注视点高度 |
| `TILT` | `0.055` | 相机 Z 轴倾角（约 3°，斜向构图） |
| `MAX_DPR` | `2` | 像素比上限 |
| `REFLECTION_SCALE` | `0.55` | 反射 RT 分辨率比例 |

### 花瓣

- 50 片，`PlaneGeometry`，尺寸 0.1–0.3
- 下落 0.12–0.3 单位/秒（等价提示词的 0.002–0.005/帧 @60fps）
- X 摆动：`sin(elapsed*0.5+offset)*0.3`
- 落到水面高度后重置到顶部，X/Z 重新随机

### 水面

- 全局波：4 组正弦，顶点位移 ±0.035/0.028
- 静水区：`CALM_RADIUS = 2`（米），`smoothstep` 内全局波压到 0，只保留脚步涟漪
- 脚步涟漪：6 个槽位，`emitRipple(x, z, strength)`，持续 2.2 s（与锦鲤水花共用）
- 反射强度：`0.15 + fresnel * 0.22`，向天空色混 28%
- 反射距离衰减：8→20 米
- 反射隔帧更新

### 树（seed 453）

| 参数 | 值 |
|---|---|
| 位置 | `(-11.8, WATER_Y, -19.5)` |
| 缩放 | `1.55` |
| 层级 | 6 级递归，主分叉 3，之后 2 |
| 树干半径 | 0.3，树根 0.15–0.26 |
| 树根 | 6–9 条，角度/长度/半径随机，一段主根 ×1.4，强制向下 |
| 关节 | 每个枝段末端补球，半径 = 段半径 × 0.66，遮住圆柱端面 |
| 树冠 | 末梢三级挂叶团，每团 52 点，约 1.3 万点 |
| 叶色 | `#e0ecc7` 混 `#efe6f7` 32%–58% |
| 树皮 | `#8d8098` |
| 点云雾 | `8 → 32`，雾混 95%，alpha 0.62 |

### 锦鲤

| 参数 | 值 |
|---|---|
| 起跳范围 | x ∈ [-3, 0.2]，z ∈ [-4.2, -2.6]（角色身后的水域） |
| 跃距 | 0.9–2.4 单位，方向随机 |
| 跃高 | 0.85–1.5 单位，时长 1.05–1.6 s |
| 间隔 | 首次 2.5–6 s，之后 5–20 s |
| 体型 | 身长 0.92 × 缩放 0.75–1.05 |
| 避让 | 起跳/入水点尽量离角色 ≥1.6 / 1.4 米，最多重试 8 次 |
| 水花 | 72 颗水珠（重力 8.4）+ 水柱 0.72 s + 白环 0.85 s |
| 涟漪 | 起跳 0.75；入水 1.9，另补 1.35 / 0.85 两圈（+0.16 s / +0.34 s） |

> 角色身高、状态机、Toon 色阶、落点持久化等参数见
> [character-animation.md](character-animation.md#2-角色参数)。

---

## 7. 交互与视觉决策记录

| 反馈 | 处理 |
|---|---|
| ddd 分支 landing 与 master 差异巨大 | 按 master 的 `src/views/landing/index.vue` 还原，并按硬性 lint 限制拆成 6 组件 + 1 composable |
| 完整页 20 fps、卡顿 | 定位为 `backdrop-filter` 与 `filter: blur()` 的合成开销；用户选择「先不优化」 |
| 默认路由负载高 | 新增 `/` 基础页（无 canvas），另加 `/lab` 测试页 |
| 切换条少了完整页入口 | 恢复三个按钮，`/landing` 也挂切换条 |
| 想要花瓣场景 | 改用 three.js：50 片实例化花瓣 + 水面 + 雾化入场 |
| 想加载角色并用状态机驱动 | GLB + Toon + idle/walk 状态机；FBX 无动画，步态程序化 |
| 二次元角色不适合 PBR | `MeshToonMaterial` + 5 阶色阶 + rim light |
| 程序化树，左上角远处 | 递归分叉 + 点云树冠，放 `(-11.8, -19.5)` |
| 树太近、颜色太深 | 拉远到 24 单位、放大 1.55、加强雾化、提亮叶/树皮 |
| 树斜、断面明显 | 扫描 500 个种子选 453（树冠重心居中）；枝段末端补球遮端面 |
| 树根上翘、太均匀 | 独立根系生成，强制向下；数量/角度/长度/半径随机，一段主根 |
| 想要动效/场景感 | 水面倾斜视角、涟漪、浮尘、开屏雾、照片卡浮动 |
| 屏幕空间反射 | 采用平面反射（镜像相机 + 半分辨率 RT），淡反射 |
| 树影硬边太明显 | 反射 pass 隐藏树；反射按 8–20 单位衰减；树本身再淡一档 |
| 角色脚悬空 | 水面高度对齐到 `WATER_Y`；模型包围盒最低点对齐根原点 |
| 波纹吞脚 | 角色 2 米内全局波压平；移除 0.02 下沉 |
| 刷新后角色总从原点重新跑 | 落点/朝向写进 Pinia（`site-scene`），1.5 s 节流持久化，载入时校验范围后恢复 |
| 场景太静 | 锦鲤随机跃水（5–20 s），入水砸出水花与多圈涟漪 |
| 锦鲤挡住角色 / 钻到卡片后 | 起跳区压到角色身后的左中水域；路径最多重试 8 次避开角色 |
| 水花像方块像素 | `PointsMaterial` 换成径向渐变贴图水珠，水柱改为低透明度锥体 |

---

## 8. 性能与已知问题

- 本机预览浏览器是 **SwiftShader 软件渲染**（无 WebGPU 适配器）：
  - 完整动效页约 20 fps
  - 场景页约 23–48 fps（随角色/反射开关变化）
  - 基础页稳定 60 fps
- 反射是第二遍场景渲染，已降为 0.55 分辨率并隔帧更新。
- 树是 3 个 draw call（枝干 / 关节 / 点云），花瓣 1 个。
- 锦鲤平时只留水珠 1 个 draw call；跃水时增加 7 个鱼身/鱼鳍/眼睛与水柱、白环，落水后自动隐藏。
- 角色蒙皮与 Toon 开销很小，主要成本在填充率与软件光栅化。
- 真实 GPU 上未实测，WebGPU 分支已移除，统一走 WebGL2。
- 树影在反射中被人为隐藏，这是视觉取舍，不是 bug。

---

## 9. 验证与截图流程

### 常规验证

```powershell
pnpm typecheck
pnpm eslint -c eslint.hard.config.mjs src/modules/site
pnpm build
```

### 截图（可靠方式）

`msedge --headless --screenshot --virtual-time-budget` 有时会把 CSS 雾化入场定格在半透明状态，
不要用它判断视觉。改用 **CDP + 真实等待**：

```powershell
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$proc = Start-Process -FilePath $edge -PassThru -ArgumentList `
  '--headless=new','--disable-gpu-sandbox','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',`
  '--remote-debugging-port=9333','--window-size=1269,736',"--user-data-dir=$env:TEMP\edge-cdp-scene",'about:blank'
Start-Sleep -Seconds 4
node cdp-shot.mjs        # 见下方脚本
Stop-Process -Id $proc.Id -Force
```

`cdp-shot.mjs`（Node ≥22，内置 `fetch` 与 `WebSocket`）：

```js
import { writeFileSync } from 'node:fs'
const port = '9333'
const url = 'http://localhost:5005/home/lab'
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json()
const socket = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 0
const pending = new Map()
const send = (method, params = {}) => {
  const id = ++nextId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result)
})
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve)
  socket.addEventListener('error', reject)
})
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1269, height: 736, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url })
await new Promise(resolve => setTimeout(resolve, 8000))
const { data } = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(`${process.env.TEMP}\\scene-shot.png`, Buffer.from(data, 'base64'))
socket.close()
```

浏览器面板的 webview 若宽度为 0（截图全白/0x0），不要浪费时间调它，直接用上面的 CDP 方式。

---

## 10. 代码规范硬门槛

`eslint.hard.config.mjs`：

| 规则 | 上限 |
|---|---|
| `max-lines`（文件） | 600 |
| `vue/max-lines-per-block` | script 400 / template 240 / style 400 |
| `max-lines-per-function` | 120 |
| `complexity` | 20 |
| `max-params` | 8 |
| `vue/max-template-depth` | 5 |
| `vue/max-props` | 16 |

TypeScript：

- `strict` + `noUncheckedIndexedAccess`（数组访问要判空）
- `noUnusedLocals`
- `verbatimModuleSyntax`（类型导入用 `import type`）

注意事项：

- 嵌套函数内 TS 会丢失 null 窄化：先 `if (!raw) throw`，再用显式类型的常量。
- 组件/函数超过 120 行时，优先拆到模块级函数或独立模块（`water-reflection.ts`、`createFootsteps`、`loadCharacter` 都是这么拆出来的）。
- WebGL2 原生 shader 需要 `#version 300 es`；three 的 `ShaderMaterial` 不需要。
- 光照注意 `MeshToonMaterial` 没有高光，环境光过强会洗白分层。

---

## 11. 待办 / 下一步

1. 有真实 GPU 的机器上验证 `/lab` 帧率与观感。
2. 照片与文字贴到花瓣上（原需求核心）：
   - 花瓣实例携带纹理索引/UV
   - 图片走缩略图接口，按需加载与缓存，避免一次拉大量原图
   - 文字用 Canvas 纹理或 SDF
3. 若要真正的屏幕空间射线追踪（非平面），可再评估 `SSRPass`；当前平面反射足够。
4. 运镜 / 景深 / 开屏镜头动画尚未实现。

> 角色相关待办见 [character-animation.md](character-animation.md#8-待办)，
> 动骨相关见 [hair-physics.md](hair-physics.md#8-复现与待办)。

---

## 12. 常见坑

- **`E:\Dev\Trae\lolosia` 本身不是 git 仓库**，真正的仓库在 `E:\Dev\Node\lolosia-web`（`web` 是 Junction）。
- 工作区根目录的 `AGENTS.md` 已指向 `backend/AGENTS.md`：后端是 Kotlin/Native(KMP)+Ktor，不是 Spring。
- 改了 `vite.config.ts` 会触发 dev server 重启，端口可能从 5005 变成 5006（先检查监听端口）。
- 模型缺失时页面不报错白屏，只会在控制台出现「角色载入失败」；检查 `Moe.glb` 是否存在。
- 反射 pass 中必须隐藏水面，否则会自我采样；树也被隐藏以避免远景硬边。
- 水面网格是 `1×1` 分段的大平面，顶点位移只影响四角，视觉波浪主要来自片元法线，调波浪优先改片元。
- 角色 `getWorldPosition` 取的是脚踝骨骼，涟漪位置据此生成，不要改成根节点位置。
- 涟漪槽位由 `water-surface.ts` 的 `RIPPLE_SLOTS` 统一控制（当前 6），shader 里的数组长度与循环都用它插值；改数量只需改这一个常量。
- 角色落点由 `character.ts` 直接读写 `site-scene` store；store 依赖 `main.ts` 已 `app.use(pinia)`，不要在 pinia 之前调用场景。
- 浏览器软件渲染下 `requestAdapter()` 可能返回 null 或长时间挂起；当前实现已不依赖 WebGPU。

### 调试手段（浏览器）

- `browser_evaluate` 里跑多语句脚本经常返回 `undefined`：改用 `setInterval(() => { window.__rec.push(...) }, 25)` 先落盘到 `window`，等一会儿再单独 `JSON.stringify(window.__rec)` 读取。
- 页面里没有 `THREE` 全局，`new THREE.Vector3()` 会报未定义：直接用 `object.matrixWorld.elements` 取数，或只取标量。
- PowerShell 里内联 Python 的引号会被吞，写临时 `.py` 文件再执行。
- `pnpm lint:hard` 会连 `ts-out-dir/` 等生成目录一起报错；判断本次改动是否合规时，对单文件跑 `pnpm eslint -c eslint.hard.config.mjs <file>`。

> 角色动画的坑见 [character-animation.md](character-animation.md#7-常见坑)；
> 动骨物理的坑与 Unity↔Web 对齐方法见 [hair-physics.md](hair-physics.md)（第 6 节）。
