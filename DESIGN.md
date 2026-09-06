---
name: MOS Grader Pro Design Spec
description: Material Design 3 Expressive Design Specification for MOS Grader Pro Web Application
version: 1.0.0
colors:
  primary: "var(--md-sys-color-primary)"
  onPrimary: "var(--md-sys-color-on-primary)"
  primaryContainer: "var(--md-sys-color-primary-container)"
  onPrimaryContainer: "var(--md-sys-color-on-primary-container)"
  secondary: "var(--md-sys-color-secondary)"
  onSecondary: "var(--md-sys-color-on-secondary)"
  secondaryContainer: "var(--md-sys-color-secondary-container)"
  onSecondaryContainer: "var(--md-sys-color-on-secondary-container)"
  tertiary: "var(--md-sys-color-tertiary)"
  onTertiary: "var(--md-sys-color-on-tertiary)"
  tertiaryContainer: "var(--md-sys-color-tertiary-container)"
  onTertiaryContainer: "var(--md-sys-color-on-tertiary-container)"
  surface: "var(--md-sys-color-surface)"
  onSurface: "var(--md-sys-color-on-surface)"
  surfaceVariant: "var(--md-sys-color-surface-variant)"
  onSurfaceVariant: "var(--md-sys-color-on-surface-variant)"
  surfaceContainerLowest: "var(--md-sys-color-surface-container-lowest)"
  surfaceContainerLow: "var(--md-sys-color-surface-container-low)"
  surfaceContainer: "var(--md-sys-color-surface-container)"
  surfaceContainerHigh: "var(--md-sys-color-surface-container-high)"
  surfaceContainerHighest: "var(--md-sys-color-surface-container-highest)"
  outline: "var(--md-sys-color-outline)"
  outlineVariant: "var(--md-sys-color-outline-variant)"
  error: "var(--md-sys-color-error)"
  onError: "var(--md-sys-color-on-error)"
  errorContainer: "var(--md-sys-color-error-container)"
  onErrorContainer: "var(--md-sys-color-on-error-container)"
typography:
  headlineLarge:
    fontFamily: Google Sans Flex, Be Vietnam Pro, sans-serif
    fontSize: 32px
    fontWeight: 700
  titleMedium:
    fontFamily: Google Sans Flex, Be Vietnam Pro, sans-serif
    fontSize: 16px
    fontWeight: 600
  bodyMedium:
    fontFamily: Google Sans Flex, Be Vietnam Pro, sans-serif
    fontSize: 14px
    fontWeight: 400
rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 28px
  4xl: 32px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  card:
    backgroundColor: "{colors.surfaceContainer}"
    rounded: "{rounded.3xl}"
    hoverRounded: "{rounded.xl}"
    transition: "border-radius 300ms cubic-bezier(0.2, 0, 0, 1), background-color 200ms ease"
---

# MOS Grader Pro — MD3 Expressive Design System

## Overview
Design specification aligning MOS Grader Pro with Material Design 3 (MD3) Expressive standards, utilizing dynamic color tokens, smooth shape morphing, and high-contrast dark mode support.

## Colors
- Rely strictly on CSS custom properties `--md-sys-color-*` provided by `@bug-on/m3-tailwind` and `@bug-on/m3-tokens`.
- Eliminate hardcoded color scales (e.g. emerald-600, blue-600) to guarantee AAA/AA contrast in both light and dark themes.
- Status badges and contextual icons use tonal containers (`primary-container`, `secondary-container`, `tertiary-container`, `error-container`).

## Shapes & Motion
- Expressive Card interaction utilizes corner morphing: from `rounded-3xl` default to `rounded-xl` on hover without Y-axis translation or disruptive shadows.
- Fluid transitions via cubic-bezier(0.2, 0, 0, 1).

## Routing & Navigation
- All card interactions must preserve SPA behaviors using client-side routing (`useNavigate` / `<Link>`).
