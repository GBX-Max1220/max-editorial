---
issue: 003
series: JUDGMENT
title: AI 说自己 90% 确定，这个数字到底意味着什么？
date: 2026-08
mode: editorial
tagline: 一个置信度，值得一个审慎的读法：它既不是概率保证，也不是准确性。
next:
  title: 当机器说"我很有把握"，它到底在说谁的把握？
---

一个健身助手告诉我，它对某项建议有 90% 的把握。我不太确定该高兴，还是该警惕。

这里的 90%，像一句**言之凿凿的承诺**。可一旦追问——这个数字怎么来的、覆盖哪些情况、误差有多大——回答常常变回一段*通用说明文字*。[置信度的完整讨论](https://example.com/calibration) 可以从一个更安静的问题开始：一个普通读者，能不能从界面上看出这个 90% 到底指什么。

## 置信度不是承诺

一个数字说 90%，听起来像十次里九次对。但模型说的置信度，是对它自己内部状态的一种声明——不是对世界客观事件的频率统计，也不等于一个普通人读这句话时理解的那种"九成把握"。两者被同一个数字包装，却是两件事。

### 三种容易混淆的意思

第一种，模型对自身参数确定程度的估计；第二种，历史评测里这类样本的命中率；第三种，你在心里把它当成"这个判断大概率成立"。同一个 90%，三种读法，对应三种不同的信任行为。

#### 为什么区分很重要

因为信任行为取决于读法。若把第一种当成第三种，就会把一次对话里的个别判断，当成长期稳定的可靠结论——这正是校准问题最初被注意到的原因。

##### 第五层：示例小标题

这一段用来验证 H5 的样式：字号更小、使用 muted 墨色，作为更低层级的段内标签，不与正文混淆。

###### 第六层：最低标签

H6 使用 mono 小字号，用于最细粒度的段落内标签，视觉重量最低。

## 两种 90%，别混为一谈

先把它说的原话摆出来，再问它的边界。

:::question id="q-90"
这个 90%，到底是模型对自身的把握，
还是对你的建议成立的概率？
:::

:::ai-output source="健身助手 · 2026-08 单次对话输出" status="raw" id="ai-output-90"
"我对该建议有 90% 的把握。"

Confidence: 90%
:::

用一套证据标准来看，什么被支持了，什么没有被支持：

:::metric value="90%" label="CONFIDENCE · AI CLAIMED" origin="model_output" display_function="inspection_specimen" specimen_source="健身助手原文" inspection_question="这个 90% 是模型的把握，还是建议成立的概率？" exact_value_visible="true" source="健身助手" method="单次对话输出" boundary="不含置信区间与评测口径" relates_to="claim-confidence" id="metric-90"
:::

:::claim id="claim-confidence"
90% 的置信度常常被当成确定性来消费，但它既不是概率保证，也不是准确性。
:::

### 证据与反方的对照

:::evidence id="ev-90" supports="claim-confidence" source="校准研究综述（示例）" evidence_strength="40 例系统评估（示例）" boundary="支持“置信度不等于确定性”的表述，不支持任何具体产品的具体数值" label="观点 A"
高置信度意味着模型更可靠。
:::

:::counterpoint id="cp-90" challenges="claim-confidence" label="观点 B"
置信度可能只是表达风格，不等于校准。
:::

### 数据的红蓝对照

:::claim id="claim-calibration"
置信度自报并不自动等于校准。
:::

:::evidence label="数据 A" supports="claim-calibration" source="示例评测集"
准确率 90%
:::

:::counterpoint label="数据 B" challenges="claim-calibration" source="示例高风险集"
高置信错误率 18%
:::

材料齐了，这是一个值得停一下的判断：

:::judgment id="jud-90" relates_to="claim-confidence" anchor="ev-90,cp-90" uncertainty="这是关于“呈现与读取方式”的判断，不是关于任何具体 AI 能力的结论。"
数字没有错，
错的是把它当成全部。
:::

## 检查，而不是相信

我自己有一个很简单的检查顺序，也适合你下次遇到一个精确数字时照着做：

1. 先记下它说了什么，不急着解释。
2. 再问它有没有带误差、边界或评测口径。
3. 最后问：一个普通读者，能不能从界面上看出前两步的答案。

跑完一轮之后，一个 90% 通常缺三样东西：

- 依据：这个数字是从什么数据、什么场景里来的
- 边界：它适用于谁，不适用于谁
- 口径：它指的到底是置信度、准确率，还是别的什么

### 一份检查清单

- [x] 记录原始输出
- [x] 追问误差与边界
- [ ] 确认口径
- [ ] 向读者交代局限

### 缺失来源的引用

> 精确的表达会让它显得比实际知道的多。

### 带来源的引用

> 人们会对表述自信做出系统性反应，即使这种自信没有任何依据。
> —— 认知心理学研究综述（示例来源）

:::lab-note title="CHECK" id="lab-check"
3 readings
2 boundaries
0 intervals

This is a reading checklist.
Not a model benchmark.
:::

## 排版验证：长内容

一个非常长的英文单词 antidisestablishmentarianism 通常会考验断行；一段中英混排 Technology is the answer, but what was the question? 中文与英文夹杂在同一个句子里，需要自然换行与合理字距。连续数字 12345678901234567890 不能被截断，也不能撑破文章宽度。

超长 URL 也会造成溢出风险：https://example.com/very/long/path/that/should/wrap/gracefully/without/breaking/the/whole/layout/on/a/390px/mobile/screen

### 表格

| 维度 | 输出呈现 | 携带的信息 |
| --- | --- | --- |
| 校准度 | 未显示 | 无 |
| 置信度 | 90% | 一个数字，无解释 |
| 误差信息 | 缺失 | 无 |

### 代码

行内代码 `point estimate` 表示点估计；区间估计是 `interval estimate`。

```python
# 点估计 vs 区间估计（示意，非真实 API）
plan = suggest(duration=43, bounds=[30, 60])
```

### 图片

![校准示意](https://example.com/calibration-chart.png "校准曲线示意：置信度与准确率")

### 脚注

这一句带一个脚注[^1]，用于验证脚注在微信产物中的呈现。

[^1]: 脚注正文使用 muted ink，与正文区分。

### 特殊字符

公式、负数 -42、百分比 12.5%、中文引号“”、英文引号"、"、破折号 —— 都应正常排版。行内删除线 ~~被划掉的文字~~ 与 **加粗** 与 *斜体* 并存。

### 负向风险指标

:::metric value="-18%" label="高置信错误率" origin="external_source" display_function="reported_result" negative="true" source="示例高风险集" id="metric-risk"
:::

回到那个健身助手。如果我把它的话拆开，会发现它其实在说三件不同的事：它对参数很确定，它在历史样本上表现稳定，以及它建议我把这两件事当作"这个计划大概率适合我"来接受。把三者合并成一个"90%"，省略的不只是误差，还有责任——谁在承担把这个数字变成行动的判断。

这篇文章本身就是一次检查练习。[回到开头那个问题](https://example.com/start) 再读一遍：下一次收到一个精确数字，先问它的依据、误差和边界，再决定要不要相信。

注：本文用于排版与阅读节奏测试，内容为示例材料，不构成研究结论。
来源：示例材料 · 2026-08 · 视觉测试专用。
