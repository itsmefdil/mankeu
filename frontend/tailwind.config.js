/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    // Mobile-only app: all standard responsive breakpoints (sm, md, lg, xl, 2xl)
    // are neutralized so the mobile layout is always active, even on wide desktop displays.
    // Use `desktop-frame:` exclusively for styling the outer container when viewed on desktop.
    screens: {
      'desktop-frame': '480px',
      sm: '99999px',
      md: '99999px',
      lg: '99999px',
      xl: '99999px',
      '2xl': '99999px',
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Neumorphic Core Palette
        neu: {
          bg: "#E0E5EC",
          fg: "#3D4852",
          muted: "#6B7280",
          accent: "#6C63FF",
          "accent-light": "#8B84FF",
          "accent-sec": "#38B2AC",
          placeholder: "#A0AEC0",
          // Dark Mode Neumorphic equivalents
          "dark-bg": "#1e222b",
          "dark-fg": "#e2e8f0",
          "dark-muted": "#94a3b8",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          hover: "hsl(var(--surface-hover))",
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        container: '32px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Light Mode Neumorphism
        'neu-extruded': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
        'neu-extruded-hover': '12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)',
        'neu-extruded-sm': '5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
        'neu-inset': 'inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)',
        'neu-inset-deep': 'inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)',
        'neu-inset-sm': 'inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)',

        // Dark Mode Neumorphism - Pure Soft Dark (Zero white halo)
        'neu-dark-extruded': '4px 4px 12px rgba(0,0,0,0.4), -2px -2px 8px rgba(255,255,255,0.02)',
        'neu-dark-extruded-hover': '6px 6px 16px rgba(0,0,0,0.5), -3px -3px 10px rgba(255,255,255,0.03)',
        'neu-dark-extruded-sm': '2px 2px 6px rgba(0,0,0,0.35), -1px -1px 4px rgba(255,255,255,0.02)',
        'neu-dark-inset': 'inset 2px 2px 5px rgba(0,0,0,0.45), inset -1px -1px 4px rgba(255,255,255,0.02)',
        'neu-dark-inset-deep': 'inset 3px 3px 8px rgba(0,0,0,0.55), inset -2px -2px 6px rgba(255,255,255,0.02)',
        'neu-dark-inset-sm': 'inset 1px 1px 3px rgba(0,0,0,0.35), inset -1px -1px 2px rgba(255,255,255,0.02)',
      },
      fontFamily: {
        sans: ["'DM Sans'", "Inter", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
