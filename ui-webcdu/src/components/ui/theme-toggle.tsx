import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { theme, toggleTheme, isDark } = useTheme()
    const [mounted, setMounted] = useState(false)

    // After mounting, we can safely show the theme toggle
    // This avoids hydration mismatch between server and client
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-9 h-9" /> // Placeholder with same dimensions to avoid layout shift
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-md theme-transition hover:bg-accent theme-focus-ring"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
            <Sun
                className={`h-[1.2rem] w-[1.2rem] theme-toggle-icon ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
                    }`}
            />
            <Moon
                className={`absolute h-[1.2rem] w-[1.2rem] theme-toggle-icon ${isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
                    }`}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}