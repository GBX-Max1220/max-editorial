---
series: FIXTURE
issue: 42
title: 微信复制兼容性验证样张
date: 2026-08
tagline: 用于验证 COPY → WECHAT 管线的确定性样张
---

# 一级标题（H1 验证）

## 二级标题（H2 自动编号验证）

普通段落包含 **加粗**、*斜体*、`行内代码` 与 [外部链接](https://example.com/wechat-copy)。

> 引用块：微信目标应保留引用样式。

无序列表：
- 第一项
- 第二项

有序列表：
1. 序号一
2. 序号二

---

:::metric value="44" origin="model_output" display_function="inspection_specimen" specimen_source="管线样张的 AI 输出原文" inspection_question="这个 44 是否为精确标本？" exact_value_visible="true" source="管线样张" method="fixture" boundary="仅限样张" label="METRIC LABEL" id="m1"
:::

:::judgment id="j1" author="Max"
管线样张判断：复制管线必须保留该语义块的独立呈现。
:::
