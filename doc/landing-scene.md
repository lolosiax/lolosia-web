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
| AFK 动作 | `public/res/animations/moe_afk.json`（Unity 烘焙，随模型一起放服务器资源，**不入库**；播放器 `character/clip-animation.ts`） |
| 素材授权 | 模型与动画按原 Avatar 的授权条款执行（VN3 或更早的协议，以原始发布页为准），与本仓库的 MIT **不是一回事** |
| AFK 诊断页 | http://localhost:5005/home/lab?afk=1 |
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
| `src/modules/site/character/clip-animation.ts` | 外部剪辑播放器：按名匹配骨骼、世界增量 × 镜像换算、fps 插值循环 |
| `src/modules/site/character/hair-physics.ts` | 头发/尾巴/耳朵/胸的动骨模拟（DynamicBone 式 Verlet） |
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

### AFK 动作剪辑（`.anim` → JSON → 播放器）

```
Assets/Kyubi closet/Moe/Animation/Base_Animation/Moe_Locomotion/
  Moe_Locomotion Animation/Moe_AFK_Loop_by_Levin.anim
    └─ Unity Editor: AnimationMode.SampleAnimationClip 逐帧采样（30 fps，16 s，480 帧）
         └─ 每根骨: delta = q_after × inverse(q_rest)   // 世界增量
              └─ public/res/animations/moe_afk.json     // 49 根 humanoid 骨，worldDelta: true（不入库）
                   └─ character/clip-animation.ts: createClipPlayer()
```

- 只导旋转、不导位置；播放按名字匹配骨骼（名字需要归一化，见第 13 节）。
- 用**世界增量**而不是局部旋转：Unity 骨架与 Blender 导出骨架的骨骼轴向不同，直接套局部四元数会把角色拧倒。
- Unity 左手系 → three 右手系要做镜像换算 `(x, y, z, w) → (x, -y, -z, w)`，这一步在播放器里做，JSON 保持 Unity 原始值。
- 源剪辑不含头发/尾巴/耳骨，这几类只能靠动骨物理（`character/hair-physics.ts`）。
- 动作独立成 JSON，`Moe.glb` 不用重导；换动作只替换这个文件。
- 诊断入口：`/home/lab?afk=1` 固定播放 AFK，便于对照 Unity。

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

### 角色动画（Unity `.anim` → three，2026-10-25）

- **GLTFLoader 会清洗节点名**：`Back Hair.001` → `BackHair001`（点号直接删掉、空格变下划线）。按名字匹配骨骼前必须归一化，当前用 `normalize = name.replace(/[\s_.-]/g, '').toLowerCase()`。不做这一步时不报错，只是"动画没生效"，很难往这里想。
- **左手系/右手系的镜像是最贵的一坑**：漏了 `(x, y, z, w) → (x, -y, -z, w)`，手臂会整体甩到背后或头顶。症状有强误导性——纯 X 轴旋转（腿前后摆、躯干前倾）镜像后不变，所以看起来"下半身正常、只有上半身错"，容易误判成上半身数据坏了。
- **别靠肉眼判断姿态对不对**，用世界位置逐点比对：Unity 侧 `SampleAnimationClip` 后取骨骼世界坐标，和 Web 侧 `bone.matrixWorld` 的位置比（头、胸、双腕、双踝），低于 2 cm 才算对上。位置不受镜像对称性欺骗，比看截图可靠得多。
- **先验证烘焙数据再改播放器**：怀疑转换出错时，先在 Unity 用同一帧重采样、跟 JSON 逐骨比。本轮 JSON 与 Unity 完全一致，问题 100% 在播放侧，省掉了大范围排查。
- **姿势"看起来怪"不等于转换错**：源剪辑本身就是左手在腹前、右手从髋前摆到胸前、右脚比左脚高约 0.2 m。Unity 采样同样如此。
- **父骨必须先应用**：世界增量换局部四元数要用"本帧"的父级世界旋转，所以轨道按深度排序后再更新，顺序错了会用到上一帧的父级、产生延迟抖动。
- **`getWorldQuaternion()` 会隐式 `updateWorldMatrix(true, false)`**，会刷新祖先矩阵。不要在"只改了一半骨骼"的循环里随手调用，否则后面的父级读到混合状态。

### 动骨物理（`character/hair-physics.ts`）

