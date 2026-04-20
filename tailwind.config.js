/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        linen: '#F4F2EC',
        surface: '#FFFFFF',
        line: '#E2DDD4',
        'line-light': '#EBE8E1',
        navy: {
          DEFAULT: '#1C3A6E',
          deep: '#122850',
          tint: '#EEF2FA',
        },
        amber: {
          DEFAULT: '#C47D0E',
          tint: '#FDF4E0',
        },
        ink: '#0F0F0F',
        'ink-2': '#5A5A5A',
        'ink-3': '#9E9E9E',
        cat: {
          'food-strip': '#D4621A',
          'food-bg': '#FFF2EA',
          'cafe-strip': '#8B5E24',
          'cafe-bg': '#F7EFE4',
          'nightlife-strip': '#4A3ADB',
          'nightlife-bg': '#EEEEFF',
          'travel-strip': '#1A7A4A',
          'travel-bg': '#E8F8EF',
        },
        budget: {
          'low-bg': '#E8F8EF',
          'low-text': '#1A7A4A',
          'mid-bg': '#FDF4E0',
          'mid-text': '#8B5E00',
          'high-bg': '#F0EAFF',
          'high-text': '#5B2D8E',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)',
        'card-hover': '0 2px 4px rgba(0,0,0,.06), 0 8px 28px rgba(0,0,0,.10)',
        navy: '0 4px 16px rgba(28,58,110,0.25)',
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '20px'],
        base: ['15px', '24px'],
        lg: ['17px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['26px', '32px'],
        '3xl': ['32px', '38px'],
      },
    },
  },
  plugins: [],
}
