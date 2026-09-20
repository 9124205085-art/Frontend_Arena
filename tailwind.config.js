/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07070A",
        panel: "#0D0D12",
        card: "#121218",
        mute: "#9696A5",
        accent: "#7C6BFF",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 107, 255, 0.28)",
        soft: "0 24px 60px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
