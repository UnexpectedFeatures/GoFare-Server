/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}", // Ensure this matches your project structure
    ],
    theme: {
      extend: {
        fontFamily: {
            archivo: ["Archivo Black", "sans-serif"], // Add Archivo Black
        },
      },  // Customize Tailwind here
    },
    plugins: [],
  }
  