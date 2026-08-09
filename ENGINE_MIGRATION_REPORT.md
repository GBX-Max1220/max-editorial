# ENGINE MIGRATION REPORT — `feat/doocs-engine-adapter`

## 结论

V0.1 → 引擎化迁移完成。**Doocs-backed 引擎是默认引擎**；legacy 引擎保留用于 A/B 回归对比。UI（布局 / 视觉 token / 排版 / 间距 / Normal-Editorial / 视口）未改变——只是文章正文的渲染路径从"React 组件渲染 AST"切换为"引擎产出的 HTML 注入 `.article-body`"。

## 起点与诚实声明

- **Option B（冻结判决）**：own UI，reuse/vendor Doocs 渲染器与微信剪贴板管线，语义块做成 parser 扩展，不 fork 整个 Doocs web 应用。
- 任务引用的 `MAX_EDITORIAL_ENGINE_RECON.md` **在磁盘上不存在**。本迁移没有伪造这份"冻结 recon"；vendoring 清单由对上游 doocs/md **实际源码检查**产生（commit 锁定 `4699016755`），每一份 provenance 都是真实可核验的。若你手上有该 recon 文档，用它核对本报告的模块清单即可。

## 架构

```
src/engine/
  types.ts        ← EditorialEngine 接口 + RenderResult / EngineStructure / CopyResult
  index.ts        ← createEditorialEngine(name)，UI 唯一入口
  legacy/         ← V0.1 解析器（仍留在 src/markdown/）封装 + HTML 渲染 + legacy 剪贴板
  doocs/
    engine.ts     ← marked + front-matter + readingTime + 扩展；render / copyToWechat
    semantic.ts   ← 7 个语义块的 marked 扩展（认领全部 `:::`）
    clipboard.ts  ← Doocs 派生的微信剪贴板流水线
    theme.ts      ← 导出期 CSS 变量解析（?inline 取 article.css/tokens.css）
    vendor/       ← vendored 上游文件（见 THIRD_PARTY_NOTICES.md）
```

UI 只依赖 `EditorialEngine` 接口。dev 模式顶栏有 `LEGACY / DOOCS` 切换（`import.meta.env.DEV` 门控），默认 `doocs`。

## 渲染管线（doocs 引擎）

- `marked@18` + `breaks:false` + `gfm:true`；`front-matter` 解析 frontmatter；vendored `readingTime`。
- 扩展注册：`markedSemanticBlocks()` → `markedAlert({ container: false })` → `markedFootnotes()`。
- **语义块独占 `:::`**：`alert` 的 `alertContainer` 关闭（vendored alert.ts 新增 `container` 开关），语义扩展是 `:::` 唯一认领者。这是"语义解析先于通用 alert/container"的最强实现。GFM `[!name]` alert 路径（walkTokens）仍生效。
- 未知语义块 → `.sblock-unknown` + `structure.unknown=true` + diagnostics → CHECK 报 FAIL（优雅失败）。
- 未闭合围栏 → `invalid=true` + diagnostics → CHECK 报 FAIL。
- **XSS 防护**：原始 HTML token 一律转义为文本，绝不注入（marked 默认转义正文；`<script>` 只显示为文字）；CHECK 仍会对 source 里的 script/css/iframe 报 FAIL。

## 语义块（Phase 3）

7 个块（question / ai-output / judgment / evidence / counterpoint / lab-note / metric）实现为 marked 扩展，输出与 V0.1 的 React 语义组件**完全相同的 class 结构**（`.sblock-*`、`.evidence-*`、`.lab-*`、`.metric-*`），因此既有 `article.css` 原样生效，视觉一致。语义块内层 markdown 逐行走 marked 行内解析（bold / code / link / image 可用），与 V0.1 逐行语义一致。

## 剪贴板流水线（Phase 4）

Doocs 派生序列（对齐上游 `apps/web/src/services/export/clipboard.ts`）：

```
Preview DOM（.article.paper）→ clone → 注入解析后的 article.css（var() 已替换为具体值）
→ juice 内联 CSS → modifyHtmlStructure（修正 li>ul 嵌套）
→ 去掉页内 # 锚点 → solveWeChatImage（width/height 内联）
→ sanitizeSvgsForWeChat（marker 展开 / 显式尺寸 / 去 defs/id/class / 深色墨水→currentColor）
→ 自包含 HTML + 纯文本 → ClipboardItem(text/html, text/plain)
```

- 剪贴板 CSS 的 `var(--x)` 解析是**导出期主题处理**（CSS 文本替换），不是渲染管线的 regex 后处理（渲染管线保持结构化）。
- legacy 剪贴板路径（V0.1 手写 inline-style HTML）保留在 `src/render/clipboard.ts` 供 A/B。

## 与上游的 intended differences

| 差异 | 原因 | 处理 |
| --- | --- | --- |
| 省略上游 class-marking renderer（`.p`/`.h2`/`.listitem`） | Max Editorial owned UI 用元素级 CSS；保留类名标注会改变视觉输出 | 文档化 |
| `breaks:false`（上游 true） | V0.1 段落把多行合并为空格 | 文档化 |
| GFM `[!name]` alert 现在可用 | V0.1 把 `[!note]` 当普通引用渲染 | 文档化（新能力） |
| footnotes 现在可用 | V0.1 无 footnotes | 文档化（新能力） |
| blockquote 内容被 marked 包一层 `<p>` | 视觉等价（blockquote 样式作用于引用整体） | 回归比较时解包后比对 |
| 表格包 `.table-wrap`（与 V0.1 一致） | 保持横向滚动行为 | 结构一致 |
| juice 上游防御 patch 未应用 | 测试输入未触发 parseCSS 空值崩溃 | **已知风险**，见下 |
| front-matter 上游 patch 未应用 | 解析到 js-yaml@3.15.1，safeLoad 存在 | 无风险 |

### 已知风险：juice patch

上游 `patches/juice@12.1.2.patch` 为 `lib/inline.js` 的 `parseCSS` 返回值加空值检查，防止解析空 inline style 时崩溃。本项目测试（含剪贴板集成测试）未触发；若真实文章遇到崩溃，复制会走 `CopyResult.ok=false`。修复路径：应用上游同一 patch（`patch-package`）或升级 juice。

## 回归（Phase 5）

- **fixtures**：`examples/issue-001.md` + 基础 markdown / 全部 7 语义块 / 语义块内嵌套 markdown / 长中英混排。
- **比较方法**（`src/engine/regression.test.ts`，jsdom）：textContent 去空白后相等（内容一致）+ 元素 tag 计数相等（结构一致）+ 各语义 class 存在。这是 headless 下对"视觉等价"最接近的代理；不做像素比较。
- **结果**：45/45 测试通过，`tsc --noEmit && vite build` 通过。

## STOP CONDITION 核对

- [x] Issue 001 经 Doocs-backed 引擎渲染正确（回归 + doocs 引擎测试）
- [x] 全部 7 个语义块可用（含内层 markdown、未知块优雅失败）
- [x] 富文本剪贴板可用（juice 内联 + 列表/图片结构修正 + SVG 净化 + ClipboardItem html+plain）
- [x] 既有 V0.1 UI 未改变（视觉 token / 排版 / 间距 / 布局 / Normal-Editorial / 视口未动）
- [x] tests / build 通过
- [x] legacy vs doocs 对比已文档化（本报告 + regression.test.ts）

## 范围外（STOP 之后未做）

未加 AI 助手 / 数据库 / 认证 / 云同步 / 分析 / CMS / 直接微信 API 发布 / 图片托管 / 模板市场 / 多主题 / 账号系统 / 协作 / 评论 / research radar 集成。
