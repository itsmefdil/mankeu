import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { StatusBar, Style } from "@capacitor/status-bar"

type Theme = "dark" | "light"

function applyStatusBarStyle(theme: Theme) {
    if (!Capacitor.isNativePlatform()) return

    // App content overlays the status bar (transparent), so only the icon/text
    // color needs to switch: dark icons on the light theme, light icons on dark.
    StatusBar.setStyle({ style: theme === "light" ? Style.Light : Style.Dark }).catch(() => {})
}

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
        applyStatusBarStyle(theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light")
    }

    const setThemeValue = (value: Theme) => {
        setTheme(value)
    }

    return { theme, toggleTheme, setTheme: setThemeValue }
}
