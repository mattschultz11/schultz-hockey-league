# Schultz Hockey League UX Design Specification

_Created on 2025-11-30 by Schultz_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

Centralized web app for the Schultz Hockey League to manage current and future seasons across multiple leagues/seasons. Focus on an in-person draft board with clear order/keepers/current pick, league + team schedule display, and simple stats upload/approval/display. Roles: admins (full write), team managers (limited write for their team), viewers/readers. Mobile-first web with great desktop support; prioritize clarity, high-contrast, and keyboard navigation. No notifications or payments in MVP; growth items include trades, exports, richer analytics/notifications.

Project vision snapshot:

- Platform: Mobile-first web with strong desktop support.
- Core experience: League data at a glance with rapid drill-down; team draft flow must be flawless.
- Emotion: Efficient and productive.
- Inspiration: BenchApp (minimal clicks, clear grouping); Yahoo Fantasy (data-driven dashboards/tables).
- Design system base: HeroUI + Tailwind, customized for dense data and dark mode.

---

## 1. Design System Foundation

### 1.1 Design System Choice

Decision: Use existing HeroUI + Tailwind setup, tuned for high-density data views and strong mobile-first responsiveness.

Rationale:

- Already integrated in the Next.js app; reduces integration risk and speeds delivery.
- Tailwind tokens give us precise control over density, spacing, and contrast.
- HeroUI components cover core primitives; we’ll customize for draft board, stats tables, and dashboards.

---

## 2. Core User Experience

### 2.1 Defining Experience

Primary experience: league data at a glance. Users rapidly scan player/team stats, standings, and schedules with minimal taps. Mobile-first web experience with strong desktop support; focus on fast load, clear hierarchies, and quick drill-down from league to team to player.

Critical action: team draft flow must feel flawless—clear order/keeper context, current pick, and rapid updates without confusion.

### 2.2 Novel UX Patterns

None identified; leverage proven dashboard/list/table patterns with strong readability and filters.

Desired feeling: efficient and productive—flows minimize friction, keep users oriented, and surface the next best action immediately.

---

## 3. Visual Foundation

### 3.1 Color System

Brand palette (updated):

- Primary: #16A394 — primary actions and highlights
- Secondary: #7F9CF5 — supporting accents and filters
- Background/base: #090a15 — deep slate canvas
- Panel/base surfaces: #2D3748 (with #233042 for inset depth)
- Foreground/base text: #F7FAFC — high-contrast text

Semantic mapping (proposal):

- Success: #128778 (deeper teal for contrast on dark)
- Warning: #CC8B2F (amber)
- Error: #C44747 (brick red)
- Info: #2F6CC8 (blue)
- Neutrals (for layering and dividers): base #090a15, panel #2D3748, soft panel #233042, stroke #39465A

Usage:

