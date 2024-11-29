import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				flash: {
					"0%, 100%": { opacity: "1" },
					"50%": { opacity: "0.3" },
				},
				explosion: {
					"0%": {
						transform: "scale(0.5)",
						opacity: "0.8",
					},
					"50%": {
						transform: "scale(1)",
						opacity: "1",
					},
					"90%": {
						transform: "scale(1.3)",
						opacity: "0.2",
					},
					"100%": {
						transform: "scale(1.2)",
						opacity: "0",
					},
				},
				grassBreak: {
					"0%": { transform: "scale(1)", opacity: "1" },
					"50%": { transform: "scale(0.8)", opacity: "0.8" },
					"70%": { transform: "scale(0.6)", opacity: "0.6" },
					"100%": { transform: "scale(0.2)", opacity: "0.4" },
				},
			},
			animation: {
				// Keep in sync with game constant. [#invulnerability-duration]
				invulnerability: "invulnerability 1500ms ease-in-out infinite",
				// Keep in sync with game constant. [#explosion-duration]
				explosion: "explosion 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
				// Keep in sync with game constant. [#grass-break-duration]
				grassBreak: "grassBreak 200ms ease-out forwards",
			},
		},
	},
	plugins: [animate],
} satisfies Config
