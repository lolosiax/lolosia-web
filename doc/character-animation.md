# 角色与动画（Moe）

> 范围：角色模型管线、Toon 材质、状态机与步态、脚部对齐、外部剪辑（AFK / 行走）的烘焙与播放。
> 动骨物理单独一篇：[hair-physics.md](hair-physics.md)；
> 场景、路由、运行环境见 [landing-scene.md](landing-scene.md)。

## 1. 资产管线（FBX → GLB）

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
- 默认步态仍是程序化骨骼驱动（腿/膝/手臂/脊柱），保证不依赖外部剪辑也能走
- 另有烘焙好的「行走2」剪辑，可在 `/lab` 调试面板切换对比（见 §5.1）

## 2. 角色参数

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

## 3. 状态机与脚部对齐

- `character.ts` 负责 GLB 加载、Toon 材质、程序化步态、`idle`/`walk` 状态机与落点恢复。
- 站立高度跟水面走：`WATER_Y + bob`；走路时 bob ≤ 0.02，idle 时 ±0.007。
- 脚底对齐用缩放后的包围盒：`model.position.y -= box.min.y`，避免脚悬空。
- 脚步涟漪的位置取**脚踝骨骼**的 `getWorldPosition`，不要改成角色根节点。
- 角色 2 米内把水面全局波压平（静水区），否则波纹会"吞脚"。
- 角色蒙皮与 Toon 开销很小，场景的主要成本是填充率与软件光栅化（见场景文档的性能一节）。

## 4. Toon 材质

- `MeshToonMaterial` + 5 阶色阶 + rim light；二次元角色不适合 PBR。
- **GLB 的 `alphaMode: BLEND` 会让角色穿透**：转成 three 材质后 `transparent = true` 且不写深度，
  角色进透明队列，背后的树/水面会透出来，甚至自己穿透自己。二次元角色除发梢、裙摆等少数部位外
  都该是 OPAQUE；导入后按材质名强制改，别直接透传 `pbr.transparent` / `pbr.depthWrite`。
- `MeshToonMaterial` 没有高光，环境光过强会洗白分层。

## 5. AFK 动作剪辑（`.anim` → JSON → 播放器）

```
Assets/Kyubi closet/Moe/Animation/Base_Animation/Moe_Locomotion/
  Moe_Locomotion Animation/Moe_AFK_Loop_by_Levin.anim
    └─ Unity Editor: AnimationMode.SampleAnimationClip 逐帧采样（30 fps，16 s，480 帧）
         └─ 每根骨: delta = q_after × inverse(q_rest)   // 世界增量
              └─ public/res/animations/moe_afk.json     // 49 根 humanoid 骨，worldDelta: true（不入库）
                   └─ character/clip-animation.ts: createClipPlayer()
```

- 只导旋转、不导位置；播放按名字匹配骨骼（名字归一化见第 7 节）。
- 用**世界增量**而不是局部旋转：Unity 骨架与 Blender 导出骨架的骨骼轴向不同，直接套局部四元数会把角色拧倒。
- Unity 左手系 → three 右手系要做镜像换算 `(x, y, z, w) → (x, -y, -z, w)`，这一步在播放器里做，JSON 保持 Unity 原始值。
- 源剪辑不含头发/尾巴/耳骨，这几类只能靠动骨物理（[hair-physics.md](hair-physics.md)）。
- 动作独立成 JSON，`Moe.glb` 不用重导；换动作只替换这个文件。
- 诊断入口：`/home/lab?afk=1` 固定播放 AFK，便于对照 Unity。
- `ClipPlayer` 暴露 `readonly time`（剪辑内秒数），AFK 诊断与采样靠它对齐相位。

### 5.1 行走剪辑（如梦工具箱 `行走2`）

- 来源：`VRC工具箱v1.3.1_by如梦.unitypackage` → `Assets/Moyuer/Assets/Animation/行走2.anim`
  （1.30 s、30 fps、原地循环；大腿摆幅小、胸腔反扭大、手臂贴身）。
- 烘焙：沿用 AFK 的 `SampleAnimationClip` 管线，输出 `public/res/animations/moe_walk.json`
  （49 根骨、39 帧、`worldDelta: true`，与 AFK 同一套骨骼名单）。
