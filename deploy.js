/**
 * $description
 * @author 一七年夏
 * @since 2022-12-07 14:00
 */
'use strict'

const childProcess = require('child_process')
const SSH2Promise = require('ssh2-promise')
const fs = require('fs')
const { v4 } = require('uuid')
const { zip } = require('compressing')
const dialog = require('dialog')
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

let sshConfig = {
  host: 'localhost',
  port: 22,
  username: 'admin',
  password: '123456'
}
sshConfig = JSON.parse(fs.readFileSync('platform.json', 'utf8'))
const tempDir = '/home/lolosia/nginx/cache'
const tempPrefix = 'home'
const nginxContentPath = 'home'

async function localExec(cmd) {
  return new Promise((r, rj) => {
    const process1 = childProcess.exec(cmd)
    process1.on('exit', r)
    process1.on('error', rj)
    process1.stdout.pipe(process.stdout)
    process1.stderr.pipe(process.stderr)
  })
}

async function main() {
  if (!process.argv.includes('-r')) {
    console.log('项目构建...')
    console.log('前端构建耗时较长，你可以去做其他事，稍后本脚本会弹窗提醒完成。')
    await localExec('.\\node_modules\\.bin\\vite build --mode build')
    console.log('构建zip...')
    await zip.compressDir(`./dist`, './archive.zip')
    console.log('连接至服务器...')
  } else {
    console.log('重新推送...')
  }
  const ssh2 = new SSH2Promise(sshConfig)

  await ssh2.connect()
  const ftp = ssh2.sftp()
  async function exec(cmd) {
    console.log(`运行 ${cmd} ...`)
    console.log(await ssh2.exec(cmd))
  }
  async function sudo(cmd) {
    const shell = await ssh2.shell()
    shell.stdout.pipe(process.stdout)
    shell.stderr.pipe(process.stderr)
    process.stdin.pipe(shell.stdin)
    shell.write(`sudo ${cmd}\n`)
    await delay(500)
    shell.write(`${sshConfig.password}\n`)
    await delay(1000)
    shell.write('exit\n')
    await new Promise((resolve) => {
      shell.on('end', resolve)
    })
    process.stdin.unpipe(shell.stdin)
  }
  async function write(path, text) {
    const stream = await ftp.createWriteStream(path, { encoding: 'utf-8' })
    return new Promise((r) => {
      stream.write(text)
      stream.end(r)
    })
  }
  const dir = tempDir
  await exec(`mkdir -p ${dir}`)
  const archivePath = `${dir}/archive.zip`
  console.log(`删除 ${archivePath} ...`)
  try {
    await ftp.unlink(archivePath)
    // eslint-disable-next-line no-empty
  } catch (e) {}
  console.log(`写入 ${archivePath} ...`)
  const stream = await ftp.createWriteStream(archivePath, {
    encoding: 'binary'
  })
  const file = fs.createReadStream('./archive.zip', {
    encoding: 'binary',
    autoClose: true
  })
  await new Promise((r, rj) => {
    // file.on('close', () => stream.end());
    stream.on('finish', () => r())
    file.on('end', () => r())
    file.on('error', rj)
    stream.on('error', rj)
    file.pipe(stream)
  })
  console.log(`写入 ${archivePath} 完成`)
  const uuid = v4()
  const target = `${dir}/${tempPrefix}-${uuid}`
  //if (process.platform === 'win32') {
  //  await exec(`unzip -O gbk ${archivePath} -d ${target}`)
  //} else {
  await exec(`unzip ${archivePath} -d ${target}`)
  await exec(`mv ${target}/dist ${target}/iGame`)
  //}

  const nginxTarget = '/home/lolosia/nginx/home'

  console.log('移除旧目录 ...')
  await sudo(`rm -rf ${nginxTarget}/${nginxContentPath}`)

  console.log('复制文件 到指定目录 ...')
  await sudo(`cp -r -f ${target}/* ${nginxTarget}`)
  await new Promise((r) => {
    dialog.info(`你现在可以关闭终端，去做其他事情了`, `${nginxContentPath}项目部署完成！`, r)
  })
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0))
