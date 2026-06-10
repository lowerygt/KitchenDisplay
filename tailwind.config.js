/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calendar source accents (used by the unified agenda widget later)
        ms: '#0a84ff',
        google: '#34a853'
      }
    }
  },
  plugins: []
}
