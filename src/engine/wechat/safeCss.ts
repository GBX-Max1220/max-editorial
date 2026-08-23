/**
 * 微信目标编译器的 SAFE CSS profile（WECHAT_SAFE_PROFILE_V1 的实现）。
 *
 * V0.3 Phase 2 RED-BLUE EDITORIAL：全语法 + 红蓝身份色收敛。
 * 所有值固定 px、所有颜色 hex（无 rgba 半透明 —— PROFILE 标 UNKNOWN）、无 var()、
 * 无 flex/clamp/vw/@media/nowrap、无伪元素承载必要内容。
 *
 * 约束（静态检查器 policyCheck 会核对产物）：
 *  - 只用 SAFE / SAFE_WITH_CONSTRAINT primitives：normal block flow、固定 px、
 *    margin/padding、border-top/left/bottom、简单 background、text-align、letter-spacing、font-weight。
 *  - 禁止：display:flex / flex-direction / flex-wrap / gap / align-items / justify-content /
 *    clamp( / vw / @media / white-space:nowrap / var(--x)。
 *  - 换行依赖渲染器已产出的 <br/>，不依赖 white-space:pre-wrap。
 *
 * 分类（WECHAT SAFETY）：
 *  - H2 编号 `<span class="sec-num">01</span>` → 直接微信安全（真实文本）。
 *  - H2 短墨线 `<span class="sec-rule">` → 渲染器产出的真实节点（Phase 2），
 *    浏览器与微信同一结构；微信是否保留空 span 的 inline 尺寸 → MANUAL_ACCEPTANCE_PENDING。
 *  - 列表：浏览器预览用 CSS counter/::before（article.css）；微信产物保留原生 <ol>/<ul>
 *    标记（微信稳定支持原生列表），不依赖 CSS counter。
 *  - .q-source：渲染器按 `——` 前缀产出的真实文本节点，微信安全（纯文本样式）。
 *  - 链接用 hex 下划线（#2F5FD7），不依赖 rgba 半透明。
 */

