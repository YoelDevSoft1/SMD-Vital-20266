/**
 * Tailwind Config — SMD-Vital Design System
 *
 * Token philosophy:
 *   - Semantic tokens (background, foreground, primary, etc.) drive dark/light via CSS vars.
 *   - Status tokens (success/warning/danger/info/neutral) power badges, alerts, stat tiles.
 *   - Role tokens (role-admin, role-doctor, etc.) unify user role badges across the app.
 *   - Brand scale (brand-50 → brand-900) is the full clinical-blue ramp.
 *
 * Never use raw color classes (bg-blue-50) in components — always reach for the tokens.
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ---------- BRAND SCALE (clinical blue) ----------
      brand: {
        50:  'hsl(214 100% 97%)',
        100: 'hsl(214 95% 93%)',
        200: 'hsl(213 97% 87%)',
        300: 'hsl(212 96% 78%)',
        400: 'hsl(213 94% 68%)',
        500: 'hsl(217 91% 60%)', // primary
        600: 'hsl(221 83% 53%)',
        700: 'hsl(224 76% 48%)',
        800: 'hsl(226 71% 40%)',
        900: 'hsl(224 64% 33%)',
      },

      // ---------- SEMANTIC TOKENS (dark/light via :root/.dark CSS vars) ----------
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ---------- STATUS (semantic, light + dark) ----------
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          muted: 'hsl(var(--success-muted))',
          'muted-foreground': 'hsl(var(--success-muted-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          muted: 'hsl(var(--warning-muted))',
          'muted-foreground': 'hsl(var(--warning-muted-foreground))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
          muted: 'hsl(var(--danger-muted))',
          'muted-foreground': 'hsl(var(--danger-muted-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          muted: 'hsl(var(--info-muted))',
          'muted-foreground': 'hsl(var(--info-muted-foreground))',
        },
        neutral: {
          DEFAULT: 'hsl(var(--neutral))',
          foreground: 'hsl(var(--neutral-foreground))',
          muted: 'hsl(var(--neutral-muted))',
          'muted-foreground': 'hsl(var(--neutral-muted-foreground))',
        },

        // ---------- ROLE (unified across Users / UserDetailsView / Header) ----------
        'role-admin': {
          DEFAULT: 'hsl(var(--role-admin))',
          muted: 'hsl(var(--role-admin-muted))',
        },
        'role-super': {
          DEFAULT: 'hsl(var(--role-super))',
          muted: 'hsl(var(--role-super-muted))',
        },
        'role-doctor': {
          DEFAULT: 'hsl(var(--role-doctor))',
          muted: 'hsl(var(--role-doctor-muted))',
        },
        'role-nurse': {
          DEFAULT: 'hsl(var(--role-nurse))',
          muted: 'hsl(var(--role-nurse-muted))',
        },
        'role-patient': {
          DEFAULT: 'hsl(var(--role-patient))',
          muted: 'hsl(var(--role-patient-muted))',
        },
        'role-agent': {
          DEFAULT: 'hsl(var(--role-agent))',
          muted: 'hsl(var(--role-agent-muted))',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // ---------- TYPOGRAPHY ----------
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
      },

      // ---------- SHADOWS (clinical, subtle) ----------
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        soft:     '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        'soft-md': '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        'soft-lg': '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04)',
        'soft-xl': '0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.04)',
        'glow-brand': '0 0 0 4px hsl(217 91% 60% / 0.15)',
        'glow-success': '0 0 0 4px hsl(142 71% 45% / 0.15)',
        'glow-danger': '0 0 0 4px hsl(0 72% 51% / 0.15)',
      },

      // ---------- TRANSITIONS ----------
      transitionDuration: {
        DEFAULT: '150ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      // ---------- ANIMATIONS ----------
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'press-pulse': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        // Glass blobs (kept from original index.css, now here for tree-shaking)
        glassDrift: {
          '0%':   { transform: 'translate3d(-6%, -4%, 0) scale(1)', opacity: '0.55' },
          '40%':  { transform: 'translate3d(4%, 6%, 0) scale(1.08)', opacity: '0.75' },
          '70%':  { transform: 'translate3d(-2%, 10%, 0) scale(1.04)', opacity: '0.65' },
          '100%': { transform: 'translate3d(6%, -2%, 0) scale(1.02)', opacity: '0.58' },
        },
        glassDriftReverse: {
          '0%':   { transform: 'translate3d(5%, -6%, 0) scale(1.02)', opacity: '0.6' },
          '45%':  { transform: 'translate3d(-8%, 4%, 0) scale(1.07)', opacity: '0.78' },
          '80%':  { transform: 'translate3d(4%, 8%, 0) scale(1.03)', opacity: '0.68' },
          '100%': { transform: 'translate3d(-6%, -3%, 0) scale(1.01)', opacity: '0.6' },
        },
      },
      animation: {
        'fade-in':         'fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-up':        'slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right':  'slide-in-right 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left':   'slide-in-left 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':        'scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer:           'shimmer 1.6s infinite',
        'press-pulse':     'press-pulse 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  // Class strings used dynamically (in Skeleton, glass blobs, shimmer) — Tailwind can't see them statically.
  safelist: [
    'animate-shimmer',
    'animate-fade-in',
    'animate-slide-up',
    'animate-scale-in',
    'animate-press-pulse',
    'animate-spin',
    'glass-blob',
    'glass-blob--reverse',
    'glass-blob--slow',
    'glass-sheen',
  ],
  plugins: [],
};