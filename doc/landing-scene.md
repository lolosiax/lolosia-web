# Landing 场景改造记录（dev/webgpu-landing）

> 用途：本文件是当前任务的完整工作记录，同时作为**后续会话的冷启动说明**。
> 记录时间：2026-10-23
> 工作目录：`f:\Develop\Trae\lolosia-home`（`web` 是指向 `F:\Develop\Node\lolosia-web` 的 Junction）
> 后端仓库：`F:\Develop\Kotlin\lolosia-backend`（本次未改动，已切到 `master`）

---

## 0. 一分钟速查

| 项目 | 值 |
|---|---|
| 前端仓库 | `F:\Develop\Node\lolosia-web` |
| 远程 | Gitee `origin` |
| 当前分支 | `dev/webgpu-landing`（基于 `dev/architecture-ddd`） |
| 启动 | `pnpm dev`（Vite，端口 **5005**，base `/home/`） |
| 场景页 | http://localhost:5005/home/lab |
| 基础页 | http://localhost:5005/home/ |
| 完整动效页 | http://localhost:5005/home/landing |
| 构建 / 类型检查 | `pnpm build`、`pnpm typecheck` |
| 硬性 lint | `pnpm lint:hard`（规则见第 11 节） |
| 角色模型 | `public/res/characters/moe/Moe.glb`（3.1 MB，**已被 .gitignore 忽略**） |
| 模型来源 | `F:\Unity\VRChat\Moe\Assets\Lolosia\FBX\Moe_Slim.fbx`（不入库） |
| 3D 引擎 | three.js 0.186（WebGL2） |
| 未提交改动 | 反射、树参数、脚底对齐、静水区等（见第 2 节） |

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

### 已提交（本地）

```
0729eb7 feat(site): 加入 Toon 角色、程序化远景树与脚步涟漪   # 仅本地，未 push
be48e40 feat(site): 测试页改为 Three.js 花瓣水面场景          # 已 push
4228bbe fix(site): 路由切换补上完整动效页入口
325758f feat(site): 默认入口改为低负载导航页，新增 WebGPU 渲染测试页
68ad070 feat(landing): 入口页对齐 master 设计并拆分组件
```

### 未提交（工作区）

```
 M .env.serve-dev                          # 本地接口地址，故意不提交
 M src/modules/site/character/character.ts  # 脚底对齐、去下沉、落点持久化
 M src/modules/site/gpu/petal-scene.ts      # 反射接入、静水区、锦鲤装配
 M src/modules/site/gpu/water-surface.ts    # 反射采样、波浪阻尼、涟漪槽位 6 个
 M src/modules/site/scenery/tree.ts         # 树根、断面、雾化、配色
 M src/modules/site/pages/LandingLabPage.vue # 状态栏文案
?? src/modules/site/store.ts                # 场景 Pinia store（角色落点）
?? src/modules/site/gpu/water-reflection.ts # 平面反射模块
?? src/modules/site/gpu/koi.ts              # 跃水锦鲤 + 水花
```

### 已废弃/被替换的实现

`325758f` 里曾有三套手写渲染后端：`webgpu-scene.ts` / `webgl-scene.ts` / `canvas2d-scene.ts`，
在 `be48e40` 中改为 three.js 后删除。需要参考时可从 git 历史取回：

```
git show 325758f:src/modules/site/gpu/webgpu-scene.ts
```

### 后端

`lolosia-backend` 已 fetch `--prune`，Gitee 仅剩 `origin/master` 与 `origin/dev/dashboard`；
本地已切 `master`（`4715371`）并删除 6 个遗留本地分支。

---

## 3. 本地运行与环境

```powershell
cd F:\Develop\Node\lolosia-web
pnpm dev          # vite --mode serve-dev，端口 5005
pnpm typecheck    # vue-tsc --noEmit
pnpm lint:hard    # 严格 ESLint
pnpm build        # vite build --mode build
```

- `vite.config.ts`：`base = settings.viteBasePath`，dev/preview 端口见该文件，`dedupe: ['three']`。
- 本地 `.env.serve-dev` 会指向开发后端；具体地址、域名与端口只保留在本机，**不要写进文档，也不要提交**。
- 本文件不记录任何部署域名、接口地址/端口、账号或密钥，可以安全进入公开仓库。
- 角色地址可用 `VITE_APP_AVATAR_URL` 覆盖，默认 `${BASE_URL}res/characters/moe/Moe.glb`。
- 模型文件不在 Git 中，新的机器上需要先放模型，否则场景其余部分正常、角色加载失败（控制台 warning）。

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
| `src/modules/site/pages/LandingLabPage.vue` | 画布、标题、卡片、状态栏、雾化入场 |
| `src/modules/site/components/shared/RouteSwitcher.vue` | 三页切换胶囊按钮 |

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

