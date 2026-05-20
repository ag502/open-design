---
name: landing-bananastudio
zh_name: "BananaStudio · AI 头像工作室"
en_name: "BananaStudio · AI Headshot Studio"
emoji: "📸"
description: "AI 头像服务 landing page · Atmospheric · 暗调 + Fraunces italic display + 紫黑光晕"
category: web-artifacts
scenario: marketing
aspect_hint: "桌面优先, 响应式 320 / 414 / 768 / 1280"
featured: 1
recommended: 1
tags: ["landing-page", "atmospheric", "ai-product", "marquee-hero", "dark", "headshot", "hallmark"]
example_id: sample-landing-bananastudio
example_name: "BananaStudio · 头像工作室"
example_format: html
example_tagline: "Atmospheric · 紫黑光晕 + Fraunces italic"
example_desc: "AI 头像服务首页, hero 用 Fraunces italic 大字, 暗调 atmospheric, 紫色 accent + 噪点纹理"
example_source_url: "https://github.com/Nutlope/hallmark/tree/main/site/examples/bananastudio"
example_source_label: "Nutlope/hallmark"
od:
  mode: prototype
  surface: web
  scenario: marketing
  featured: 0.00011
  upstream: "https://github.com/Nutlope/hallmark"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "用「BananaStudio · AI 头像工作室」模板把我的内容做成一份「AI 产品 landing page · Atmospheric · 暗调 + Fraunces italic display + 紫黑光晕」。保持模板的视觉签名 (atmospheric · marquee-hero · 紫色 accent · 噪点纹理), 使用真实内容和数据, 避免 lorem ipsum 和占位图片。"
---

# landing-bananastudio · BananaStudio AI 头像工作室

> Adapted from [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (MIT) — one of the 5 named showcase landing pages. Originally **bananastudio** in `hallmark/site/examples/`.

## 适用场景

- AI 产品 / 工具的首页 (生图 / 视频 / 语音 / 音乐 / 代码 agent)
- 暗调 atmospheric 风格, 主打"专业级 / studio-grade"卖点
- 单一动作驱动 (上传 → 等待 → 拿到结果)
- 营销页需要在 30 秒内完成"看到 → 心动 → 点击"

## 视觉签名 — 不要改

- **Genre**: atmospheric (atom-design 4 大 genre 之一)
- **Macrostructure**: Marquee Hero (atom #03) — hero 占满首屏, 大字 + italic 副词
- **Theme axes**: dark paper (#0a0712) · italic-serif display (Fraunces) · cool-purple accent
- **Typography**: Fraunces (display, italic 9-144 opsz) + Geist (body) + Geist Mono (label)
- **Microinteractions**: 噪点纹理 (subtle grain) · 渐变光晕 (atmospheric bloom) · 反向斜体强调

## 文件结构

```
landing-bananastudio/
├── SKILL.md           ← 你正在读
├── index.html         ← 主入口
├── styles.css         ← 视觉层
├── tokens.css         ← 调色 + 字号 + 间距 token
└── example.md         ← 内容简报
```

## 改造规则

- **保留**: macrostructure 骨架 / accent 色相 / Fraunces italic / 噪点 / atmospheric bloom
- **可改**: 文案 / 子标题 / 三个卖点 / CTA 文字 / pricing 表格内容 / FAQ 文案
- **不许**: 改 Fraunces 为别的衬线 / 把暗调改亮 / 加边框圆角 / 用 emoji 装饰

详细的视觉纪律见 [`../atom-design/references/genres/atmospheric.md`](../atom-design/references/genres/atmospheric.md) 和 [`../atom-design/references/slop-test.md`](../atom-design/references/slop-test.md) (atmospheric overrides 段)。
