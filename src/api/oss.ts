import request, { post } from '@/utils/request'
import type { AxiosProgressEvent } from 'axios'
import SparkMD5 from 'spark-md5'
import type { BasicModel } from '~/model'

export interface OssFile extends BasicModel {
  id: string
  md5: string
  fileName: string
  service: string
}

export async function listFiles(service: string): Promise<OssFile[]> {
  return post('/oss/list', { service })
}
export async function getFiles(service: string, md5: string[]): Promise<OssFile[]> {
  return post('/oss/getMetas', { service, md5 })
}

/*export*/ async function checkFile(md5: string[]): Promise<boolean[]> {
  return post('/oss/fileCheck', { md5 })
}

/**
 * 上传文件到服务器
 * @param file 文件列表
 * @param service 服务类型
 * @param onUploadProgress 上传进度
 * @return 每个文件对应的md5值
 */
export async function uploadFile(
  file: File | File[],
  service: string = '',
  onUploadProgress: ((e: AxiosProgressEvent) => void) | undefined = undefined
): Promise<string[]> {
  if (!Array.isArray(file)) file = [file]

  // 计算文件MD5
  const promises = [] as Promise<string>[]
  for (const it of file) {
    const promise = new Promise<string>((r, rj) => {
      const reader = new FileReader()
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer
        r(SparkMD5.ArrayBuffer.hash(buffer))
      }
      reader.onerror = (e) => {
        rj(e)
      }
      reader.readAsArrayBuffer(it)
    })
    promises.push(promise)
  }

  // 获取文件MD5
  const md5 = await Promise.all(promises)
  // 检测文件是否上传完成
  const success = await checkFile(md5)
  // 过滤已被上传的文件
  const fileNotUploaded = file.filter((_, i) => !success[i])
  const fileUploaded = md5.filter((_, i) => success[i])

  // 开始上传文件
  const formData = new FormData()
  for (const it of fileNotUploaded) {
    formData.append('file', it)
  }
  // 上传完成的文件，添加一个引用
  for (const it of fileUploaded) {
    formData.append('reference', it)
  }
  // 添加服务名称
  formData.append('service', service)

  await request({
    url: '/oss/upload',
    method: 'post',
    responseType: 'json',
    data: formData,
    onUploadProgress
  })

  return md5
}

export interface UserFile {
  id: string
  md5: string
  fileName: string
  service: string
}

export async function downloadOssFile(
  user: string,
  md5: string,
  callback: (e: AxiosProgressEvent) => void
): Promise<ArrayBuffer> {
  return request({
    url: `/oss/get/${user}/${md5}`,
    method: 'get',
    responseType: 'arraybuffer',
    onDownloadProgress: callback
  })
}
