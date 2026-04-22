# moomoocow-devlog 디자인 시스템 명세

기준일: 2026-04-22  
버전: v1.1 (Hermes 벤치마크 정합)

## 1) Context and Goals
본 문서는 `moomoocow-devlog`의 공개 블로그/어드민 UI를 일관된 토큰 기반 시스템으로 구현하기 위한 기준이다.

- 디자인 시스템은 `DEVELOPMENT_SPEC.md` 확정 스택과 정합되어야 한다.
- 구현 라이브러리는 `shadcn/ui + Radix Primitives + Tailwind CSS + CVA`를 기본으로 사용해야 한다.
- 모든 컴포넌트와 화면은 WCAG 2.2 AA를 충족해야 한다.

## 2) Benchmark Reference (Hermes)
이 프로젝트는 아래 레퍼런스를 벤치마크로 삼는다.

- Product/brand: Hermes Agent — An Agent That Grows With You
- URL: https://hermes-agent.nousresearch.com/
- Audience: developers and technical teams
- Product surface: documentation site
- Visual direction: clean, functional, implementation-oriented

주의:
- 본 프로젝트는 Hermes를 복제하지 않는다.
- 레이아웃/톤/가독성/정보 구조 원칙을 참고해 우리 브랜드 문맥으로 재해석해야 한다.

## 3) Style Foundations (Benchmark-Informed)
아래 항목은 Hermes 벤치마크에서 참고한 foundation을 우리 시스템 규칙으로 변환한 것이다.

### 3-1. Typography Foundation
벤치마크 입력값(참고):
- `font.family.primary=mondwestFont`
- `font.size.base=14px`
- `font.weight.base=400`
- `font.lineHeight.base=21px`
- scale: `xs/sm/md/lg/xl/2xl`

프로젝트 적용 규칙:
- 기본 body 타이포는 `14px / 1.5`를 기준으로 해야 한다.
- 타이포 단계는 `xs/sm/base/lg/xl/2xl/3xl`로 확장해 관리해야 한다.
- 코드 블록/인라인 코드는 고정폭 폰트를 사용해야 한다.

### 3-2. Color Foundation
벤치마크 입력값(참고):
- 밝은 텍스트 + 어두운 표면 대비
- muted/border 계열을 분리해 계층감을 만드는 방식

프로젝트 적용 규칙:
- raw hex 직접 사용 대신 semantic token을 사용해야 한다.
- 최소 토큰:
  - `--background`, `--foreground`
  - `--muted`, `--muted-foreground`
  - `--card`, `--card-foreground`
  - `--border`, `--input`, `--ring`
  - `--primary`, `--primary-foreground`
  - `--destructive`, `--destructive-foreground`
- 기본 테마는 dark-first를 허용하되, 대비 기준(WCAG 2.2 AA)을 반드시 충족해야 한다.

### 3-3. Spacing Foundation
벤치마크 입력값(참고):
- `space.1=14px`, `space.2=28px`처럼 큰 리듬 단위 사용

프로젝트 적용 규칙:
- 시스템 기본 간격은 4px 배수 체계를 사용해야 한다.
- 문서형 레이아웃(블로그 본문)은 14/28 기반 vertical rhythm을 보조 단위로 사용할 수 있다.
- one-off 간격 값은 금지해야 한다.

### 3-4. Radius/Motion Foundation
벤치마크 입력값(참고):
- 매우 큰 radius 값, `motion.duration.instant=150ms`

프로젝트 적용 규칙:
- radius는 `--radius-sm/md/lg` semantic token만 사용해야 한다.
- 기본 인터랙션 duration은 120ms~200ms 범위여야 한다.
- `prefers-reduced-motion` 환경에서는 모션을 축소/비활성화해야 한다.

## 4) Token Draft (Hermes-leaning)
아래 값은 벤치마크 무드를 최대한 유지하기 위한 초기 토큰 초안이다.  
실제 구현 시작점으로 사용하고, 접근성 검증 결과에 따라 미세 조정해야 한다.

```css
:root {
  /* Typography */
  --font-sans: "Mondwest", "Inter", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace;

  --font-size-xs: 0.625rem;   /* ~10px */
  --font-size-sm: 0.8125rem;  /* ~13px */
  --font-size-base: 0.875rem; /* 14px */
  --font-size-lg: 0.9375rem;  /* 15px */
  --font-size-xl: 1rem;       /* 16px */
  --font-size-2xl: 2.25rem;   /* 36px */
  --font-size-3xl: 2.75rem;   /* 확장 단계 */
  --line-height-base: 1.5;    /* 21px@14px */

  /* Spacing (4px grid + Hermes rhythm) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 0.875rem; /* 14px (Hermes rhythm) */
  --space-5: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-7: 1.75rem;  /* 28px (Hermes rhythm) */
  --space-8: 2rem;     /* 32px */

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.875rem;

  /* Motion */
  --motion-instant: 150ms;
  --motion-fast: 120ms;
  --motion-normal: 180ms;

  /* Color (dark-first, Hermes-inspired) */
  --background: oklch(0.12 0 0);
  --foreground: oklch(0.93 0.03 55);

  --card: oklch(0.15 0 0);
  --card-foreground: var(--foreground);

  --muted: oklch(0.92 0.02 50 / 0.08);
  --muted-foreground: oklch(0.82 0.02 55);

  --border: oklch(0.92 0.02 50 / 0.20);
  --input: oklch(0.92 0.02 50 / 0.20);
  --ring: oklch(0.85 0.04 58);

  --primary: oklch(0.92 0.03 56);
  --primary-foreground: oklch(0.15 0 0);

  --destructive: oklch(0.62 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
}
```

