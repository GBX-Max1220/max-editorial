# V0.3 Phase 2 — Editorial Surface & Hierarchy Study

方向 B — Restrained Hybrid / 克制混合模式。设计研究，非生产实现。

## 目录

| 文件 | 用途 |
|---|---|
| `fixture-phase2.md` | 测试文章（22 项内容，两个样张共用，字节相同） |
| `01_CURRENT_BASELINE.html` | 当前生产视觉的忠实样张 |
| `02_RESTRAINED_HYBRID.html` | 克制混合候选样张 |
| `styles/hybrid-tokens.css` | hybrid 色板 token（生产 tokens.css 派生） |
| `styles/hybrid-article.css` | hybrid 文章排版（生产 article.css 派生） |
| `scripts/build-study.ts` | 样张生成器（esbuild + node，同 Phase 1 模式） |
| `03_DESIGN_DECISION_REPORT.md` | 决策报告（Revision 1 修订 + 最终裁决见其中 §R） |
| `04_WECHAT_MANUAL_ACCEPTANCE.md` | 手动微信验收清单（Revision 1 候选，Owner 执行，勿预填 PASS） |
| `shots/*.png` | 渲染截图（Revision 1 = `hybrid-v2-*`，CDP 真视口 390px，未降采样） |

## 生成样张

```bash
node_modules/.bin/esbuild design-studies/v03-phase2-surface-hierarchy/scripts/build-study.ts \
  --bundle --platform=node --format=cjs --outfile=.tmp/build-study.cjs
node .tmp/build-study.cjs
```

浏览器打开 `01_CURRENT_BASELINE.html` / `02_RESTRAINED_HYBRID.html` 即可对比。

## 截图命令（Edge headless，零新依赖）

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --hide-scrollbars --no-first-run --user-data-dir="$env:TEMP\edge-x" `
  --window-size=1280,9000 --virtual-time-budget=4000 `
  --screenshot="shots\out.png" "file:///.../02_RESTRAINED_HYBRID.html"
```

## Provenance

- Agent：Claude Code
- 日期：2026-08-21（本地时区）
- Branch：`design/v03-phase2-surface-hierarchy-study`
- Starting HEAD：`00cbebf224b32f3e754133ab525666d1a20d19ce`
- 任务：V0.3 Phase 2 — Editorial Surface & Hierarchy Study
