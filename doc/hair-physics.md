# 动骨物理求解器（hair-physics）

> 范围：`character/physbone-solver.ts` 的弹簧骨算法、`character/hair-physics.ts` 的链参数与调度，
> 以及 Unity ↔ Web 的 AFK 对标方法与调试手册。
> 角色/动画见 [character-animation.md](character-animation.md)；
> 场景/运行环境见 [landing-scene.md](landing-scene.md)。

实现为独立的 TypeScript，不包含 VRChat SDK 代码；许可与声明见
[THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。

## 1. 实现

两个文件：

- [physbone-solver.ts](../src/modules/site/character/physbone-solver.ts)：求解器本体。
  每骨保存 `posePosition/poseRotation`、`endPoint/prevEnd/prevVector/prevVelocity`，
  以及按骨曲线算出的 `pull/spring/stiffness/gravity/gravityFalloff/immobile/radius/maxAngle`。
- [hair-physics.ts](../src/modules/site/character/hair-physics.ts)：20 条链的参数表 +
  1/60 s 固定子步调度。

调度（对应 `PhysBoneManager` 的 `executions`）：

```ts
pending = min(pending + delta, SUBSTEP * 6)          // SUBSTEP = 1/60
executions = min(pending / SUBSTEP, 6)
for (i = 0; i < max(1, ceil(executions)); i++)
  solve(ratio = min(1, executions - i))              // 最后一次不足 1
if (executions >= 1) pending = (executions % 1) * SUBSTEP
```

`immobileMatrix` 取角色根节点的**平移**（`immobileType = World`）。

移植时踩到并修掉的四个真实差异：

1. **呆毛根骨**：Unity 里 `Ahoge.001` 的 PhysBone `rootTransform` 指向 **`Ahoge.004`**，
   `Ahoge.001` 只是挂载点。原实现从 `Ahoge.001` 开始模拟，多带了一节静止骨。
   改后呆毛误差 16.6° → **4.3°**、末端偏移 20 mm → 5.4 mm，摆幅比 2.31 → 0.89。
2. **碰撞体**：Unity 里这 20 条链的 `colliders` 全为空（`allowCollision` 只引入手部/世界碰撞器，
   本场景没有），自造的 Head/Chest 球反而把耳骨、侧发整条顶到球面上（侧发曾偏 44°）。已移除。
3. **部分子步语义**：每个子步都从「上一个整步」的 `prevEndPoint` 重新求解，部分步只做预览、
   不累加。原实现从当前端点继续积分。
4. **曲线参数 t**：力参数用 `i/(n-2)`，半径用 `i/(n-1)`；原实现两者混用。

另外修了一个自己引入的 bug：`immobile = 0` 时部分子步插值的起点 `before` 没被赋值，
会复用上一根骨的临时向量，导致整条链翻转（实测 159°）；现在无条件在每步开头取快照。

## 2. 求解顺序

```
v = prevVelocity * spring
v += (poseEnd - (endPoint + v)) * pull
v += down * gravity * boneLength          // falloff: 按骨骼朝向与重力夹角在 1-falloff..1 间插值
v += prevVector * stiffness               // 注意：往"上一帧骨骼方向"回正，不是回静止姿态
endPoint += v
endPoint = 长度夹到 restLength（maxStretch/maxSquish 为 0 时就是刚体）
endPoint 做碰撞
endPoint = lerp(prevEndPoint, endPoint, frameRatio / lerp(1, frameRatio, pull))   // 部分子步
localRotation = originalLocalRotation * FromToRotation(局部骨向量, 角度限制后的方向)
```

`immobile`（World 0.5）：

```
endPoint += (immobileMatrix * immobileEndpoint - endPoint) * immobile
```

即把一半端点锁在世界空间，角色整体移动时头发不会整体跟着平移。`immobileEndpoint`
只在整步结束时更新；AFK（角色根静止）下它不产生影响。

## 3. 参数表

Unity 侧从 `Moe_Debug.unity` 的 PhysBone 组件读取，`immobile` 全部是 `World 0.5`。
完整数值（含曲线关键帧）以 [hair-physics.ts](../src/modules/site/character/hair-physics.ts)
的 `CHAIN_SPECS` 为准。

| 链 | pull | spring | stiffness | gravity / falloff | limit | limitRotation |
|---|---|---|---|---|---|---|
| 后发 ×5 | 0.1 | 0.5 | 0.05 | 0.08 / 1 | Angle 90/45 | (-15,0,80)、(-30,0,±80) |
| 侧发 ×4 | 0.1 | 0.5 | 0.05 | 0.08 / 1 | Angle 55/45、50/45 | (-15,0,∓50) |
| 刘海 ×4 | 0.1 | 0.5 | 0.05 | 0.08 / 1 | Angle 35/45 | (0,0,∓30) |
| 呆毛 | 0.1 | 0.5 | 0.05 | 0 / 0 | Angle 35/45 | (0,0,0) |
| 尾巴 | 0.05 | 0.8（曲线 0.694→1） | 0.05 | 0 / 0 | Polar 10/90（Z 曲线） | (10,0,0) |
| 耳朵 ×2 | 0.05 | 0.9 | 0.05 | 0 / 0 | Angle 60/45 | (0,0,0) |
| 胸部 ×2 | 0.65 | 0.8（曲线） | 0 | 0 / 0 | Polar 15/10 | (7,0,0) |

半径：默认 0.01；尾巴 0.1、耳朵 0.05（曲线 1→0.147）、胸部 0.04（曲线）。
尾巴还有 `spring` 与 `maxAngleZ` 曲线，胸部还有 `pull`/`spring`/`immobile`/`radius` 曲线，
都写在 `CHAIN_SPECS` 里。曲线参数 t 的分母见第 1 节第 4 条。

> 注：耳朵/胸部的 `gravity` 在首次对标时误用了头发默认值 0.08，之后按 Unity 实际值改为 0。
> 这两条链本来误差就小（3.9 mm / 7.3 mm），未重跑全量对标。

## 4. 对标方法

### 4.1 采样

- Unity：`EditorApplication.update` 注册逐帧回调（`EditorApplication.CallbackFunction`），
  **不要**在 `execute_code` 里 `Thread.Sleep`——主线程被阻塞时动画和物理都不会推进。
  每帧写一行 JSONL，字段：
  `t`（realtimeSinceStartup）、`dt`、`clip`、`w`、`n`（Action 层的 `normalizedTime`）、
  `p`（292 根骨在 `Moe` 局部空间的坐标）、`q`（115 根动骨链骨的 localRotation）。
  头部一行写骨骼表（name/path/parent/physRoot）和 `qIdx`。
  本次参数：45 s、7088 帧（约 164 fps）。
- Web：`/home/lab?afk=1`，用 CDP 注入 rAF 采样器（详见 6.2），
  AFK 播放器时间通过 `window.__moe.player.time` 读出（`ClipPlayer` 暴露了 `readonly time`）。
- JSONL 带 UTF-8 BOM，Python 读取用 `encoding='utf-8-sig'`。

### 4.2 时间轴怎么对齐

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

## 5. 复测结果

相位对齐后 5213 帧：

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

## 6. Unity ↔ Web 对齐调试手册

> 以后再遇到「动骨/动画在 Unity 和 Web 不一致」，按这个顺序走。不要跳步——先证明对齐，
> 再谈形状和动力学，否则会把坐标/相位误差当成物理误差。

### 6.0 判定顺序

1. **对齐**：身体骨残差 < 1 mm；否则先修时间轴和坐标系。
2. **形状**：链长（root→tip 弦长）一致、无拉伸/翻转。
3. **动力学**：滞后、摆幅、峰值。
4. **定位**：偏差是从链根开始，还是沿链累积。

### 6.1 Unity 侧采样

按 [character-animation.md](character-animation.md) 的「在 Unity Play 模式触发 AFK」进入状态，
再用 4.1 的回调逐帧写 JSONL。坑位：

- `execute_code` 走 CodeDom（C# 6）：不能 `using`、局部函数；委托要写
  `EditorApplication.CallbackFunction`；**不要 `Thread.Sleep`**。
- 必须记录 Action 层的 `normalizedTime`（`n`）和 `weight`（`w`），否则无法对齐。
- 坐标记在角色根（`Moe`）的**局部空间**，不是世界空间。
- Play 模式下 PhysBone 在跑，采到的是「动画 + 物理」，这正是我们要的参考。

### 6.2 Web 侧采样

```powershell
pnpm dev    # localhost:5005

# Edge 会随启动它的命令会话一起被杀，所以要用常驻命令包一层
Start-Process msedge.exe -ArgumentList '--remote-debugging-port=9333',
  '--user-data-dir=%TEMP%\edge-cdp-afk','--no-first-run','about:blank'
while ($true) { Start-Sleep 10 }
```

CDP 流程：`/json/new?http://localhost:5005/home/lab?afk=1` → `Page.enable` / `Runtime.enable` →
`Emulation.setDeviceMetricsOverride` → `Page.navigate` → **`Page.bringToFront` +
`Emulation.setFocusEmulationEnabled {enabled:true}`** → 注入 rAF 采样器 → 36 s 后
`Runtime.evaluate` 取回 JSON。

采样字段：`t`（`window.__moe.player.time`）、`w`（页面加载后秒数）、
`p`（角色根局部坐标，mm）。

坑位：

- **后台标签页的 rAF 会被暂停**（采到 0 帧），必须 bringToFront + focus emulation；窗口最小化也会停。
- 采样窗口要覆盖 ≥ 16 s 的稳定段（本轮用 36 s，跳过前 16 s）。

### 6.3 对齐与坐标系

```python
# 相位配对（16 s 循环）：只在 Web 稳定段里找；Unity 侧丢弃 phase < 4 s / weight < 0.99
d = np.abs((web_t - phase + 8.0) % 16.0 - 8.0)
j = int(np.argmin(d))

# Umeyama：Y_web ≈ s · X_unity · Rᵀ + t，允许镜像（不要强制 det = +1）
U, S, Vt = np.linalg.svd(Yc.T @ Xc / n)
R = U @ Vt
s = float(S.sum() / ((Xc ** 2).sum() / n))
t = Y.mean(0) - s * R @ X.mean(0)
```

自检：`R ≈ diag(-1,1,1)`、`det(R) = -1`、`s ≈ 0.8082`；
身体骨残差中位应 < 1 mm（本轮 0.58 mm）。最后**逐帧再扣一次整体平移**。

### 6.4 按现象定位

| 现象 | 先查什么 | 结论 |
|---|---|---|
| 身体骨就 > 几 mm | 相位、weight、映射 | 对齐错了，后面的数都不可信 |
| 只有链根骨大 | 链根位置、父子关系 | 骨骼名匹配或层级错了 |
| 链长（弦长）变了 | 相邻骨距离是否恒定 | 求解器改了 position，或配到了别的骨 |
| 沿链越往下越大 | 逐段夹角（相邻骨方向） | 求解器的动力学（pull/spring/gravity/limit） |
| 整体常量偏转 | 把时间轴 ±0.2 s 平移再比 | 有改善=滞后；没改善=bind pose / 常量力 |
| 摆幅比 ≠ 1 | 相对均值方向的摆幅 | 阻尼、spring、immobile 不对 |

注意：「逐帧角度中位数」不等于「均值方向的夹角」；存在滞后时前者会明显偏大，
所以先量滞后，再判断是不是常量偏差。

### 6.5 隔离实验（一次只改一个量，每轮约 40 s）

- `pull=1, spring=0, stiffness=0, gravity=0, immobile=0` → 刚性贴姿势，用来量 **bind pose 差异**。
- `gravity=0` → 看重力和 `gravityFalloff` 是否主导。
- `maxAngleX=180` → 关掉 Angle 限角（Polar 不能这样关）。
- 清空 colliders → 排除自造碰撞体。
- `immobile=0` → 验证求解器自身稳定性；**正确移植的求解器不该依赖 immobile 才稳定**
  （本轮就是靠这个抓到部分步插值起点未赋值的 bug）。

### 6.6 已知坑位清单

- GLTFLoader 会改节点名（`Back Hair.001` → `Back_Hair001`）；匹配前统一
  `re.sub(r'[\s_.\-]', '', name).lower()`。
- 骨骼编号不等于链序：`Back Hair_L.001 → L006 → L005 → … → L002`，只能按 parent/children 遍历。
- PhysBone 根不一定是组件所在节点：呆毛组件挂在 `Ahoge.001`，但 `rootTransform` 是 `Ahoge.004`。
- 两个模型的骨长可能不同（本模型侧发 165.7 vs 174.9 mm），绝对位移天然带这部分误差。
- Unity 采样率（约 164 fps 的 Editor 更新）不等于游戏渲染帧率，物理子步数会和 Web（约 160 fps）
  不同；比较「滞后/摆幅」时以整圈相位为准，不要按帧号。

## 7. 历史：重写前的 DynamicBone 版本

第一版是 DynamicBone 式（Verlet + elasticity/damping），与 Unity 的 VRCPhysBone 不是同一套模型。
当时的对标结论（保留下来供对照）：

| 组 | 中位 | 均值 | 95% | 最大 |
|---|---|---|---|---|
| 身体骨（动画） | 0.57 mm | 0.77 mm | 2.13 mm | 6.41 mm |
| 动骨链根骨 | 0.69 mm | 0.68 mm | 0.95 mm | 1.64 mm |
| 动骨链子骨 | 6.74 mm | 13.38 mm | 45.1 mm | 168.3 mm |

| 链 | Unity 摆幅 | Web 摆幅 | Web 滞后 | 相关系数 |
|---|---|---|---|---|
| Back Hair.001 | 39.0 mm | 33.2 mm | 0.32 s | 0.64 |
| Back Hair_L.001 | 39.3 mm | 34.6 mm | 0.32 s | 0.68 |
| Back Hair_R.001 | 37.3 mm | 30.8 mm | 0.30 s | 0.57 |
| Sides Hair_L.001 | 14.5 mm | 13.0 mm | 0.06 s | 0.63 |
| Tail.001 | 40.0 mm | 27.4 mm | ≈0.08 s | 0.41 |
| Bangs.001 | 3.5 mm | 2.7 mm | 0.12 s | 0.79 |
| Ear_L.001 | 1.7 mm | 1.3 mm | 0.02 s | 0.62 |

当时的参数是 `HAIR = { damping 4.2, stiffness 0.3, gravity 0.8 }`：
**gravity 是 Unity 的 10 倍**（0.8 vs 0.08），求解器模型不同，`immobile` 没有实现，
尾巴的 `damping 2.4 / stiffness 0.22` 也对不上 `spring 0.8`。
位置误差看起来更小，是因为强重力把头发"吊"成了直下的形状，恰好接近 Unity 的均值，
但响应慢了约 1/3 秒——所以不能只看位置误差。

### 历史坑（DynamicBone 版本，仍值得记住）

- **逐帧位置 lerp 一定会自激振荡**：首版用两轮 lerp（0.165 / 0.09）+ 无速度 Verlet，
  实测 7–15 Hz 抖动。根因是每步约束修正被 Verlet 当成了速度，越修越抖。
- **`m_Damping` / `m_Elasticity` 都是"每次更新"的量，不是每秒的量**。直接当 `1/s` 用会随帧率漂。
- **必须做根骨平移补偿**：角色 0.36 m/s 行走时，`1/60 × 1/0.08 ≈ 6–7 cm` 的跟随滞后；
  耳骨每节只有约 2 cm，链条会被拉反、翻到 180°。
- **约束修正要写回 `prev`**：长度、角度、碰撞三种约束都改位置，不同步更新 `prev`
  等于往系统里灌能量，表现仍是抖。
- **子步要固定、不要自适应**：固定 1/60 让参数手感与帧率无关。
- **AFK 下动骨"几乎不动"是错觉**：以前只测了纯动画姿态，误以为 AFK 没有驱动量。
  启用 GestureManager + AFK 后，Unity 的 PhysBone 会真实模拟，头发骨骼局部旋转可达 22°，
  呆毛可达 35°。

## 8. 复现与待办

- 采样/对比脚本是临时产物，已清理；重建步骤见第 6 节。代码侧只保留硬性 lint：

  ```powershell
  cd web
  pnpm exec eslint -c eslint.hard.config.mjs src/modules/site/character/hair-physics.ts src/modules/site/character/physbone-solver.ts
  ```

- 待办：
  - 若要继续对齐后发/侧发左的常量偏差，先修 GLB 的 bind pose（或从 Unity 导出一次链骨的 rest 旋转）。
  - 耳朵/胸部的 `gravity` 修正后建议重跑一次全量对标，确认误差没有变大。
  - 若以后要加手部/裙摆碰撞，按第 2 节的碰撞步骤补 capsule/sphere collider，不要再用自造的整头球。
