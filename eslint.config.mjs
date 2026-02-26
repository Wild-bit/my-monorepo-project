import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 全局忽略
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  },

  // 基础配置
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,

  // TypeScript 通用规则
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // React 前端规则
  {
    files: ['apps/web/**/*.tsx', 'apps/web/**/*.ts'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  // NestJS 后端规则
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  }
);
