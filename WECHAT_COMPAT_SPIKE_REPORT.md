# WECHAT_COMPAT_SPIKE_REPORT

> Spike：识别 `Preview == post-WeChat artifact` 的兼容性边界。
> **不修设计**：本 spike 只建基础设施 + 给出真机测试指令。V0.2 保持原样。
> 分支：`spike/wechat-compat-matrix`（基线 = `feat/cognitive-editorial-v02` HEAD，V0.2 未动）。

## 1. 已验证（pipeline 事实，headless 可确证）

以下来自管线审计与自动化测试，**不等于** WeChat 行为：

1. **CSS 变量全部在导出期解析**，粘贴产物中无 `var()` 残留（`theme.ts` resolveVars）。
2. **`@media (max-width:480px)` 存活在粘贴产物的 `<style>` 标签**（juice 默认不剥离）。但微信是否执行 `<style>` 里的 media query 待实测；且该规则只作用于 `.paper`（PAPER_OVERRIDE 已把 border/shadow 内联去掉），对视觉无实际影响。
3. **flex/gap/clamp/calc 等被 juice 内联成 inline style**（探针产物含 `display:flex`、`gap:`、`flex-wrap:wrap`、`clamp(...)`）。
4. **PAPER_OVERRIDE 移除纸面 chrome**（border/shadow/背景/内边距）——设计意图，非兼容损失。
5. **doocs 规范化边界**（vendored 代码核验）：只做结构修正（li>ul 提升、img 尺寸、SVG 净化），不做样式 primitive 转换。
6. **Max 相对 doocs 正文引入了 flex/gap/clamp/vw/calc 等现代 primitive**（`WECHAT_DOOCS_COMPAT_BASELINE.md` §3）。
7. 探针产物通过真实 `renderer → clipboard` 管线生成（`artifacts/wechat-compat-probe.html`，0 个假导出路径；EXTRA HARNESS 区段明确标注为附加诊断，不属于 Max artifact）。
8. copy-back 诊断模块 `htmlDiff` 可报告 element removed / style removed / style rewritten / value normalized / structure flattened（`compat/htmlDiff.test.ts` 6 项测试通过）。

## 2. 仍需要真机微信测试（本 spike 无法代劳）

- 全部 `WECHAT_COMPAT_MATRIX.md` 中 Verdict=UNKNOWN 的 primitive（默认全部）。
- 特别优先（高风险候选，非结论）：`display:flex`、`gap`、`flex-wrap`、`align-items:baseline`、`clamp()`、`vw`、media query 是否执行、`white-space:nowrap` 长来源、em 相对 `letter-spacing`/`min-width`、表格结构、`figure+figcaption`、嵌套 sblock 结构是否被扁平化。
- 判定规则：**自动化测试不能授予 SAFE**；只有真实粘贴截图（+可选 copy-back）才能落 Verdict。

## 3. 不得改动（现在）

- ❌ 不得重写 V0.2 CSS / 语义组件 / 布局。
- ❌ 不得用 flex 替代品或 clamp 像素封顶去"预修"——没有真机证据前禁止猜测。
- ❌ 不得改 doocs 引擎 / 剪贴板架构 / semantic block 数量。
- ❌ 不得动 `main` / `feat/cognitive-editorial-v02` / V0.2.1 分支。
- ✅ 唯一允许的是：按下面流程做真机测试，回填矩阵 Verdict。

## 4. 精确手动测试指令

**准备**
1. 终端（项目根 `C:\Users\gbx12\projects\max-editorial`，分支 `spike/wechat-compat-matrix`）：`npm run dev`
2. 浏览器打开 `http://localhost:5173`。
3. 编辑器面板粘贴探针内容：`examples/wechat-compat-probe.md` 全文（或直接在编辑器打开该文件复制）。

**COPY → WECHAT**
4. 点击底部 **COPY → WECHAT**（此时 `COMPAT` 面板里 PRE-HTML 状态变绿 ✓，已存下粘贴前产物）。
5. 打开微信公众号后台「图文消息 / 新建图文」编辑器，粘贴。
6. 截图整篇（或分段截图 T01–T31 + EXTRA HARNESS）。

**可选：copy-back 诊断**
7. 在微信编辑器里 Ctrl+A → Ctrl+C 全选复制。
8. 回到 Max Editorial，点 **COMPAT** 面板，把内容粘贴进 textarea，点 **DIFF**。
9. 把各 primitive 的 finding 抄进 `WECHAT_COMPAT_MATRIX.md` 的 Copy-Back DOM 栏。

**回填矩阵**
10. 对每个 primitive：对照截图判定 `WeChat Visual`，结合 diff 判定 `Verdict`（SAFE / SAFE_WITH_CONSTRAINT / UNSTABLE / STRIPPED / UNKNOWN）。

> copy-back 不是发布渲染的完美证明（微信编辑器内部可能二次转换）。真实微信视觉截图才是 source of truth；copy-back 只是诊断辅助。

## 5. 参考探针对照表（截图时对着看）

| 探针 | 观察点 | 相关 primitive |
|---|---|---|
| T01 顶部线 / T02 引用条 / T03 底部线 | 发丝线是否保留 | border-top/left/bottom |
| T05–T09 | evidence 行是否仍是 flex 两列、gap 是否保留、baseline 对齐 | flex / gap / align-items / flex-direction / flex-wrap |
| T10–T11 | 43 是否仍大（clamp/vw 生效） | clamp / vw |
| T12 | 三级标题 margin（calc） | calc |
| T13 | （矩阵记录 media query 是否执行） | @media |
| T14 / T07 | 长来源是否 nowrap 溢出或换行 | white-space / flex-wrap |
| T16 / T17 / T18 | 居中 / 字距 / 大写 label | text-align / letter-spacing / text-transform |
| T19 / T20 | margin/padding 节奏、em 缩放 | margin / padding / em |
| T22 / T23 | 表格结构、图注 | table / figure+figcaption |
| T25 / T26 / T27 / T28 | 底色、字体族、px vs em、行高 | background / font-family / font-size / line-height |
| E01–E08 | 附加 harness 的通用 primitive | inline-block / shadow / opacity / rem / justify / vw / max-width% / float |

## 6. Deliverables

| 文件 | 内容 |
|---|---|
| `WECHAT_CSS_CURRENT_USAGE.md` | 最终 artifact primitives 全量盘点 + 管线事实 |
| `WECHAT_DOOCS_COMPAT_BASELINE.md` | doocs 兼容知识基线（vendored 核验） |
| `WECHAT_COMPAT_MATRIX.md` | Primitive × Verdict 矩阵（默认 UNKNOWN，待真机回填） |
| `examples/wechat-compat-probe.md` | 探针 fixture（T01–T31） |
| `artifacts/wechat-compat-probe.html` | 探针产物（真实管线生成 + EXTRA HARNESS） |
| `src/compat/htmlDiff.ts` + `CompatPanel.tsx`（dev-only） | copy-back 诊断 |
| `WECHAT_COMPAT_SPIKE_REPORT.md` | 本报告 |
