---
name: landing-najm
zh_name: "NAJM · 摩洛哥时装"
en_name: "NAJM · Moroccan Fashion House"
emoji: "🌟"
description: "服装电商 landing page · Editorial · 暖色 paper + Bricolage Grotesque + 阿拉伯字符 accent"
category: web-artifacts
scenario: marketing
aspect_hint: "桌面优先, 响应式 320 / 414 / 768 / 1280"
featured: 1
recommended: 1
tags: ["landing-page", "editorial", "ecommerce", "fashion", "warm-paper", "catalogue", "hallmark"]
example_id: sample-landing-najm
example_name: "NAJM · 时装电商"
example_format: html
example_tagline: "Editorial · 暖纸 + Bricolage Grotesque"
example_desc: "摩洛哥时装电商首页, Bricolage Grotesque 重磅显示 + Inter 正文 + 阿拉伯字符 wordmark"
example_source_url: "https://github.com/Nutlope/hallmark/tree/main/site/examples/najm"
example_source_label: "Nutlope/hallmark"
od:
  mode: prototype
  surface: web
  scenario: marketing
  featured: 0.00013
  upstream: "https://github.com/Nutlope/hallmark"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "用「NAJM · 摩洛哥时装」模板把我的内容做成一份「服装 / 配饰 / 美妆 / 家居电商 landing page · Editorial · 暖纸 + Bricolage Grotesque」。保持模板的视觉签名 (editorial · 暖色 paper · 大字 wordmark · 公告横条 · 双语 accent), 使用真实内容和数据, 避免 lorem ipsum 和占位图片。"
---

# landing-najm · 摩洛哥时装电商

> Adapted from [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (MIT) — one of the 5 named showcase landing pages. Originally **najm** in `hallmark/site/examples/`.

## 适用场景

- 服装 / 配饰 / 香水 / 家居 / 工艺品 类电商首页
- 有"原产地 / 手作 / 限量"故事的品牌
- 暖色 editorial 调性, 而非冰冷 e-commerce
- 需要双语 / 文化符号 (阿拉伯字符 / 中文书法 / 西里尔等) 的品牌

## 视觉签名

- **Genre**: editorial
- **Macrostructure**: Catalogue (atom #11) + Photographic fold (atom #08)
- **Theme axes**: warm paper · sans-display (Bricolage Grotesque 800) · neutral accent
- **Typography**: Bricolage Grotesque (variable 12-96 opsz) + Inter (body) + JetBrains Mono (label)
- **Microinteractions**: announce 公告横条 · icon button hover · drop 倒计时

## 文件结构

```
landing-najm/
├── SKILL.md
├── index.html
├── styles.css
├── tokens.css
├── script.js          ← announce 滚动 + 倒计时
└── example.md
```

## 改造规则

- **保留**: 暖纸调 / Bricolage 大字 wordmark / 公告横条 / 双语 wordmark / 倒计时
- **可改**: 文案 / 商品图占位 / 价格货币 / 文化符号 (najm 的 نجم 可替换为别的)
- **不许**: 用衬线 display / 把 paper 改冷 / 用通用 ecommerce 模板 (Shopify dawn 之类) / 加渐变

视觉纪律见 [`../atom-design/references/genres/editorial.md`](../atom-design/references/genres/editorial.md)。
