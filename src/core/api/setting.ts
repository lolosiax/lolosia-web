import { post } from '@/core/lib/http'

export interface WebdavSetting {
  /** 是否允许 WebDAV 客户端访问隐藏项（`.` 开头的名字，以及 lost+found）。 */
  allowHidden: boolean
}

export interface AppSetting {
  webdav: WebdavSetting
}

export function settingGet(): Promise<AppSetting> {
  return post<AppSetting>('setting/get')
}

export function settingWebdav(payload: WebdavSetting): Promise<AppSetting> {
  return post<AppSetting>('setting/webdav', payload)
}
