# Design System Specification

## Context and goals
Design intent: moomoocow-devlog UI must provide a clean, functional, implementation-oriented reading and writing experience for developers, benchmarked against Hermes Agent style while fitting blog/admin workflows.

- Product/brand: moomoocow-devlog
- Benchmark reference: https://hermes-agent.nousresearch.com/
- Audience: developers and technical teams
- Product surfaces:
  - Public blog (`/`, `/posts`, `/posts/[slug]`)
  - Admin dashboard/editor (`/admin`, `/admin/new`)

## Design tokens and foundations

### Foundation direction
- Visual style must be clean, functional, and implementation-oriented.
- Token usage must prefer semantic aliases over raw color literals.
- Typography must prioritize technical readability over decorative styling.

### Typography tokens
- `font.family.primary` must use a readable sans stack for Korean/English mixed content.
- `font.family.display` should be used only for major headings/brand lines.
- `font.size.base` must be `14px`.
- `font.weight.base` must be `400`.
- `font.lineHeight.base` must be `21px`.
- Scale:
  - `font.size.xs=10px`
  - `font.size.sm=13px`
  - `font.size.md=14px`
  - `font.size.lg=15px`
  - `font.size.xl=16px`
  - `font.size.2xl=36px`

### Color tokens
- Dark-first palette should follow Hermes-like contrast and warmth.
- `color.text.primary` must be high-contrast on dark surface.
- `color.surface.base` must represent primary page background.
- `color.surface.muted` should be used for cards/panels/inputs.
- `color.border.muted` should be used for default boundaries.
- `color.border.strong` should be used for emphasized boundaries.
- Focus/interactive colors must be represented as semantic tokens:
  - `color.focus.ring`
  - `color.action.primary`
  - `color.action.primaryForeground`
  - `color.feedback.error`

### Spacing, radius, motion
- Base spacing unit must be 14px.
- Spacing scale should include `14px`, `28px`, and larger layout tokens for section rhythm.
- `radius.base` should be moderate and consistent across components.
- Motion duration token:
  - `motion.duration.instant=150ms`
- State transitions should use tokenized timing and avoid ad-hoc durations.

## Component-level rules

### Global rules
- Every interactive component must define states:
  - default
  - hover
  - focus-visible
  - active
  - disabled
  - loading
  - error
- Every component must define responsive behavior for mobile and desktop.
- Every component must define handling for long-content, overflow, and empty-state.

### Layout shell (Header / Content / Footer)
- Shell must remain structurally consistent across public and admin surfaces.
- Header must contain primary navigation and theme toggle.
- Footer should contain lightweight metadata/navigation and must not compete with content.
- Mobile layout must collapse side regions into stacked sections without clipping.

### Navigation and sidebars
- Public pages must provide category, popular posts, recent posts, and recent comments modules.
- Sidebar modules should keep consistent heading, spacing, and link density.
- Current item indicators must be visually distinct and keyboard-discernible.

### Post card list
- Post cards must prioritize title and summary readability.
- Metadata (author/date/category/tags) should be secondary but always visible.
- Card actions must preserve pointer and keyboard parity.

### Search input
- Search must expose clear placeholder and immediate focus-visible feedback.
- Empty query and no-result states must be explicit and readable.

### Post detail
- Header area must include title, author, date, share action, tags, and current category context.
- TOC must be visible on desktop and accessible via collapsed section on mobile.
- Previous/next post navigation must be present near the bottom.
- Comment section must include input, submit action, and empty/loading/error states.

### Admin dashboard
- Dashboard must include:
  - category summary
  - popular posts
  - recent posts
  - recent comments
  - central post management list
- Actions must include:
  - category management
  - new post
  - logout
- Post rows/cards must expose edit actions clearly.

### Editor and publish dialog
- Editor must support split view (markdown input + preview).
- Publish/update flow must require confirmation dialog with:
  - thumbnail image or URL
  - title
  - summary
  - visibility
  - category
- Dialog submission must communicate loading/success/error states explicitly.

### Input behavior specification
- Keyboard:
  - All actions must be reachable via Tab/Shift+Tab.
  - Enter/Escape behavior must be documented for dialogs and forms.
- Pointer:
  - Click targets must meet minimum target size and spacing.
- Touch:
  - Interactive controls must remain usable without hover dependency.

## Accessibility requirements and testable acceptance criteria
- Target must be WCAG 2.2 AA.
- Focus-visible indicators must always be present on keyboard navigation.
- Contrast must satisfy AA for body text and UI controls.
- Semantic landmarks (`header`, `main`, `nav`, `footer`) must be used correctly.
- Acceptance checks:
  - Pass: keyboard-only user can login, open editor, and publish draft.
  - Pass: all interactive controls show visible focus ring.
  - Pass: no text/control pair falls below required contrast.
  - Fail: hidden focus indicator, hover-only affordance, or unlabeled action control.

## Content and tone standards
- Tone must be concise, confident, and implementation-focused.
- Labels must be explicit and unambiguous.
- Button text should use action verbs with clear outcomes.
- Examples:
  - Good: `새 글 작성`, `출간하기`, `임시저장`, `카테고리 관리`
  - Bad: `확인`, `진행`, `다음`

## Anti-patterns and prohibited implementations
- Low-contrast text or hidden focus ring must not be shipped.
- One-off spacing/typography exceptions must not be introduced.
- Ambiguous labels and generic action names must not be used.
- Component guidance without explicit state rules must not be accepted.
- Raw hex colors in component code should not be preferred over semantic tokens.

## QA checklist
- [ ] Every component documents default/hover/focus-visible/active/disabled/loading/error states.
- [ ] Responsive behavior is validated for mobile and desktop.
- [ ] Long-content, overflow, and empty states are defined and tested.
- [ ] Keyboard, pointer, and touch behavior are all documented.
- [ ] WCAG 2.2 AA contrast and focus-visible checks pass.
- [ ] Labels and actions are explicit and implementation-focused.
- [ ] Token usage is semantic and consistent across pages.

## Quality gates
- Non-negotiable rules must use `must`.
- Recommendations should use `should`.
- Accessibility requirements must be testable in implementation.
- System consistency should be preferred over local visual exceptions.

