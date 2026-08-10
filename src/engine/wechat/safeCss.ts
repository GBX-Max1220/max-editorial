/**
 * 微信目标编译器的 SAFE CSS profile（WECHAT_SAFE_PROFILE_V1 的实现）。
 *
 * 约束（静态检查器 policyCheck 会核对产物）：
 *  - 只用 SAFE / SAFE_WITH_CONSTRAINT primitives：normal block flow、固定 px、
 *    margin/padding、border-top/left/bottom、简单 background、text-align、letter-spacing、font-weight。
 *  - 禁止：display:flex / flex-direction / flex-wrap / gap / align-items / justify-content /
 *    clamp( / vw / @media / white-space:nowrap / var(--x)。
 *  - 换行依赖渲染器已产出的 <br/>，不依赖 white-space:pre-wrap。
 *  - 所有值固定 px（见 WECHAT_TARGET_TOKENS_V1.md），无 em 相对依赖。
 */

export const WECHAT_SAFE_CSS = `
.wechat-article {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  color: #171612;
  font-size: 16px;
  line-height: 1.8;
  overflow-wrap: break-word;
}

/* ── Base Markdown（§12 语义保持，primitive 块流化） ── */

.article h1 { font-size: 30px; font-weight: 600; line-height: 1.4; margin: 34px 0 12px; }
.article h2 { font-size: 24px; font-weight: 600; line-height: 1.4; margin: 34px 0 12px; }
.article h3 { font-size: 19px; font-weight: 600; line-height: 1.4; margin: 28px 0 10px; }
.article p { margin: 0 0 18px; }
.article strong { font-weight: 600; }
.article em { font-style: italic; }
.article code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 14px; background: #f5f4ef; border: 1px solid #e2e0d8; padding: 2px 5px; border-radius: 2px; }
.article a { color: #576b95; text-decoration: none; }
.article blockquote { border-left: 2px solid #c6c4ba; padding-left: 16px; color: #7c7a72; font-size: 15px; margin: 24px 0; }
.article ul, .article ol { padding-left: 24px; margin: 0 0 18px; }
.article li { margin-bottom: 6px; }
.article pre { background: #f5f4ef; border: 1px solid #e2e0d8; padding: 14px 16px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 14px; line-height: 1.7; }
.article pre code { border: none; background: none; padding: 0; }
.article hr { border: none; border-top: 1px solid #c6c4ba; margin: 30px 0; }
.article img { max-width: 100%; height: auto; display: block; margin: 18px auto; }
.article .figure { margin: 18px auto; }
.article .figure img { margin: 0 auto; }
.article .figure-caption { font-size: 13px; color: #7c7a72; text-align: center; margin-top: 6px; }
.article table { width: 100%; border-collapse: collapse; font-size: 14px; border-top: 1px solid #c6c4ba; border-bottom: 1px solid #c6c4ba; margin: 24px 0; }
.article th, .article td { padding: 8px 10px; text-align: left; vertical-align: top; }
.article th { font-weight: 600; border-bottom: 1px solid #e2e0d8; }
.article tr + tr td { border-top: 1px solid #e2e0d8; }
.article .table-wrap { overflow-x: auto; }

/* ── Label 系统（§9.4 语义；固定字距） ── */

.sblock-label {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #7c7a72;
  margin-bottom: 10px;
}
.sblock-body { color: #171612; }

/* ── 元数据（块行 + 自然换行；禁 nowrap） ── */

.sblock-meta { display: block; margin-top: 12px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; letter-spacing: 0.5px; color: #7c7a72; line-height: 1.7; }
.meta-source, .meta-status { display: block; }

/* ── QUESTION（§13.1 左对齐 + 底部发丝线） ── */

.sblock-question { margin: 24px 0; padding: 4px 0 14px; border-bottom: 1px solid #e2e0d8; }
.sblock-question .sblock-body { font-size: 19px; line-height: 1.7; }
.sblock-question-major { text-align: center; padding: 40px 8px; border-top: 1px solid #171612; border-bottom: 1px solid #171612; }
.sblock-question-major .sblock-body { font-size: 23px; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; }

/* ── AI OUTPUT（§13.2 引用条 + 元数据块行；换行靠 <br/>） ── */

.sblock-ai-output { margin: 24px 0; border-left: 3px solid #c6c4ba; padding-left: 16px; }
.sblock-ai-output .sblock-label { margin-bottom: 8px; }
.sblock-ai-output .sblock-body { font-size: 15px; line-height: 1.75; color: #3b3a36; }

/* ── EVIDENCE ↔ COUNTERPOINT（§13.5 parity：同一容器同一排版；垂直块流） ── */

.sblock-evidence, .sblock-counterpoint { margin: 24px 0; padding: 14px 0 4px; border-top: 1px solid #e2e0d8; }
.sblock-evidence .sblock-body, .sblock-counterpoint .sblock-body { font-size: 16px; line-height: 1.8; }
.evidence-claim { display: block; margin-bottom: 12px; }
.evidence-claim-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 1px; color: #7c7a72; }
.evidence-claim-text { color: #171612; }
.evidence-rows { display: block; }
.evidence-row { display: block; padding: 7px 0; }
.evidence-label { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #7c7a72; margin-bottom: 4px; }
.evidence-value { display: block; font-size: 16px; line-height: 1.7; color: #171612; }
.evidence-prose { font-size: 16px; line-height: 1.8; color: #171612; }
.evidence-fields { display: block; margin-top: 10px; }
.evidence-field { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 0.5px; color: #7c7a72; line-height: 1.7; }

/* ── JUDGMENT（§13.3 PAUSE：单条 top 墨线，V0.2.1 决定保留；块流 + 固定字号） ── */

.sblock-judgment { margin: 44px 0; padding: 30px 8px 22px; border-top: 1px solid #171612; text-align: center; }
.sblock-judgment .sblock-label { margin-bottom: 14px; }
.sblock-judgment .sblock-body { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 21px; line-height: 1.7; font-weight: 500; }
.sblock-judgment .judgment-author { margin-top: 18px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 2px; color: #7c7a72; }
.sblock-judgment .judgment-uncertainty { margin-top: 14px; font-size: 14px; line-height: 1.7; color: #7c7a72; }
.sblock-judgment .judgment-anchor { margin-top: 10px; font-size: 12px; color: #b2b0a7; }

/* ── LAB NOTE（§13.6 ANNOTATION：浅底 + 左边线 + 块文本；非 dashboard） ── */

.sblock-lab-note { margin: 24px 0; font-size: 13px; line-height: 1.75; color: #7c7a72; background: #f5f4ef; border-left: 2px solid #e2e0d8; padding: 12px 14px; }
.sblock-lab-note .sblock-label { margin-bottom: 8px; color: #b2b0a7; }
.sblock-lab-note .lab-stats-flat { margin-bottom: 6px; }
.sblock-lab-note .lab-note-line { color: #7c7a72; }

/* ── METRIC（§13.7 固定 px；specimen 大数字，非 clamp/vw） ── */

.sblock-metric { text-align: center; margin: 32px 0; }
.metric-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #7c7a72; margin-bottom: 14px; }
/* V0.2.3：数字行对齐 H01（P + 固定 44px + weight 600 + margin 10px 0，无 line-height 覆盖，继承默认行高）。
   特异性：.sblock-metric .metric-value（0,2,0）须压过 .article p（0,1,1），否则 p 的段距会覆盖 margin。 */
.sblock-metric .metric-value { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-weight: 600; margin: 10px 0; color: #171612; }
.sblock-metric[data-salience='inspection_specimen'] .metric-value { font-size: 44px; }
.sblock-metric[data-salience='reported_result'] .metric-value { font-size: 22px; }
.sblock-metric[data-salience='contextual_reference'] .metric-value { font-size: 19px; }
.sblock-metric[data-salience='inspection_specimen'] .metric-cover { margin-top: 18px; padding-top: 14px; border-top: 1px solid #c6c4ba; }
.metric-cover-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #171612; }
.metric-cover-question { margin-top: 8px; font-size: 16px; line-height: 1.7; color: #171612; }
.metric-meta, .metric-provenance { margin-top: 10px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 0.5px; color: #7c7a72; line-height: 1.7; }

/* ── 降级（§14：结构无效关系不镀金） ── */

.sblock-degraded .evidence-claim-text { color: #7c7a72; }
.degraded-note { margin-top: 8px; font-size: 12px; color: #b2b0a7; }

/* ── masthead / footer（serif 标题保留；固定 px） ── */

.masthead { padding-bottom: 32px; margin-bottom: 32px; border-bottom: 1px solid #e2e0d8; }
.masthead-brand { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #7c7a72; }
.masthead-series { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #b2b0a7; margin-top: 8px; }
.masthead-title { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 28px; line-height: 1.35; margin: 20px 0 10px; font-weight: 600; overflow-wrap: break-word; }
.masthead-date { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; color: #7c7a72; letter-spacing: 1px; }
.article-footer { margin-top: 32px; padding-top: 28px; border-top: 1px solid #e2e0d8; }
.footer-brand { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #b2b0a7; }
.footer-tagline { margin-top: 12px; font-size: 14px; color: #7c7a72; line-height: 1.7; }
.next-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #7c7a72; }
.next-title { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 19px; line-height: 1.55; margin-top: 8px; }
`