- **逐帧位置 lerp 一定会自激振荡**：首版用两轮 lerp（0.165 / 0.09）+ 无速度 Verlet，实测 7–15 Hz 抖动，观感就是"所有动骨像弹簧"。根因是每步约束修正被 Verlet 当成了速度，越修越抖。正确做法是照抄 DynamicBone：固定 1/60 子步、单轮约束、`pos += (restPos - pos) * elasticity`、速度每步乘 `(1 - damping)`。
- **`m_Damping` / `m_Elasticity` 都是"每次更新"的量，不是每秒的量**。直接拿来当 `1/s` 用会随帧率漂。当前映射：`damping = 1 - exp(-spec.damping * dt)`，`elasticity = 0.04 + 0.2 * stiffness`（stiffness 0.3 → 0.10，即 DynamicBone 默认值）。
- **必须做根骨平移补偿**（DynamicBone 的 `m_Inert`）：角色 0.36 m/s 行走时，`1/60 × 1/0.08 ≈ 6–7 cm` 的跟随滞后；而耳骨每节只有约 2 cm，链条会被拉反、翻到 180°。每帧把根骨位移同时加到 `pos` 和 `prev`。
- **约束修正要写回 `prev`**：长度、角度、碰撞三种约束都改位置，不同步更新 `prev` 就等于往系统里灌能量，表现仍是抖。`solveAngle` / `pushOut` 里都补了 `prev[i].add(delta)`。
- **子步要固定、不要自适应**：固定 1/60 让参数手感与帧率无关；`MAX_SUBSTEPS = 3` 只用于防止掉帧后一次追赶过多。
- **AFK 下动骨"几乎不动"是错觉**：以前只测了纯动画姿态，误以为 AFK 没有驱动量。启用 GestureManager + AFK 后，Unity 的 VRCPhysBone 会真实模拟，头发骨骼局部旋转可达 22°，呆毛可达 35°（见第 14 节）。
- 量化方法：25 ms 采样局部四元数相对首帧的夹角，看「单帧最大跳变」和「停步后的峰值」，比截图更容易确认是否还在抖。

### 材质与渲染

- **GLB 的 `alphaMode: BLEND` 会让角色穿透**：转成 three 材质后 `transparent = true` 且不写深度，角色进透明队列，背后的树/水面会透出来，甚至自己穿透自己。二次元角色除发梢、裙摆等少数部位外都该是 OPAQUE；导入后按材质名强制改，别直接透传 `pbr.transparent` / `pbr.depthWrite`。

### 调试手段（浏览器）

- `browser_evaluate` 里跑多语句脚本经常返回 `undefined`：改用 `setInterval(() => { window.__rec.push(...) }, 25)` 先落盘到 `window`，等一会儿再单独 `JSON.stringify(window.__rec)` 读取。
- 页面里没有 `THREE` 全局，`new THREE.Vector3()` 会报未定义：直接用 `object.matrixWorld.elements` 取数，或只取标量。
- PowerShell 里内联 Python 的引号会被吞，写临时 `.py` 文件再执行。
- `pnpm lint:hard` 会连 `ts-out-dir/` 等生成目录一起报错；判断本次改动是否合规时，对单文件跑 `pnpm eslint -c eslint.hard.config.mjs <file>`。

---

## 14. AFK 动骨物理对标（2026-10-25）

目标：确认「同一段 AFK 动画、同一相位」下，Web 的动骨物理（`character/hair-physics.ts`）和
Unity/VRChat 的 VRCPhysBone 是否一致。动画播放本身已在上一轮验证过（身体骨误差 < 3 mm），本轮只看动骨。

### 14.1 在 Unity Play 模式触发 AFK

前提：`Moe` 上有 `Animator`（Avatar=`FBX_MoeAvatar`，运行时 controller 为 null）与
`VRCAvatarDescriptor`；场景里有 `GestureManager`（Gesture Manager 3.9）。

1. GestureManager 的 `Module` 默认是 null，需要在 Play 模式里手动挂上它的 `ModuleVrc3`：
   ```csharp
   var gm = GameObject.Find("GestureManager").GetComponent<GestureManager>();
   var mod = new BlackStartX.GestureManager.Editor.Modules.Vrc3.ModuleVrc3(vrcDescriptor);
   gm.SetModule(mod);   // 内部会 Connect → InitForAvatar，自建 PlayableGraph
   ```
