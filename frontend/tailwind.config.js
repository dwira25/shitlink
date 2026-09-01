/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        cloud: "#f6f7fb",
        line: "#d8dee9",
        brand: "#0f766e",
        accent: "#f59e0b"
      },
      boxShadow: {
        soft: "0 12px 35px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};
