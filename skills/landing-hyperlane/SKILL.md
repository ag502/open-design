---
name: landing-hyperlane
zh_name: "Hyperlane · 开发者大会"
en_name: "Hyperlane · Developer Summit"
emoji: "🌌"
description: "一夜开发者峰会 landing page · Atmospheric · Inter Tight + bloom 背景 + 时间线 + RSVP"
category: web-artifacts
scenario: marketing
aspect_hint: "桌面优先, 响应式 320 / 414 / 768 / 1280"
featured: 1
recommended: 1
tags: ["landing-page", "atmospheric", "event", "conference", "dark", "split-studio", "hallmark"]
example_id: sample-landing-hyperlane
example_name: "Hyperlane · 开发者大会"
example_format: html
example_tagline: "Atmospheric · bloom 背景 + Inter Tight"
example_desc: "单夜开发者峰会页, Inter Tight 加重 + Instrument Serif 反向插入 italic, atmospheric bloom 衬底"
example_source_url: "https://github.com/Nutlope/hallmark/tree/main/site/examples/hyperlane"
example_source_label: "Nutlope/hallmark"
od:
  mode: prototype
  surface: web
  scenario: marketing
  featured: 0.00012
  upstream: "https://github.com/Nutlope/hallmark"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "用「Hyperlane · 开发者大会」模板把我的内容做成一份「单日 / 单夜活动 landing page · Atmospheric · bloom 背景 + Inter Tight + 时间线」。保持模板的视觉签名 (atmospheric · 反向 italic · bloom · 节点时间线), 使用真实内容和数据, 避免 lorem ipsum 和占位图片。"
---

# landing-hyperlane · 开发者峰会

> Adapted from [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (MIT) — one of the 5 named showcase landing pages. Originally **hyperlane** in `hallmark/site/examples/`.

## 适用场景

- 单日 / 单夜技术活动 (peerlist drink up, oss launch, conf afterparty)
- AI / 开发者 / oss 圈层观众, 暗调 atmospheric 调性
- 需要"日期 · 地点 · 议程 · RSVP 名单"的四要素
- 内容偏短, 但要在视觉上"压住"页面

## 视觉签名

- **Genre**: atmospheric
- **Macrostructure**: Split Studio (atom #15) — diptych, 文字 + 时间线对照
- **Theme axes**: dark paper (#1a120c) · sans-display (Inter Tight 800) · 反向 italic Instrument Serif
- **Microinteractions**: 双 bloom 渐变背景 · 噪点 grain · 滚动揭示

## 文件结构

```
landing-hyperlane/
├── SKILL.md
├── index.html
├── styles.css
├── tokens.css
├── script.js          ← 倒计时 / RSVP 状态
└── example.md
```

## 改造规则

- **保留**: bloom 衬底 / Inter Tight 重磅 + Instrument Serif italic 对位 / 暗调 / 时间线节点样式
- **可改**: 主题文案 / 议程内容 / 演讲者 / 城市 / 日期 / RSVP 提示语
- **不许**: 把 bloom 去掉 / 用纯黑无 atmosphere / 加 emoji 装饰 / 用通用 SVG icon 库

视觉纪律见 [`../atom-design/references/genres/atmospheric.md`](../atom-design/references/genres/atmospheric.md)。
