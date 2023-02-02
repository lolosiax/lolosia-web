import base from './eslint.config.mjs'

/**
 * 硬阈值（2x，error）。
 * 超过阈值的文件必须拆分或重构后才能合并，不允许 eslint-disable。
 */
export default [
  ...base,
  {
    rules: {
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }],
      'vue/max-lines-per-block': [
        'error',
        { script: 400, template: 240, style: 400, skipBlankLines: true }
      ],
      'max-lines-per-function': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 20],
      'max-params': ['error', 8],
      'vue/max-template-depth': ['error', { maxDepth: 5 }],
      'vue/max-props': ['error', { maxProps: 16 }]
    }
  }
]
