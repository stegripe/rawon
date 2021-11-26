module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "media", // or "media" or "class"
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#e0f2f1",
          100: "#b2dfdb",
          200: "#80cbc4",
          300: "#4db6ac",
          400: "#26a69a",
          500: "#009688",
          600: "#00897b",
          700: "#00796b",
          800: "#00695c",
          900: "#004d40",
          "accent-100": "#a7ffeb",
          "accent-200": "#64ffda",
          "accent-400": "#1de9b6",
          "accent-700": "#00bfa5",
        },
        "deep-purple": {
          50: "#ede7f6",
          100: "#d1c4e9",
          200: "#b39ddb",
          300: "#9575cd",
          400: "#7e57c2",
          500: "#673ab7",
          600: "#5e35b1",
          700: "#512da8",
          800: "#4527a0",
          900: "#311b92",
          "accent-100": "#b388ff",
          "accent-200": "#7c4dff",
          "accent-400": "#651fff",
          "accent-700": "#6200ea",
        }
      },
      transitionDelay: {
        "5000": "5000ms"
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ["checked"]
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class"
    })
  ],
}
