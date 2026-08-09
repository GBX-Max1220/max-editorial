# V0.1 IMPLEMENTATION NOTES

## 分层（为替换 Doocs engine 预留的边界）

```
src/markdown/   ← 解析层。纯函数，零 React 依赖，输出纯数据 Block[]
  ├─ parser.ts     行级 block 解析（frontmatter / 7 语义块 / 基础 markdown）
  ├─ inline.ts     inline 解析（strong / em / code / link / image）
  └─ frontmatter.ts 极简 YAML 子集
src/render/     ← 渲染层。同一个 Block[] 出三份产物
  ├─ Article.tsx / blocks.tsx / inline.tsx   React 预览
  ├─ clipboard.ts                            微信富文本 HTML + 纯文本
  └─ parseHelpers.ts                         evidence / lab-note 共享解析
src/compat/     ← 微信兼容性检查器（纯函数）
src/components/ ← 应用壳（编辑器 / 预览 / 状态栏 / 检查面板）
```

替换 Doocs engine = 重写 `src/markdown/` 的输入输出契约，`src/render/` 与 UI 不动。

## 关键取舍

### 1. 自研解析器，而不是 marked
不引依赖、完全掌控语义块渲染。代价是 GFM 的边角（嵌套列表、复杂表格）按 V0.1 需求降级——**微信兼容优先降级**。已覆盖：h1–h6、段落、加粗、斜体、引用、有序/无序列表、链接、行内代码、围栏代码、分隔线、图片、表格。

### 2. 编辑器用 `<textarea>`，不做语法高亮
V0.1 的 Editor UX 权重是"够用 + 稳定"，不是炫。高亮 overlay 会引入滚动同步的 bug 面，放进后续版本。Tab 键已支持插入两空格。

### 3. 间距 token 全部用 `em`
spacing 挂在纸面字号上，视口缩放（WECHAT/MOBILE 的 `--scale: 0.94`）自动把间距、标题、米字一起收窄，不用写两套 CSS。

### 4. 微信剪贴板 = inline style 富文本
微信编辑器会剥离 `<style>` 和 class，但保留 inline style。`toWechatHtml` 逐元素内联。`copyWechat` 用 `ClipboardItem` 同时写 `text/html` + `text/plain`；Clipboard API 不可用时退回 `execCommand`（**此时只复制纯文本**，属已知降级）。

### 5. 兼容性检查是"保守结论"，不是 lint
规则有意克制：能 PASS 不多报，能 warning 不升级 fail。10 项：外部 CSS / script / iframe / 复杂定位 / 本地图片 / 超长字符串 / 空语义块 / 无效语义语法 / 未知语义块 / 过宽表格。

## 已知边界（V0.1 接受）

- 嵌套列表按"续行"处理，不渲染层级缩进。
- 表格单元格内的换行不支持。
- `# 标题` 必须有空格（标准 GFM 行为）。
- NORMAL 模式 header 简化、无 tagline、judgment/metric 收小——同系统两种密度，不是两套主题。
- 复制到微信后，metric / judgment 的观感依赖微信编辑器对 inline style 的保留程度，个别平台可能有 ± 差异。这是微信侧限制，不是本工具缺陷。

## 测试覆盖

Vitest（node 环境，无 DOM 依赖，快）：
- parser：frontmatter（含嵌套）、7 语义块、metric/lab-note props、未闭合围栏、基础 markdown、表格
- compat：PASS / FAIL（script、css、iframe、未闭合、未知块）/ WARNING（本地图片、长字符串、空块、宽表）
- clipboard：html 内容与 label、不泄漏 `:::` 源码标记、editorial 含 header 而 normal 不含、纯文本
- words：CJK + 英文混排计数
- modes：editorial/normal token、desktop/wechat/mobile viewport

## 未来（明确不在 V0.1）

Doocs engine 替换、编辑器语法高亮、图片托管、多主题、账号/CMS/云同步/AI 助手/直接发布微信。
