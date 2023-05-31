/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    darkMode: "class",
    corePlugins: {
        preflight: false
    },
    important: "#__next",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: "var(--font-poppins)"
            },
            colors: {
                primary: "#FFF3D1",
                secondary: "#8D2023",
                third: "#414045",
                fourth: "#704700"
            },
            borderWidth: {
                1: "1px"
            }
        }
    },
    plugins: []
};
