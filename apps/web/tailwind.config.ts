import type { Config } from 'tailwindcss'
import path from 'path'

// Resolve relative to this config file regardless of server CWD
const root = path.resolve(__dirname)

const config: Config = {
  content: [
    path.join(root, 'src/pages/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(root, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(root, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'),
    // Fallback relative paths for environments where __dirname may differ
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Safelist: guarantee custom classes always generated (for @apply in globals.css)
  safelist: [
    { pattern: /^bg-(paper|cream|maroon|terra|marigold|turmeric|gold|green|indigo|ink|success|warning|error|info)/ },
    { pattern: /^text-(paper|cream|maroon|terra|marigold|turmeric|gold|green|indigo|ink|success|warning|error|info)/ },
    { pattern: /^border-(paper|cream|maroon|terra|gold|ink|success|warning|error|info)/ },
    { pattern: /^from-(maroon|gold|terra|green)/ },
    { pattern: /^via-(maroon|gold|terra|green)/ },
    { pattern: /^to-(maroon|gold|terra|green)/ },
    { pattern: /^shadow-mj/ },
    { pattern: /^rounded-(mj|pill)/ },
  ],
  theme: {
    extend: {
      colors: {
        // ── Mithila Jodi brand palette ──────────────────────────────────
        paper: {
          DEFAULT: '#FCF5E7',
          2: '#F7EBD3',
          3: '#ECDCC0',
        },
        cream: '#FFFAF0',
        maroon: {
          DEFAULT: '#7A1220',
          2: '#9B2233',
          deep: '#5A0E19',
        },
        terra: '#C4562F',
        marigold: '#E8912A',
        turmeric: '#D6A83C',
        gold: {
          DEFAULT: '#B98A2E',
          lt: '#E4C572',
        },
        green: {
          DEFAULT: '#1F5133',
          2: '#2E7048',
          leaf: '#3E7C4A',
        },
        indigo: {
          DEFAULT: '#2E3A6E',
        },
        ink: {
          DEFAULT: '#2B211C',
          soft: '#6A5A4E',
        },
        // ── Semantic state colours (harmonised with the warm palette) ──
        success: {
          DEFAULT: '#1F5133',
          soft: '#E7F0E9',
          fg: '#1B4A2E',
        },
        warning: {
          DEFAULT: '#B98A2E',
          soft: '#F7ECCF',
          fg: '#6B4E12',
        },
        error: {
          DEFAULT: '#C4562F',
          soft: '#F8E6DE',
          fg: '#8A2F14',
        },
        info: {
          DEFAULT: '#2E3A6E',
          soft: '#E6E8F2',
          fg: '#20294F',
        },
      },
      fontFamily: {
        sans: ['Mukta', 'system-ui', 'sans-serif'],
        serif: ['Marcellus', 'Georgia', 'serif'],
        display: ['Rozha One', 'Marcellus', 'serif'],
        deva: ['Rozha One', 'Tiro Devanagari Hindi', 'serif'],
        hand: ['Kalam', 'cursive'],
      },
      fontSize: {
        'display-xl': ['clamp(48px,7vw,96px)', { lineHeight: '1.05' }],
        'display-lg': ['clamp(38px,5.5vw,72px)', { lineHeight: '1.07' }],
        'display-md': ['clamp(28px,4vw,52px)', { lineHeight: '1.1' }],
      },
      boxShadow: {
        mj: '0 26px 55px -26px rgba(58,20,12,0.5)',
        'mj-sm': '0 14px 30px -18px rgba(58,20,12,0.4)',
        'mj-xs': '0 4px 12px -4px rgba(58,20,12,0.25)',
        'mj-soft': '0 10px 28px -14px rgba(90,40,20,0.28), 0 2px 6px -3px rgba(90,40,20,0.14)',
      },
      backgroundImage: {
        'paper-texture': `
          radial-gradient(circle at 10% 12%, rgba(232,145,42,0.12), transparent 40%),
          radial-gradient(circle at 92% 6%, rgba(122,18,32,0.09), transparent 42%),
          radial-gradient(circle at 78% 96%, rgba(31,81,51,0.08), transparent 44%),
          radial-gradient(circle at 30% 80%, rgba(214,168,60,0.08), transparent 40%)
        `,
        'maroon-gradient': 'linear-gradient(180deg, #9B2233, #7A1220)',
        'gold-gradient': 'linear-gradient(180deg, #E4C572, #D6A83C)',
      },
      borderRadius: {
        'mj': '18px',
        'mj-sm': '12px',
        'mj-lg': '22px',
        'pill': '999px',
      },
      transitionTimingFunction: {
        'mj-out': 'cubic-bezier(0.2, 0.8, 0.3, 1)',
        'mj-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'mj-bounce': 'cubic-bezier(0.2, 1.3, 0.4, 1)',
      },
      transitionDuration: {
        'mj-fast': '180ms',
        'mj-mid': '280ms',
        'mj-slow': '550ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'float': 'mithilaFloat 4s ease-in-out infinite',
        'garland': 'garlandSway 3s ease-in-out infinite',
        'flame': 'flameDance 0.7s ease-in-out infinite',
        'gold-shimmer': 'shimmerGold 2s ease-in-out infinite',
        'petal-fall': 'petalFall 5s linear infinite',
        'fade-up': 'fadeUp 0.7s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'none' },
        },
        mithilaFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        garlandSway: {
          '0%, 100%': { transform: 'rotate(-1.5deg) translateY(0)' },
          '50%': { transform: 'rotate(1.5deg) translateY(3px)' },
        },
        flameDance: {
          '0%': { transform: 'scaleY(1) scaleX(1)' },
          '25%': { transform: 'scaleY(1.15) scaleX(0.88)' },
          '50%': { transform: 'scaleY(0.9) scaleX(1.1)' },
          '100%': { transform: 'scaleY(1) scaleX(1)' },
        },
        shimmerGold: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        petalFall: {
          '0%': { transform: 'translateY(-30px) translateX(0) rotate(0deg)', opacity: '0.9' },
          '100%': { transform: 'translateY(600px) translateX(-20px) rotate(360deg)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
