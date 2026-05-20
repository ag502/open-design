# Manual UI test checklist · atom-design + landing-*

> Copy-pasteable checklist for verifying this branch by hand in the Open Design web UI.
> Run after `git checkout midnight-lemur && pnpm install`.

## 1 · Start the runtime

```bash
pnpm tools-dev start --namespace atom-verify --daemon-port 17456 --web-port 17573
```

Expected: daemon + web + desktop all show `started · running`. If desktop window doesn't open, use the web URL `http://127.0.0.1:17573`.

## 2 · Confirm the skills loaded at the daemon

```bash
curl -sf http://127.0.0.1:17456/api/skills \
  | python3 -c "import sys, json; d=json.load(sys.stdin); top=sorted([s for s in d['skills'] if s.get('featured') is not None], key=lambda s: s['featured'])[:10]; [print(f'{i+1:2}. {s[\"id\"]:35} featured={s[\"featured\"]}') for i,s in enumerate(top)]"
```

**Pass criteria** (must match exactly, ranking 1-6):

```
 1. atom-design                         featured=0.0001
 2. landing-bananastudio                featured=0.00011
 3. landing-hyperlane                   featured=0.00012
 4. landing-najm                        featured=0.00013
 5. landing-tally                       featured=0.00014
 6. landing-wayfare                     featured=0.00015
```

## 3 · Render each preview through the daemon

```bash
for n in bananastudio hyperlane najm tally wayfare; do
  echo "=== landing-$n ==="
  curl -sf "http://127.0.0.1:17456/api/skills/landing-$n/example" \
    | python3 -c "import sys, re; html=sys.stdin.read(); title=re.search(r'<title>([^<]+)</title>', html); print('title:', title.group(1) if title else '?'); print('size :', len(html), 'bytes'); print('inline styles:', html.count('<style>'))"
done
```

**Pass criteria** — five blocks each showing:
- a real title (BananaStudio · Hyperlane · NAJM · Tally · Wayfare)
- size between 40 KB and 70 KB
- ≥ 1 inline `<style>` block (all CSS inlined; not a sibling-file reference)

## 4 · Visual check in the UI

Open the desktop window (or `http://127.0.0.1:17573` in a browser).

### 4a · Fresh namespace — skip onboarding

Three Welcome cards (Connect / About you / Design system) appear. Click **Skip for now** twice (once per remaining card) until the gallery loads.

### 4b · Gallery → Featured filter

In the **Official starters** strip, click the **Featured** chip (top-left, next to All / Import / Create / Export / Share / …).

**Pass criteria** — the first six cards visible are, in this order:

1. **atom-design** (description: anti-AI-slop)
2. **landing-bananastudio** (📸 AI 头像工作室)
3. **landing-hyperlane** (🌌 开发者大会)
4. **landing-najm** (🌟 摩洛哥时装)
5. **landing-tally** (📊 API 计量 SaaS)
6. **landing-wayfare** (✈️ 慢旅行预订)

If they appear in a different order, double-check `od.featured` numeric values in each SKILL.md.

### 4c · Preview each card

Click each landing-* card. The preview iframe / panel should render the HTML at full fidelity:

- **bananastudio** — dark purple paper · Fraunces italic display · "Studio-grade headshots, in thirty minutes." hero · pricing tiers (Basic / Studio / Studio+).
- **hyperlane** — dark sepia paper · dual atmospheric blooms · Inter Tight "Hyperlane / 26" · agenda timeline.
- **najm** — warm cream paper · Bricolage Grotesque "NAJM نجم" wordmark · announce horizontal strip · catalogue product grid.
- **tally** — light paper · Geist sans · LIVE counter chip · Marquee Hero · pricing slider.
- **wayfare** — warm cream paper · IATA city-code ticker · Newsreader italic · narrative 1-2-3-4 workflow.

If a preview shows broken styles (raw HTML without CSS, or visible `<link rel="stylesheet">` errors), the inline step in `python3 inline_one()` regressed.

### 4d · atom-design card

Click **atom-design**. The current daemon doesn't have a single `example.html` for atom-design (it's a meta-skill — its preview is browsing the catalog of macrostructures / themes / examples). Expected: example may 404; that's acceptable for this PR. The 22-theme catalog lives at `skills/atom-design/site/css/tokens.css`; the catalog showcase page is `skills/atom-design/site/index.html` and is browsable directly via the file system.

### 4e · Cross-references in other plugin SKILL.md

Open these and confirm each has a "## Design discipline (atom-design cross-reference)" section that links to `../atom-design/...`:

- `skills/slides/SKILL.md`
- `skills/artifacts-builder/SKILL.md`
- `skills/web-artifacts-builder/SKILL.md`
- `skills/frontend-slides/SKILL.md`
- `skills/deck-open-slide-canvas/SKILL.md` (Chinese section heading 【视觉纪律 — 交叉引用 atom-design】)
- `skills/deck-guizang-editorial/SKILL.md` (same)
- `skills/deck-swiss-international/SKILL.md` (same)

## 5 · 1:1 fidelity spot-check

```bash
cd /tmp && rm -rf hallmark-scratch && mkdir hallmark-scratch && cd hallmark-scratch
git clone --depth=1 https://github.com/Nutlope/hallmark.git
cd <THIS_REPO>

# Should report 0 silent drifts:
norm() { sed -e 's/Hallmark/Atom/g' -e 's|hallmark · |atom · |g' -e 's|\.hallmark/|.od/atom/|g' -e 's|hallmark audit|atom audit|g' -e 's|hallmark redesign|atom redesign|g' -e 's|hallmark study|atom study|g' -e 's|hallmark default|atom default|g' "$1"; }
fail=0
while IFS= read -r line; do
  f=$(echo "$line" | awk '{print $2}' | sed 's|/tmp/hallmark-scratch/hallmark/||')
  if [ -f "/tmp/hallmark-scratch/hallmark/$f" ] && [ -f "skills/atom-design/$f" ]; then
    if ! diff <(norm "/tmp/hallmark-scratch/hallmark/$f") "skills/atom-design/$f" > /dev/null 2>&1; then
      echo "DRIFT: $f"; fail=$((fail+1))
    fi
  fi
done < <(diff -rq /tmp/hallmark-scratch/hallmark/references skills/atom-design/references)
echo "STILL_DIFF_COUNT: $fail"
```

**Pass criteria** — `STILL_DIFF_COUNT: 0`. Any non-zero count is a silent drift; investigate and fix.

## 6 · Stop the runtime

```bash
pnpm tools-dev stop --namespace atom-verify
```

## 7 · Sign-off

- [ ] Step 2 ranking matches exactly
- [ ] Step 3 all five previews render with inlined `<style>` blocks
- [ ] Step 4b gallery shows the six cards on top
- [ ] Step 4c each preview matches its expected visual signature
- [ ] Step 4e all seven plugin SKILL.md files have the cross-reference section
- [ ] Step 5 fidelity diff returns `STILL_DIFF_COUNT: 0`