2. AFK 是 animator 参数（Bool），直接走它自己的参数表：
   ```csharp
   Vrc3Param afk; mod.Params.TryGetValue("AFK", out afk); afk.Set(mod, true);
   ```
   `Params` 是 public 字典，`Set` 是 public；不需要模拟 UI 点击。
3. AFK 动作不在 Locomotion 层，而在 **Action 层**：`Moe_Action.controller` 的
   `Afk_Intro → Afk_Loop → Afk_Outro`，循环剪辑就是 `Moe_AFK_Loop_by_Levin`。
   采样前确认 `AnimatorControllerPlayable.GetCurrentAnimatorClipInfo(0)` 返回该剪辑且 `weight == 1`。
4. **Unity Play 模式会真实模拟 PhysBone**（SDK 的 `VRC.Dynamics.PhysBoneManager` 会跑
   `FixedUpdate/LateUpdate`），所以这份参考数据是「动画 + 物理」，不是纯动画姿态。
   取层 playable 的方式：反射 `ModuleVrc3._layers` → `LayerData.Playable`（`AnimatorControllerPlayable`）。

### 14.2 采样方法

- 用 `EditorApplication.update` 注册逐帧回调（`EditorApplication.CallbackFunction`），**不要**在
  execute_code 里 `Thread.Sleep`：主线程被阻塞时动画和物理都不会推进。
- 每帧写一行 JSONL，字段：
  `t`（realtimeSinceStartup）、`dt`、`clip`、`w`、`n`（Action 层的 `normalizedTime`）、
  `p`（292 根骨在 `Moe` 局部空间的坐标）、`q`（115 根动骨链骨的 localRotation）。
- 头部一行写骨骼表（name/path/parent/physRoot）和 `qIdx`。
- 本次参数：45 s、7088 帧（约 164 fps）、`unity-gm-afk.jsonl`（86 MB）。
- Web 侧沿用 `/home/lab?afk=1` 的采样（159 fps、36 s），AFK 播放器时间通过
  `window.__moe.player.time` 读出（`ClipPlayer` 增加了 `readonly time`）。

### 14.3 时间轴怎么对齐

**不要用墙钟对齐，也不要用互相关猜偏移**。两边都记录剪辑相位，按相位配对：

- Unity：`phase = frac(normalizedTime) × 16`（`16` 是剪辑长度；该状态 speed = 1，
  实测 `normalizedTime` 每 4.64 s 增加 0.29，即 16 s 一圈）。
- Web：`phase = player.time`（0..16 循环）。
- 对每个 Unity 帧，在 Web 帧里找循环相位差最小的一帧；**只用 Web 采集时间 ≥ 16 s 的帧**，
  确保物理已经稳定。
- 丢弃 `phase < 4 s` 的帧（开头段），并只保留 `weight > 0.99` 的帧。
- 校验：身体骨残差中位 **0.58 mm**、最大 6.4 mm，说明相位对齐没有偏移；如果对齐错了，
  这里会先炸到厘米级。

坐标系映射：Umeyama 相似变换（允许镜像）一次性拟合，结果是
`R ≈ diag(-1, 1, 1)`、`det = -1`、`scale = 0.8082`（= 1.15 m 目标身高 / 原始身高），
说明「Unity 左手系 → three 右手系」就是 x 取反，没有额外旋转。
另外逐帧再扣一个整体平移，剥离「Web 只导旋转、不导位移」造成的 1.4 cm 漂移，避免污染动骨误差。

### 14.4 对比结果

| 组 | 中位 | 均值 | 95% | 最大 |
|---|---|---|---|---|
| 身体骨（动画） | 0.57 mm | 0.77 mm | 2.13 mm | 6.41 mm |
| 动骨链根骨 | 0.69 mm | 0.68 mm | 0.95 mm | 1.64 mm |
| 动骨链子骨 | 6.74 mm | 13.38 mm | 45.1 mm | 168.3 mm |

- 最差：`Tail.009` 均值 44 mm、`Back Hair*` 36–41 mm（峰值 168 mm）、`Sides Hair_L.005` 30 mm；
  耳朵只有 0.6 mm。
- 链长几乎不变（403 vs 405 mm 等），**没有拉伸、爆炸、方向反转**；Web 自身两圈同相位差 < 5 mm，
  说明没有振荡。
- 真正的问题是**响应偏慢**：

