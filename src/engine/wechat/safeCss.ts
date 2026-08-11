/**
 * 微信目标编译器的 SAFE CSS profile（WECHAT_SAFE_PROFILE_V1 的实现）。
 *
 * V0.3 Phase 1：基础 Markdown + masthead/footer 对齐 V0.3 token（LOCK §6–§17）；
 * 语义块结构沿用 V0.2.2/0.2.3 已验证表达（metric H01 44px 不动），颜色收敛到 V0.3 色板。
 *
 * 约束（静态检查器 policyCheck 会核对产物）：
 *  - 只用 SAFE / SAFE_WITH_CONSTRAINT primitives：normal block flow、固定 px、
 *    margin/padding、border-top/left/bottom、简单 background、text-align、letter-spacing、font-weight。
 *  - 禁止：display:flex / flex-direction / flex-wrap / gap / align-items / justify-content /
 *    clamp( / vw / @media / white-space:nowrap / var(--x)。
 *  - 换行依赖渲染器已产出的 <br/>，不依赖 white-space:pre-wrap。
 *  - 所有值固定 px（无 em 相对依赖）。
 *
 * 分类（WECHAT SAFETY）：
 *  - H2 编号 `<span class="sec-num">01</span>` → 直接微信安全（真实文本）。
 *  - H2 短墨线（浏览器 ::after）→ 编译期展开为真实节点/border（Phase 6 已知映射）；
 *    本阶段微信产物不含该短线，核心身份（编号 + serif 标题）不依赖它。
 *  - 列表浏览器用 CSS 计数器 → 微信保留默认列表标记；显式文本序号属 Phase 6。
 */

