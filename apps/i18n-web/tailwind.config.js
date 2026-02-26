/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // 避免与 Ant Design 样式冲突
  corePlugins: {
    preflight: false,
  },
};
