import logo from '@/core/icons/common/sidebar-logo.svg?url'
import { settings } from '@/core/config/settings'
import css from '@/core/styles/init.css?url'

const root = document.querySelector('#app')
if (root === null) throw new Error('缺少 #app 挂载点')

root.innerHTML = `
<div class="__init__" style="display: none">
  <link rel="stylesheet" href="${css}" />
  <div class="__init__image">
    <img src="${logo}" alt="" />
  </div>
  <div class="__init__title">${settings.title}</div>
  <div class="__init__process-frame">
    <div class="__init__progress">
      <div class="__init__masker"></div>
    </div>
  </div>
</div>
`

void import('./main')
