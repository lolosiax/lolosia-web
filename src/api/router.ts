import request from '@/utils/request'

export function getRouterList(data) {
  return post('/menu/navigate', data)
}