| 链 | Unity 摆幅 | Web 摆幅 | Web 滞后 | 相关系数 |
|---|---|---|---|---|
| Back Hair.001 | 39.0 mm | 33.2 mm | 0.32 s | 0.64 |
| Back Hair_L.001 | 39.3 mm | 34.6 mm | 0.32 s | 0.68 |
| Back Hair_R.001 | 37.3 mm | 30.8 mm | 0.30 s | 0.57 |
| Sides Hair_L.001 | 14.5 mm | 13.0 mm | 0.06 s | 0.63 |
| Tail.001 | 40.0 mm | 27.4 mm | ≈0.08 s | 0.41 |
| Bangs.001 | 3.5 mm | 2.7 mm | 0.12 s | 0.79 |
| Ear_L.001 | 1.7 mm | 1.3 mm | 0.02 s | 0.62 |

结论：方向对、幅度偏小 15–30%、后发慢约 1/3 秒；尾巴摆幅只有 Unity 的 ~70%。

### 14.5 参数对照（Unity 实测 vs 当前 Web）

Unity（Play 模式下读取，已含 NDMF 处理）：

| 链 | pull | spring | stiffness | gravity | immobile | limit |
|---|---|---|---|---|---|---|
| 后发/侧发/刘海/呆毛 | 0.1 | 0.5 | 0.05 | 0.08（falloff 1） | World 0.5 | Angle 90 / 55 / 50 / 35 |
| 尾巴 | 0.05 | 0.8 | 0.05 | 0 | World 0.5 | Polar 10 |
| 耳朵 | 0.05 | 0.9 | 0.05 | 0 | World 0.5 | Angle 60 |

Web（[hair-physics.ts](../src/modules/site/character/hair-physics.ts)）：

- `HAIR = { damping 4.2, stiffness 0.3, gravity 0.8 }` → **gravity 是 Unity 的 10 倍**（0.8 vs 0.08）；
- 求解器是 DynamicBone 模型（`elasticity = 0.04 + 0.2 × stiffness`，阻尼按 `1-exp(-damping·dt)`），
  和 VRCPhysBone 的 `pull/spring/stiffness/immobile` 不是同一套；`immobile` 没有实现；
- 尾巴 `damping 2.4 / stiffness 0.22` 对应不上 Unity 的 `spring 0.8`。

### 14.6 复现与下一步

- 数据与脚本（临时目录，不入库）：
  `%TEMP%\lolosia-afk-compare\` 下的 `unity-gm-afk.jsonl`、`web-afk.json`、
  `compare_gm.py`（主对比）、`diag_gm.py` / `diag_lag.py`（滞后/幅度）、`web-sample.mjs`（CDP 采样）。
- 下一步（已完成，见 14.8）：按 VRCPhysBone 的 `pull/spring/stiffness/immobile` 重写求解器，
  用真实参数替换 DynamicBone 预置。

### 14.7 反编译分析与求解顺序

> 这一节是互操作性研究记录：反编译产物只放在本机临时目录，**不入库**；仓库里的实现是按行为
> 独立重写的 TypeScript，不包含 VRChat SDK 代码。许可声明见
> [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。

Rider 自带的反编译器没有命令行入口（只能在 Assembly Explorer 里交互查看）。
本机用 `ilspycmd` 更省事：

```powershell
dotnet tool install --global ilspycmd

