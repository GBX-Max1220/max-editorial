# WECHAT_TARGET_COMPILER_REPORT — V0.2.2

> **Epistemic status：** 目标编译器改善**预期兼容性**。它**不证明**：每种样式在每种微信版本存活、预览精确等于最终移动发布、认知设计目标已被行为验证。**真实微信粘贴验收仍必须。** 设计权威（认知/行为/设计心理学 spec）保持冻结，本任务是渲染策略的 target-dependent 实现。

## 1. Starting State

| 项 | 值 |
|---|---|
| Branch | `feat/wechat-target-compiler`（自 `fix/v02-1-visual-polish` 创建，cherry-pick spike 2 commits） |
| Starting commit | `71c3646`（spike 基线 + V0.2.1；工作树干净） |
| Current commit（报告撰写时） | `71c3646` + 未提交编译器工作 |
| V0.2 基线 | `5b09393`（`feat/cognitive-editorial-v02`，未动） |
| 未动 | `main`、`feat/cognitive-editorial-v02`、`feat/doocs-engine-adapter` |

## 2. Architecture Before

```
Markdown
  → engine.render() → 浏览器类化 HTML（article.css，含 flex/clamp/vw）
  → Article.tsx 注入 .article-body → 浏览器预览（所有 viewport 同构）
  → copyToWechat() → clone 预览 DOM → juice 内联 article.css → 剪贴板
```

问题：预览显示"浏览器理想态"，剪贴板粘贴到微信后 flex/gap/clamp 塌陷——**预览 == pre-paste artifact，但 != post-WeChat artifact**。

## 3. Architecture After

```
Markdown
  → 语义表示（renderDoocsHtml 类化 HTML）
  → compileForWechat()（内联 WECHAT_SAFE_CSS：块流 + 固定 px，0 禁止 primitive）
  → WeChatCompiledArtifact { html, plainText }   ← 单一产物
       ├→ WECHAT/MOBILE 预览（PreviewPane 渲染 compiledHtml）
       └→ COPY → WECHAT（doocs copyToWechat 返回同一 artifact）
  另外：DESKTOP 预览保留浏览器 article（阅读/调试，非微信目标）
```

**P0 满足：微信预览与剪贴板消费同一 WeChatCompiledArtifact**（`compileForWechat(source, {mode})` 单一调用点；`compiler.test.ts` 验证确定性）。

## 4. Forbidden Primitive Removal（前后计数，fixture）

| Primitive | Before（旧剪贴板产物） | After（编译产物） |
|---|---|---|
| `display:flex` | 6 | 0 |
| `gap` | 5 | 0 |
| `clamp()` | 1 | 0 |
| `vw` | 1 | 0 |
| `@media` | 1 | 0 |
| `white-space:nowrap` | 2 | 0 |
| `<style>` 标签 / `var(--)` | 有 | 无 |

产物为**纯 inline-style 自包含 HTML**。静态检查器 `checkWechatPolicy` 以这些为 ERROR 目标；`policyCheck.test.ts` 验证检测 + 产物干净。

## 5. Semantic Component Mapping

| 组件 | 设计意图（冻结） | 旧浏览器 primitive | 新微信安全 primitive |
|---|---|---|---|
| QUESTION | orientation landmark（V0.2.1 无冗余 H2 预告） | 底部 hairline + em 字号 | 块流 + 固定 19px + 底部发丝线 |
| AI OUTPUT | source specimen，引用条 + source/status | border-left + flex meta + gap + nowrap | border-left + 元数据**块行自然换行**（meta-source/status display:block）；换行靠 `<br/>` |
| METRIC | 放大检查对象而非其权威（覆盖标记） | clamp()+vw 大数字 + flex | **固定 44px**（specimen）/ 22px（result）/ 19px（reference）+ serif + 覆盖标记（块流） |
| EVIDENCE | evidence-for-a-claim；二元是变体（V0.2.1） | flex 行 + gap + baseline 对齐 | **纵向块流**：SUPPORTED / value 各自独立行；generic → prose + 边界/来源字段 |
| COUNTERPOINT | legibility parity，非 salience parity | 同 evidence 容器 | 同 evidence 容器（块流同排版，无灰化/缩小） |
| JUDGMENT | 暂停 + 作者归属 + uncertainty（V0.2.1 单规则 + 方向锚点） | 居中 + 上下墨线 + 响应式 | 块流 + 居中 + **单条 top 墨线** + 固定 21px serif + 署名；锚点方向感知保留 |
| LAB NOTE | scope-limiting 注记 | 浅底 + 左边线 + 数字网格 | 浅底 + 左边线 + **块文本**（数字平铺）+ scope 声明常显 |

## 6. Base Markdown Mapping

