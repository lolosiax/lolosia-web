declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_BASE_MODE: 'local' | 'url' | 'port'
    readonly VITE_APP_BASE_URL: string
    readonly VITE_APP_BASE_PORT: number
    readonly VITE_APP_ENV: 'prod' | 'test' | 'dev'

    // Jenkins 的环境变量
    // readonly BRANCH_NAME: string
    // readonly BRANCH_IS_PRIMARY: string
    // readonly CHANGE_ID: string
    // readonly CHANGE_URL: string
    // readonly CHANGE_TITLE: string
    // readonly CHANGE_AUTHOR: string//
    // readonly CHANGE_AUTHOR_DISPLAY_NAME: string
    // readonly CHANGE_AUTHOR_EMAIL: string
    // readonly CHANGE_TARGET: string
    // readonly CHANGE_BRANCH: string
    // readonly CHANGE_FORK: string
    // readonly TAG_NAME: string
    readonly TAG_TIMESTAMP: string
    // readonly TAG_UNIXTIME: string
    // readonly TAG_DATE: string
    // readonly JOB_DISPLAY_URL: string
    // readonly RUN_DISPLAY_URL: string
    // readonly RUN_ARTIFACTS_DISPLAY_URL: string
    // readonly RUN_CHANGES_DISPLAY_URL: string
    // readonly RUN_TESTS_DISPLAY_URL: string
    // readonly CI: string;
    // readonly BUILD_NUMBER: string
    // readonly BUILD_ID: string
    readonly BUILD_DISPLAY_NAME: string
    // readonly JOB_NAME: string
    // readonly JOB_BASE_NAME: string
    // readonly BUILD_TAG: string
    // readonly EXECUTOR_NUMBER: string
    // readonly NODE_NAME: string
    // readonly NODE_LABELS: string
    // readonly WORKSPACE: string
    // readonly WORKSPACE_TMP: string
    // readonly JENKINS_HOME: string
    // readonly JENKINS_URL: string
    // readonly BUILD_URL: string
    // readonly JOB_URL: string
    readonly GIT_COMMIT: string
    // readonly GIT_PREVIOUS_COMMIT: string
    // readonly GIT_PREVIOUS_SUCCESSFUL_COMMIT: string
    // readonly GIT_BRANCH: string
    // readonly GIT_LOCAL_BRANCH: string
    // readonly GIT_CHECKOUT_DIR: string
    // readonly GIT_URL: string
    // readonly GIT_COMMITTER_NAME: string
    // readonly GIT_AUTHOR_NAME: string
    // readonly GIT_COMMITTER_EMAIL: string
    // readonly GIT_AUTHOR_EMAIL: string

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
