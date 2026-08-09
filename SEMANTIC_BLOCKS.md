# SEMANTIC BLOCKS — 写法与视觉规则

七个扩展块。语法：`:::type [key="value"]` 围栏，用 `:::` 闭合。

解析器在 `src/markdown/parser.ts`，视觉组件在 `src/render/blocks.tsx`，剪贴板 HTML 在 `src/render/clipboard.ts`。共享解析逻辑（evidence 行、lab-note 数字行）在 `src/render/parseHelpers.ts`，React 预览与微信富文本共用，不会漂移。

---

## 1. question — 让问题自己说话

```markdown
:::question
AI 说自己 90% 确定，
到底是什么意思？
:::
```

**规则**：大量留白，仅顶部一根发丝线，无边框。重点是问题本身——21px、宽松行高。

## 2. ai-output — raw observation / terminal excerpt

```markdown
:::ai-output
“建议每天恰好进行 43 分钟训练。”
:::
```

**规则**：等宽字体，弱底色 + 发丝边框，`pre-wrap` 保留换行。**不要做成聊天气泡**，不要加 AI 头像或 robot 图标。

## 3. judgment — 品牌块

```markdown
:::judgment
一个数字可以算得没错，
但仍然没有资格精确到那个程度。
:::
```

**规则**：最有辨识度的块。用排版而不是背景色：居中、宋体大字、上下两条墨色发丝线、上方克制 label。**不要蓝色大卡片。**

## 4. evidence — research annotation

```markdown
:::evidence
SUPPORTED
30–60 min

NOT SUPPORTED
exactly 43 min
:::
```

**规则**：全大写行 = label，其余行 = 数据。等宽数据、右侧对齐、行间发丝线。像研究注释，不像营销表格。

## 5. counterpoint — 反方不是错误

```markdown
:::counterpoint
精确表达并不必然意味着误导。
:::
```

**规则**：**视觉中立**。正文同色墨字，只有顶部一根发丝线。不用红色、不用 warning icon、不用 danger 样式。

## 6. lab-note — 数据化 layout

```markdown
:::lab-note title="CHECKMYCOACH"
40 cases
15 routed
12 passed

System evaluation.
Not a human study.
:::
```

**规则**：`title=` 进 label。以数字开头的行 → stat（等宽数字 + label 网格），其余行 → note 弱化文字。

## 7. metric — 文章 visual break

```markdown
:::metric value="43" label="MINUTES · EXACTLY?"
:::
```

**规则**：超大数字（宋体、`clamp` 到约 50–72px）+ 字距 label。正文中间的呼吸点：

```
43        MINUTES · EXACTLY?
90%       CONFIDENCE
50        FILES
```

---

## 渲染行为

- **NORMAL 模式**：judgment 降到 18px、metric 内边距减半、块间距 × 0.7——同系统，更紧凑。
- **微信剪贴板**：每个块有对应的 inline-style HTML 变体（复制时保留 label 与结构）。
- **未知 / 未闭合块**：渲染为虚线框 + `UNKNOWN · type` 标签，CHECK 会报 FAIL。