export const WECHAT_SAFE_CSS = `
.wechat-article {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  color: #191918;
  font-size: 16px;
  line-height: 1.85;
  overflow-wrap: break-word;
}

/* ── Base Markdown（V0.3：serif 标题 + mono 编号 + 墨线边框，全部固定 px） ── */

.article h1 { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 30px; font-weight: 500; line-height: 1.3; margin: 48px 0 16px; }
.article h2 { margin: 48px 0 0; }
.article h2 .sec-num { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #3157D5; margin-bottom: 12px; }
.article h2 .sec-title { display: block; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 24px; font-weight: 500; line-height: 1.4; color: #191918; margin-bottom: 14px; }
.article h3 { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 20px; font-weight: 500; line-height: 1.45; margin: 36px 0 12px; color: #191918; }
.article p { margin: 0 0 22px; }
.article strong { font-weight: 600; }
.article em { font-style: italic; }
.article code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 14px; background: #EFEEE8; border: 1px solid #D8D4CA; padding: 2px 6px; border-radius: 2px; color: #191918; }
.article a { color: #3157D5; text-decoration: none; border-bottom: 1px solid rgba(49, 87, 213, 0.35); }
.article blockquote { border-left: 1px solid #191918; padding: 4px 0 4px 18px; margin: 38px 0; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 18px; line-height: 1.8; color: #191918; }
.article ul, .article ol { padding-left: 24px; margin: 0 0 24px; }
.article li { margin-bottom: 8px; }
.article pre { background: #EFEEE8; border: 1px solid #D8D4CA; padding: 19px 21px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; line-height: 1.75; color: #191918; }
.article pre code { border: none; background: none; padding: 0; }
.article hr { border: none; border-top: 1px solid #191918; margin: 48px 0; }
.article img { max-width: 100%; height: auto; display: block; margin: 32px auto; }
.article .figure { margin: 40px auto; }
.article .figure img { margin: 0 auto; }
.article .figure .fig-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 2px; color: #6A6862; margin-bottom: 12px; }
.article .figure-caption { font-size: 13px; color: #6A6862; text-align: center; margin-top: 10px; line-height: 1.6; }
.article table { width: 100%; border-collapse: collapse; font-size: 14px; border-top: 1px solid #191918; border-bottom: 1px solid #191918; margin: 34px 0; }
.article th, .article td { padding: 10px 8px; text-align: left; vertical-align: top; font-weight: 400; }
.article th { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 2px; color: #6A6862; border-bottom: 1px solid #D8D4CA; }
.article tr + tr td { border-top: 1px solid #D8D4CA; }
.article .table-wrap { overflow-x: auto; }

/* ── Label 系统（V0.3 次级色；固定字距） ── */

.sblock-label {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #6A6862;
  margin-bottom: 10px;
}
.sblock-body { color: #191918; }

/* ── 元数据（块行 + 自然换行；禁 nowrap） ── */

.sblock-meta { display: block; margin-top: 12px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; letter-spacing: 0.5px; color: #6A6862; line-height: 1.7; }
.meta-source, .meta-status { display: block; }

/* ── QUESTION（§13.1 左对齐 + 底部发丝线） ── */

.sblock-question { margin: 34px 0; padding: 4px 0 14px; border-bottom: 1px solid #D8D4CA; }
.sblock-question .sblock-body { font-size: 19px; line-height: 1.7; }
.sblock-question-major { text-align: center; padding: 48px 8px; border-top: 1px solid #191918; border-bottom: 1px solid #191918; }
.sblock-question-major .sblock-body { font-size: 23px; font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; }

/* ── AI OUTPUT（§13.2 引用条 + 元数据块行；换行靠 <br/>） ── */

.sblock-ai-output { margin: 34px 0; border-left: 3px solid #B7B4AB; padding-left: 16px; }
.sblock-ai-output .sblock-label { margin-bottom: 8px; }
.sblock-ai-output .sblock-body { font-size: 15px; line-height: 1.75; color: #3b3a36; }

/* ── EVIDENCE ↔ COUNTERPOINT（§13.5 parity：同一容器同一排版；垂直块流） ── */

.sblock-evidence, .sblock-counterpoint { margin: 34px 0; padding: 14px 0 4px; border-top: 1px solid #D8D4CA; }
.sblock-evidence .sblock-body, .sblock-counterpoint .sblock-body { font-size: 16px; line-height: 1.8; }
.evidence-claim { display: block; margin-bottom: 12px; }
.evidence-claim-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 1px; color: #6A6862; }
.evidence-claim-text { color: #191918; }
.evidence-rows { display: block; }
.evidence-row { display: block; padding: 7px 0; }
.evidence-label { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #6A6862; margin-bottom: 4px; }
.evidence-value { display: block; font-size: 16px; line-height: 1.7; color: #191918; }
.evidence-prose { font-size: 16px; line-height: 1.8; color: #191918; }
.evidence-fields { display: block; margin-top: 10px; }
.evidence-field { display: block; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 0.5px; color: #6A6862; line-height: 1.7; }

/* ── JUDGMENT（§13.3 PAUSE：单条 top 墨线，V0.2.1 决定保留；块流 + 固定字号） ── */

.sblock-judgment { margin: 48px 0; padding: 30px 8px 22px; border-top: 1px solid #191918; text-align: center; }
.sblock-judgment .sblock-label { margin-bottom: 14px; }
.sblock-judgment .sblock-body { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 21px; line-height: 1.7; font-weight: 500; }
.sblock-judgment .judgment-author { margin-top: 18px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 2px; color: #6A6862; }
.sblock-judgment .judgment-uncertainty { margin-top: 14px; font-size: 14px; line-height: 1.7; color: #6A6862; }
.sblock-judgment .judgment-anchor { margin-top: 10px; font-size: 12px; color: #B7B4AB; }

/* ── LAB NOTE（§13.6 ANNOTATION：浅底 + 左边线 + 块文本；非 dashboard） ── */

.sblock-lab-note { margin: 34px 0; font-size: 13px; line-height: 1.75; color: #6A6862; background: #EFEEE8; border-left: 2px solid #B7B4AB; padding: 12px 14px; }
.sblock-lab-note .sblock-label { margin-bottom: 8px; color: #B7B4AB; }
.sblock-lab-note .lab-stats-flat { margin-bottom: 6px; }
.sblock-lab-note .lab-note-line { color: #6A6862; }

/* ── METRIC（§13.7 固定 px；V0.2.3 H01 模式不动：specimen 44px 已验证上限） ── */

.sblock-metric { text-align: center; margin: 32px 0; }
.metric-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #6A6862; margin-bottom: 14px; }
/* V0.2.3：数字行对齐 H01（P + 固定 44px + weight 600 + margin 10px 0，无 line-height 覆盖，继承默认行高）。
   特异性：.sblock-metric .metric-value（0,2,0）须压过 .article p（0,1,1），否则 p 的段距会覆盖 margin。 */
.sblock-metric .metric-value { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-weight: 600; margin: 10px 0; color: #191918; }
.sblock-metric[data-salience='inspection_specimen'] .metric-value { font-size: 44px; }
.sblock-metric[data-salience='reported_result'] .metric-value { font-size: 22px; }
.sblock-metric[data-salience='contextual_reference'] .metric-value { font-size: 19px; }
.sblock-metric[data-salience='inspection_specimen'] .metric-cover { margin-top: 18px; padding-top: 14px; border-top: 1px solid #B7B4AB; }
.metric-cover-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 2px; color: #191918; }
.metric-cover-question { margin-top: 8px; font-size: 16px; line-height: 1.7; color: #191918; }
.metric-meta, .metric-provenance { margin-top: 10px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 12px; letter-spacing: 0.5px; color: #6A6862; line-height: 1.7; }

/* ── 降级（§14：结构无效关系不镀金） ── */

.sblock-degraded .evidence-claim-text { color: #6A6862; }
.degraded-note { margin-top: 8px; font-size: 12px; color: #B7B4AB; }

/* ── masthead / footer（V0.3 封面开版；固定 px） ── */

.masthead { padding-bottom: 20px; margin-bottom: 42px; border-bottom: 1px solid #191918; }
.masthead-brand { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; letter-spacing: 3px; color: #191918; }
.masthead-brand .dot { color: #3157D5; }
.masthead-series { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #6A6862; margin-top: 22px; }
.masthead-title { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 30px; line-height: 1.35; margin: 14px 0 0; font-weight: 500; overflow-wrap: break-word; }
.masthead-deck { font-size: 16px; color: #6A6862; line-height: 1.7; margin-top: 16px; }
.masthead-date { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 2px; color: #6A6862; margin-top: 22px; }
.masthead-simple { padding-bottom: 20px; margin-bottom: 42px; border-bottom: 1px solid #191918; }
.article-footer { margin-top: 48px; padding-top: 28px; border-top: 1px solid #191918; }
.footer-brand { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #6A6862; }
.footer-tagline { margin-top: 12px; font-size: 15px; color: #6A6862; line-height: 1.7; }
.next-label { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 10px; letter-spacing: 3px; color: #6A6862; }
.next-title { font-family: Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif; font-size: 19px; line-height: 1.55; margin-top: 8px; color: #191918; }
`
