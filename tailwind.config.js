/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      backgroundImage: {
        dots: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
