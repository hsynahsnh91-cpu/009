# AGENTS.md — Internal AI Agent Skills & Design Intelligence Configuration

This repository and agent environment have **UI/UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`)** and its complete suite of 7 design skills permanently installed and configured.

---

## 1. Installed Skills (Local & Global)

All 7 skills from `ui-ux-pro-max-skill` are saved in both the workspace and the home directory:
- Workspace Claude Skills: `/home/user/009/.claude/skills/`
- Workspace Universal Agent Skills: `/home/user/009/.agents/skills/`
- Global Claude Skills: `/home/user/.claude/skills/`
- Global Universal Agent Skills: `/home/user/.agents/skills/`
- Canonical Source of Truth: `/home/user/009/src/ui-ux-pro-max/`

### Bundled Skills Directory

| Skill | Path | Purpose |
|-------|------|---------|
| **`ui-ux-pro-max`** | `.claude/skills/ui-ux-pro-max/SKILL.md` | Core UI/UX design intelligence: 79 UI styles (50 active), 192 product palettes & reasoning rules, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types, and 22 technology stacks |
| **`design`** | `.claude/skills/design/SKILL.md` | Full design workflows for logos, CIP (Corporate Identity Program), icons, social photos, banners, and slides |
| **`design-system`** | `.claude/skills/design-system/SKILL.md` | 3-layer design token architecture (primitive, semantic, component tokens), Tailwind integration, and slide token validation |
| **`ui-styling`** | `.claude/skills/ui-styling/SKILL.md` | shadcn/ui component styling, Tailwind CSS customization/responsive design, and canvas design systems with bundled fonts |
| **`brand`** | `.claude/skills/brand/SKILL.md` | Brand identity guidelines, color extraction, voice/messaging framework, logo usage rules, and token synchronization |
| **`banner-design`** | `.claude/skills/banner-design/SKILL.md` | Banner sizes, styles, and layout specifications across platforms |
| **`slides`** | `.claude/skills/slides/SKILL.md` | HTML presentation slide strategies, copywriting formulas, and layout patterns |

---

## 2. Quick Commands (`search.py` & `uipro`)

### Generate a Complete Design System (v2.0 Reasoning Engine)
```bash
python3 /home/user/009/.claude/skills/ui-ux-pro-max/scripts/search.py "<product_type_and_keywords>" --design-system -p "<Project Name>"
```

**Optional Design Dials:**
```bash
python3 /home/user/009/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --variance <1-10> --motion <1-10> --density <1-10>
```

**Persist Design System (`design-system/<slug>/MASTER.md`):**
```bash
python3 /home/user/009/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<Project Name>" --output-dir "/home/user/009"
```

### Domain-Specific Search
```bash
python3 /home/user/009/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```
Available domains:
- `product` — Product type recommendations (192 categories)
- `style` — UI styles, CSS variables, and implementation checklists (79 styles)
- `typography` — Google Fonts pairings and CSS imports (74 pairings)
- `color` — Semantic color tokens and palettes (192 palettes)
- `landing` — Landing page patterns and CTA strategies (34 patterns)
- `chart` — Data visualization and chart recommendations (25 chart types)
- `ux` — UX best practices, accessibility, and anti-patterns (119 guidelines)
- `icons` — Curated Phosphor/Heroicons/Lucide icon usage (105 rows)
- `react` — React / Next.js performance guidelines
- `web` — App interface guidelines (iOS / Android / React Native / Web)
- `google-fonts` — Approved Google Fonts catalog (1,934 fonts)
- `gsap` — GSAP animation presets and motion skeletons (17 presets)

### Stack-Specific Search
```bash
python3 /home/user/009/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```
Available stacks (22):
`html-tailwind`, `react`, `nextjs`, `shadcn`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `astro`, `threejs`, `angular`, `laravel`, `swiftui`, `jetpack-compose`, `react-native`, `flutter`, `javafx`, `wpf`, `winui`, `avalonia`, `uno`, `uwp`

### CLI (`uipro`)
```bash
uipro init --ai <platform>
```