### 4-1. Hermes Mapping Notes
- `font.size.base=14px`, `lineHeight=21px`는 `--font-size-base`, `--line-height-base`로 반영해야 한다.
- `space.1=14px`, `space.2=28px`는 `--space-4`, `--space-7`로 보조 리듬에 반영해야 한다.
- `motion.duration.instant=150ms`는 `--motion-instant`로 고정해야 한다.
- Hermes의 밝은 텍스트/어두운 표면 대비는 `--foreground`/`--background` 조합으로 유지해야 한다.
- 매우 큰 radius는 그대로 복제하지 말고, 제품 사용성에 맞는 `sm/md/lg` 체계로 정규화해야 한다.

## 5) Library and Implementation Rules

### 5-1. shadcn/ui
- shadcn/ui는 "시작점"으로 사용해야 하며, 소스 코드를 로컬에서 수정 가능해야 한다.
- 컴포넌트는 `src/components/ui` 하위에서 관리해야 한다.

### 5-2. Radix Primitives
- Dialog, Dropdown, Select, Tabs 등 복합 인터랙션은 Radix 기반으로 구현해야 한다.
- 키보드 내비게이션/포커스 트랩/ARIA 동작을 훼손하면 안 된다.

### 5-3. Tailwind CSS
- Tailwind 유틸리티 + CSS 변수 토큰 조합을 기본으로 사용해야 한다.
- 반복되는 스타일은 컴포넌트/유틸 레벨로 추출해야 한다.

### 5-4. CVA
- 변형이 있는 컴포넌트(Button/Input/Badge/Alert)는 CVA로 variant를 정의해야 한다.
- 최소 variant 축은 `size`, `intent`, `state`를 고려해야 한다.

## 6) Component Rules
모든 인터랙티브 컴포넌트는 아래 상태를 반드시 정의해야 한다.

- default
- hover
- focus-visible
- active
- disabled
- loading
- error

상호작용/반응형/엣지케이스 규칙:
- Keyboard: `Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc` 경로가 예측 가능해야 한다.
- Pointer: 클릭 타겟은 최소 24x24px, 권장 32x32px 이상이어야 한다.
- Touch: hover 의존 상호작용을 금지해야 한다.
- Responsive: 모바일 우선이며 `mobile/tablet/desktop` 3단계를 보장해야 한다.
- Edge cases: 긴 제목/긴 태그/긴 코드 블록에서도 깨지지 않아야 하며 Empty/Loading/Error 상태를 제공해야 한다.

## 7) Accessibility Requirements

### 7-1. Non-negotiable
- 모든 페이지는 키보드만으로 주요 플로우 탐색이 가능해야 한다.
- `:focus-visible`은 항상 시각적으로 명확해야 한다.
- 텍스트 대비는 WCAG 2.2 AA를 충족해야 한다.
- 모든 입력 필드는 label 또는 동등한 접근성 이름을 가져야 한다.

### 7-2. Pass/Fail Checks
- Pass: 마우스 없이 포스트 작성(어드민) 및 포스트 탐색(공개 페이지) 완료 가능
- Pass: 모달/드롭다운 닫힘 시 트리거로 포커스 복귀
- Pass: 오류 메시지와 필드 연결(`aria-describedby`)
- Fail: placeholder만 있고 label이 없는 입력
- Fail: 배경과 구분 안 되는 focus ring

## 8) Content and Tone Standards
- 문장 톤은 concise, confident, implementation-focused 여야 한다.
- 액션 라벨은 동사 중심으로 명확해야 한다.
- 모호한 라벨("확인", "처리", "클릭")은 금지해야 한다.

## 9) Anti-Patterns
- raw hex 직사용 금지
- semantic element 대체(div/button role 남용) 금지
- `outline: none` 단독 사용 금지
- 임의 타이포/간격 예외 추가 금지

## 10) QA Checklist
- [ ] 토큰 외 색상/간격/반경 직사용이 없는가?
- [ ] 모든 인터랙티브 컴포넌트 상태(default~error)가 정의되었는가?
- [ ] 키보드 접근성과 focus-visible이 검증되었는가?
- [ ] 모바일/데스크톱에서 레이아웃 깨짐이 없는가?
- [ ] Empty/Loading/Error 상태가 구현되었는가?
- [ ] 공개/어드민이 동일 토큰 체계를 공유하는가?

## 11) Quality Gates
- 모든 non-negotiable rule 문장은 "must"로 작성해야 한다.
- 모든 recommendation 문장은 "should"로 작성해야 한다.
- 접근성 규칙은 구현에서 pass/fail 테스트 가능해야 한다.
- 개별 화면 예외보다 시스템 일관성을 우선해야 한다.
