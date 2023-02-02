declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_ENV: 'prod' | 'test' | 'dev'
    readonly VITE_APP_BASE_MODE: 'local' | 'url' | 'port'
    readonly VITE_APP_BASE_URL: string
    readonly VITE_APP_BASE_PORT: string

    /** 构建元信息，由 Gradle 的 viteJar 注入 */
    readonly VITE_PROJECT_VERSION: string
    readonly VITE_BUILD_TIMESTAMP: string
    readonly VITE_GIT_COMMIT: string
    readonly VITE_BUILD_DISPLAY_NAME: string
    /** 前端自身版本，由 vite.config.ts 的 define 注入 */
    readonly PROJECT_VERSION: string

    readonly VITE_AMAP_KEY?: string
    readonly VITE_AMAP_SECURITY_CODE?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    readonly NGINX_BASE_URL: string | undefined
  }
}

export {}
