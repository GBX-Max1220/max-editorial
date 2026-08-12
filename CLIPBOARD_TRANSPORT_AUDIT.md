# CLIPBOARD TRANSPORT AUDIT

> 诊断任务（V0.3 视觉工作 PAUSED 期间）。本文件只审计、不改代码。
> 目标：定位 `COPY → WECHAT` 剪贴板传输层失败点。不推断根因，只记录证据。

- 日期：2026-08-13
- 分支：`feat/v03-phase1-markdown-typography`
- 提交基线：`87ba7bc`

---

## 1. 生产 COPY → WECHAT 路径（精确调用链）

当前生产默认引擎是 **Doocs-backed**（`App.tsx:14` `DEFAULT_ENGINE = 'doocs'`）。

| # | 阶段 | 位置 |
| - | ---- | ---- |
| 1 | UI 点击处理 | `src/components/StatusBar.tsx:50-52`（`<button className="copy-btn" onClick={onCopy}>`）→ `App.tsx:38-49` `handleCopy` |
| 2 | 引擎分发 | `App.tsx:26` `createEditorialEngine('doocs')` → `src/engine/index.ts:12` → `doocsEngine.copyToWechat` 于 `src/engine/doocs/engine.ts:169-178` |
| 3 | artifact 生成 | `compileForWechat(markdown, { mode })` 于 `src/engine/wechat/compiler.ts:84-91` → 返回 `WeChatCompiledArtifact { html, plainText }` |
| 4 | HTML 序列化 | 在 `compileForWechat` 内完成（`compiler.ts:58-90`：`renderDoocsHtml` → masthead/body/footer → juice 内联 → `stripStyleTags` → `extractPlainText`）。**同步，无额外序列化步骤** |
| 5 | `ClipboardItem` 构造 | `src/engine/doocs/vendor/browser-clipboard.ts:46-62` `copyHtml` 内 `new ClipboardItem({ 'text/html': Blob, 'text/plain': Blob })` |
| 6 | 写入的 MIME | `text/html` + `text/plain`（现代路径）；降级 `writeText` 只写 `text/plain`；`execCommand` 走隐藏 textarea 只写纯文本 |
| 7 | `navigator.clipboard.write` 调用 | `src/engine/doocs/vendor/browser-clipboard.ts:54` |
| 8 | 错误处理 | **三层全部吞掉**（详见 §3） |
| 9 | 成功处理 | 引擎返回 `{ ok: true, html, plainText }`（`doocs/engine.ts:174`）→ `App.tsx:42` 置 `copied`、`App.tsx:44` 存 `lastCopiedHtml`（供 CompatPanel）→ 2s 后复位 |
| 10 | 写入时焦点/安全上下文 | 未在任何地方检查 `document.hasFocus()`；写入在点击的 async 微任务链内（见 §4） |

### 1.1 UI → 引擎 代码（`App.tsx:38-49`）

```tsx
const handleCopy = async () => {
  setCopyState('idle')
  try {
    const r = await engine.copyToWechat(source, { mode, previewEl: articleRef.current })
    setCopyState(r.ok ? 'copied' : 'error')
    if (r.ok) setLastCopiedHtml(r.html)
    setTimeout(() => setCopyState('idle'), 2000)
  } catch {
    setCopyState('error')
  }
}
```

### 1.2 引擎 → 剪贴板（`src/engine/doocs/engine.ts:169-178`）

```ts
async copyToWechat(markdown: string, options?: CopyOptions): Promise<CopyResult> {
  try {
    const { html, plainText } = compileForWechat(markdown, { mode: options?.mode })
    await copyHtml(html, plainText)
    return { ok: true, html, plainText }
  } catch {
    return { ok: false, html: '', plainText: '' }   // ← 错误被吞
  }
}
```

### 1.3 现代写入（`src/engine/doocs/vendor/browser-clipboard.ts:46-62`）

```ts
export async function copyHtml(html: string, fallback?: string): Promise<void> {
  const plain = fallback ?? html.replace(/<[^>]+>/g, ``)
  if (window.isSecureContext && navigator.clipboard?.write) {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: `text/html` }),
        'text/plain': new Blob([plain], { type: `text/plain` }),
      })
      await navigator.clipboard.write([item])
      return
    } catch {
      // fall through to legacy                                  ← 吞掉
    }
  }
  await copyPlain(plain)
}
```

### 1.4 降级路径（同文件 :33-44, :11-31）

```ts
export async function copyPlain(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch { /* fall through to legacy */ }                    ← 吞掉
  }
  await legacyCopy(text)
}
// legacyCopy：textarea + document.execCommand('copy')；返回 false 则 reject('execCommand failed')
```

### 1.5 旧引擎（dev A/B 切换路径）

`src/engine/legacy/engine.ts:35-44` → `copyWechat`（`src/render/clipboard.ts:270-286`）。同一模式：
`ClipboardItem` 写入 → `catch` 吞 → `copyLegacy(plain)`（execCommand 返回 false 时 `throw 'clipboard copy failed'`）。
**同样吞错。**

---

## 2. 相关既有设施

