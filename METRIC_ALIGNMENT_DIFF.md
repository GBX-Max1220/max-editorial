# METRIC_ALIGNMENT_DIFF — 生产 specimen vs H01 探针

> 基于真实编译产物（`compileForWechat(examples/issue-001.md)` 的 specimen section）与 typography 探针 H01 逐属性对比。不猜测。

## 生产 specimen 编译产物（现状）

```html
<section class="sblock sblock-metric" data-salience="inspection_specimen" style="text-align:center;margin:32px 0;">
  <div class="metric-label" style="mono 11px;letter-spacing:3px;color:#7c7a72;margin-bottom:14px;">MINUTES · EXACTLY?</div>
  <div class="metric-value" style="serif;font-weight:600;line-height:1.1;color:#171612;font-size:44px;">43</div>
  <div class="metric-cover" style="margin-top:18px;padding-top:14px;border-top:1px solid #c6c4ba;">
    <div class="metric-cover-label" style="mono 11px;letter-spacing:2px;color:#171612;">被检查对象 · 非结论</div>
    <div class="metric-cover-question" style="margin-top:8px;font-size:16px;line-height:1.7;">这个 43 分钟…？</div>
  </div>
  <div class="metric-provenance" style="mono 12px;color:#7c7a72;line-height:1.7;">模型输出 · 来源：… · 方法：… · 边界：…</div>
</section>
```

## H01 探针（生产赢家）

```html
<div style="text-align:center;padding:24px 0;">
  <div style="font-size:12px;letter-spacing:2px;color:#7c7a72;">MINUTES · EXACTLY?</div>
  <p style="font-size:44px;font-weight:600;margin:10px 0;">43</p>
  <div style="font-size:13px;color:#7c7a72;">被检查对象 · 非结论</div>
</div>
```

## 差异表

| Property | Production Metric | H01 Probe | Difference | Action |
|---|---|---|---|---|
| 数字 tag | `<div class="metric-value">` | `<p>` | **tag 不同** | 改为 `<p>` |
| 数字 font-size | 44px（data-salience 派生，内联） | 44px（直接内联） | 同值 | 保持 44px |
| 数字 font-weight | 600 | 600 | 同 | 保持 |
| 数字 line-height | 1.1（显式） | 继承（≈1.8） | **不同** | 移除显式 line-height（对齐 H01） |
| 数字 margin | 无（0） | `10px 0` | **不同** | 加 `margin:10px 0` |
| 数字 font-family | serif | 继承 sans | 不同 | 保留 serif（设计身份；探针 G 未判定 serif 失败，非结构对齐项） |
| wrapper | section + data-salience + margin:32px 0 | div + padding:24px 0 | 间距模型不同 | 保留 section 容器（语义块语法）；只对齐数字行 |
| label | mono 11px · ls 3px | 12px · ls 2px | 微差 | 保留（设计） |
| qualifier（被检查对象） | cover-label mono 11px | 13px | 微差 | 保留 |
| 数字下方行数 | cover(label+question) + provenance = 3 行 | qualifier = 1 行 | 生产多 question+provenance（认识论必需） | 保留（任务要求形状含它们） |
| data-salience 属性 | 有 | 无 | 外观 | 保留（驱动 font-size） |
| 嵌套 | section > div + div(cover>div+div) + div | div > div + p + div | 生产嵌套略深 | 数字行变 `<p>` 后与 H01 同深；cover/provenance 是认识论必需，保留 |

## 结论

生产 specimen 的数字行是唯一**结构上**偏离 H01 的部分：`<div>` + `line-height:1.1` + 无 margin。
对齐 = 数字行改为 H01 的 `<p style="font-size:44px;font-weight:600;margin:10px 0;">` 模式（无 line-height 覆盖）。
其余层（label / cover 被检查对象+问题 / provenance）已是任务要求的 5 层形状，无需简化。
