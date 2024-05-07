export interface DriveStruct {
  ptcType: 'motor' | 'non-motor'
  ptcId: number
  global_track_id: string
  timeStamp: number
  secMark: number
  pos_lat: number
  pos_lon: number
  heading: number
  source: number
  width: number
  length: number
  height: number
  speed: number
  lane: number
  x: number
  y: number
}

export type DeviceStruct = {
  content: Array<DriveStruct>
  dev_pos: {
    lat: number
    lon: number
  }
}

export type DataLibContent = Array<Array<DeviceStruct>>

export interface DataLib {
  data: () => Promise<DataLibContent>
  title: string
}

async function importLib(url: string) {
  const baseUrl = window.NGINX_BASE_URL ? window.NGINX_BASE_URL : ''
  const url1 = `${baseUrl}/home${url}`
  const resp = await fetch(url1)
  if (!resp.ok) {
    throw new Error(await resp.text())
  }
  return resp.json()
}

const dataLib = {
  CLC_track: {
    data: () => importLib('/static/mqtt/CLC_track.json'),
    title: '协作换道场景，轨迹数据'
  },
  DNP_track: {
    data: () => importLib('/static/mqtt/DNP_track.json'),
    title: '逆向超车场景，轨迹数据'
  },
  ICW_track: {
    data: () => importLib('/static/mqtt/ICW_track.json'),
    title: '交叉口车辆间碰撞预警场景，轨迹数据'
  },
  msg_VIR_CLC: {
    data: () => importLib('/static/mqtt/msg_VIR_CLC.json'),
    title: '协作换道场景，车辆请求信息'
  },
  msg_VIR_DNP: {
    data: () => importLib('/static/mqtt/msg_VIR_DNP.json'),
    title: '逆向超车场景，车辆请求信息'
  },
  overspeed_track: {
    data: () => importLib('/static/mqtt/overspeed_track.json'),
    title: '车辆超速数据'
  },
  RW_track: {
    data: () => importLib('/static/mqtt/RW_track.json'),
    title: '车辆逆行数据'
  },
  SDS_track: {
    data: () => importLib('/static/mqtt/SDS_track.json'),
    title: '数据共享场景，轨迹数据'
  },
  slower_speed_track: {
    data: () => importLib('/static/mqtt/slower_speed_track.json'),
    title: '车辆慢行数据'
  },
  VPTC_CW_track_turn: {
    data: () => importLib('/static/mqtt/VPTC_CW_track_turn.json'),
    title: '弱势交通参与者碰撞预警场景，车辆转向'
  }
}
export type DataLibList = { [P in keyof typeof dataLib]: DataLib }
export default dataLib as any as DataLibList
