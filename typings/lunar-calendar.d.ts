declare module 'lunar-calendar' {
  export interface LunarCalendarError {
    error: number
    msg: string
  }

  export interface LunarToSolarResult {
    year: number
    month: number
    day: number
  }

  export function lunarToSolar(year: number, month: number, day: number): LunarToSolarResult | LunarCalendarError
}
