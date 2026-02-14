import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#ea580c', // Orange-600
            light: '#fdba74',
            dark: '#c2410c',
            contrastText: '#fff',
        },
        secondary: {
            main: '#4b5563', // Gray-600
            light: '#9ca3af',
            dark: '#1f2937',
            contrastText: '#fff',
        },
        background: {
            default: '#ffffff', // White
            paper: '#ffffff',
        },
        text: {
            primary: '#111827', // Gray-900
            secondary: '#6b7280', // Gray-500
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 600, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        body1: { fontSize: '0.95rem' },
        button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: 'none', // Flat look by default as per screenshot
                },
                rounded: {
                    borderRadius: 16,
                },
            },
        },
    },
});

export default theme;
