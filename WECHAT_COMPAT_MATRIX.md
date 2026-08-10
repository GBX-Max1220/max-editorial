# WECHAT_COMPAT_MATRIX

> 状态（V0.2.2）：微信目标编译器已产出首个可粘贴 artifact。本矩阵的 **Verdict = 编译器策略分类**，
> **Evidence = 证据来源**。真实微信粘贴验收仍未执行——编译器使用某个 primitive 不构成 SAFE 证据
> （`CONSERVATIVE-POLICY` 项必须等真机确认）。
>
> 证据分类：`REAL-WECHAT-OBSERVED`（本次真实粘贴可见）/ `DOOCS-BASELINE`（vendored/上游成熟）/ `CONSERVATIVE-POLICY`（保守策略）/ `UNVERIFIED`（未测）。
> Verdict：`SAFE` / `SAFE_WITH_CONSTRAINT` / `UNSTABLE` / `STRIPPED` / `UNKNOWN` / `PRODUCTION_FORBIDDEN`。
>
> 填写：真机粘贴后，把截图观察填入 `WeChat Visual`、copy-back diff 填入 `Copy-Back DOM`；确认后把 Evidence 从策略级升级为 OBSERVED。

## A. PRODUCTION_FORBIDDEN（编译器不产出；真机已观察到失败）

| Primitive | 编译器策略 | Evidence | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|---|
| `display:flex` | 不产出 | REAL-WECHAT-OBSERVED（evidence 行塌陷） |  |  | PRODUCTION_FORBIDDEN | 编译器全块流 |
| `flex-direction` / `flex-wrap` | 不产出 | REAL-WECHAT-OBSERVED + DOOCS-BASELINE |  |  | PRODUCTION_FORBIDDEN | |
| `gap` | 不产出 | REAL-WECHAT-OBSERVED（meta 塌陷） |  |  | PRODUCTION_FORBIDDEN | |
| `align-items` / `justify-content` | 不产出 | REAL-WECHAT-OBSERVED |  |  | PRODUCTION_FORBIDDEN | |
| `clamp()` / `vw` | 不产出 | REAL-WECHAT-OBSERVED（43 塌缩） |  |  | PRODUCTION_FORBIDDEN | specimen 固定 44px |
| `@media` 依赖 | 不产出 | DOOCS-BASELINE + CONSERVATIVE-POLICY |  |  | PRODUCTION_FORBIDDEN | |
| 长元数据 `white-space:nowrap` | 不产出 | REAL-WECHAT-OBSERVED（source/status 挤行） |  |  | PRODUCTION_FORBIDDEN | 编译器 meta 块行 + 自然换行 |
| `var(--x)` 残留 | 不产出 | DOOCS-BASELINE |  |  | PRODUCTION_FORBIDDEN | 导出期解析 |

## B. 编译器使用（SAFE 或 SAFE_WITH_CONSTRAINT；需真机确认）

| Primitive | 编译器用法 | Evidence | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|---|
| normal block flow | 全部语义块纵向堆叠 | REAL-WECHAT-OBSERVED（lab-note 存活）+ DOOCS-BASELINE |  |  | SAFE_WITH_CONSTRAINT | 首要组合单位 |
| `display:block`（子元素） | evidence-row/label/value、meta-source/status、fields | CONSERVATIVE-POLICY |  |  | UNKNOWN | 编译器把 span 块化；需确认 |
| 固定 px `font-size` | 16 正文 / 44 specimen / 22 result / 21 judgment | REAL-WECHAT-OBSERVED（基础排版存活） |  |  | SAFE_WITH_CONSTRAINT | 44px 是 target heuristic，需真机确认视觉主导 |
| `line-height` | 1.8 / 1.7 | REAL-WECHAT-OBSERVED |  |  | SAFE_WITH_CONSTRAINT | |
| `font-weight` 600/500 | h/judgment/metric | REAL-WECHAT-OBSERVED |  |  | SAFE_WITH_CONSTRAINT | |
| `font-family`（serif 标题） | masthead-title serif | REAL-WECHAT-OBSERVED（标题保留） |  |  | SAFE_WITH_CONSTRAINT | 中文 serif 移动栈需确认 |
| `margin` / `padding` 固定 px | 全文 | REAL-WECHAT-OBSERVED |  |  | SAFE_WITH_CONSTRAINT | |
| `border-top` | judgment 墨线、evidence/counterpoint 发丝线 | REAL-WECHAT-OBSERVED（规则存活） |  |  | SAFE_WITH_CONSTRAINT | V0.2.1 单规则保留 |
| `border-left` | ai-output 引用条、blockquote、lab-note | REAL-WECHAT-OBSERVED（引用条） |  |  | SAFE_WITH_CONSTRAINT | |
| `border-bottom` | question | REAL-WECHAT-OBSERVED |  |  | SAFE_WITH_CONSTRAINT | |
| 简单 `background` | lab-note/pre/code 浅底 | REAL-WECHAT-OBSERVED（lab-note 存活） |  |  | SAFE_WITH_CONSTRAINT | |
| `text-align:center` | judgment/metric | REAL-WECHAT-OBSERVED（居中存活） |  |  | SAFE_WITH_CONSTRAINT | |
| `letter-spacing` 固定 px | label/meta | CONSERVATIVE-POLICY |  |  | UNKNOWN | 固定 px，非 em |
| `max-width:100%` | img | DOOCS-BASELINE |  |  | SAFE_WITH_CONSTRAINT | |
| `border-radius` 2px | code | CONSERVATIVE-POLICY |  |  | UNKNOWN | |
| 简单嵌套块 | section>div>p | REAL-WECHAT-OBSERVED |  |  | SAFE_WITH_CONSTRAINT | |
| `<br/>` 换行 | 块体内逐行 | CONSERVATIVE-POLICY |  |  | UNKNOWN | 编译器不依赖 white-space |

## C. 表格 / 代码 / 图（SAFE_WITH_CONSTRAINT）

| Primitive | 编译器用法 | Evidence | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|---|
| `<table>`（仅真实数据） | 真实表格；证据/布局不用表 | REAL-WECHAT-OBSERVED（表格被重排 → 政策限制） |  |  | SAFE_WITH_CONSTRAINT | 表格仅限真实 tabular data |
| `<pre>` 代码块 | 简单可读，横滚 | DOOCS-BASELINE |  |  | SAFE_WITH_CONSTRAINT | |
| `figure`+`figcaption` | 图片 title → 图注 | UNVERIFIED |  |  | UNKNOWN | |

## D. 非 Max 产物（EXTRA HARNESS 参考，未测）

`inline-block` 复杂对齐、`box-shadow`、`opacity`、`rem`、`float`、`justify-content`、`vw` 单独：全部 `UNVERIFIED` / `UNKNOWN`（编译器不产出；探针 E01–E08 仅供微信通用行为参考）。

---

## 真机回填指引

1. 用 `artifacts/issue-001-wechat-target.html` 作为"预想产物"对照。
2. `npm run dev` → WECHAT 预览（显示编译产物）→ COPY → WECHAT → 微信粘贴截图。
3. 每项：截图判定 `WeChat Visual`；可选 Ctrl+A/Ctrl+C → COMPAT 面板 DIFF → 填 `Copy-Back DOM`。
4. 确认后把 Evidence 升级为 `REAL-WECHAT-OBSERVED`，Verdict 定稿。
5. 特别确认：evidence 纵向堆叠、44px specimen、meta 换行、judgment 单顶线、lab-note 浅底。
