import { post } from '@/utils/request'

export function getList(data) {
  return post('/api/user/list', data)
}

export function doEdit(data) {
  return post('/api/user/edit', data)
}

export function doCreate(data) {
  return post('/api/user/create', data)
}

export function doDelete(data) {
  return post('/api/user/delete', data)
}
