# CLIPBOARD TRANSPORT DIAGNOSTIC REPORT

> 诊断任务交付（V0.3 视觉工作 PAUSED）。目标：用实测证据定位 `COPY → WECHAT` 剪贴板传输层失败点。
> 本报告只提供诊断工具与解释矩阵；**根因判定必须等用户真机 A/B/C/D 结果**（见 §7）。
> 详细调用链审计见 `CLIPBOARD_TRANSPORT_AUDIT.md`。

- 日期：2026-08-13
- 分支：`feat/v03-phase1-markdown-typography`
- 状态：审计 ✓ · 诊断面板 ✓ · 错误记录 ✓ · 自动化测试 ✓ · build ✓ · **生产视觉代码未动 ✓**

---

## 1. 当前复制架构（Doocs 引擎默认）

```
[COPY → WECHAT 按钮]  StatusBar.tsx:50
   └─ handleCopy()              App.tsx:38   (async)
        └─ engine.copyToWechat  doocs/engine.ts:169
             ├─ compileForWechat(source, {mode})   compiler.ts:84  → WeChatCompiledArtifact{html, plainText}（同步）
             └─ copyHtml(html, plainText)          vendor/browser-clipboard.ts:46
                  ├─ [现代] ClipboardItem(text/html + text/plain) → navigator.clipboard.write    ← 目标双 MIME
                  └─ [降级] copyPlain → writeText → legacyCopy(execCommand)                      ← 只纯文本
```

引擎 `catch {}` 一律吞错 → 返回 `{ ok: false, html: '', plainText: '' }` → UI 只显示「COPY FAILED」。

---

## 2. 潜在失败层（每层一个候选假设）

| 层 | 候选失败原因 | 判定方式 |
| - | ------------ | -------- |
| L1 浏览器/安全/用户激活 | `isSecureContext=false`、`navigator.clipboard` 缺失、`ClipboardItem` 缺失、无用户激活/失焦 | 面板环境快照 + 测试 A |
| L2 富剪贴板 API / MIME | `ClipboardItem` 构造失败、`text/html` 不支持、`clipboard.write` 拒绝 | 测试 B |
| L3 HTML 产物构造 | 产物含微信不支持的 primitive 或格式问题 | 测试 C（静态安全 payload） |
| L4 生产 artifact / 集成 | `compileForWechat` 产物本身问题、或产物与写入路径集成 bug | 测试 D |
| L5 微信粘贴行为 | 传输层全部通过，但微信编辑器丢弃/改变内容 | 全 PASS + 真机粘贴验证 |

> 注意：若现代路径失败，`copyHtml` 会**静默降级纯文本**，`{ ok: true }` 仍返回。所以「COPIED ✓ 但微信里没样式」= 现代路径失败但没被看见。这是本任务要暴露的关键盲区。

---

## 3. 诊断 UI 路径（dev-only）

- 入口：底部状态栏 **`CLIPBOARD`** 按钮（`import.meta.env.DEV` 门控；生产构建不存在）。
- 文件：
  - `src/components/ClipboardDiagPanel.tsx` — 面板 UI（环境快照 + A/B/C/D + 生产错误日志）
  - `src/clipboard/diag.ts` — 测试核心（payload、环境收集、直写不吞错）
  - `src/clipboard/errors.ts` — 生产路径错误记录器（环形缓冲）
- 面板显示（STEP 3）：
  - `location.href` / `isSecureContext` / `document.hasFocus()`
  - `navigator.clipboard` / `.write` / `.writeText` 可用性
  - `ClipboardItem` 可用性 + `ClipboardItem.supports("text/html")`
  - `user agent`
- 生产错误日志：真实「COPY → WECHAT」按钮触发的异常（name/message/stack/stage/timestamp）在此列出，可 REFRESH / CLEAR。
- 与既有 `COMPAT`（copy-back 渲染层诊断）互补：CLIPBOARD 管传输层，COMPAT 管渲染层。

**四个独立测试按钮：**

| 测试 | 写入内容 | 目标 |
| ---- | -------- | ---- |
| A · PLAIN TEXT | `MAX_EDITORIAL_CLIPBOARD_TEXT_TEST` 经 `navigator.clipboard.writeText` | 纯文本最小路径 |
| B · MINIMAL HTML | 固定 `<p style="font-size:24px;font-weight:700;color:#3157D5;">` 经 `ClipboardItem`(text/html + text/plain) | 富剪贴板 API / MIME 能力 |
| C · STATIC SAFE | 仅 `<p>` + 固定 px + margin/color/weight/border 的静态 payload | HTML 产物构造 |
| D · PRODUCTION | `compileForWechat(source, mode)` — 与生产按钮**同一 artifact** | 生产 artifact / 集成 |

每个测试显示：PASS/FAIL、失败 stage（`env-check` / `payload` / `clipboarditem` / `clipboard.write` / `writeText`）、异常 name/message/stack、HTML/纯文本长度、MIME、顶层元素数（D）。**不吞错。**

