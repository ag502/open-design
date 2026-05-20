---
name: landing-tally
zh_name: "Tally · API 计量 SaaS"
en_name: "Tally · Usage-based Billing SaaS"
emoji: "📊"
description: "SaaS 计量计费 landing page · Modern-minimal · Geist 极简 + Instrument Serif italic 反差 + 实时事件流"
category: web-artifacts
scenario: marketing
aspect_hint: "桌面优先, 响应式 320 / 414 / 768 / 1280"
featured: 1
recommended: 1
tags: ["landing-page", "modern-minimal", "saas", "metering", "workbench", "stat-led", "hallmark"]
example_id: sample-landing-tally
example_name: "Tally · API 计量 SaaS"
example_format: html
example_tagline: "Modern-minimal · Geist + 实时事件流"
example_desc: "用量计费 SaaS 首页, Marquee Hero + 实时事件计数器, Geist 极简 + Instrument Serif italic 反差"
example_source_url: "https://github.com/Nutlope/hallmark/tree/main/site/examples/tally"
example_source_label: "Nutlope/hallmark"
od:
  mode: prototype
  surface: web
  scenario: marketing
  featured: 0.00014
  upstream: "https://github.com/Nutlope/hallmark"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "用「Tally · API 计量 SaaS」模板把我的内容做成一份「SaaS / API / 开发者工具 landing page · Modern-minimal · Geist 极简 + 实时事件流」。保持模板的视觉签名 (modern-minimal · marquee hero · 实时计数器 · 极简 sans · Instrument Serif italic 反差), 使用真实内容和数据, 避免 lorem ipsum 和占位图片。"
---

# landing-tally · 用量计费 SaaS

> Adapted from [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (MIT) — one of the 5 named showcase landing pages. Originally **tally** in `hallmark/site/examples/`.

## 适用场景

- SaaS / API / 开发者工具 / 基础设施类产品首页
- 强用量 / 强数据驱动的产品 (计量 / 指标 / 监控 / 流量)
- Modern-minimal 风格 (Stripe / Linear / ElevenLabs school)
- 需要 LIVE 计数 / 实时数据可视化

## 视觉签名

- **Genre**: modern-minimal
- **Macrostructure**: Marquee Hero + Workbench (atom #03 + #05)
- **Theme axes**: light paper · sans-display (Geist 700) · cool neutral accent · italic-serif inline 反差 (Instrument Serif)
- **Typography**: Geist (variable, display + body) + Geist Mono (data) + Instrument Serif (italic 反差)
- **Microinteractions**: LIVE 计数器 · pricing 滑块 · 透明度 hover · 锐角 hairline

## 文件结构

```
landing-tally/
├── SKILL.md
├── index.html
├── styles.css
├── tokens.css
├── app.js             ← LIVE counter + pricing slider
└── example.md
```

## 改造规则

- **保留**: Geist + Instrument Serif italic 反差 / LIVE 计数器 / N5 floating pill nav / 锐角
- **可改**: 文案 / 计量维度 (events/sec, GB, calls) / pricing 价格 / FAQ 问题
- **不许**: 加渐变 / 加圆角 / 把 Geist 换成 Inter / 把 italic 反差去掉

视觉纪律见 [`../atom-design/references/genres/modern-minimal.md`](../atom-design/references/genres/modern-minimal.md)。
