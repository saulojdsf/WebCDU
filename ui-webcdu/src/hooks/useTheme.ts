import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
    const { theme, setTheme, systemTheme, themes } = useNextTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const currentTheme = theme === 'system' ? systemTheme : theme;

    return {
        theme,
        currentTheme,
        setTheme,
        systemTheme,
        themes,
        toggleTheme,
        isDark: currentTheme === 'dark',
    };
}