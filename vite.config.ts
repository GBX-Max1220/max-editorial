/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径构建：部署到任意子路径（GitHub Pages /max-editorial/）都能加载资源。
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // 需要 ?inline CSS（剪贴板 juice 内联）在测试中返回真实字符串
    css: true,
  },
})
