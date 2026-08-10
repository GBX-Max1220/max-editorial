---
issue: 001
series: JUDGMENT
title: 我本来只是想检查 AI 的健身建议，最后发现问题根本不在健身
date: 2026-08
mode: editorial
tagline: AI 越来越能干以后，人该如何判断？
next:
  title: AI 说自己“90% 确定”，到底是什么意思？
---

我买了一个便宜的运动手环，顺手让健身 App 帮我生成每周计划。App 说我的有氧能力“处于平均水平”，并且“建议每周三次、每次恰好 43 分钟的中等强度训练”。

我一开始只是想确认一件事：这个 43 分钟，到底是科学，还是随口一说？这个问题指向一个更宽的判断：**当 AI 给出一个精确数字，用户有没有途径知道它的依据、误差和边界。**

:::claim id="claim-precision"
AI 输出的精确数字，没有携带足够的依据、误差与边界信息。
:::

先放下手环，回到那个更基本的问题：

:::question id="q-90-confidence"
AI 说自己 90% 确定，
到底是什么意思？
:::

## 一个数字，两种含义

区别在 **点估计** 和 **区间估计**。手环只给了我一个点——43 分钟。它没有告诉我误差范围，没有告诉我置信区间，也没有告诉我这个数字是在什么人群、什么数据上算出来的。

同样的数据集，换一个模型再问一遍，它回答得很干脆：

:::ai-output source="健身 App 内置 AI 助手 · 2026-08 输出" status="raw" id="ai-output-1"
“建议每天恰好进行 43 分钟训练。”

Confidence: 90%
:::

这是我截取的原始输出。Confidence 这个数字是模型声称的置信度，不是对“训练 43 分钟有效”这一结论的保证——这两种不确定性不是一回事。

这正是需要被单独拉出来检查的东西：

:::metric value="43" unit="分钟" label="MINUTES · EXACTLY?" origin="model_output" display_function="inspection_specimen" specimen_source="上述 AI 输出的原文" inspection_question="这个 43 分钟，到底是科学，还是随口一说？" exact_value_visible="true" source="健身 App 内置 AI 助手" method="单次对话输出" boundary="仅限该次输出；不含置信区间" relates_to="claim-precision" id="metric-43"
:::

用一套证据标准来看，什么被支持了，什么没有被支持：

:::evidence id="ev-3060" supports="claim-precision" supports_hash="0b7dbde3" source="运动科学文献综述（示例）" evidence_strength="40 例系统评估（示例）" boundary="支持到“范围”，不支持“精确点值”"
SUPPORTED
30–60 分钟，中等强度，每周 3–5 次

NOT SUPPORTED
恰好 43 分钟；对个体给出置信度
:::

当然，要公平一点——最强的反方是这样说的：

:::counterpoint id="cp-precision" challenges="claim-precision" challenges_hash="0b7dbde3"
精确表达并不必然意味着误导。
在医疗和工程场景里，精确是有价值的。
:::

材料齐了，这是一个值得停一下的判断：

:::judgment id="jud-precision" relates_to="claim-precision" anchor="ev-3060,cp-precision" uncertainty="这是关于“呈现方式”的判断，不是关于“训练时长”的科学结论。"
一个数字可以算得没错，
但仍然没有资格精确到那个程度。
:::

## 系统评估，不是人类研究

随后我把这套材料整理成一个小的评估集，跑了一轮系统测试：

:::lab-note title="CHECKMYCOACH" id="lab-checkmycoach"
40 cases
15 routed
12 passed

System evaluation.
Not a human study.
:::

这里的数字来自机器评估流程。你不能从“12 例通过”推出“真人用户也会这样判断”——这是两类完全不同的证据。

## 我看到的问题

跑完这轮测试，问题变得清楚：这不是健身建议准不准，而是呈现方式。校准研究早已发现：

> 人们会对“表述自信”做出系统性反应，即使这种自信没有任何依据。
> —— 认知心理学研究综述（示例来源）

这个问题并不新。**Calibration** 研究很早就发现，人们会对表述自信做出系统性反应。误差范围这种东西，英文里叫 margin of error，而在健身 App 里它完全缺席。

一个点估计至少应该带上三样东西：

- 依据：这个数字从哪里来（人群、数据、模型）
- 误差：可能的范围有多大
- 边界：它适用于谁、不适用于谁

把范围拉回这件事本身：

1. 精确 ≠ 准确。
2. 准确 ≠ 可验证。
3. 可验证 ≠ 用户能判断。

误差范围在实现里通常长这样（示意代码，不是真实 API）：

```python
# 点估计 vs 区间估计
plan = suggest(duration=43, bounds=[30, 60])
```

| 维度 | 结果 |
| --- | --- |
| 校准度 | 需要改进 |
| 置信度 | 90%（未校准） |
| 误差信息 | 缺失 |

点估计与区间估计的区别，可以用一张图说清：

![点估计与区间估计示意](data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='480'%20height='80'%3E%3Crect%20x='60'%20y='30'%20width='300'%20height='14'%20fill='%23c6c4ba'/%3E%3Ccircle%20cx='120'%20cy='37'%20r='9'%20fill='%23171612'/%3E%3C/svg%3E "43 分钟是点估计，不是区间")

这就是一篇文章的起点。[回到问题本身](https://example.com/start) 再想一想，下一期，我会写 AI 的置信度到底有没有意义。
