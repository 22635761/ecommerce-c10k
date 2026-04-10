/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zp: {
          primary: '#0e874b', // Zero Phone Green
          dark: '#1f2937',    // Cần cho text đậm
          accent: '#374151',  // Xám đen (như trong ảnh mẫu text)
          light: '#f3f4f6'
        }
      }
    },
  },
  plugins: [],
}