/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: '#3F77DB',
        'blue-light': '#7B9BE8',
        bg: '#EEF3FC',
        surface: '#F4F7FB',
        high: '#E53935',
        med: '#F59E0B',
        low: '#16A36A',
        'high-bg': '#FFF1F1',
        'high-line': '#F3C9C9',
        'high-text': '#A32D2D',
        'med-text': '#3D2A02',
        t1: '#1B2640',
        t2: '#5B6B82',
        t3: '#9AA4B2',
        line: '#E2E6EE',
        'char-disc': '#CFE0F7',
        'tint-line': '#D6E2F5',
        track: '#EEF0F4',
        'toggle-off': '#D3D9E2',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}