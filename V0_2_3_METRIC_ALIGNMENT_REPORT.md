# V0_2_3_METRIC_ALIGNMENT_REPORT

> 生产对齐补丁：METRIC specimen 对齐 H01 探针（已验证生产赢家）。不改设计、不重开认知 spec、不新建 spike。

## 1. Starting Branch / Commit

| 项 | 值 |
|---|---|
| Branch | `fix/v02-3-metric-alignment`（自 `feat/wechat-target-compiler` 创建） |
| Starting commit | `076c4be`（V0.2.2 编译器 checkpoint，工作树干净） |
| 未动 | `main`、`feat/cognitive-editorial-v02`、`feat/wechat-target-compiler` |

## 2. Probe Verdict（来自真实微信排版探针）

- **H01 · M1 · P+44PX = SUCCESS**（生产赢家）
- H02 · 嵌套 span = 对 H01 无优势
- H03 · heading-based = 对 H01 无优势
- H04 · 保守层级（rule+weight+适中字号）= 对主要生产 metric 太弱

**解释**：微信允许放大的 metric 数字；不需要嵌套 span、不需要 heading 技巧、不需要巨大字号的降级。用最简块流 primitive 匹配成功探针。

## 3. Production vs H01 Diff（详见 `METRIC_ALIGNMENT_DIFF.md`）

关键差异（生产 specimen 数字行）：

| Property | Production（前） | H01 | 差异 | 动作 |
|---|---|---|---|---|
| 数字 tag | `<div class="metric-value">` | `<p>` | **tag 不同** | 改 `<p>` |
| 数字 line-height | 1.1（显式） | 继承（≈1.8） | **不同** | 移除显式 line-height |
| 数字 margin | 无 | `10px 0` | **不同** | 加 `margin:10px 0` |
| 数字 font-size | 44px（data-salience 派生） | 44px（直接） | 同值 | 保持 |
| 数字 font-weight | 600 | 600 | 同 | 保持 |
| 数字 font-family | serif | 继承 sans | 不同 | 保留 serif（设计身份；探针 G 未判 serif 失败，非结构对齐项） |

其余层（label / cover 被检查对象+问题 / provenance）已是任务要求的 5 层形状，未简化（认识论必需）。

## 4. Exact Code Changes

| 文件 | 变更 |
|---|---|
| `src/engine/shared/semanticHtml.ts` | `renderMetric`：数字行 `<div class="metric-value">` → `<p class="metric-value">`（所有 metric role 一致的小重构，保证编译器一致） |
| `src/engine/wechat/safeCss.ts` | `.metric-value` → `.sblock-metric .metric-value`（特异性 0,2,0 压过 `.article p` 的 0,1,1），移除 `line-height:1.1`，加 `margin:10px 0`——对齐 H01 |
| `src/styles/article.css` | `.metric-value` 加 `margin:0`（value 变 `<p>` 后覆盖 `.article p` 段距，避免浏览器布局回归） |
| 测试 | `metric.test.ts` / `v02-render.test.ts` 断言更新（div→p）；`compiler.test.ts` +2（H01 模式、无 heading/span） |

## 5. Final Specimen Metric Structure

编译产物（对齐 H01）：

```html
<section class="sblock sblock-metric" data-salience="inspection_specimen" style="text-align:center;margin:32px 0;">
  <div class="metric-label" style="mono 11px;letter-spacing:3px;color:#7c7a72;margin-bottom:14px;">MINUTES · EXACTLY?</div>
  <p class="metric-value" style="font-family:serif;font-weight:600;margin:10px 0;color:#171612;font-size:44px;">43</p>
  <div class="metric-cover" style="margin-top:18px;padding-top:14px;border-top:1px solid #c6c4ba;">
    <div class="metric-cover-label" style="mono 11px;letter-spacing:2px;color:#171612;">被检查对象 · 非结论</div>
    <div class="metric-cover-question" style="margin-top:8px;font-size:16px;line-height:1.7;">这个 43 分钟…？</div>
  </div>
  <div class="metric-provenance" style="mono 12px;color:#7c7a72;">模型输出 · 来源：… · 方法：… · 边界：…</div>
</section>
```

**数字行 = H01 模式**：`<p>` + 固定 44px + font-weight 600 + `margin:10px 0` + 无 line-height 覆盖。无 flex/gap/clamp/vw/heading/嵌套 span。

## 6. Forbidden Primitive Check

`checkWechatPolicy` 对全部 V0.2.3 artifact 返回 0 error。fixture 编译产物仍为纯 inline style：flex/gap/clamp/vw/@media/nowrap 计数 0。

## 7. Tests / Build

- **167 tests 全绿**（+2 V0.2.3 对齐测试；2 个既有 metric 断言更新 div→p）。
- `tsc --noEmit` ✓；`vite build` ✓。
- 不声称测试验证真实微信——验证与已验证成功探针 H01 模式的本地对齐。

## 8. Manual WeChat Acceptance Instructions（必须执行）

1. `npm run dev`（分支 `fix/v02-3-metric-alignment`）。
2. 打开 Issue 001 → 预览切 **WECHAT**（显示编译产物）。
3. 目视确认 specimen metric 数字行符合 H01 赢家模式（大数字，显著大于正文）。
4. **COPY → WECHAT**。
5. 粘贴进空公众号图文（不手动重排）。
6. **截图 metric 区域**。

**成功标准**：生产 Issue 001 的 metric specimen 在真实微信中视觉接近 H01 探针（44px 数字明显放大）。
对照：`artifacts/metric-h01-aligned-snippet.html`（生产 specimen 对齐片段）。

## STOP 条件核对

- [x] 生产 specimen 对齐 H01（数字行 `<p>` + 44px + weight 600 + margin 10px 0）
- [x] 禁止 primitive 保持缺席（policy 0 error）
- [x] 微信预览用对齐后的编译产物（PreviewPane 渲染 compiledHtml）
- [x] 剪贴板用同一产物（copyToWechat → compileForWechat）
- [x] artifacts 已更新（issue-001-wechat-target / six-block 重新生成 + metric-h01-aligned-snippet 新建）
- [x] 测试（167）/ tsc / build 通过
- [x] 报告存在
- [x] 手动验收指令已含

**下一步 = 真实微信粘贴测试。** 未开始 V0.3，未重开任何设计，未 merge main。
