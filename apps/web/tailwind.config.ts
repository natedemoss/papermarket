import type { Config } from 'tailwindcss'

export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    750: '#1a293e',
                },
            },
        },
    },
    plugins: [],
} satisfies Config
