import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useBasicStore } from '@/store/basic'

//使用axios.create()创建一个axios请求实例
const service = axios.create()

//请求前拦截
service.interceptors.request.use(
  (req) => {
    const { token, axiosPromiseArr } = useBasicStore()
    //axiosPromiseArr收集请求地址,用于取消请求
    req.cancelToken = new axios.CancelToken((cancel) => {
      axiosPromiseArr.push({
        url: req.url,
        cancel
      })
    })
    //设置token到header
    req.headers['authorization'] = `Bearer ${token}`
    //如果req.method给get 请求参数设置为 ?name=xxx
    if ('get'.includes(req.method?.toLowerCase() as string)) req.params = req.data
    return req
  },
  (err) => {
    //发送请求失败
    Promise.reject(err)
  }
)
//请求后拦截
service.interceptors.response.use(
  (res) => {
    const type = (res.headers['content-type'] as string) || ''
    if (!type.startsWith('application/json')) return res.data
    const { code } = res.data
    const successCode = '0,200,20000'
    const noAuthCode = '401,403'
    if (successCode.includes(code)) {
      return res.data
    } else {
      if (noAuthCode.includes(code) && !location.href.includes('/login')) {
        useBasicStore().resetStateAndToLogin()
      }
      return Promise.reject(new Error(res.data?.msg ?? '未知异常'))
    }
  },
  //响应报错
  (err) => {
    const { response } = err
    if (response?.status === 401) {
      useBasicStore().resetStateAndToLogin()
    } else {
      const { msg } = response?.data ?? { msg: '未知异常' }
      ElMessage.error({
        message: msg || err,
        duration: 2 * 1000
      })
    }
    return Promise.reject(err)
  }
)

function getRoot() {
  if (window.NGINX_BASE_URL) return window.NGINX_BASE_URL

  const mode = import.meta.env.VITE_APP_BASE_MODE
  if (mode === 'port') {
    const port = import.meta.env.VITE_APP_BASE_PORT || location.port
    return `${location.protocol}//${location.hostname}:${port}`
  }
  if (mode === 'url') {
    let url = import.meta.env.VITE_APP_BASE_URL
    if (!url) url = `${location.protocol}//${location.host}`
    return url
  }

  //local
  return `${location.protocol}//${location.host}`
}

export const baseUrl: string = `${getRoot()}/home/api/`

//导出service实例给页面调用 , config->页面的配置
export default function request(config: AxiosRequestConfig) {
  return service({
    //baseURL: import.meta.env.VITE_APP_BASE_URL,
    baseURL: baseUrl,
    timeout: 8000,
    ...config
  })
}

export function post<T>(url: string, data?): Promise<T> {
  return request({
    url,
    method: 'post',
    responseType: 'json',
    data
  }).then((it) => it.data)
}

export function get<T>(url: string, data?): Promise<T> {
  return request({
    url,
    method: 'get',
    responseType: 'json',
    data
  }).then((it) => it.data)
}
