import { post } from '@/utils/request'

export function getRouterList(data) {
  return post('/api/menu/navigate', data)
}