---

## 4. 生产复制错误记录（STEP 4）

- `browser-clipboard.ts` 三个 catch（ClipboardItem/write、writeText、execCommand）现在都 `recordClipboardError(stage, err)`，控制流不变，只暴露被吞的异常。
- `doocs/engine.ts` / `legacy/engine.ts` 的 `copyToWechat` catch 也记录 `engine.copyToWechat`。
- `render/clipboard.ts`（legacy 引擎路径）同样记录。
- 不新增降级（STEP 5 遵守）；现有 execCommand 降级是既有行为，只加了「为什么降级」的日志。

---

## 5. 自动化测试（STEP 6）

`npm test` 全绿（19 文件 / 192 tests），新增 `src/clipboard/diag.test.ts`（16 tests）：

- MIME 构造：`clipboardPayload` 精确返回 `['text/html','text/plain']`。
- 生产 payload：`compileForWechat(fixture)` 产物同时含 `text/html` + `text/plain`，非空、含完整结构。
- 环境快照形状：jsdom 默认（无现代 API）与 stub 后（现代 API 可用）两态。
- 错误传播不吞：
  - `runTestB` 在 `clipboard.write` 拒绝时返回 `{ pass:false, stage:'clipboard.write', errorName:'NotAllowedError' }`。
  - `ClipboardItem` 构造抛错 → stage `clipboarditem`。
  - `copyHtml` 现代路径失败后，`readClipboardErrors()` 含 `copyHtml → ClipboardItem/clipboard.write` 记录。
  - `doocsEngine.copyToWechat` 失败时返回 `{ ok:false }` 且记录 `doocsEngine.copyToWechat`。

> ⚠️ 这些测试**不证明**浏览器权限/用户激活行为——那必须真机手测（§6）。

---

## 6. 手测步骤（真机，用户执行）

前置：`npm run dev`，从 **`http://127.0.0.1:5173`** 打开（确保 `isSecureContext=true`）。

1. 点击底部 `CLIPBOARD` 打开诊断面板。
2. 记录环境快照（尤其 `isSecureContext`、`ClipboardItem.supports`、`hasFocus`）。
3. **A**：点 `RUN A` → 打开 Notepad → 粘贴 → 确认出现 `MAX_EDITORIAL_CLIPBOARD_TEXT_TEST`。记录面板 PASS/FAIL + 异常。
4. **B**：点 `RUN B` → 在富文本目标（如公众号编辑器草稿 / 微信编辑器）粘贴 → 看是否出现蓝色大字。记录 PASS/FAIL + 异常 + HTML 长度。
5. **C**：点 `RUN C` → 微信编辑器粘贴 → 看黑色粗字是否保留。记录。
6. **D**：点 `RUN D` → 微信编辑器粘贴 → 看完整文章样式是否保留。记录 PASS/FAIL + 异常 + 各长度。
7. 另：点一次真实 `COPY → WECHAT` 按钮 → 打开面板看「PRODUCTION COPY ERROR LOG」是否有记录 → 微信粘贴确认。
8. 不要手动重排任何格式——原样粘贴、原样记录。

---

## 7. 解释矩阵

| A Plain | B Minimal HTML | C Static safe | D Production | Interpretation |
| ------- | -------------- | ------------- | ------------ | -------------- |
| FAIL | — | — | — | **L1 浏览器/安全/用户激活层**：看环境快照（isSecureContext / clipboard 缺失 / 无激活）。 |
| PASS | FAIL | — | — | **L2 富剪贴板 API / MIME 层**：ClipboardItem 或 text/html 路径有问题；纯文本可用但富文本不可用。 |
| PASS | PASS | FAIL | — | **L3 HTML 产物构造问题**：浏览器能写富文本，但生产式 payload（更多元素）失败。 |
| PASS | PASS | PASS | FAIL | **L4 生产 artifact / 复制集成 bug**：`compileForWechat` 产物或引擎调用链问题。 |
| PASS | PASS | PASS | PASS | **L5 传输层正常**：改查微信粘贴行为 / 渲染层（配合 COMPAT copy-back 面板）。 |

---

## 8. 停止条件核对

- [x] 审计存在：`CLIPBOARD_TRANSPORT_AUDIT.md`
- [x] 诊断面板存在：`CLIPBOARD` 按钮 + `ClipboardDiagPanel.tsx`，A/B/C/D 各自独立可跑
- [x] 真实异常被暴露：生产错误日志 + 面板测试直写不吞
- [x] 自动化测试通过：`npm test` 192/192
- [x] build 通过：`npm run build`（tsc --noEmit + vite build）✓
- [x] 生产视觉代码未动：未改 typography / H2 / 语义块 / 编译器架构
- [x] 未加任何新降级（STEP 5 遵守）
- 未做：根因判定（等待用户真机 A/B/C/D 结果）

提交信息见 §9。
