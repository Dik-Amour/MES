/**
 * 薄 index 版打包配置（产物形态和 webpack/CRA 那种一样）：
 *   index.html  -> 几百字节，只引用一个 bundle.js
 *   bundle.js   -> 全部代码（classic script，不是 type="module"）
 *   CSS         -> 打包进 bundle.js，运行时注入 <style>
 *   图片        -> 与 index.html 同级，相对路径引用
 *
 * 用途：file:// 下也能双击打开，同时保持"壳和代码分离"的结构。
 * 命令：npm run build:thin   （产物在 dist-thin）
 *
 * 为什么需要下面这些定制：Vite 默认产出 type="module" 的 ESM 入口 + 独立 css 文件，
 * 这两样在 file:// 下会被浏览器的 CORS 策略拦截（origin 为 null），页面白屏。
 */
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const OUT_DIR = 'dist-thin'

/**
 * 1) 把 CSS 从产物中取出，改成 bundle.js 运行时注入 <style>（等价于 webpack 的 style-loader）
 * 2) 清掉 index.html 里残留的 <link rel="stylesheet"> 和入口脚本上的 type="module"
 */
function thinIndexPlugin(): Plugin {
  return {
    name: 'thin-index',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      const cssFiles = Object.keys(bundle).filter((file) => file.endsWith('.css'))
      if (cssFiles.length) {
        let css = ''
        for (const file of cssFiles) {
          css += (bundle[file] as { source: string }).source
          delete bundle[file] // 不再输出独立 css 文件
        }
        const entry = Object.values(bundle).find(
          (item) => item.type === 'chunk' && item.isEntry
        ) as { code: string } | undefined
        if (entry) {
          // CSS 里可能出现 </script 之类的字符也没关系：这是独立 js 文件，不是内联在 html 里
          entry.code =
            `(function(){var s=document.createElement("style");s.setAttribute("data-vite-css","");` +
            `s.textContent=${JSON.stringify(css)};document.head.appendChild(s)})();\n` +
            entry.code
        }
      }
    },

    // 文件落盘后再修一次 HTML，确保没有任何外链 css、入口脚本是 classic script
    closeBundle() {
      const htmlPath = join(resolve(__dirname, OUT_DIR), 'index.html')
      if (!existsSync(htmlPath)) return

      const html = readFileSync(htmlPath, 'utf-8')
        // 去掉 Vite 自动注入的外链样式（内容已经注入进 bundle.js）
        .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
        // 入口脚本去掉 type="module" crossorigin，变成普通脚本
        .replace(/<script type="module" crossorigin /g, '<script ')
        .replace(/\s+crossorigin(?=[^>]*src=)/g, '')
        // 关键：module 脚本天生是延后执行的，改成普通脚本后必须补 defer，
        // 否则脚本在 <head> 里立刻执行，此时 <div id="app"> 还不存在，Vue 挂载失败 -> 白屏
        .replace(
          /<script(?![^>]*\bdefer\b)([^>]*\ssrc="[^"]+")[^>]*><\/script>/g,
          '<script defer$1></script>'
        )

      writeFileSync(htmlPath, html)
    }
  }
}

export default defineConfig({
  plugins: [vue(), thinIndexPlugin()],
  base: './',
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    cssCodeSplit: false,
    // 图片等资源与 index.html 同级，file:// 下相对路径才能正确解析
    assetsDir: '',
    rollupOptions: {
      output: {
        // 单个普通脚本（IIFE），file:// 下不会被 CORS 拦
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'bundle.js'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
