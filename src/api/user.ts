//获取用户信息
import request from '@/utils/request'
export async function getUserInfo(): Promise<any> {
  const reqConfig = {
    url: '/userInfo',
    params: { plateFormId: 2 },
    method: 'post'
  }
  return request(reqConfig).then((it) => it.data)
}

//登录
export async function login(subForm) {
  return request({
    url: '/login',
    params: subForm,
    method: 'post'
  })
}

//退出登录
export async function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}