### 角色

| 参数 | 值 |
|---|---|
| 目标身高 | 1.15 世界单位 |
| 状态机 | `idle`（1.2–3.6 s）↔ `walk`（0.36 单位/秒） |
| 活动范围 | x ∈ [-2, 1.2]，z ∈ [-2, -0.6] |
| 脚底对齐 | 缩放后 `model.position.y -= box.min.y` |
| 站立高度 | `WATER_Y + bob`（bob 走路 ≤0.02，idle ±0.007） |
| Toon 色阶 | `[70, 120, 175, 225, 255]`，`NearestFilter` |
| 边缘光 | `0.22`，粉白 `(1.0, 0.85, 0.94)` |
| 落点持久化 | `site-scene` store，`pick: ['characterPose']`，每 1.5 s 与销毁时写回 |

恢复规则：store 里的 `{ x, z, yaw }` 在 `BOUNDS` 内才采用，否则回到随机出生点；
恢复后仍从 `idle` 起步，只是位置和朝向不再是原点。

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

---

## 7. 角色资产管线（FBX → GLB）

原 FBX **没有任何动画片段**（actions 为空），有 186 根骨骼、114 个表情 Morph。

处理步骤（本机 Blender 4.4 无头模式，脚本为临时文件，未入库）：

1. 导入 `Moe_Slim.fbx`
2. 重新链接丢失贴图：`Body.png`、`MergedTexture.png`、`Effect_C.png`
3. `MergedTexture` 从 4096 降到 2048
4. 导出 `GLB`，贴图用 WebP，保留蒙皮，丢弃表情 Morph
5. 产物 3.1 MB，放到 `public/res/characters/moe/Moe.glb`

要点：

- 模型不是开源内容，`.gitignore` 增加了 `public/res/characters/`
- 部署时用 `VITE_APP_AVATAR_URL` 指向服务器地址
- 走路由加载：`fetch` + `GLTFLoader.parseAsync`，避免 base 路径问题
- 没有走路 clip，所以步态是程序化骨骼驱动（腿/膝/手臂/脊柱）
- 需要更自然的动作时，导入 Mixamo 走路 clip 后再用 `AnimationMixer` 替换程序化步态，状态机可复用

---

## 8. 交互与视觉决策记录

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

## 9. 性能与已知问题

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

## 10. 验证与截图流程

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

## 11. 代码规范硬门槛

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

## 12. 待办 / 下一步

1. 有真实 GPU 的机器上验证 `/lab` 帧率与观感。
2. 把当前未提交的反射/树/脚底/静水区改动整理成一次或两次提交并推送。
3. 照片与文字贴到花瓣上（原需求核心）：
   - 花瓣实例携带纹理索引/UV
   - 图片走缩略图接口，按需加载与缓存，避免一次拉大量原图
   - 文字用 Canvas 纹理或 SDF
4. 用 Mixamo 走路 clip 替换程序化步态，接入 `AnimationMixer`。
5. 若要真正的屏幕空间射线追踪（非平面），可再评估 `SSRPass`；当前平面反射足够。
6. 运镜 / 景深 / 开屏镜头动画尚未实现。

---

## 13. 常见坑

- **`f:\Develop\Trae\lolosia-home` 本身不是 git 仓库**，真正的仓库在 `F:\Develop\Node\lolosia-web`（`web` 是 Junction）。
- 工作区根目录的 `AGENT.md` 已过时：后端是 Kotlin/Native(KMP)+Ktor，不是 Spring；后端规范看 `backend/AGENTS.md`。
- 改了 `vite.config.ts` 会触发 dev server 重启，端口可能从 5005 变成 5006（先检查监听端口）。
- 模型缺失时页面不报错白屏，只会在控制台出现「角色载入失败」；检查 `Moe.glb` 是否存在。
- 反射 pass 中必须隐藏水面，否则会自我采样；树也被隐藏以避免远景硬边。
- 水面网格是 `1×1` 分段的大平面，顶点位移只影响四角，视觉波浪主要来自片元法线，调波浪优先改片元。
- 角色 `getWorldPosition` 取的是脚踝骨骼，涟漪位置据此生成，不要改成根节点位置。
- 涟漪槽位由 `water-surface.ts` 的 `RIPPLE_SLOTS` 统一控制（当前 6），shader 里的数组长度与循环都用它插值；改数量只需改这一个常量。
- 角色落点由 `character.ts` 直接读写 `site-scene` store；store 依赖 `main.ts` 已 `app.use(pinia)`，不要在 pinia 之前调用场景。
- 浏览器软件渲染下 `requestAdapter()` 可能返回 null 或长时间挂起；当前实现已不依赖 WebGPU。