- Primary buttons/links: Teal (#16A394) fill on deep background; hover/active to #128778.
- Secondary buttons: Outline with #7F9CF5; text #F7FAFC; hover darkens border/fill subtly.
- Data highlights and positive trends: #16A394 with light text.
- Tables/panels: dark surfaces (#2D3748/#233042) with clear gridlines; text #F7FAFC; teal for active states; amber for secondary/neutral tags.
- Draft board emphasis: background #090a15/#2D3748; teal for active/available; warning #CC8B2F; error #C44747; focused/selected states outlined clearly for keyboard users.

Inspiration and UX references:

- BenchApp — simple grouping of data/screens with minimal clicks; emphasizes clarity and low-friction navigation.
- Yahoo Fantasy (fantasysports.yahoo.com) — data-driven dashboards and screens; strong use of tables/leaderboards, quick context switching.

**Interactive Visualizations:**

- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

### 3.2 Typography System

- Heading font: Space Grotesk (fallback: Inter, system) for strong display on dark backgrounds.
- Body font: Inter (fallback: system) for dense data readability.
- Type scale (desktop → mobile): h1 32/28 semi-bold, h2 28/24 semi-bold, h3 24/20 semi-bold, h4 20/18 medium, body 16/15 regular, small 14/13 regular, mono for stats/IDs.
- Line heights: headings 1.2, body 1.5, small 1.4; tighten to 1.35 for tables to maintain density.
- Weights: 600 for primary headings and CTAs, 500 for secondary labels, 400 for body.

### 3.3 Spacing & Layout System

- Base spacing unit: 8px (micro 4px for tight controls, max 48px for hero/rail padding).
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Corners: cards/panels 12-14px, inputs/buttons 10-12px, pills 999px.
- Grid/containers: mobile full-bleed with 16px inset, tablet max width ~720px with 20px gutters, desktop max width ~1200–1280px with 24px gutters; use 12-column layout on desktop, 6 on tablet.
- Density: default “condensed” for tables/lists; allow “comfortable” variant with +4px vertical padding where readability is prioritized over density.

Token quick-reference (dev handoff):

- Colors: `--bg #090a15`, `--panel #2D3748`, `--panel-2 #233042`, `--text #F7FAFC`, `--primary #16A394`, `--primary-strong #128778`, `--secondary #7F9CF5`, `--secondary-strong #6885E6`, `--warning #CC8B2F`, `--error #C44747`, `--info #2F6CC8`, `--stroke #39465A`.
- Typography: h1 32/28 @600 lh1.2; h2 28/24 @600 lh1.2; h3 24/20 @600 lh1.25; h4 20/18 @500 lh1.3; body 16/15 @400 lh1.5; small 14/13 @400 lh1.4; mono for IDs/stats.
- Spacing: 4-8-12-16-20-24-32-40-48; default gutters 16/20/24 (mobile/tablet/desktop); cards radius 12-14; inputs/buttons radius 10-12; pills 999px.

---

## 4. Design Direction

### 4.1 Chosen Design Approach

Chosen blend: Dense Command Center + Draft Day Live + Schedule & Standings Hub (mobile-first, data-dense, dark mode)

- Command Center framing: Desktop gets left rail + sticky header with quick stats cards; mobile keeps a compact top bar and bottom tab/CTA for key actions.
- Draft focus: Two-pane layout (pick context + board); current pick banner, keepers, available players; collapses to stacked cards on mobile; strong focus/keyboard states for admins.
- Schedules/standings: Tabbed views with fast filter chips; responsive tables that degrade to summary tiles/lists on mobile; sticky context (league/season/team) and deep-linkable filters.
- Navigation: Top bar with league/season selector + quick tabs; lightweight rail on desktop; primary actions reachable via floating button/bottom bar on mobile.
- Visual cues: High-contrast states for current pick, published/active games, and pending stats; teal accents for safe/active, amber/red for warnings/errors.

**Interactive Mockups:**

- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html)

---

## 5. User Journey Flows

### 5.1 Critical User Paths

Key journeys to design:

- Draft Day Live Flow (critical)
- League Schedule Browse
- Team Schedule Browse
- Standings/Stats Browse
- Stats Submission (manager → admin approval)

Draft Day Live Flow (approach: two-pane desktop, stacked mobile):

1. Entry: Landing on draft view with current league/season; current pick banner + timer; summary of next picks.
2. Input: Select team/pick action; choose player from available list (search/filter by position/rating); keepers visible.
3. Feedback: Live board updates current pick/available/recent picks; audit/confirmation chip.
4. Success: Roster updates; board advances to next pick; toast/inline confirmation.
5. Errors: Duplicate pick blocked with inline error; conflict states (player unavailable) highlighted in red; undo/override available to admins.

League Schedule Browse:

- Entry: League context selected; schedule tab active; filter chips for date/location/status.
- Display: Table/grid on desktop; list with collapsible cards on mobile; published state clearly indicated.
- Success: Users see all games; quick filters respond instantly; deep links to game detail.
- Errors: Empty states for no games; messaging when filters yield nothing.

Team Schedule Browse:

- Entry: Team scoped; schedule filtered to team; same tab set.
- Display: Team-focused list/table; quick switch to league view; highlight upcoming games.
- Success/Error handling mirrors league schedule.

Standings/Stats Browse:

- Entry: Standings tab; filters for season/division; leaderboards for players/teams.
- Display: Tables with pinned columns on desktop; summary tiles + sortable lists on mobile.
- Success: Clear rank indicators; trend arrows; tooltips for stat definitions.
- Errors: Empty/unpublished states; clarify when data pending admin approval.

Stats Submission (manager) → Admin Approval:

- Entry: Manager selects game; submission form (scores/penalties/stats).
- Input: Form with validation; inline errors; clear required fields.
- Feedback: Pending state after submit; toast confirmation.
- Admin: Review queue; approve/reject with reason; published state updates standings/leaderboards.
- Errors: Invalid payloads blocked with specific messages; retry guidance.

---

## 6. Component Library

### 6.1 Component Strategy

Design system base: HeroUI + Tailwind + dark theme tokens.

Components from system:

- App shell: top bar, sidebar/rail, tabs, drawers, modals, toasts.
- Inputs: text, select, combobox, segmented controls, chips, date/time pickers.
- Data display: tables (sortable/paginated), cards, accordions, badges, skeletons.
- Feedback: alerts, inline validation, spinners/skeletons, toasts.

Custom/highly-tuned components:

- Draft Board Pane: current pick banner, pick queue, available players with filters/search, recent picks, keeper flags, admin controls (override/undo).
- Draft Pick Action Bar: role-aware controls (admin/manager/viewer), keyboard-friendly shortcuts, confirmation/audit chips.
- Schedule Table/Card Hybrid: dense table on desktop; collapsible cards/list on mobile with quick filters and status tags.
- Standings/Leaderboards: sortable with pinned columns; trend arrows; mobile summary tiles with expand for details.
- Stats Submission Form: guided sections for scores/penalties/stats; inline validation; pending state indicator.
- Approval Queue: admin review list with approve/reject, reason capture, and immediate published-state updates.

States/variants to document:

- Interactive states: default, hover, active, focus-visible (strong outlines), loading, disabled.
- Tables: row hover, selected, error/warning states, condensed density toggle.
- Draft board: current pick highlight, keeper flag, unavailable/locked states, conflict error.
- Status tags: published/active/pending/delayed/error with consistent color tokens.

### 6.2 Component States & Variants (Implementable)

- Draft Board Pane: states for current pick, upcoming pick queue, keeper flagged, locked/unavailable, conflict/error; variants for desktop two-pane vs. stacked mobile; focus-visible outlines on cards/rows and actionable chips.
- Draft Pick Action Bar: role-aware states (admin override, manager submit, viewer read-only); active/loading/disabled; keyboard shortcuts surfaced via tooltips/ARIA hints.
- Schedule Table/Card Hybrid: table row hover/selected/error; mobile card variant with chips for status/date; density toggle (condensed/comfortable); empty/no-results state.
- Standings/Leaderboards: sortable headers with focus/hover; pinned columns on desktop; mobile summary tiles with “expand for details”; trend indicator states (up/down/steady).
- Stats Submission Form: default/dirty/submitted/pending; inline validation errors; autosave/unsaved warning; success confirmation chip/toast.
- Approval Queue: item states pending/approved/rejected; reason capture required on reject; bulk action disabled until selection; optimistic update with revert on failure.

Component UI key (apply to all):

- Focus: 2px outline #7F9CF5 outside border; maintain visible ring on dark surfaces.
- Hover: lift +2px shadow on cards; darken fills 8–10% on buttons; underline on tertiary text links.
- Active: compress shadow; darken fills 12–14%; keep outline on keyboard activation.
- Disabled: 45–55% opacity on text/icons; desaturate fills; cursor default.
- Loading: replace label with spinner/skeleton; preserve layout width to avoid shifts.
- Error state: border/stroke #C44747, background tint rgba(196, 71, 71, 0.12); inline message 14px, left-aligned.
- Success state: border/stroke #16A394, background tint rgba(22, 163, 148, 0.14); chip/toast paired for confirmations.

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

Button hierarchy:

- Primary: Teal (#16A394) fill on slate; hover #128778; focus ring lighter teal; used for critical actions (draft submit, publish, approve).
- Secondary: Outline with periwinkle (#7F9CF5) on slate; hover shifts border/text toward #6885E6; used for filters/navigation.
- Tertiary: Text buttons with subtle underline; used for low-affordance links.
- Destructive: Brick red (#C44747) fill/outline with clear focus/hover.

Feedback patterns:

- Success: Toast + inline confirmation chip; non-blocking.
- Error: Inline and toast; keep context visible; highlight fields/rows in error.
- Warning: Amber tag/inline note; optional toast for critical warnings.
- Loading: Skeletons for tables/cards; spinners for actions; optimistic UI for draft picks where safe.

Form patterns:

- Labels above fields; required indicated with “(required)” text.
- Validation on blur + on submit; inline error text under field.
- Help text as caption beneath inputs.

Modal/drawer patterns:

- Use drawers on mobile, modals on desktop for multi-step forms.
- Dismiss: explicit close; escape allowed; click-out optional for non-critical.
- Focus management: initial focus set; trap focus; return focus on close.

Navigation patterns:

- Active state: clear underline + color shift.
- Breadcrumbs: optional in deep settings; tabs for primary sections.
- Back behavior: browser back respected; in-flow back controls for draft subviews.
- Deep links: filters and league/season/team context reflected in URL params.

Empty state patterns:

- First use: short explainer + primary CTA.
- No results: clear message + reset filters.
- Cleared content: undo option where safe.

Confirmation patterns:

- Destructive actions (delete/override): confirm modal; offer undo where possible.
- Leave unsaved: prompt on dirty forms; autosave drafts when feasible (not for draft picks).

Notification patterns:

- Toasts top-right desktop; top stacked on mobile; priority ordering (error > warning > success > info).
- Auto-dismiss for success/info; sticky for error/warning until resolved.

Search/filter patterns:

- Trigger: instant for filters; enter for search where heavy.
- Results: tables/cards update live; loading state visible.
- No results: suggest clearing filters or altering search.

Date/time patterns:

- Format: absolute dates with time; relative for recent updates; timezone aware; league/season context shown.
- Pickers: date/time pickers with keyboard support; mobile-friendly.

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

Responsive layout (mobile-first):

- Mobile: single-column; stacked cards for draft board (current pick banner, queue, available players), list/card schedules, summary tiles for standings.
- Tablet: two-column where space allows (draft board + context sidebar); tab bar persists.
- Desktop: command-center layout with rail + sticky header; two/three columns for data (tables with pinned columns).

Breakpoints (tailored for Tailwind defaults):

- Mobile: up to ~640px (stacked)
- Tablet: ~640–1024px (two-column)
- Desktop: 1024px+ (rail + multi-column data)

Adaptation patterns:

- Navigation: top bar + tabs on mobile; rail + tabs on desktop; league/season/team selectors stay visible.
- Tables: condense density; on mobile, collapse to cards with key fields surfaced.
- Modals: drawers on mobile for multi-step forms; centered modals on desktop.
- Forms: single column on mobile; two columns on desktop where appropriate.
- Draft board: current pick banner pinned; available list scrollable; filters collapse to chips on mobile.

Accessibility:

- Target: WCAG 2.1 AA (legally safe default).
- Color contrast: ensure text/background meets AA; verify mint-on-teal combinations.
- Keyboard navigation: all interactive elements focusable; visible focus rings; skip-to-content.
- ARIA: meaningful labels for controls, tables with proper headers, live regions for toasts.
- Touch targets: ≥44px on mobile; spacing tuned for dense but tappable controls.
- Screen reader: describe current pick, keeper states, and statuses; announce toast messages.
- Error identification: inline, descriptive; link to offending fields.
- Testing: run axe/Lighthouse; keyboard-only pass for draft, schedule, stats flows.

---

## 9. Implementation Guidance

### 9.1 Completion Summary

Deliverables captured:

- Design system: HeroUI + Tailwind with dark-mode palette (slate background, teal primary, periwinkle secondary, near-white text).
- Design direction: Blend of Command Center + Draft Day Live + Schedule & Standings Hub (mobile-first, data-dense).
- Core journeys: Draft Day Live, league/team schedules, standings/stats, stats submission + admin approval.
- Components: Draft board pane/action bar, schedule table/card hybrid, standings/leaderboards, stats submission, approval queue.
- Patterns: Buttons/feedback/forms/modals/navigation/empty/confirmation/notifications/search/date-time.
- Responsive & accessibility: Mobile-first breakpoints, adaptive layouts, WCAG 2.1 AA focus, strong keyboard/ARIA contrast guidance.

### 9.2 Implementation Checklist (Dev)

- Palette in Tailwind/HeroUI: extend Tailwind theme with `colors.{primary,primary-strong,secondary,secondary-strong,warning,error,info,bg,panel,panel2,stroke,text}` per tokens; wire HeroUI theme tokens to these entries (primary, accent, surface, border, text).
- CSS variables: define the token set in a global `:root` (and `.dark`) with the same values used in `ux-color-themes.html` to keep docs and app in sync.
- Typography: add font stack (Space Grotesk for headings, Inter for body) in Tailwind `fontFamily`; map weights to utility classes; apply scale in heading components.
- Spacing/layout: set spacing scale (4-48) and container widths/gutters in Tailwind config; ensure “condensed” and “comfortable” table variants exist via utilities.
- Components: apply the Component UI key (focus/hover/active/disabled/loading/error/success) to button, chip, table row, card, and input primitives; ensure focus rings use #7F9CF5.
- States: implement error/success tints and outlines using the specified semantic colors; ensure loading preserves layout width with spinners/skeletons.
- Accessibility: confirm contrast AA with new colors; enforce focus-visible styles; add ARIA labels for draft states, tables, toasts; touch targets ≥44px.
- Theming test: snapshot core screens (draft board, schedule, standings, stats form) after theme wiring to verify color application and state visibility.

### 9.3 Tailwind/HeroUI Theme Snippets (apply in codebase)

Tailwind config (extend theme):

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#090a15",
        panel: "#2D3748",
        panel2: "#233042",
        text: "#F7FAFC",
        primary: "#16A394",
        "primary-strong": "#128778",
        secondary: "#7F9CF5",
        "secondary-strong": "#6885E6",
        warning: "#CC8B2F",
        error: "#C44747",
        info: "#2F6CC8",
        stroke: "#39465A",
      },
      fontFamily: {
        heading: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        panel: "14px",
        control: "12px",
      },
      spacing: {
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
      },
    },
  },
};

