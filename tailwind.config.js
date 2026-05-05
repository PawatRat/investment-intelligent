/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      backgroundImage: {
        dots: "radial-gradient(circle, rgba(0,0,0,0.16) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
