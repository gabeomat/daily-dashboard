import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        fredoka: ["Fredoka", "sans-serif"],
        space: ["Space Grotesk", "sans-serif"],
      },
      colors: {
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
        positive: "hsl(var(--positive))",
        negative: "hsl(var(--negative))",
        lav: {
          50: "hsl(var(--lav-50))",
          100: "hsl(var(--lav-100))",
          200: "hsl(var(--lav-200))",
          300: "hsl(var(--lav-300))",
          400: "hsl(var(--lav-400))",
          500: "hsl(var(--lav-500))",
          700: "hsl(var(--lav-700))",
          900: "hsl(var(--lav-900))",
        },
        pink: {
          100: "hsl(var(--pink-100))",
          300: "hsl(var(--pink-300))",
          400: "hsl(var(--pink-400))",
          500: "hsl(var(--pink-500))",
          700: "hsl(var(--pink-700))",
        },
        banana: {
          100: "hsl(var(--banana-100))",
          300: "hsl(var(--banana-300))",
          400: "hsl(var(--banana-400))",
          500: "hsl(var(--banana-500))",
          900: "hsl(var(--banana-900))",
        },
        sky: {
          100: "hsl(var(--sky-100))",
          300: "hsl(var(--sky-300))",
          400: "hsl(var(--sky-400))",
          500: "hsl(var(--sky-500))",
          800: "hsl(var(--sky-800))",
        },
        aqua: {
          100: "hsl(var(--aqua-100))",
          300: "hsl(var(--aqua-300))",
          500: "hsl(var(--aqua-500))",
          700: "hsl(var(--aqua-700))",
          900: "hsl(var(--aqua-900))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