- `src/components/CompatPanel.tsx` — 已存在的 dev-only **copy-back 渲染层诊断**（微信粘贴后再复制回来 DIFF），
  `App.tsx:92` 由 `import.meta.env.DEV` 门控。定位是「渲染/结构差异」，**不含传输层诊断**。
- `src/engine/doocs/clipboard.ts` `processClipboardForWeChat` — 旧 DOM 克隆流水线，已被编译器取代，
  非生产默认路径（`WECHAT_TARGET_COMPILER_REPORT.md:95` 标注为兼容/回退路径）。

---

## 3. 已确认的失败风险点（按影响排序）

### 3.1 【核心问题】三层错误吞噬 → 真实 DOMException 不可见
- `browser-clipboard.ts:56-58` `catch {}`：吞掉 `ClipboardItem` 构造错误 **和** `navigator.clipboard.write` 拒绝。
  **后果**：若 rich write 失败，静默降级为 `copyPlain`（只写纯文本），引擎仍返回 `{ ok: true }` →
  按钮显示 `COPIED ✓`，但微信粘贴到的是无样式纯文本 —— 视觉上即「COPY → WECHAT 失败」，且无任何报错。
- `browser-clipboard.ts:39-41` `catch {}`：吞掉 `writeText` 拒绝 → 静默降级 `execCommand`。
- `doocs/engine.ts:175-177` `catch {}`：兜底吞掉一切 → `{ ok: false, html: '', plainText: '' }`，无错误详情。
- `App.tsx:46-48` `catch {}`：同上（实际极少触发，因为引擎内部已吞）。

### 3.2 `copyHtml` 未检查 `ClipboardItem` 存在性
`browser-clipboard.ts:48` 只检查 `navigator.clipboard?.write`，随后直接 `new ClipboardItem(...)`。
若 `ClipboardItem` 未定义而 `write` 存在（少数 WebKit/非标准环境），`ReferenceError` 被 §3.1 的空 catch 吞掉，
静默降级纯文本。**`ClipboardItem.supports?.('text/html')` 全工程从未检查。**

### 3.3 降级语义偏差
现代路径目标是 `text/html + text/plain` 双写；每次降级（writeText / execCommand）都**丢失富文本**。
当前没有任何日志表明「发生了降级」。生产代码无法区分：正常富文本写入成功 vs 降级纯文本写入成功。

### 3.4 安全上下文 / 环境依赖
`copyHtml` 与 `copyPlain` 都要求 `window.isSecureContext` 为真才走现代路径。
- `http://127.0.0.1:*`（vite dev 默认）→ 安全上下文，正常。
- `http://<LAN-IP>:*` 或其它非安全源 → **现代路径整体跳过** → 直接纯文本降级。
这是「写入层 A/B 测试」必须显示 `window.isSecureContext` 的原因（见解释矩阵第一行）。

### 3.5 用户激活 / 焦点
- 写入在点击 handler 的 async 微任务链内（`compileForWechat` 同步 → `copyHtml` 内首个 `await` 前即发出 `write`）。
  Chromium 中转态激活可穿过 microtask，**大概率不是失败源**，但仍是候选层，需要面板实测确认。
- `document.hasFocus()` 全程未检查。devtools 聚焦或窗口失焦场景未覆盖。

---

## 4. 待实测变量（面板将逐项显示）

| 变量 | 当前代码位置 | 状态 |
| ---- | ------------ | ---- |
| `window.location.href` | — | 未记录 |
| `window.isSecureContext` | `browser-clipboard.ts:34,48` | 被检查但值未暴露 |
| `document.hasFocus()` | — | 未检查 |
| `navigator.clipboard` 存在 | `browser-clipboard.ts:34,48` | 被检查但值未暴露 |
| `navigator.clipboard.write` 存在 | `browser-clipboard.ts:48` | 被检查但值未暴露 |
| `navigator.clipboard.writeText` 存在 | `browser-clipboard.ts:34` | 被检查但值未暴露 |
| `ClipboardItem` 存在 | `render/clipboard.ts:274` 检查；`browser-clipboard.ts` **未检查** | 不一致 |
| `ClipboardItem.supports('text/html')` | — | 从未检查 |
| 抛出异常 name/message/stack | 三层 `catch {}` | 全部丢失 |
| 写入时 `hasFocus` | — | 未检查 |

---

## 5. 结论（仅陈述事实，不做根因推断）

1. 传输层存在**两个独立能力门**：`isSecureContext`、`navigator.clipboard?.write` 存在性。
2. 传输层存在**三个静默吞噬点**，任何现代路径失败都无日志、无 UI 暴露。
3. 富文本与纯文本降级之间**不可区分** —— 现有 UI 无法告诉我们「A/B/C/D 哪层失败」。
4. `compileForWechat`（artifact 生成）是同步纯函数，失败概率低；真正的未知层是 **ClipboardItem 构造 + clipboard.write**。

因此诊断面板（STEP 2-4）聚焦：A 纯文本 / B 最小富文本 / C 静态安全富文本 / D 生产 artifact，
配合环境快照与错误记录，把「哪层失败」从推断变成实测。
