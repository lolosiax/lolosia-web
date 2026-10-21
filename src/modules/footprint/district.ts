/** 高德省界图层：`setFeatures` 把路网与行政区界捆在 'road' 里，低缩放时需要单独描省界。 */

const PROVINCE_ADCODE = [
  '110000', '120000', '130000', '140000', '150000', '210000', '220000', '230000',
  '310000', '320000', '330000', '340000', '350000', '360000', '370000', '410000',
  '420000', '430000', '440000', '450000', '460000', '500000', '510000', '520000',
  '530000', '540000', '610000', '620000', '630000', '640000', '650000', '710000',
  '810000', '820000'
]

export function createProvinceLayer(AMap: any, map: any): any {
  const DistrictLayer = AMap?.DistrictLayer
  if (!DistrictLayer?.Province) return null

  const layer = new DistrictLayer.Province({
    zIndex: 3,
    adcode: PROVINCE_ADCODE,
    depth: 1,
    styles: {
      'nation-stroke': '#7b879f',
      'coastline-stroke': '#7b879f',
      'province-stroke': '#7b879f',
      'city-stroke': 'rgba(0,0,0,0)',
      'county-stroke': 'rgba(0,0,0,0)',
      fill: 'rgba(0,0,0,0)'
    }
  })
  layer.setMap?.(map)
  return layer
}
