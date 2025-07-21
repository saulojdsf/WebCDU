import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from '../theme-toggle'
import { vi } from 'vitest'

// Mock the useTheme hook
vi.mock('@/hooks/useTheme', () => ({
    useTheme: () => ({
        theme: 'light',
        toggleTheme: vi.fn(),
        isDark: false,
    }),
}))

describe('ThemeToggle', () => {
    it('renders correctly', () => {
        render(<ThemeToggle />)

        // Check if the button is rendered with the correct aria-label
        const button = screen.getByRole('button', { name: /switch to dark theme/i })
        expect(button).toBeInTheDocument()

        // Check if both icons are present
        expect(screen.getByText('Toggle theme')).toBeInTheDocument()
    })

    it('calls toggleTheme when clicked', () => {
        const { useTheme } = require('@/hooks/useTheme')
        const toggleThemeMock = vi.fn()

        // Override the mock implementation for this test
        useTheme.mockImplementation(() => ({
            theme: 'light',
            toggleTheme: toggleThemeMock,
            isDark: false,
        }))

        render(<ThemeToggle />)

        const button = screen.getByRole('button')
        fireEvent.click(button)

        expect(toggleThemeMock).toHaveBeenCalledTimes(1)
    })

    it('shows correct icon based on theme', () => {
        const { useTheme } = require('@/hooks/useTheme')

        // Test light theme
        useTheme.mockImplementation(() => ({
            theme: 'light',
            toggleTheme: vi.fn(),
            isDark: false,
        }))

        const { rerender } = render(<ThemeToggle />)

        // Sun icon should be visible in light mode
        const sunIcon = document.querySelector('.scale-100:not(.scale-0)')
        expect(sunIcon).toHaveClass('rotate-0')

        // Moon icon should be hidden in light mode
        const moonIcon = document.querySelector('.scale-0')
        expect(moonIcon).toHaveClass('rotate-90')

        // Test dark theme
        useTheme.mockImplementation(() => ({
            theme: 'dark',
            toggleTheme: vi.fn(),
            isDark: true,
        }))

        rerender(<ThemeToggle />)

        // Moon icon should be visible in dark mode
        const moonIconDark = document.querySelector('.scale-100:not(.scale-0)')
        expect(moonIconDark).toHaveClass('rotate-0')

        // Sun icon should be hidden in dark mode
        const sunIconDark = document.querySelector('.scale-0')
        expect(sunIconDark).toHaveClass('rotate-90')
    })
})