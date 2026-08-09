# THIRD-PARTY NOTICES

本文件记录 vendored 代码与第三方依赖的来源、许可与修改。上游仓库：

- **doocs/md** — https://github.com/doocs/md
- **锁定 commit** — `4699016755d0a699197aa6d634ed87f5a693b649`（2026-08-10，depth-1 克隆 HEAD）
- **上游许可** — WTFPL v2（`LICENSE` 文件）

每个 vendored 文件头部都有 provenance 注释（上游 URL、commit、源码路径、许可、修改说明）。

## Vendored 代码（`src/engine/doocs/vendor/`）

| 本地文件 | 上游路径 | 许可 | 修改 |
| --- | --- | --- | --- |
| `basicHelpers.ts` | `packages/core/src/utils/basicHelpers.ts` | WTFPL v2 | 无（verbatim） |
| `marked-tokens.ts` | `packages/core/src/types/marked-tokens.ts` | WTFPL v2 | 裁剪：只保留 alert 相关类型（删除 mermaid / plantuml / infographic / katex / ruby / markup 类型） |
| `readingTime.ts` | `packages/shared/src/utils/readingTime.ts` | WTFPL v2 | 无（verbatim） |
| `clipboard-dom.ts` | `apps/web/src/services/export/clipboard-dom.ts` | WTFPL v2 | 无（verbatim） |
| `browser-clipboard.ts` | `apps/web/src/lib/browser/clipboard.ts` | WTFPL v2 | 裁剪：去掉 i18n / toast 耦合与读取剪贴板辅助函数 |
| `footnotes.ts` | `packages/core/src/extensions/footnotes.ts` | WTFPL v2 | `var(--md-primary-color)` → `currentColor`（本项目无该主题变量） |
| `alert.ts` | `packages/core/src/extensions/alert.ts` | WTFPL v2 | import 改本地路径；默认变体裁剪为中性集、去 icon；新增 `container` 开关 |
| `wechat-svg.ts` | `apps/web/src/services/export/wechat-svg.ts` | WTFPL v2 | 裁剪：删除 PlantUML 专属分支（tightenViewBox / pixel-size / scroll wrapper） |

## npm 依赖（非 vendored）

| 包 | 版本 | 来源 | 说明 |
| --- | --- | --- | --- |
| `marked` | `^18.0.9` | 上游 `@md/core` 的宿主渲染器 | doocs/md 渲染管线使用 marked；版本取自其 `pnpm-workspace.yaml` catalog |
| `front-matter` | `^4.0.2` | 上游 frontmatter 处理 | 上游对 js-yaml v4 打了 patch（`safeLoad`→`load`）；本项目解析到 `js-yaml@3.15.1`，`safeLoad` 存在，**不需要**该 patch（实测通过） |
| `juice` | `12.1.2` | 上游微信 CSS 内联 | 上游对 juice 打了 parseCSS 空值防御 patch；本项目测试覆盖的输入未触发该崩溃，暂未应用（见 ENGINE_MIGRATION_REPORT.md「已知风险」） |

## 明确未 vendoring（上游存在但超出迁移范围）

Vue 应用 / Pinia / auth / 云同步 / marketplace / AI 助手 / i18n / VSCode 扩展 / uTools 插件 / MCP server / Mermaid / PlantUML / infographic 系统 / 主题市场 / 大块无关 UI 模块。这些在引擎里一律不引入。

## mdnice

mdnice **仅作设计/产品参考**，未复制其任何代码。