export default config;
```

HeroUI theme (palette + focus ring):

```ts
// src/app/hero.ts
import { heroui } from "@heroui/react";

export default heroui({
  themes: {
    dark: {
      colors: {
        background: "#090a15",
        foreground: "#F7FAFC",
        primary: "#16A394",
        primaryForeground: "#022824",
        secondary: "#7F9CF5",
        secondaryForeground: "#0A1026",
        success: "#128778",
        warning: "#CC8B2F",
        danger: "#C44747",
        info: "#2F6CC8",
        focus: "#7F9CF5",
        default: "#2D3748",
        defaultForeground: "#F7FAFC",
        border: "#39465A",
      },
    },
  },
});
```

CSS variables (keep docs + app aligned):

```css
:root {
  --bg: #090a15;
  --panel: #2d3748;
  --panel-2: #233042;
  --text: #f7fafc;
  --primary: #16a394;
  --primary-strong: #128778;
  --secondary: #7f9cf5;
  --secondary-strong: #6885e6;
  --warning: #cc8b2f;
  --error: #c44747;
  --info: #2f6cc8;
  --stroke: #39465a;
}
```

---

## Appendix

### Related Documents

- Product Requirements: `ai-docs/prd.md`
- Product Brief: `ai-docs/product-brief-schultz-hockey-league-2025-11-27.md`
- Brainstorming: `None provided`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: ai-docs/ux-color-themes.html
  - Status: Generated (current palette applied)
  - Interactive HTML showing theme tokens
  - Live UI component examples in the chosen theme
  - Extendable to add side-by-side comparisons if new themes are explored

- **Design Direction Mockups**: ai-docs/ux-design-directions.html
  - Status: Generated (aligned to current palette)
  - Interactive HTML scaffold for design direction cards/layouts
  - Extend with 6-8 full-screen mockups as needed
  - Design philosophy and rationale for each direction

### Optional Enhancement Deliverables

_This section will be populated if additional UX artifacts are generated through follow-up workflows._

<!-- Additional deliverables added here by other workflows -->

### Next Steps & Follow-Up Workflows

This UX Design Specification can serve as input to:

- **Wireframe Generation Workflow** - Create detailed wireframes from user flows
- **Figma Design Workflow** - Generate Figma files via MCP integration
- **Interactive Prototype Workflow** - Build clickable HTML prototypes
- **Component Showcase Workflow** - Create interactive component library
- **AI Frontend Prompt Workflow** - Generate prompts for v0, Lovable, Bolt, etc.
- **Solution Architecture Workflow** - Define technical architecture with UX context

### Version History

| Date       | Version | Changes                         | Author  |
| ---------- | ------- | ------------------------------- | ------- |
| 2025-11-30 | 1.0     | Initial UX Design Specification | Schultz |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
