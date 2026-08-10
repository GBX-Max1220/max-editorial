# MAX EDITORIAL V03 — WECHAT MAPPING SPEC

> **状态：SPEC ONLY。** 把选定方向 C 的每个视觉 primitive 映射到：原型实现 → 生产源主题表达 → 微信安全编译表达 → 保真风险。
> 生产目标 primitive 保持 V0.2.2 已验证的安全集：normal block flow、显式文本节点、固定 px 字号、font-weight、line-height、letter-spacing、margin、padding、border、background、text-align、简单嵌套。
> **核心身份不依赖 browser-only primitive。** 微信编译产物是真实文本 + 内联样式；禁止 flex/gap/clamp/vw/@media/nowrap 依赖。

## 0. 微信安全边界（沿用 V0.2.2 `WECHAT_SAFE_PROFILE_V1`）

- **PRODUCTION_FORBIDDEN**：display:flex、flex-direction、flex-wrap、gap、align-items、justify-content、clamp()、vw、media-query 依赖、长元数据 nowrap、var(--x) 残留。
- **SAFE / SAFE_WITH_CONSTRAINT**：normal block flow、固定 px、margin/padding、border-top/left/bottom、简单 background、text-align、letter-spacing（px）、font-weight、font-family、简单嵌套。
- 判定规则：自动化测试不授予 SAFE；真实微信粘贴验收必须（`WECHAT_COMPAT_MATRIX` 回填）。

## 1. 逐 primitive 映射表

| # | Visual intent | Prototype implementation (C) | Production source-theme expression | WeChat-safe compiled expression | Fidelity risk |
|---|---|---|---|---|---|
| 1 | 封面/标题排版 | serif 42px 标题 + kicker + deck + byline，cover-rule 1px ink | 源主题 serif 栈 + 固定 px 字号 + margin/padding + border-top | 内联：`<h1 style="font-family:serif;font-size:42px;...">`；kicker/deck/byline 各为 block 文本行 | 低（block 流 + 固定字号，V0.2.2 已验证基础排版存活） |
| 2 | 封面 kicker/deck | mono kicker + sans deck（次级色） | mono/sans 栈 + px | 各为独立 `<div>` 文本行，固定 px + 颜色 | 低 |
| 3 | `display:grid`（封面左侧 issue tag / 部分布局） | C 主布局未用 grid；A/B 用 | **不用 grid**；源主题用 block 流 + 显式文本行 | 不出现 grid | 无（规避） |
| 4 | `flex`（masthead-row 并排 / metric 行 / evidence 双列） | C 用 flex 做 masthead 并排、部分行 | 源主题允许 flex（浏览器）；**微信编译拍平为 block** | masthead brand 与 meta 各为 block 行（或 flex 由编译器降级为 inline-block——但首选纯 block 堆叠）；metric 行数字+单位堆叠 | 中（并排信息在微信变上下，需接受垂直堆叠） |
| 5 | `::after`/`::before`（H2 短墨线、列表 `—` 标记） | H2 `::after` 60px×1px ink；ul `::before "—"` | 源主题保留伪元素（浏览器渲染） | **编译为真实元素**：H2 下方加 `<div style="width:60px;height:1px;background:var(--ink)">`（或 `border-top` 于容器内）；列表标记编译为显式文本 `— ` 前缀 | 中（伪元素在微信不渲染；需编译期展开为 DOM 节点） |
| 6 | CSS `counter()`（ol `01/02/03`） | ol 用 `counter()` | 源主题保留（浏览器）；**微信编译为显式文本** | ol 每项编译为 `<li>` 内显式 `<span style="mono;cobalt">01&nbsp;</span>` 文本前缀 | 中（序号必须是真实文本，不能依赖计数器） |
| 7 | `position:absolute`（Metric 角标） | C 未用角标（B 用）；C metric 居中布局 | 源主题不用 absolute；用 block 流 | 不出现 | 无（规避） |
| 8 | `linear-gradient`（ai-output 底色渐隐） | C 未用；B 用 | 源主题不用渐变；用 `background: var(--surface)` 整块或透明 | 不出现 | 无（规避） |
| 9 | serif display 文本（标题/H2/Judgment/Metric） | serif 栈 | serif 栈 + px | 内联 `font-family: Georgia,"Songti SC",...;font-size:...px` | 中（中文 serif 移动端栈受系统字体限制，需真机确认 Songti/Noto Serif 是否呈现） |
| 10 | 大固定排版（Metric 84px） | 84px | 源主题 84px | **微信编译：H01 模式 `<p>` 固定 44px + weight 600 + margin 10px 0**（V0.2.3 已验证 44px 存活） | 中（44px 是验证上限；更大字号在真实微信可能塌缩——禁止超 44px 依赖） |
| 11 | section 编号（H2 `01`） | `sec-num` mono 11px ls .32em cobalt | 渲染器自动生成 `<span class="sec-num">01</span>` 文本；源主题 mono+cobalt | 显式文本 span + 内联 mono/px/color；微信产物含真实数字 | 低（真实文本） |
| 12 | 规则（墨线/hairline） | 1px ink / hairline border-top/bottom/left | `border-*: 1px solid <token>` | 内联 border-*（V0.2.2 已验证 border-top/left/bottom 存活） | 低 |
| 13 | 元数据行（role/status/source） | mono 标签 + 次级色，block 或内联 | 源主题 mono + px + block | **块行 + 自然换行**（V0.2.2 已验证 meta-source/status display:block 换行存活）；禁 nowrap | 低–中（长来源在微信宽度下换行，接受） |
| 14 | Judgment 签名时刻 | 居中 serif 23px + 上墨线 + `MAX / JUDGMENT` + `— MAX` | 源主题：居中块 + border-top + 固定 px | 内联 `text-align:center;border-top:1px solid ink`；serif 21px（编译值按 D2 区间）；署名行文本 | 中（居中 + 单规则已验证；serif 字体栈需真机确认） |
| 15 | Metric | 居中 84px serif + role 标 + qualifier | 源主题 84px + 标签 | H01 模式：label / `<p>` 44px 数字 / qualifier / 单行 provenance，全 block 流 | 中（数字 44px 已验证；role 标中文标签是真实文本） |
| 16 | Evidence/Counterpoint（判词结构） | e-verdict mono + e-text 16px；cp-body | 源主题：SUPPORTED 行 + 值行；counterpoint 同容器 | **垂直块流**：判词一行、值一行（V0.2.2 已验证 evidence block flow 存活）；counterpoint 同排版 | 低（块流已验证） |
| 17 | Lab Note（surface 插页） | surface 底 + border-left 2px secondary | `background` + `border-left` | 内联 background + border-left + block 文本（V0.2.2 已验证 lab-note 浅底存活） | 低 |
| 18 | figures/captions | figure + fig-label + img + figcaption + fig-source | 源主题 figure 结构 | img `max-width:100%` + 显式 caption 文本行（V0.2.2 已验证图片 + 图注） | 中（fig-label `FIG / 01` 是真实文本；图片本身需上传微信图床） |
| 19 | 有序列表（ol） | `01/02/03` counter | 源主题 ol | **编译为显式序号文本 + 正文文本行**（微信可能重排列表结构，首选每项显式 `<div>` 或 plain `<li>`） | 中（微信对 ol/ul 重排已知；显式序号可绕开） |
| 20 | 表格 | 出版表格（无 box/竖线） | 源主题 table + 上下边框 | table 保留但接受微信强加表格语义；仅真实数据用表 | 中（V0.2.2 观察到表格被重排 → 政策限制） |
| 21 | 代码块 | mono 13px surface 底 | 源主题 pre | pre 内联 mono + 背景 + 横滚（V0.2.2 已验证代码横滚安全） | 低–中 |
| 22 | 引用（blockquote） | serif 19px 左墨线 | 源主题 blockquote + border-left | blockquote 内联 border-left + serif px + 来源行 | 低–中 |
| 23 | 链接 | cobalt + 细下划线 | 源主题 a | 内联 cobalt + border-bottom | 低 |

