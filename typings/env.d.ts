declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_BASE_MODE: 'local' | 'url' | 'port'
    readonly VITE_APP_BASE_URL: string
    readonly VITE_APP_BASE_PORT: number
    readonly VITE_APP_ENV: 'prod' | 'test' | 'dev'
    // 更多环境变量...
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    readonly NGINX_BASE_URL: string | undefined
  }
}
export {}