| 元素 | 旧 | 新微信安全 |
|---|---|---|
| h1/h2/h3 | em 字号 | 固定 30/24/19px，粗体 |
| p | em margin | 固定 18px 段距 |
| strong/em | weight/italic | 不变（安全） |
| blockquote | border-left + em | border-left 2px + 固定 15px |
| ul/ol/li | em | 固定 px + padding-left 24px |
| code/pre | em + flex 无关 | 固定 14px mono + 浅底 + border-radius 2px + 横滚 |
| table | 单元格 grid | 仅真实表格数据：上下边框 + 表头发丝线；证据/布局不用表 |
| img/figure | flex 无关 | max-width:100% + block + 图注 13px |
| hr | — | 上边框 |

## 7. Tests

`164 tests` 全绿（V0.2.2 基线 147 → +17），`tsc --noEmit` ✓，`vite build` ✓。

新增：
- `src/engine/wechat/compiler.test.ts`（13）：policy-clean、确定性、无禁止 primitive、metric 固定 44px / result 22 / reference 19、evidence 块流、generic+二元 evidence、AI meta 换行、counterpoint 保留、judgment 归属 + 单规则 + 无"见后文"、lab-note scope、H2→QUESTION 已移除、preview/clipboard 同一 artifact。
- `src/engine/wechat/policyCheck.test.ts`（4）：检测 flex/gap/clamp/vw/align/nowrap/@media/var()；正文提及禁止词不误报；干净产物通过。

既有 147 项全部保留通过（浏览器渲染/旧剪贴板函数未动）。**不声称这些测试验证真实微信**。

## 8. Known Unknowns

1. **编译器"使用"的 primitive 尚非 SAFE**：块流 evidence、44px specimen、meta 换行、judgment 单规则——都是 `CONSERVATIVE-POLICY`（真机观察到的失败项已禁，但这些替代布局的微信行为未实测）。
2. **44px 是 target heuristic**：非最优证明；真机后可能需调（用固定值，不回到 clamp/vw）。
3. **表格/图注/code 在微信的具体表现**：表格已被观察重排 → 政策限制；图注、代码横滚未实测。
4. **旧 `processClipboardForWeChat`**（article.css 内联路径）仍保留（测试覆盖），但已被编译器取代；是兼容/回退路径，非生产默认。
5. **serif 中文移动字体栈**：微信是否按 serif 栈渲染，未实测。
6. **media query**：编译器产物无 `@media`；浏览器 article.css 里的 `@media` 只在桌面/开发预览有意义。

## 9. Manual WeChat Acceptance Instructions（必须执行，不可自证）

1. 终端：`npm run dev` → 浏览器打开 `http://localhost:5173`（分支 `feat/wechat-target-compiler`）。
2. 确认编辑器是 `examples/issue-001.md`（V0.2.1 fixture）。
3. 预览切到 **WECHAT**（显示的是编译产物，非浏览器理想态）。
4. 点 **COPY → WECHAT**。
5. 打开微信公众号后台 → 新建图文 → **粘贴**（不要手动重排）。
6. 截图整篇。

**逐项检查**：
- 标题层级（serif 标题保留）
- H2
- QUESTION（提问 label + 底部线）
- AI OUTPUT（引用条 + 来源/状态各自成行、可换行）
- **43 metric（固定 44px，显著大）**
- Evidence 分离（SUPPORTED / 30–60 分钟 纵向堆叠）
- Counterpoint（与证据同级 legibility）
- Judgment（单顶线 + 居中 + — Max）
- Lab Note（浅底 + scope 声明）
- 表格 / 代码 / 列表
- Footer

7. （可选）微信里 Ctrl+A/Ctrl+C → 回 `COMPAT` 面板 → DIFF，回填 `WECHAT_COMPAT_MATRIX.md`。
8. 不要以本次实现自证生产兼容——**真实微信视觉是 source of truth**。

## 10. STOP 条件核对

- [x] V0.2 基线保留（未动设计）
- [x] 微信目标编译器存在（`src/engine/wechat/compiler.ts`）
- [x] 微信预览用编译产物（PreviewPane wechat/mobile → compiledHtml）
- [x] 剪贴板用同一产物（doocs copyToWechat → compileForWechat）
- [x] 产物无禁止布局 primitive（policy 检查 0 error）
- [x] metric specimen 固定高 salience（44px）
- [x] evidence 纵向块流
- [x] 元数据换行块流
- [x] judgment 无高级布局依赖的暂停（单规则 + 固定字号）
- [x] lab-note 保持 scope-limiting 注记
- [x] V0.2.1 补丁并入（cherry-pick 保留：单规则/锚点方向/无冗余 H2/evidence 两态）
- [x] tests（164）/ tsc / build 通过
- [x] 报告与 artifacts 存在
- [x] 手动验收指令已提供（§9）

**下一步（STOP 之后）＝真实微信粘贴测试。** 未开始 V0.3，未重开视觉设计，未 merge main。
