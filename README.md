# MAX EDITORIAL — V0.1

> 文章写完，排版就应该已经完成。

一个专注的公众号出版工作站：左侧写 Markdown，右侧看 editorial 排版预览，一键复制富文本进微信。不是 Markdown IDE，不是 AI 写作工具，不是 CMS。

## 快速开始

```bash
npm install
npm run dev
```

打开 Vite 输出的地址（默认 `http://localhost:5173`）。

左侧编辑器已预载 `examples/issue-001.md`，打开即可看到全部排版能力。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发，热更新 |
| `npm run build` | 类型检查 + 生产构建（输出 `dist/`） |
| `npm run preview` | 本地预览生产构建 |
| `npm test` | 运行 Vitest 测试 |

## 用法

1. **写**：左侧粘贴或书写 Markdown。顶部 `LOAD FIXTURE` 可随时回到示例。
2. **看**：右侧实时排版预览。右上角切换 `DESKTOP / WECHAT / MOBILE` 三种视口，重点检查中文标题换行、长段落、超大米字、图片宽度。
3. **调密度**：底部 `NORMAL / EDITORIAL` 切换。EDITORIAL 是旗舰密度（issue masthead、更大 metric、更多留白）；NORMAL 适合 600–1200 字短评。
4. **检查**：点 `CHECK` 跑微信兼容性检查（外部 CSS / script / iframe / 本地图片 / 超长字符串 / 空语义块 / 无效语义语法等），输出 PASS / WARNING / FAIL。
5. **复制**：点 `COPY → WECHAT`，向剪贴板写入 `text/html` + `text/plain`，粘贴进微信公众号编辑器即可。复制的是富文本，不是 HTML 源码。

## 语义块（7 个）

`:::type` 开头的围栏块。见 [SEMANTIC_BLOCKS.md](./SEMANTIC_BLOCKS.md)。

## 渲染引擎

Markdown 解析与渲染由 `src/engine/` 驱动，UI 只依赖 `EditorialEngine` 接口，不直接碰引擎实现。默认使用 **Doocs-backed 引擎**（marked + front-matter + 语义扩展 + juice 微信剪贴板流水线）；V0.1 自研解析器保留为 `legacy` 引擎。dev 模式顶栏可切换 `LEGACY / DOOCS`（生产不渲染该控件）。

引擎迁移的完整取舍见 [ENGINE_MIGRATION_REPORT.md](./ENGINE_MIGRATION_REPORT.md)，vendored 代码与依赖来源见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

## 文档

- [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) — 颜色 / 字号 / 间距 token
- [SEMANTIC_BLOCKS.md](./SEMANTIC_BLOCKS.md) — 七个语义块的写法与视觉规则
- [V0_IMPLEMENTATION_NOTES.md](./V0_IMPLEMENTATION_NOTES.md) — 实现取舍与已知边界

## 技术栈

Vite + TypeScript + React 18。Markdown 解析为自研轻量解析器，输出纯数据 Block[]，与渲染完全解耦——未来替换为 Doocs engine 时只动 `src/markdown/`。
