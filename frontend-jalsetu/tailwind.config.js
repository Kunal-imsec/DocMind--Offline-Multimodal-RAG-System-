/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Raycast color palette
                raycast: {
                    bg: '#1C1C1E',           // Main background
                    surface: '#2C2C2E',      // Surface/card background
                    elevated: '#3A3A3C',     // Elevated elements
                    border: '#38383A',       // Subtle borders
                    'border-strong': '#48484A', // Stronger borders

                    // Text colors
                    text: '#FFFFFF',         // Primary text
                    'text-secondary': '#AEAEB2', // Secondary text
                    'text-tertiary': '#636366',  // Tertiary text
                    'text-quaternary': '#48484A', // Quaternary text

                    // Accent colors
                    orange: '#FF6B35',       // Primary accent
                    'orange-hover': '#FF8555',
                    red: '#FF453A',          // Destructive actions
                    'red-hover': '#FF6259',
                    green: '#30D158',        // Success states
                    'green-hover': '#4ADB6D',
                    blue: '#0A84FF',         // Info/links
                    'blue-hover': '#409CFF',
                    yellow: '#FFD60A',       // Warning
                    purple: '#BF5AF2',       // Special highlights
                },
                // Keep some legacy colors for gradual migration
                primary: {
                    400: '#FF8555',
                    500: '#FF6B35',
                    600: '#FF6B35',
                    700: '#FF5520',
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
            },
            animation: {
                // Raycast-style spring animations
                'spring-in': 'springIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'slide-down': 'slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'shimmer': 'shimmer 2s infinite',
                'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                springIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },
            backdropBlur: {
                xs: '2px',
                '3xl': '64px',
            },
            boxShadow: {
                'raycast': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1)',
                'raycast-lg': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 8px 16px rgba(0, 0, 0, 0.15)',
                'raycast-hover': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.12)',
            },
            borderRadius: {
                'raycast': '10px',
                'raycast-lg': '12px',
            },
        },
    },
    plugins: [],
}
