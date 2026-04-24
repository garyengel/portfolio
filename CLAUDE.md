# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build step required. To preview locally:

```bash
open index.html
# or serve with:
python3 -m http.server 8000
```

No linter, test framework, or package manager is configured.

## Architecture

This is a **static, single-file portfolio site** for a UX designer. All HTML, CSS, and JavaScript live in `index.html` (~400 lines). There are no external libraries — only Google Fonts (Playfair Display + Inter) and vanilla JS.

**`index.html`** is the production file. `index2.html`, `index3.html`, and `index4.html` are experimental design iterations and are not deployed.

### Sections (in order)
- Fixed navbar with scroll-triggered backdrop blur
- Hero with CTAs
- About (bio + skills grid)
- Work (3 project case studies, alternating layout)
- Process (4-step: Discover → Define → Design → Validate)
- Contact (email, LinkedIn, GitHub)

### JavaScript behavior
- Scroll progress bar at top of page
- `IntersectionObserver` drives scroll-reveal animations on `.reveal`, `.reveal-left`, `.reveal-right` elements
- Stagger delays are applied dynamically to process cards and skill tags

### Design tokens (CSS custom properties)
| Variable | Value | Use |
|---|---|---|
| `--bg` | `#1e1e24` | Page background |
| `--surface` | `#26262e` | Section backgrounds |
| `--card` | `#2e2e38` | Card backgrounds |
| `--accent` | `#2176c7` | Primary blue |
| `--accent2` | `#56a0e0` | Lighter blue |
| `--text` | `#e8e8f0` | Body text |
| `--muted` | `#9090aa` | Secondary text |

Single responsive breakpoint at `@media (max-width: 900px)`.