- 与 AFK 的差别：这是 humanoid muscle 剪辑，带 `LeftFootT/Q` 等 IK 目标；`SampleAnimationClip`
  不跑 IK pass，脚掌贴地会比原剪辑略差（踝高浮动约 4 cm），需要时用 `solveFoot` 补。
- 用法：`/lab` 右侧调试面板切「动画剪辑」。此时角色停在原地循环播放，不跑状态机与 IK；
  切回「自动漫步」时 `ClipPlayer.reset()` 还原未被程序化步态覆盖的骨骼（手指、头等）。

## 6. 在 Unity Play 模式触发 AFK

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
   `FixedUpdate/LateUpdate`），所以这时采到的参考数据是「动画 + 物理」，不是纯动画姿态。
   取层 playable 的方式：反射 `ModuleVrc3._layers` → `LayerData.Playable`（`AnimatorControllerPlayable`）。

## 7. 常见坑

- **GLTFLoader 会清洗节点名**：`Back Hair.001` → `BackHair001`（点号直接删掉、空格变下划线）。
  按名字匹配骨骼前必须归一化，当前用 `normalize = name.replace(/[\s_.-]/g, '').toLowerCase()`。
  不做这一步时不报错，只是"动画没生效"，很难往这里想。
- **左手系/右手系的镜像是最贵的一坑**：漏了 `(x, y, z, w) → (x, -y, -z, w)`，手臂会整体甩到背后或头顶。
  症状有强误导性——纯 X 轴旋转（腿前后摆、躯干前倾）镜像后不变，所以看起来"下半身正常、只有上半身错"，
  容易误判成上半身数据坏了。
- **别靠肉眼判断姿态对不对**，用世界位置逐点比对：Unity 侧 `SampleAnimationClip` 后取骨骼世界坐标，
  和 Web 侧 `bone.matrixWorld` 的位置比（头、胸、双腕、双踝），低于 2 cm 才算对上。
  位置不受镜像对称性欺骗，比看截图可靠得多。
- **先验证烘焙数据再改播放器**：怀疑转换出错时，先在 Unity 用同一帧重采样、跟 JSON 逐骨比。
  本轮 JSON 与 Unity 完全一致，问题 100% 在播放侧，省掉了大范围排查。
- **姿势"看起来怪"不等于转换错**：源剪辑本身就是左手在腹前、右手从髋前摆到胸前、右脚比左脚高约 0.2 m。
  Unity 采样同样如此。
- **父骨必须先应用**：世界增量换局部四元数要用"本帧"的父级世界旋转，所以轨道按深度排序后再更新，
  顺序错了会用到上一帧的父级、产生延迟抖动。
- **`getWorldQuaternion()` 会隐式 `updateWorldMatrix(true, false)`**，会刷新祖先矩阵。
  不要在"只改了一半骨骼"的循环里随手调用，否则后面的父级读到混合状态。
- **骨骼编号不等于链序**：本模型 `Back Hair_L.001 → L006 → L005 → … → L002`，
  遍历必须按 parent/children，不要按名字里的数字。
- **PhysBone 根不一定是组件所在节点**：呆毛组件挂在 `Ahoge.001`，但 `rootTransform` 指向 `Ahoge.004`。

## 8. 待办

- 行走剪辑目前只用于调试对比；要让自动漫步也走剪辑，需要先处理脚底打滑、`idle ↔ walk` 淡化与转向混合。
- 动作烘焙脚本目前是临时文件：需要长期维护时，建议固化成 `tools/` 下的一次性脚本（输出仍不入库）。

## 9. 素材授权

角色模型、烘焙动画、贴图等美术资源**不随仓库分发**（`public/res/characters/`、
`public/res/animations/` 均已在 `.gitignore` 中排除），由部署服务器单独提供。

- 授权按原 Avatar 的条款执行（该 Avatar 适用 VN3 等角色授权协议，具体版本以原始发布页为准），
  与本仓库的 MIT **不是一回事**。
- `行走2` 来自「如梦工具箱」的示例动作；站点公开使用前需确认其原始授权范围。
- 二次分发、商用或改作他用前，请自行确认协议的适用范围。
- 详细声明见 [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。