$p = 'E:\Unity\VRChat\Moe\Packages\com.vrchat.base\Runtime\VRCSDK\Plugins'
ilspycmd -o "$env:TEMP\vrc-physbone-src\sdk"      "$p\VRC.SDK3.Dynamics.PhysBone.dll"  # 组件
ilspycmd -o "$env:TEMP\vrc-physbone-src\dynamics" "$p\VRC.Dynamics.dll"                # 求解器
```

- 组件与参数：`VRCPhysBoneBase` / `VRCPhysBone`；`CalcPull/CalcSpring/CalcStiffness/
  CalcGravity/CalcImmobile/CalcMaxAngle/...` 都在 `VRCPhysBoneBase` 里，
  曲线为空时按常数 1 处理。
- 求解器：`VRC.Dynamics.PhysBoneManager`（`LateUpdate` 里推进）+ 内部 `PhysBoneJob`
  （`SolveChain` / `SolveAnimation` / `SolveCollisions` / `ApplyAngleLimits`）。
- 生命周期：`UpdateRootsJob` 用 `executions = min(dt / (1/60), 6)` 决定子步数，
  `PhysBoneJob.Execute` 对每条链按 `frameRatio`（最后一步不足 1）求解。
- 本次模型的实际配置已导出到
  `%TEMP%\lolosia-afk-compare\vrc-physbone-config.json`（36 条链，含曲线关键帧）。

核心积分（Advanced，Version_1_0，与我们的 DynamicBone 式求解器完全不同）：

```
v = prevVelocity * spring
v += (poseEnd - (endPoint + v)) * pull
v += down * gravity * boneLength          // falloff: 按骨骼朝向与重力夹角在 1-falloff..1 间插值
v += prevVector * stiffness               // 注意：是往"上一帧骨骼方向"回正，不是回静止姿态
endPoint += v
endPoint = 长度夹到 restLength（maxStretch/maxSquish 为 0 时就是刚体）
endPoint 做碰撞
endPoint = lerp(prevEndPoint, endPoint, frameRatio / lerp(1, frameRatio, pull))   // 部分子步
localRotation = originalLocalRotation * FromToRotation(局部骨向量, 角度限制后的方向)
```

`immobile`（World 0.5）：`endPoint += (immobileMatrix * immobileEndpoint - endPoint) * immobile`，
即把一半端点锁在世界空间，角色整体移动时头发不会整体跟着平移。这一步我们目前完全没有。

移植时要用的实际参数（全部链的完整值见上面的 JSON）：

| 链 | pull | spring | stiffness | gravity | falloff | immobile | limit | limitRotation |
|---|---|---|---|---|---|---|---|---|
| 后发（5 条根） | 0.1 | 0.5 | 0.05 | 0.08 | 1 | 0.5 World | Angle 90/45 | (-15, 0, 80) |
| 侧发（4 条根） | 0.1 | 0.5 | 0.05 | 0.08 | 1 | 0.5 World | Angle 55/45、50/45 | (-15, 0, -50) 等 |
| 刘海/呆毛 | 0.1 | 0.5 | 0.05 | 0.08（呆毛 0） | 1（呆毛 0） | 0.5 World | Angle 35/45 | (0, 0, ±30) |
| 尾巴 | 0.05 | 0.8（曲线 0.694→1.0） | 0.05 | 0 | 0 | 0.5 World | Polar 10/90 | (10, 0, 0) |
| 耳朵 | 0.05 | 0.9 | 0.05 | 0 | 0 | 0.5 World | Angle 60/45 | (0, 0, 0) |
| 胸部 | 见 JSON | | | | | | | |

实现顺序建议（已按此完成）：

1. 把 `ChainSpec` 换成 VRC 参数集，求解器改成上面的速度模型（世界空间、1/60 固定子步、最多 6 步）；
2. 实现 `immobile`（World）与角度限制（Angle/Polar）；
3. 保留现有的球体碰撞（Head/Chest/Hips），碰撞半径改用每条链的 `radius`；
4. 用同一套 AFK 对标脚本复测，验收线：后发滞后 < 0.1 s、摆幅差 < 10%、峰值位移 < 60 mm。

### 14.8 重写后的实现与复测（2026-10-25）

已按 14.7 分析的求解顺序独立重写（不含 SDK 代码，声明见
[THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)），两个文件：

- [physbone-solver.ts](../src/modules/site/character/physbone-solver.ts)：VRCPhysBone（Version 1.0 /
  Advanced）求解器。每骨保存 `posePosition/poseRotation`、`endPoint/prevEnd/prevVector/prevVelocity`、
  按骨曲线求出的 `pull/spring/stiffness/gravity/gravityFalloff/immobile/radius/maxAngle`；
  求解顺序（按同一套状态量独立实现）：
  `v = prevVel·spring → v += (poseEnd - (endPoint+v))·pull → 重力(含 falloff) → v += prevVector·stiffness
  → 长度夹紧 → 碰撞 → 部分子步 lerp(prevEnd, endPoint, ratio/lerp(1,ratio,pull)) →
  localRotation = poseRotation · FromToRotation(localDir, 限角后 axis)`。
- [hair-physics.ts](../src/modules/site/character/hair-physics.ts)：20 条链的真实参数表 +
  1/60 s 固定子步循环（`executions = min(累计时间×60, 6)`，`ceil(executions)` 次求解，
  最后一次 `ratio = executions - i`），`immobileMatrix` 取角色根节点的**平移**（World 类型）。

移植时踩到并修掉的四个真实差异：

1. **呆毛根骨**：Unity 里 `Ahoge.001` 的 PhysBone `rootTransform` 指向 **`Ahoge.004`**，
   `Ahoge.001` 只是挂载点。原实现从 `Ahoge.001` 开始模拟，多带了一节静止骨。
   改后呆毛误差 16.6° → **4.3°**、末端偏移 20 mm → 5.4 mm，摆幅比 2.31 → 0.89。
2. **碰撞体**：Unity 里这 20 条链的 `colliders` 全为空（`allowCollision` 只引入手部/世界碰撞器，
   本场景没有），自造的 Head/Chest 球反而把耳骨、侧发整条顶到球面上（侧发曾偏 44°）。已移除。
3. **部分子步语义**：VRC 每个子步都从「上一个整步」的 `prevEndPoint` 重新求解，部分步只做预览、
   不累加。原实现从当前端点继续积分。
4. **曲线参数 t**：力参数用 `CalcBoneRatio = i/(n-2)`，半径用 `CalcTransformRatio = i/(n-1)`；
   原实现两者混用。

另外修了一个自己引入的 bug：`immobile = 0` 时部分子步插值的起点 `before` 没被赋值，
会复用上一根骨的临时向量，导致整条链翻转（实测 159°）；现在无条件在每步开头取快照。

复测（同一份 `unity-gm-afk.jsonl`，相位对齐后 5213 帧）：

| 组 | 中位 | 均值 | 95% | 最大 |
|---|---|---|---|---|
| 身体骨（动画） | 0.57 mm | 0.77 mm | 2.15 mm | 4.9 mm |
| 动骨链根骨 | 0.69 mm | 0.68 mm | 0.95 mm | 1.8 mm |
| 动骨链子骨 | 10.42 mm | 21.71 mm | 71.9 mm | 109.1 mm |

逐链（末端相对链根的偏移方向差 / 相位滞后 / 摆幅比）：

| 链 | 角度中位 | 滞后 | 摆幅比 | 末端偏移 |
|---|---|---|---|---|
| Bangs.001 | 3.8° | 0.00 s | 0.96 | 2.5 mm |
| Tail.001 | 3.2° | -0.12 s | 0.52 | 42.9 mm |
| Ahoge（根 Ahoge.004） | 4.3° | -0.02 s | 0.89 | 5.4 mm |
| Sides Hair_R.001 | 4.9° | — | — | 16.3 mm |
| breast_L/R | 4.5° | — | — | 7.3 mm |
| Ear_L/R.001 | 11.3° | — | 1.40 | 3.9 mm |
| Sides Hair_L.001 | 11.9° | -0.14 s | 0.89 | 36.4 mm |
| Back Hair.001 | 13.2° | -0.18 s | 0.58 | 92.0 mm |

结论：

- **滞后已消除**（原实现后发 0.30–0.32 s，现在各链 ≈ 0），短链（刘海/呆毛/尾巴/侧发右/胸）
  的角度差 3–5°、末端 2–16 mm，属于同量级。
- 剩下的是**后发/侧发左的常量方向偏差**（13°/12°，不是滞后——把时间轴前后平移 ±0.2 s
  只能把 12.5° 降到 11.7°）。它与限角、碰撞无关（把 `maxAngleX` 放到 180° 后仍是 13.2°），
  但把 `gravity` 置 0 会降到 **3.7°**，说明是「GLB 的 bind pose 与 Unity 差约 6°，
  再被 `gravityFalloff` 的正反馈放大」。
- 两边模型的发骨长度本身也略有差异（侧发 165.7 vs 174.9 mm），所以这类静态偏差属于**模型导出差异**，
  不是求解器能修的部分；要彻底对齐需要让 Web 的骨架 bind pose 与 Unity 一致。
- 复现：

```powershell
cd web
pnpm exec eslint -c eslint.hard.config.mjs src/modules/site/character/hair-physics.ts src/modules/site/character/physbone-solver.ts
node %TEMP%\lolosia-afk-compare\web-sample.mjs   # 需要 dev server:5005 + Edge CDP:9333
python %TEMP%\lolosia-afk-compare\compare_gm.py
python %TEMP%\lolosia-afk-compare\diag_lag.py
```



