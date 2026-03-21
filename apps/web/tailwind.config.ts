import type { Config } from 'tailwindcss'

export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                pm: {
                    bg: '#0D0D0D',
                    surface: '#161616',
                    card: '#1E1E1E',
                    border: '#2A2A2A',
                    hover: '#252525',
                    yes: '#00C278',
                    'yes-dim': '#003D26',
                    no: '#FF5A5A',
                    'no-dim': '#4A1212',
                    blue: '#3B74FF',
                    'blue-dim': '#0F2460',
                    text: '#FFFFFF',
                    muted: '#888888',
                    subtle: '#555555',
                },
            },
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                mono: ['DM Mono', 'monospace'],
            },
            fontSize: {
                '2xs': '0.65rem',
            },
        },
    },
    plugins: [],
} satisfies Config
