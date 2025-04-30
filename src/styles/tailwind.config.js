/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',     // Include all page files
        './components/**/*.{js,ts,jsx,tsx}', // Include all component files
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'Arial', 'sans-serif'],
                mono: ['var(--font-mono)', 'Courier New', 'monospace'],
            },
        },
    },
    plugins: [],
}
