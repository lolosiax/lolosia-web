import { post } from '@/utils/request'

export function getList(data) {
  return post('/user/list', data)
}

export function doEdit(data) {
  return post('/user/edit', data)
}

export function doCreate(data) {
  return post('/user/create', data)
}

export function doDelete(data) {
  return post('/user/delete', data)
}
