import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * 常规阈值（1x，warn）。
 * 超过阈值的文件不阻断提交，但需要在提交说明里解释为什么不拆。
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'typings/components.d.ts']
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    }
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // SFC 结构
      'vue/block-order': ['error', { order: [['script', 'template'], 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineModel'] }
      ],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],

      // 代码形态
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // 拆分阈值（1x）
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'vue/max-lines-per-block': [
        'warn',
        { script: 200, template: 120, style: 200, skipBlankLines: true }
      ],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 10],
      'max-params': ['warn', 4],
      'vue/max-template-depth': ['warn', { maxDepth: 3 }],
      'vue/max-props': ['warn', { maxProps: 8 }],
      'vue/no-undef-components': ['error', { ignorePatterns: ['^El[A-Z]', '^el-'] }]
    }
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  prettier
)
