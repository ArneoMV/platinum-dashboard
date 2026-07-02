# Platinum Dashboard — Design System

Target design language: **Airtable-derived** — a warm parchment canvas, dark
slate-blue ink, a single ocean-blue interactive accent, generous radii, and
restrained shadows. Elevation comes mostly from **color contrast + border**,
not heavy drop shadows.

This document is the reference for the visual redesign. It describes the
_target_ system. The SCSS token layer in [`src/styles/_tokens.scss`](src/styles/_tokens.scss)
implements the color / radii / spacing / shadow values below. The **type-size
scale is documented here as the target but is not yet wired** — the current
scale stays in place until a later component-level phase (see Typography).

> **Token discipline:** token _names_ are stable. The redesign revalues tokens;
> it does not rename them, so components pick up the new look automatically.

---

## Colors

| Role | Hex | SCSS token | Notes |
|---|---|---|---|
| Canvas (page) | `#faf5e8` | `--bg` | Warm parchment. The signature surface. |
| Surface (cards) | `#ffffff` | `--surface` | White cards sit on the parchment canvas. |
| Secondary surface | `#f8fafc` | `--surface-2` | Subtle cool panel (nested/secondary areas). |
| Ink (headings/primary) | `#181d26` | `--ink-900` | Dark slate-blue. Headlines, primary text. |
| Body text | `#333840` | `--ink-700` | Default reading copy. |
| Muted text | `#41454d` | `--ink-500` | Labels, captions, secondary meta. |
| Faint / disabled | `#8a9099` | `--ink-300` | Derived light slate (not from the core Airtable list). |
| Border / divider | `#e0e2e6` | `--line` | Cool hairline. Primary elevation cue. |
| Accent (interactive) | `#1b61c9` | `--accent` | Ocean blue. **Interactive & illustration only.** |
| Accent soft | `#e8f0fc` | `--accent-soft` | Ocean-blue tint (hover/selected wash). |

### Semantic status colors

| Role | Hex | SCSS token | Notes |
|---|---|---|---|
| Attention | `#aa2d00` | `--rust` | "Za kontakt" / warning. Aligns with the vivid set. |
| Positive | `#2f7a3e` | `--sage` | "Aktivno" / success. Retained green, tuned cooler for the new palette. Not the viz green (`#0a2e00` is reserved for charts). |

### Vivid accent set — **charts & badges only**

Reserved for data visualization and category encoding. Never for text or UI chrome.

| Token | Hex |
|---|---|
| `--viz-1` | `#254fad` |
| `--viz-2` | `#aa2d00` |
| `--viz-3` | `#0a2e00` |
| `--viz-4` | `#fa91e0` |
| `--viz-5` | `#fcb42a` |

---

## Typography

- **Display / headings:** PT Serif (400) — retained deliberately. Parchment +
  serif is the differentiator; a sans display face would read generic. Loaded
  via `next/font` (`--font-serif`).
- **Body / UI / numbers:** Open Sans — clean sans for reading copy, labels, and
  tabular numbers (`--font-sans`).

### Target type-size scale (documented — not yet wired)

| Name | Size |
|---|---|
| caption | 14px |
| body | 16px |
| subheading | 18px |
| heading-sm | 20px |
| heading | 24px |
| heading-lg | 32px |
| display | 48px |

> The current project scale (`--h-*`, `--hd-*`, `--body-*`) remains in effect for
> now. Migrating to the scale above changes rendered sizes (e.g. body 14 → 16)
> and touches the type mixins/components — that is a **later phase**, intentionally
> excluded from the token-only groundwork.

---

## Radii

| Use | Radius | SCSS token |
|---|---|---|
| Small (pills, badges) | 8px | `--radius-sm` |
| Buttons, inputs, nav | 12px | `--radius` |
| Cards | 16px | `--radius-lg` |
| Large cards | 24px | `--radius-xl` |

---

## Spacing

8px base scale. Existing half-steps (4px, 12px) are retained for fine control.

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--space-1` | 4px | | `--space-8` | 32px |
| `--space-2` | 8px | | `--space-10` | 40px |
| `--space-3` | 12px | | `--space-12` | 48px |
| `--space-4` | 16px | | `--space-16` | 64px |
| `--space-6` | 24px | | | |

Airtable 8-base rhythm: **8 / 16 / 24 / 32 / 40 / 48 / 64**.

---

## Shadows

Subtle only — `rgba(0,0,0,0.08)` with a small blur. Elevation is carried mainly
by the parchment/white contrast and the `--line` border, with shadow as a light
lift.

- `--shadow-card`: `0 1px 2px rgba(0,0,0,.05), 0 2px 6px rgba(0,0,0,.08)`

---

## Do / Don't

**Do**
- Use the ocean-blue `--accent` for interactive affordances (links, buttons,
  focus, active states) and illustration only.
- Let borders (`--line`) and the parchment/white surface contrast carry
  separation before reaching for shadow.
- Confine vivid colors (`--viz-*`) to charts, category encoding, and badges.
- Keep PT Serif for display/headings; Open Sans for everything else.

**Don't**
- Don't tint body text with the accent or vivid colors — text is ink/body/muted.
- Don't stack heavy shadows to fake depth; keep elevation flat and calm.
- Don't introduce new brand hues outside this palette.
- Don't rename tokens — revalue them so consumers update automatically.
