import { lunarToSolar } from 'lunar-calendar'

/** 主角资料。 */
export const HERO_SECTIONS = [
  { id: 'hero', label: '首页' },
  { id: 'about', label: '详细介绍' },
  { id: 'photo', label: '照片墙' },
  { id: 'scenes', label: '游戏场景' }
] as const

export const INTRO_TEXT =
  '温柔体贴的治愈系姐姐，偏爱那份热闹的烟火气，流连于熙攘的街角，享受着人群的喧嚣与友谊的温暖。现任职于抚眠屋，闲暇时也是许多知名咖啡厅的常客。'

/** 按公历生日计算周岁。 */
export function ageOf(birth: string): number {
  const date = new Date(birth)
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1
  return age
}

/** 农历三月初三在本年度的公历日期；转换失败时退回文字。 */
export function lunarBirthday(year: number): string {
  const result = lunarToSolar(year, 3, 3)
  if ('error' in result) return '三月初三'
  return `${result.year}年${result.month}月${result.day}日`
}

export function heroFacts(): { label: string; value: string }[] {
  const year = new Date().getFullYear()
  return [
    { label: '姓名', value: '洛洛希雅' },
    { label: '年龄', value: `${ageOf('2002-04-15')} 岁` },
    { label: '身高', value: '165cm' },
    { label: '生日', value: '三月初三（农历）' },
    { label: '本年度生日', value: lunarBirthday(year) }
  ]
}

export const HOBBIES = ['社团活动', '音乐欣赏', '绘画创作', '旅行探索']

export const FEATURES = [
  '宽大柔软的猫耳（粉色内耳）',
  '长而蓬松的紫色长发（发尾微卷）',
  '头顶蓝色蝴蝶结装饰',
  '修长身材，四肢纤细',
  '白色为主色调的休闲运动装'
]

export const COLOR_THEMES = [
  { name: '主色调', code: '#D2B1DB', meaning: '淡紫色 · 温柔与神秘', color: '#d2b1db' },
  { name: '辅助色', code: '#FFFFFF', meaning: '白色 · 纯洁与清新', color: '#ffffff' },
  { name: '点缀色', code: '#6C757D', meaning: '蓝色 · 冷静与可靠', color: '#6c757d' }
]

export interface PhotoTile {
  title: string
  icon: string
  tone: string
}

export const PHOTO_TILES: PhotoTile[] = [
  { title: '日常快照', icon: 'camera', tone: '210, 177, 219' },
  { title: '社团活动', icon: 'people', tone: '138, 169, 224' },
  { title: '游戏场景', icon: 'controller', tone: '124, 191, 172' },
  { title: '角色立绘', icon: 'palette', tone: '194, 150, 205' },
  { title: '活动海报', icon: 'image', tone: '224, 155, 172' },
  { title: '生活记录', icon: 'journal-text', tone: '176, 166, 209' },
  { title: '节日祝福', icon: 'gift', tone: '226, 173, 128' },
  { title: '角色设定', icon: 'vector-pen', tone: '150, 178, 206' },
  { title: '游戏截图', icon: 'badge-3d', tone: '164, 128, 171' }
]

export interface GameScene {
  title: string
  description: string
  icon: string
  tone: string
}

export const GAME_SCENES: GameScene[] = [
  { title: '社团活动室', description: '洛洛希雅组织社团活动的地方', icon: 'house-door', tone: '194, 150, 205' },
  { title: '游戏世界', description: '虚拟游戏中的奇幻场景', icon: 'globe2', tone: '124, 161, 214' },
  { title: '舞台表演', description: '精彩的舞台表演现场', icon: 'music-note-beamed', tone: '224, 155, 172' },
  { title: '日常场景', description: '洛洛希雅的日常生活场景', icon: 'cup-hot', tone: '150, 178, 206' }
]
