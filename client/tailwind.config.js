/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Newsprint palette
        ink:       '#111111',
        paper:     '#F9F9F7',
        muted:     '#E5E5E0',
        editorial: '#CC0000',
        // Neutral shades
        'neutral-100': '#F5F5F5',
        'neutral-200': '#E5E5E5',
        'neutral-400': '#A3A3A3',
        'neutral-500': '#737373',
        'neutral-600': '#525252',
        'neutral-700': '#404040',
      },
      fontFamily: {
        'inter':       ['Inter', 'sans-serif'],
        'playfair':    ['Playfair Display', 'serif'],
        'lora':        ['Lora', 'serif'],
        'jetbrains':   ['JetBrains Mono', 'monospace'],
        'poppins':     ['Poppins', 'sans-serif'],
        'roboto':      ['Roboto', 'sans-serif'],
        'crimson':     ['Crimson Text', 'serif'],
        'montserrat':  ['Montserrat', 'sans-serif'],
        'merriweather':['Merriweather', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
      },
      boxShadow: {
        'hard':       '4px 4px 0px 0px #111111',
        'hard-red':   '4px 4px 0px 0px #CC0000',
        'hard-lg':    '6px 6px 0px 0px #111111',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'marquee':     'marquee 28s linear infinite',
        'marquee-slow':'marquee 40s linear infinite',
        'fade-in':     'fadeIn 0.4s ease-out both',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ]
}
