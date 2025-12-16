import { useEffect, useState } from "react"

type Theme = "dark" | "light"

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "light"

    // Check localStorage first
    const saved = localStorage.getItem("theme") as Theme | null
    if (saved === "dark" || saved === "light") {
        return saved
    }

    // Fall back to system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark"
    }

    return "light"
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light")
    }

    const setThemeValue = (value: Theme) => {
        setTheme(value)
    }

    return { theme, toggleTheme, setTheme: setThemeValue }
}
