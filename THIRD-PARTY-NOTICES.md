# 第三方数据与在线服务声明

本仓库自身代码以 [MIT](LICENSE) 许可发布。以下内容不是本项目的原创产物，或由第三方服务在运行时提供。

## 1. 行政区划边界数据

| 位置 | 来源 | 说明 |
| --- | --- | --- |
| `src/modules/footprint/china-outline.ts` | 阿里云 [DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector) `100000` | 中国轮廓，简化后按小地图投影成 Path 字符串 |
| `src/modules/footprint/china-provinces.ts` | 同上，`100000_full` | 省级行政区轮廓，同样简化并投影 |

两个文件均为构建期外的一次性生成物（文件头已注明来源），请勿手改。

DataV.GeoAtlas 的边界数据源自高德开放平台，其使用与再分发条件以阿里云、高德各自的服务条款为准。在中国大陆公开展示地图（含自绘边界）另有审图号要求，正式对外上线时请按所在地区规定处理。

引用它们的是 `src/modules/footprint/components/FootprintMinimap.vue`；不需要这部分能力时，连同该组件一起移除即可，不影响其他模块。

## 2. 高德地图 JS API 2.0

足迹页在首次进入时从 `https://webapi.amap.com/maps` 动态加载 SDK（见 `src/modules/footprint/amap.ts`），**不随本仓库分发**。
需要自备 Web 端 key 与安全密钥（`VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_CODE`），使用受[高德开放平台服务条款](https://lbs.amap.com/)约束。

## 3. npm 依赖

其余第三方代码均通过 pnpm 从 npm registry 解析，不随本仓库分发源码，完整清单与版本锁定见 [`package.json`](package.json) 与 [`pnpm-lock.yaml`](pnpm-lock.yaml)。
各依赖的许可随其包本身提供；若对外分发**构建产物**（`dist/`），请按各依赖的许可要求保留其版权与许可声明。
