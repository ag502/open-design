---
name: landing-wayfare
zh_name: "Wayfare · 慢旅行预订"
en_name: "Wayfare · Slow-travel Booking Studio"
emoji: "✈️"
description: "慢旅行预订 landing page · Editorial · IATA 滚动牌 + Bricolage Grotesque + Newsreader italic"
category: web-artifacts
scenario: marketing
aspect_hint: "桌面优先, 响应式 320 / 414 / 768 / 1280"
featured: 1
recommended: 1
tags: ["landing-page", "editorial", "travel", "booking", "ticker", "narrative", "hallmark"]
example_id: sample-landing-wayfare
example_name: "Wayfare · 慢旅行预订"
example_format: html
example_tagline: "Editorial · IATA 滚动牌 + Newsreader italic"
example_desc: "慢旅行预订工作室首页, IATA 城市代码滚动条 + Bricolage 重磅大字 + Newsreader italic 副词"
example_source_url: "https://github.com/Nutlope/hallmark/tree/main/site/examples/wayfare"
example_source_label: "Nutlope/hallmark"
od:
  mode: prototype
  surface: web
  scenario: marketing
  featured: 0.00015
  upstream: "https://github.com/Nutlope/hallmark"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "用「Wayfare · 慢旅行预订」模板把我的内容做成一份「旅行 / 预订 / 行程 / 民宿 landing page · Editorial · IATA 滚动牌 + 大字 + 衬线 italic」。保持模板的视觉签名 (editorial · 横向滚动 ticker · narrative workflow · 大字 wordmark · 衬线 italic 反差), 使用真实内容和数据, 避免 lorem ipsum 和占位图片。"
---

# landing-wayfare · 慢旅行预订工作室

> Adapted from [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (MIT) — one of the 5 named showcase landing pages. Originally **wayfare** in `hallmark/site/examples/`.

## 适用场景

- 旅行 / 行程 / 民宿 / 体验类 landing
- "小作坊 · 手挑 · 慢" 调性 (不是 Booking.com / Airbnb 那种规模化)
- Editorial 印刷感, 有"周刊 / 期刊"叙事节奏
- 需要时间感 / 日历感 / 城市清单的产品

## 视觉签名

- **Genre**: editorial
- **Macrostructure**: Narrative Workflow (atom #14) + Photographic (atom #08)
- **Theme axes**: warm paper · sans-display (Bricolage Grotesque) · roman-serif italic (Newsreader)
- **Typography**: Bricolage Grotesque (variable) + Newsreader (italic 反差) + JetBrains Mono (city codes)
- **Microinteractions**: IATA ticker 横向滚动 · 日历 hover · 滚动同步图片

## 文件结构

```
landing-wayfare/
├── SKILL.md
├── index.html
├── style.css          ← (注意: 是 style.css 不是 styles.css)
├── tokens.css
└── example.md
```

## 改造规则

- **保留**: IATA ticker / Bricolage + Newsreader italic 反差 / 暖纸 / narrative workflow 编号
- **可改**: 城市 / 日期 / 价格 / 行程描述 / FAQ / 关于团队
- **不许**: 把 ticker 去掉 / 用 Booking 风网格 / 加滤镜风照片 / 加渐变背景

视觉纪律见 [`../atom-design/references/genres/editorial.md`](../atom-design/references/genres/editorial.md)。
