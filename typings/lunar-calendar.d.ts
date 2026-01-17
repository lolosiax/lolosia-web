declare module 'lunar-calendar' {
  // 天干
  export type HeavenlyStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'

  // 地支
  export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'

  // 干支纪年/月/日格式
  export type GanZhi = `${HeavenlyStem}${EarthlyBranch}`

  // 生肖
  export type Zodiac = '鼠' | '牛' | '虎' | '兔' | '龙' | '蛇' | '马' | '羊' | '猴' | '鸡' | '狗' | '猪'

  // prettier-ignore
  // 24节气
  export type SolarTerm =
    | '小寒' | '大寒' | '立春' | '雨水' | '惊蛰' | '春分' | '清明' | '谷雨'
    | '立夏' | '小满' | '芒种' | '夏至' | '小暑' | '大暑' | '立秋' | '处暑'
    | '白露' | '秋分' | '寒露' | '霜降' | '立冬' | '小雪' | '大雪' | '冬至';

  // prettier-ignore
  // 农历月份名称
  export type LunarMonthName =
    | '正月' | '二月' | '三月' | '四月' | '五月' | '六月' | '七月' | '八月' | '九月' | '十月' | '十一月' | '十二月'
    | '闰正月' | '闰二月' | '闰三月' | '闰四月' | '闰五月' | '闰六月' | '闰七月' | '闰八月' | '闰九月' | '闰十月' | '闰十一月' | '闰十二月';

  // prettier-ignore
  // 农历日期名称
  export type LunarDayName =
    | '初一' | '初二' | '初三' | '初四' | '初五' | '初六' | '初七' | '初八' | '初九' | '初十'
    | '十一' | '十二' | '十三' | '十四' | '十五' | '十六' | '十七' | '十八' | '十九' | '二十'
    | '廿一' | '廿二' | '廿三' | '廿四' | '廿五' | '廿六' | '廿七' | '廿八' | '廿九' | '三十' | '卅一';

  // prettier-ignore
  // 公历节日
  export type SolarFestival =
    | '元旦节' | '世界湿地日' | '国际气象节' | '情人节' | '国际海豹日' | '全国爱耳日' | '学雷锋纪念日' | '妇女节'
    | '植树节 孙中山逝世纪念日' | '国际警察日' | '消费者权益日' | '中国国医节 国际航海日' | '世界森林日 消除种族歧视国际日 世界儿歌日'
    | '世界水日' | '世界气象日' | '世界防治结核病日' | '全国中小学生安全教育日' | '巴勒斯坦国土日' | '愚人节 全国爱国卫生运动月(四月) 税收宣传月(四月)'
    | '世界卫生日' | '世界地球日' | '世界图书和版权日' | '亚非新闻工作者日' | '劳动节' | '青年节' | '碘缺乏病防治日' | '世界红十字日'
    | '国际护士节' | '国际家庭日' | '世界电信日' | '国际博物馆日' | '全国学生营养日' | '国际生物多样性日' | '国际牛奶日' | '世界无烟日'
    | '国际儿童节' | '世界环境日' | '全国爱眼日' | '防治荒漠化和干旱日' | '国际奥林匹克日' | '全国土地日' | '国际禁毒日' | '香港回归纪念日 中共诞辰 世界建筑日'
    | '国际体育记者日' | '抗日战争纪念日' | '世界人口日' | '非洲妇女日' | '建军节' | '中国男子节(爸爸节)' | '抗日战争胜利纪念' | '国际扫盲日 国际新闻工作者日'
    | '毛泽东逝世纪念' | '中国教师节' | '世界清洁地球日' | '国际臭氧层保护日' | '九一八事变纪念日' | '国际爱牙日' | '世界旅游日' | '孔子诞辰'
    | '国庆节 世界音乐日 国际老人节' | '国际和平与民主自由斗争日' | '世界动物日' | '老人节' | '全国高血压日 世界视觉日' | '世界邮政日 万国邮联日'
    | '辛亥革命纪念日 世界精神卫生日' | '世界保健日 国际教师节' | '世界标准日' | '国际盲人节(白手杖节)' | '世界粮食日' | '世界消除贫困日'
    | '世界传统医药日' | '联合国日 世界发展信息日' | '世界勤俭日' | '十月社会主义革命纪念日' | '中国记者日' | '全国消防安全宣传教育日'
    | '世界青年节' | '国际科学与和平周(本日所属的一周)' | '孙中山诞辰纪念日' | '世界糖尿病日' | '国际大学生节 世界学生节' | '世界问候日 世界电视日'
    | '国际声援巴勒斯坦人民国际日' | '世界艾滋病日' | '世界残疾人日' | '国际经济和社会发展志愿人员日' | '国际儿童电视日' | '世界足球日'
    | '世界人权日' | '西安事变纪念日' | '南京大屠杀(1937年)纪念日！紧记血泪史！' | '澳门回归纪念' | '国际篮球日' | '平安夜' | '圣诞节' | '毛泽东诞辰纪念';

  // prettier-ignore
  // 农历节日
  export type LunarFestival = '春节' | '元宵节' | '龙抬头节' | '妈祖生辰' | '端午节' | '七夕情人节' | '中元节' | '中秋节' | '重阳节' | '下元节' | '腊八节' | '小年' | '除夕';

  // 通用错误类型
  export interface LunarCalendarError {
    error: 100 | 101
    msg: string
  }

  // 公历转农历结果类型
  export interface SolarToLunarResult {
    zodiac: Zodiac
    GanZhiYear: GanZhi
    GanZhiMonth: GanZhi
    GanZhiDay: GanZhi
    worktime: 0 | 1 | 2 // 0无特殊安排，1工作，2放假
    term?: SolarTerm
    lunarYear: number
    lunarMonth: number
    lunarDay: number
    lunarMonthName: LunarMonthName
    lunarDayName: LunarDayName
    lunarLeapMonth: number
    solarFestival?: SolarFestival
    lunarFestival?: LunarFestival
  }

  // 农历转公历结果类型
  export interface LunarToSolarResult {
    year: number
    month: number
    day: number
  }

  // 日历数据项类型
  export interface CalendarDataItem {
    year: number
    month: number
    day: number
    zodiac: Zodiac
    GanZhiYear: GanZhi
    GanZhiMonth: GanZhi
    GanZhiDay: GanZhi
    worktime: 0 | 1 | 2
    term?: SolarTerm
    lunarYear: number
    lunarMonth: number
    lunarDay: number
    lunarMonthName: LunarMonthName
    lunarDayName: LunarDayName
    lunarLeapMonth: number
    solarFestival?: SolarFestival
    lunarFestival?: LunarFestival
  }

  // 日历结果类型
  export interface CalendarResult {
    firstDay: number
    monthDays: number
    monthData: CalendarDataItem[]
  }

  // 公历日历数据项类型
  export interface SolarCalendarDataItem {
    year: number
    month: number
    day: number
  }

  // 公历日历结果类型
  export interface SolarCalendarResult {
    firstDay: number
    monthDays: number
    monthData: SolarCalendarDataItem[]
  }

  /**
   * 将公历转换为农历
   * @param year 公历年
   * @param month 公历月 (从 1 开始)
   * @param day 公历日
   * @example
   * // 示例：将公历 2024 年 1 月 1 日转换为农历
   * // 月份从 1 开始，1 表示一月
   * const result = solarToLunar(2024, 1, 1);
   * // 返回结果示例：
   * // {
   * //   zodiac: '兔',
   * //   GanZhiYear: '癸卯',
   * //   GanZhiMonth: '甲子',
   * //   GanZhiDay: '癸酉',
   * //   worktime: 2,
   * //   solarFestival: '元旦节',
   * //   lunarYear: 2023,
   * //   lunarMonth: 11,
   * //   lunarDay: 20,
   * //   lunarMonthName: '十一月',
   * //   lunarDayName: '二十',
   * //   lunarLeapMonth: 0
   * // }
   */
  export function solarToLunar(year: number, month: number, day: number): SolarToLunarResult | LunarCalendarError

  /**
   * 将农历转换为公历
   * @param year 农历年
   * @param month 农历月 (1-13，有闰月时 13 表示闰月)
   * @param day 农历日
   * @example
   * // 示例：将农历 2023 年 11 月 20 日转换为公历
   * // 月份从 1 开始，11 表示十一月
   * const result = lunarToSolar(2023, 11, 20);
   * // 返回结果示例：
   * // {
   * //   year: 2024,
   * //   month: 1,
   * //   day: 1
   * // }
   * 
   * // 示例：处理闰月，将农历 2020 年闰 4 月 1 日转换为公历
   * // 使用 13 表示闰月
   * const leapResult = lunarToSolar(2020, 13, 1);
   * // 返回结果示例：
   * // {
   * //   year: 2020,
   * //   month: 5,
   * //   day: 23
   * // }
   */
  export function lunarToSolar(year: number, month: number, day: number): LunarToSolarResult | LunarCalendarError

  /**
   * 获取指定公历月份的农历数据
   * @param year 公历年
   * @param month 公历月 (从 1 开始)
   * @param fill 是否用上下月数据补齐首尾空缺，首例数据从周日开始
   * @example
   * // 示例：获取 2024 年 1 月的农历数据
   * // 月份从 1 开始，1 表示一月
   * // 不补齐首尾空缺
   * const result = calendar(2024, 1);
   * // 返回结果包含该月的农历数据数组
   * 
   * // 示例：获取 2024 年 2 月的农历数据并补齐首尾空缺
   * // fill 设为 true 时，会用上下月数据补齐成 7*6 阵列
   * const filledResult = calendar(2024, 2, true);
   * // 返回结果示例：
   * // {
   * //   firstDay: 4, // 该月 1 日是星期四
   * //   monthDays: 29, // 该月有 29 天
   * //   monthData: [ // 该月的每一天数据，包含农历信息
   * //     { year: 2024, month: 2, day: 1, ... },
   * //     { year: 2024, month: 2, day: 2, ... },
   * //     // ... 更多天数数据
   * //   ]
   * // }
   */
  export function calendar(year: number, month: number, fill?: boolean): CalendarResult | LunarCalendarError

  /**
   * 公历某月日历
   * @param year 公历年
   * @param month 公历月 (从 1 开始)
   * @param fill 是否用上下月数据补齐首尾空缺，首例数据从周日开始 (7*6阵列)
   * @example
   * // 示例：获取 2024 年 3 月的公历日历数据
   * // 月份从 1 开始，3 表示三月
   * // 不补齐首尾空缺
   * const result = solarCalendar(2024, 3);
   * // 返回结果包含该月的公历数据数组
   * 
   * // 示例：获取 2024 年 4 月的公历日历数据并补齐首尾空缺
   * // fill 设为 true 时，会用上下月数据补齐成 7*6 阵列
   * const filledResult = solarCalendar(2024, 4, true);
   * // 返回结果示例：
   * // {
   * //   firstDay: 1, // 该月 1 日是星期一
   * //   monthDays: 30, // 该月有 30 天
   * //   monthData: [ // 该月的每一天数据，仅包含公历信息
   * //     { year: 2024, month: 4, day: 1 },
   * //     { year: 2024, month: 4, day: 2 },
   * //     // ... 更多天数数据
   * //   ]
   * // }
   */
  export function solarCalendar(year: number, month: number, fill?: boolean): SolarCalendarResult | LunarCalendarError

  /**
   * 设置放假安排
   * @param workData 放假安排数据，键为日期格式 'dMMDD'，值为 0(无特殊安排)、1(工作)、2(放假)
   * @example
   * // 示例：设置 2024 年的放假安排
   * setWorktime({
   *   // 键格式为 'd' + 月份(2位) + 日期(2位)
   *   'd0101': 2, // 1月1日放假
   *   'd0210': 2, // 2月10日放假
   *   'd0211': 2, // 2月11日放假
   *   'd0212': 2, // 2月12日放假
   *   'd0213': 2, // 2月13日放假
   *   'd0214': 2, // 2月14日放假
   *   'd0215': 2, // 2月15日放假
   *   'd0217': 1, // 2月17日调休上班
   *   'd0218': 1  // 2月18日调休上班
   * });
   */
  export function setWorktime(workData: Record<string, 0 | 1 | 2>): void

  /**
   * 获取公历月份的天数
   * @param year 公历年
   * @param month 公历月 (从 1 开始)
   * @returns 该月的天数
   * @example
   * // 示例：获取 2024 年 2 月的天数
   * // 月份从 1 开始，2 表示二月
   * const days = getSolarMonthDays(2024, 2);
   * // 返回结果：29 (2024 年是闰年，二月有 29 天)
   * 
   * // 示例：获取 2023 年 2 月的天数
   * const days2023 = getSolarMonthDays(2023, 2);
   * // 返回结果：28 (2023 年不是闰年，二月有 28 天)
   */
  export function getSolarMonthDays(year: number, month: number): number
}
