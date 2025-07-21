/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
        canvas: {
          DEFAULT: 'hsl(var(--canvas-background))',
          grid: 'hsl(var(--canvas-grid))',
          'node-selected': 'hsl(var(--canvas-node-selected))',
          'node-border': 'hsl(var(--canvas-node-border))',
          edge: 'hsl(var(--canvas-edge))',
          'edge-selected': 'hsl(var(--canvas-edge-selected))',
        },
        control: {
          DEFAULT: 'hsl(var(--control-background))',
          foreground: 'hsl(var(--control-foreground))',
          border: 'hsl(var(--control-border))',
          hover: 'hsl(var(--control-hover))',
        },
        dialog: {
          overlay: 'hsl(var(--dialog-overlay))',
        },
        toast: {
          DEFAULT: 'hsl(var(--toast-background))',
          foreground: 'hsl(var(--toast-foreground))',
          border: 'hsl(var(--toast-border))',
          success: 'hsl(var(--toast-success))',
          error: 'hsl(var(--toast-error))',
          warning: 'hsl(var(--toast-warning))',
          info: 'hsl(var(--toast-info))',
        }
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
