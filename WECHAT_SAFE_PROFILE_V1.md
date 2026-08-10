# WECHAT_SAFE_PROFILE_V1

> 生产目标契约：Max Editorial 微信目标编译器的 primitive 允许集。
> **不是**"科学证明微信安全"——是保守生产策略，基于：真实微信粘贴观察（metric/evidence/metadata 塌陷）+ Doocs 基线 + 保守渲染。
> 证据级别：`REAL-WECHAT-OBSERVED`（本次真实粘贴可见）/ `DOOCS-BASELINE`（vendored/上游成熟行为）/ `CONSERVATIVE-POLICY`（保守策略推断）/ `UNVERIFIED`（未测）。

## 分类总览

| 类别 | 含义 | 编译器行为 |
|---|---|---|
| SAFE | 有足够证据存活 | 正常使用 |
| SAFE_WITH_CONSTRAINT | 仅限简单/受控形式 | 受限使用 |
| PRODUCTION_FORBIDDEN | 微信目标编排中不得产出 | 静态检查器 ERROR |
| UNKNOWN | 未充分测试 | 避免默认使用；如必须，记录 |

## PRODUCTION_FORBIDDEN（除非有更强的直接证据）

| Primitive | 证据 | 原因 |
|---|---|---|
| `display:flex` | REAL-WECHAT-OBSERVED（evidence 行塌陷）+ DOOCS-BASELINE（doocs 正文不用 flex） | 微信富文本对 flex 布局不可靠 |
| `flex-direction` 组合 | 同上 | 依赖 flex 引擎 |
| `flex-wrap` | 同上 | 依赖 flex 引擎 |
| `gap`（flex 间隙） | REAL-WECHAT-OBSERVED（meta 塌陷）| 较新 CSS，旧 webview 忽略 |
| `align-items` | REAL-WECHAT-OBSERVED | 行内对齐丢失 → 错位 |
| `justify-content` | CONSERVATIVE-POLICY | flex 依赖 |
| `clamp()` | REAL-WECHAT-OBSERVED（43 塌缩为近正文）| 现代 CSS，回退到最小/初始值 |
| `vw` 单位 | REAL-WECHAT-OBSERVED | 视口单位在微信富文本中不可靠 |
| 依赖 media query 的文章布局 | DOOCS-BASELINE + CONSERVATIVE-POLICY | `<style>`/media query 在微信执行未知；文章语义不得依赖 |
| 长元数据 `white-space:nowrap` | REAL-WECHAT-OBSERVED（source/status 挤成一行）| 长值溢出/塌陷 |
| 依赖 CSS 变量存活于最终 artifact | DOOCS-BASELINE（导出期必须解析）| 变量必须在内联前解析 |

> 静态策略检查器（`src/engine/wechat/policyCheck.ts`）把这些作为 ERROR 检测目标。禁止项在浏览器/开发预览中可以存在，但**不得**出现在 WeChat 目标产物里。

## SAFE（足够证据）

| Primitive | 证据 | 说明 |
|---|---|---|
| normal block flow（`display:block`/默认） | REAL-WECHAT-OBSERVED（lab-note 块流存活）+ DOOCS-BASELINE | 首选组合单位 |
| inline text（`<span>`/行内） | DOOCS-BASELINE + CONSERVATIVE-POLICY | 元数据内联文本 |
| `font-size`（固定 px） | REAL-WECHAT-OBSERVED（基础排版存活）+ DOOCS-BASELINE | 禁 em 相对链（见约束） |
| `line-height` | REAL-WECHAT-OBSERVED | 固定值 |
| `font-weight` | REAL-WECHAT-OBSERVED | 粗体保留 |
| `font-family`（安全字体栈） | REAL-WECHAT-OBSERVED（serif 标题保留）+ DOOCS-BASELINE | 系统栈 |
| `margin` / `padding` | REAL-WECHAT-OBSERVED | 固定 px |
| `border-top` / `border-bottom` | REAL-WECHAT-OBSERVED（judgment/evidence 规则存活）| 发丝线/墨线 |
| `border-left` | REAL-WECHAT-OBSERVED（引用条）+ DOOCS-BASELINE | 引用/注记 |
| 简单 `background` | REAL-WECHAT-OBSERVED（lab-note 浅底存活）| 整块浅色 |
| `text-align` | REAL-WECHAT-OBSERVED（居中存活）| center/left |
| `letter-spacing` | CONSERVATIVE-POLICY | 固定 px（非 em）|
| `width`/`max-width`（受限形式） | DOOCS-BASELINE（图片 max-width:100%）| 仅简单场景 |
| 简单嵌套块元素 | REAL-WECHAT-OBSERVED | section/div/p 层级 |

## SAFE_WITH_CONSTRAINT（仅简单/受控形式）

| Primitive | 约束 | 证据 |
|---|---|---|
| `inline-block` | 仅单行、固定尺寸、无复杂对齐 | UNVERIFIED（未实测；保守）|
| `border-radius` | 小圆角（2px）可，大圆角未知 | CONSERVATIVE-POLICY |
| `<table>` | 仅真实表格数据；不用做布局/对齐 | REAL-WECHAT-OBSERVED（表格被重排）|
| `overflow-wrap`/`word-break` | 长英文断字可，不依赖 | CONSERVATIVE-POLICY |
| `<pre>` 代码块 | 可读、横滚安全；不做语法高亮 | DOOCS-BASELINE |
| `figure`+`figcaption` | 图注可，但需真机确认 | UNVERIFIED |
| 颜色 `hex`/`rgb` | 简单值可；rgba 半透明未知 | CONSERVATIVE-POLICY |

## UNKNOWN（避免默认使用）

`inline-block` 复杂对齐、`box-shadow`、`opacity`、`rem`、`float`、`max-width:%` 依赖、深色模式 `currentColor` 依赖、`white-space:pre-wrap`（编译器改用 `<br/>` 实现换行，绕开）。

## 编译器策略（本文件如何被实现）

1. 微信目标产物只用 SAFE + SAFE_WITH_CONSTRAINT（受控）。
2. 布局 = **normal block flow**：每个语义对象纵向堆叠，垂直阅读优先（任务行为要求）。
3. 字号 = **固定 px**（`WECHAT_TARGET_TOKENS_V1.md`）。禁止 clamp/vw/em 依赖。
4. 间距 = 固定 px，避免视口相对/深层嵌套 margin 交互。
5. 元数据 = 块行 + 自然换行（`white-space:normal`），禁 nowrap。
6. 换行 = 依赖 HTML `<br/>`（渲染器已逐行 `<br/>` 连接），不依赖 `white-space:pre-wrap`。
7. CSS 变量：编译器内联前全部解析，产物无 `var()`。
8. 表格仅用于真实表格数据；证据/注释/元数据不用 `<table>`。

## 诚实边界

- 本 profile 是**生产策略**，不是每个 primitive 都被真机证明安全。
- 类别证据见上；`UNVERIFIED` 项绝不假装已测。
- 静态检查器只强制本 profile，**不证明**微信兼容（`WECHAT_TARGET_COMPILER_REPORT.md`）。