## 2. 编译策略（实现时遵循）

1. **伪元素/计数器/渐变/absolute/grid**：编译期拍平为真实 DOM 节点或真实文本（H2 墨线 → `<div>`/border；ol 序号 → 显式文本；lab-note 底色 → background；无 absolute/grid/渐变）。
2. **flex**：微信编译产物全 block 流（masthead 并排 → 堆叠；metric 行 → 数字/单位/标签各一行）。
3. **字号**：全部固定 px；Metric 数字微信上限 44px（H01 已验证），源主题可更大地 84px 供浏览器/desktop，编译收敛到安全值。
4. **元数据**：块行 + 自然换行；禁 nowrap。
5. **CSS 变量**：导出期内联前解析，产物无 var()。
6. **边界标签**：`被检查对象 / METRIC`、`系统结果 / RESULT`、`外部统计 / REFERENCE` 是真实中文文本（冻结 D3）。

## 3. 保真风险分级（已知未知，需真机确认）

| 风险 | 说明 | 缓解 |
|---|---|---|
| 中 | 中文 serif（Songti/Noto Serif CJK）在微信移动端的字体栈呈现 | 真机截图确认；若 serif 不可用，接受回退 sans（标题仍靠字号/字重区分） |
| 中 | 44px 数字在部分机型/字号设置的存活 | V0.2.3 已验证；矩阵回填机型差异 |
| 中 | 表格被微信重排 | 仅真实数据用表；证据/布局不用表 |
| 中 | ol/ul 结构重排 | 显式序号文本 + 简单 li |
| 低–中 | 图片需上传微信图床（本地 file/data URI 不成立） | 生产发布时图片走微信上传流程（非渲染问题） |

**诚实边界**：本映射是**计划**；真实微信粘贴验收必须，不能以 spec 自证。