export const WECHAT_SAFE_CSS = `
.wechat-article {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  color: #252421;
  font-size: 16px;
  line-height: 1.85;
  overflow-wrap: break-word;
}

/* ── Base Markdown（V0.3：serif 标题 + mono 编号 + 真实节点短线；全部固定 px） ── */

.article h1 { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 30px; font-weight: 500; line-height: 1.3; margin: 48px 0 16px; color: #252421; }
.article h2 { margin: 48px 0 0; }
.article h2 .sec-num { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #2F5FD7; margin-bottom: 12px; }
.article h2 .sec-title { display: block; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 24px; font-weight: 500; line-height: 1.4; color: #252421; margin-bottom: 14px; }
.article h2 .sec-rule { display: block; width: 60px; height: 1px; background: #2F5FD7; margin-top: 14px; }
.article h3 { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 20px; font-weight: 500; line-height: 1.45; margin: 36px 0 12px; color: #252421; }
.article h4 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; font-size: 17px; font-weight: 600; line-height: 1.5; margin: 30px 0 10px; color: #252421; }
.article h5 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; font-size: 15px; font-weight: 600; line-height: 1.5; margin: 26px 0 8px; color: #6F6B63; }
.article h6 { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; font-weight: 600; line-height: 1.5; letter-spacing: 1px; margin: 24px 0 8px; color: #6F6B63; }
.article p { margin: 0 0 22px; }
.article strong { font-weight: 600; }
.article em { font-style: italic; }
.article code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 14px; background: #F4F1EB; border: 1px solid #D8D1C6; padding: 2px 6px; border-radius: 2px; color: #B83E38; }
.article a { color: #2F5FD7; text-decoration: none; border-bottom: 1px solid #2F5FD7; }
.article blockquote { border-left: 2px solid #746F67; background: #F4F1EB; padding: 12px 16px; margin: 38px 0; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 18px; line-height: 1.8; color: #252421; }
.article blockquote .q-source { display: block; margin-top: 14px; padding-top: 8px; border-top: 1px solid #D8D1C6; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; line-height: 1.6; letter-spacing: 2px; text-transform: uppercase; color: #6F6B63; font-style: normal; }
.article ul, .article ol { padding-left: 24px; margin: 0 0 24px; }
.article li { margin-bottom: 8px; }
.article .task-mark { color: #6F6B63; }
.article .task-mark.task-done { color: #2F5FD7; }
.article pre { background: #23211E; border: 1px solid #23211E; padding: 19px 21px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; line-height: 1.75; color: #F5F2EC; }
.article pre code { border: none; background: none; padding: 0; color: #F5F2EC; }
.article hr { border: none; border-top: 1px solid #252421; margin: 48px 0; }
.article img { max-width: 100%; height: auto; display: block; margin: 32px auto; }
.article .figure { margin: 40px auto; }
.article .figure img { margin: 0 auto; }
.article .figure .fig-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 2px; color: #6F6B63; margin-bottom: 12px; }
.article .figure-caption { font-size: 13px; color: #6F6B63; text-align: center; margin-top: 10px; line-height: 1.6; }
.article table { width: 100%; border-collapse: collapse; font-size: 14px; border-top: 1px solid #252421; border-bottom: 1px solid #252421; margin: 34px 0; }
.article th, .article td { padding: 10px 8px; text-align: left; vertical-align: top; font-weight: 400; }
.article th { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #6F6B63; background: #F4F1EB; border-bottom: 1px solid #2F5FD7; }
.article tr + tr td { border-top: 1px solid #D8D1C6; }
.article .table-wrap { overflow-x: auto; }

/* ── Label 系统（角色色：blue=结构/证据/提问，red=反方/判断；固定字距） ── */

.sblock-label {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #6F6B63;
  margin-bottom: 10px;
}
.sblock-body { color: #252421; }

/* ── 元数据（块行 + 自然换行；禁 nowrap） ── */

.sblock-meta { display: block; margin-top: 12px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; letter-spacing: 0.5px; color: #6F6B63; line-height: 1.7; }
.meta-source, .meta-status { display: block; }

/* ── QUESTION（蓝左边框 + 浅蓝面 + 蓝 label；问题入口，非 CTA） ── */

.sblock-question { margin: 34px 0; padding: 10px 16px 14px; border-left: 2px solid #2F5FD7; border-bottom: 1px solid #D8D1C6; background: #EEF3FF; }
.sblock-question .sblock-label { color: #2F5FD7; }
.sblock-question .sblock-body { font-size: 19px; line-height: 1.7; }
.sblock-question-major { text-align: center; padding: 48px 8px; border-top: 1px solid #252421; border-bottom: 1px solid #252421; background: #EEF3FF; }
.sblock-question-major .sblock-body { font-size: 23px; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; }

/* ── AI OUTPUT（蓝细边框，无大面积背景；label 蓝；换行靠 <br/>） ── */

.sblock-ai-output { margin: 34px 0; border-left: 2px solid #2F5FD7; padding-left: 16px; }
.sblock-ai-output .sblock-label { margin-bottom: 8px; color: #2F5FD7; }
.sblock-ai-output .sblock-body { font-size: 15px; line-height: 1.75; color: #3b3a36; }

/* ── EVIDENCE ↔ COUNTERPOINT（parity：同一容器同一排版；蓝/红左边框 + 色 label） ── */

.sblock-evidence, .sblock-counterpoint { margin: 34px 0; padding: 4px 0 4px 16px; }
.sblock-evidence { border-left: 2px solid #2F5FD7; }
.sblock-counterpoint { border-left: 2px solid #D4473F; }
.sblock-evidence .sblock-label { color: #2F5FD7; }
.sblock-counterpoint .sblock-label { color: #D4473F; }
.sblock-evidence .sblock-body, .sblock-counterpoint .sblock-body { font-size: 16px; line-height: 1.8; }
.evidence-claim { display: block; margin-bottom: 12px; }
.evidence-claim-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 1px; color: #6F6B63; }
.evidence-claim-text { color: #252421; }
.evidence-rows { display: block; }
.evidence-row { display: block; padding: 7px 0; }
.evidence-label { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #6F6B63; margin-bottom: 4px; }
.evidence-value { display: block; font-size: 16px; line-height: 1.7; color: #252421; }
.evidence-prose { font-size: 16px; line-height: 1.8; color: #252421; }
.evidence-fields { display: block; margin-top: 10px; }
.evidence-field { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 0.5px; color: #6F6B63; line-height: 1.7; }

/* ── JUDGMENT（PAUSE：单条 top 墨线；红 label 表示"这是明确裁决"；非警报） ── */

.sblock-judgment { margin: 48px 0; padding: 30px 8px 22px; border-top: 1px solid #252421; text-align: center; }
.sblock-judgment .sblock-label { margin-bottom: 14px; color: #D4473F; }
.sblock-judgment .sblock-body { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 21px; line-height: 1.7; font-weight: 500; }
.sblock-judgment .judgment-author { margin-top: 18px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 2px; color: #6F6B63; }
.sblock-judgment .judgment-uncertainty { margin-top: 14px; font-size: 14px; line-height: 1.7; color: #6F6B63; }
.sblock-judgment .judgment-anchor { margin-top: 10px; font-size: 12px; color: #B4B0A6; }

/* ── LAB NOTE（ANNOTATION：中性浅底 + 灰左边线；不占用红蓝主色） ── */

.sblock-lab-note { margin: 34px 0; font-size: 13px; line-height: 1.75; color: #6F6B63; background: #F4F1EB; border-left: 2px solid #D8D1C6; padding: 12px 14px; }
.sblock-lab-note .sblock-label { margin-bottom: 8px; color: #B4B0A6; }
.sblock-lab-note .lab-stats-flat { margin-bottom: 6px; }
.sblock-lab-note .lab-note-line { color: #6F6B63; }

/* ── METRIC（数字 ink，≤44px；label 蓝；negative 才红且伴随文本标签） ── */

.sblock-metric { text-align: center; margin: 32px 0; }
.metric-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #2F5FD7; margin-bottom: 14px; }
/* V0.2.3 H01：<p> + 固定 44px + weight 600 + margin 10px 0，无 line-height 覆盖。
   特异性：.sblock-metric .metric-value（0,2,0）须压过 .article p（0,1,1）。 */
.sblock-metric .metric-value { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-weight: 600; margin: 10px 0; color: #252421; }
.sblock-metric .metric-value-negative { color: #D4473F; }
.sblock-metric[data-salience='inspection_specimen'] .metric-value { font-size: 44px; }
.sblock-metric[data-salience='reported_result'] .metric-value { font-size: 22px; }
.sblock-metric[data-salience='contextual_reference'] .metric-value { font-size: 19px; }
.sblock-metric[data-salience='inspection_specimen'] .metric-cover { margin-top: 18px; padding-top: 14px; border-top: 1px solid #C7C0B4; }
.metric-cover-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #252421; }
.metric-cover-question { margin-top: 8px; font-size: 16px; line-height: 1.7; color: #252421; }
.metric-meta, .metric-provenance { margin-top: 10px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 0.5px; color: #6F6B63; line-height: 1.7; }

/* ── 降级（结构无效关系不镀金） ── */

.sblock-degraded .evidence-claim-text { color: #6F6B63; }
.degraded-note { margin-top: 8px; font-size: 12px; color: #B4B0A6; }

/* ── masthead / footer（V0.3 封面开版；固定 px） ── */

.masthead { padding-bottom: 20px; margin-bottom: 42px; border-bottom: 1px solid #252421; }
.masthead-brand { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #252421; }
.masthead-brand .dot { color: #2F5FD7; }
.masthead-series { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #6F6B63; margin-top: 22px; }
.masthead-title { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 30px; line-height: 1.35; margin: 14px 0 0; font-weight: 500; overflow-wrap: break-word; color: #252421; }
.masthead-deck { font-size: 16px; color: #6F6B63; line-height: 1.7; margin-top: 16px; }
.masthead-date { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 2px; color: #6F6B63; margin-top: 22px; }
.masthead-simple { padding-bottom: 20px; margin-bottom: 42px; border-bottom: 1px solid #252421; }
.article-footer { margin-top: 48px; padding-top: 28px; border-top: 1px solid #252421; }
.footer-brand { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #6F6B63; }
.footer-tagline { margin-top: 12px; font-size: 15px; color: #6F6B63; line-height: 1.7; }
.next-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #6F6B63; }
.next-title { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 19px; line-height: 1.55; margin-top: 8px; color: #252421; }
`
