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
      // 앱(SafeFam_FE `AppText`)과 같은 타이포 스케일.
      // 전 연령 대응이라 본문 16·버튼 17 아래로 내리지 않는다.
      // 굵기는 400/600/700만 쓴다.
      fontSize: {
        logo: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'title-lg': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'title-result': ['22px', { lineHeight: '1.35', fontWeight: '700' }],
        'title-screen': ['19px', { lineHeight: '1.4', fontWeight: '700' }],
        button: ['17px', { lineHeight: '1.4', fontWeight: '700' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-strong': ['16px', { lineHeight: '1.6', fontWeight: '600' }],
        caption: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        section: ['13px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      borderRadius: {
        // 앱 컴포넌트 기준: 버튼 14 · 카드 16 · 칩 22 · 뱃지 11
        button: '14px',
        card: '16px',
        chip: '22px',
        badge: '11px',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
