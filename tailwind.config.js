/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006368',
          dark: '#004d51',
          light: '#008a91',
        },
        secondary: {
          DEFAULT: '#a5f7c0',
          dark: '#7dd99e',
          light: '#c7ffd9',
        },
        accent: '#008a91',
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-dark': '#f1f5f9',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 99, 104, 0.07), 0 10px 20px -2px rgba(0, 99, 104, 0.04)',
        'card': '0 0 0 1px rgba(0, 99, 104, 0.05), 0 2px 4px rgba(0, 99, 104, 0.05), 0 12px 24px rgba(0, 99, 104, 0.05)',
        'elevated': '0 20px 40px -12px rgba(0, 99, 104, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
