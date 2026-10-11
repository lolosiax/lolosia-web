import gcoord from 'gcoord'

/**
 * 坐标系转换：库里的照片 / 区域坐标是 WGS-84，高德底图用 GCJ-02。
 *
 * 约定数据层一律保持 WGS-84，只在「往地图上画」时转成 GCJ-02；地图取点再转回 WGS-84。
 */

/** WGS-84 → GCJ-02。返回 `[lng, lat]`。 */
export function wgs84ToGcj02(lon: number, lat: number): [number, number] {
  return gcoord.transform([lon, lat], gcoord.WGS84, gcoord.GCJ02)
}

/** GCJ-02 → WGS-84。返回 `[lng, lat]`。 */
export function gcj02ToWgs84(lon: number, lat: number): [number, number] {
  return gcoord.transform([lon, lat], gcoord.GCJ02, gcoord.WGS84)
}
