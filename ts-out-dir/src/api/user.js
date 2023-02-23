import request from '@/utils/request'
export const userInfoReq = () => {
  return new Promise((resolve) => {
    const reqConfig = {
      url: '/basis-func/user/getUserInfo',
      params: { plateFormId: 2 },
      method: 'post'
    }
    request(reqConfig).then(({ data }) => {
      resolve(data)
    })
  })
}
export const loginReq = (subForm) => {
  return request({
    url: '/basis-func/user/loginValid',
    params: subForm,
    method: 'post'
  })
}
export const loginOutReq = () => {
  return request({
    url: '/basis-func/user/loginValid',
    method: 'post'
  })
}
