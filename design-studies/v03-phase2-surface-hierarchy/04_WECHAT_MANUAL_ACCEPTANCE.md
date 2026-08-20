# V0.3 Phase 2 — WECHAT MANUAL ACCEPTANCE

> 执行人：Owner。真机验收前，**所有"微信存活"结论都只是推断**。
> 本文件不要预填 PASS。逐项粘贴、逐项记录。
> Provenance：Agent Claude Code · 2026-08-21 · Branch `design/v03-phase2-surface-hierarchy-study` ·
> Starting HEAD `00cbebf224b32f3e754133ab525666d1a20d19ce`。

## 1. 如何启动本地样张

```bash
cd C:\Users\gbx12\projects\max-editorial
node_modules/.bin/esbuild design-studies/v03-phase2-surface-hierarchy/scripts/build-study.ts \
  --bundle --platform=node --format=cjs --outfile=.tmp/build-study.cjs
node .tmp/build-study.cjs
```
浏览器打开 `design-studies/v03-phase2-surface-hierarchy/02_RESTRAINED_HYBRID.html`。

## 2. 如何复制 Restrained Hybrid 到微信

> 注意：样张是静态 HTML，不含 app 的 `COPY → WECHAT` 富文本管线。
> 以下两种方式选一：

**A. 用 app 管线（推荐）**：`npm run dev` → 载入 `fixture-phase2.md` → `COPY → WECHAT`。但 app 当前仍是生产 CSS（无 hybrid token），复制的是生产视觉——**只能验证"复制动作"与"微信渲染基础"，不能验证 hybrid 样式**。

**B. 直接复制样张富文本**：
1. 浏览器打开 `02_RESTRAINED_HYBRID.html`
2. 全选（Ctrl+A）→ 复制（Ctrl+C）——复制的是浏览器选区富文本，会带 hybrid 内联表现
3. 粘贴进公众号编辑器
4. 局限：浏览器复制会把 HTML 重排为它自己的选区格式，**不等于 app 编译产物**。真正的 hybrid 微信验收须待 hybrid 合入生产编译管线后进行。

**诚实边界**：当前阶段 hybrid 的微信验收是**部分可行**（方式 B 粗验 + 方式 A 只验基础）。完整验收需 Phase 2 合入生产。

## 3. 需要截图或观察的位置

- 文章开头（封面区）
- 第一个 H2（编号 + 短线）
- Quote 引用
- Question 块
- AI Output 块
- Evidence 块
- Counterpoint 块
- Lab Note 块
- Metric 块
- Judgment 块
- 正文段落（字号/行距/段距）
- 手机端预览（公众号后台手机模拟）

## 4. 验收清单（粘贴后逐项记录）

| 项目 | PASS / FAIL / UNCERTAIN | 观察记录 |
|---|---|---|
| 整体背景（暖白 #FFFDF8 是否出现） | | |
| H2 边线（teal 短线是否出现；若塌成无短线则记录） | | |
| Quote 左边框（Neutral 2px） | | |
| Question 背景与边框（浅 teal 底 + teal 左线） | | |
| Evidence（teal 左线） | | |
| Counterpoint（陶土左线 + 浅陶土底） | | |
| AI Output（Neutral 左线 + 浅底 + `AI OUTPUT` 标签） | | |
| Lab Note（上下 hairline + 浅底） | | |
| Metric（顶部 teal 细线 + 数字 44px + label） | | |
| Judgment 墨线（居中 ink 顶线 + 署名） | | |
| 字号（标题/正文是否保持，不塌缩到默认） | | |
| 行距（正文 1.85 是否保留） | | |
| 段间距（1.4em 是否保留） | | |

## 5. 若失败，记录以下内容

- 哪个元素失败
- 哪个属性丢失（color / background / border-left / border-top / font-size / margin…）
- 微信中实际表现（变成什么样）
- 是否影响接受（若仅色相/浅底丢失而结构仍在，可能仍可接受）

## 6. 判定

全部关键项 PASS → 回填本文件，并在报告 §19 决策基础上进入生产实施。
任一关键项 FAIL/UNCERTAIN → 记录失败细节，回到报告 §19 决策，调整 hybrid 后再验。
