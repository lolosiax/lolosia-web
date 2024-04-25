//@ts-ignore
import css from '@/styles/init.css?url'
//@ts-ignore
import logo from '@/icons/common/sidebar-logo.svg?url'
import settings from '@/settings'

document.querySelector('#app')!.innerHTML = `
<div class="__init__" style="display: none">
  <link id="__init__" rel="stylesheet" href="${css}" />
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
;(async () => {
  await import('./main')
})()
