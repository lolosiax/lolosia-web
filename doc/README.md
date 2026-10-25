# 前端文档导航

`web`（`lolosia-web`，分支 `dev/webgpu-landing`）的工程文档按「能独立阅读」的边界拆成三篇，
另有一份上线清单：

| 文档 | 范围 | 先看什么 |
|---|---|---|
| [landing-scene.md](landing-scene.md) | 3D 场景与页面 | 路由、three.js 装配、水面/反射/花瓣/树/锦鲤、性能、截图、代码规范 |
| [character-animation.md](character-animation.md) | 角色与动画 | FBX→GLB、Toon、idle/walk、脚部对齐、AFK 剪辑烘焙与播放器 |
| [hair-physics.md](hair-physics.md) | 动骨物理求解器 | 弹簧骨算法、20 条链参数、Unity↔Web 对标与调试手册 |
| [test-checklist.md](test-checklist.md) | 上线前验收 | 逐项检查表 |

维护约定：

- 新增内容写进对应模块文档，跨模块只留结论和链接，不重复叙述。
- 仓库、分支、启动命令、硬性 lint 只在 `landing-scene.md` 维护一份，其他文档引用它。
- 临时脚本、采样数据、反编译产物一律不入库；需要复跑时按 `hair-physics.md` 的调试手册重建。
- 素材（模型/动画）不随仓库分发，授权见 [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。
