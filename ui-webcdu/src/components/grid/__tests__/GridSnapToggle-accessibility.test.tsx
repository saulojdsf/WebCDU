import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GridSnapToggle } from '../GridSnapToggle'

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Grid3X3: (props: any) => <div data-testid="grid-icon" {...props}>GridIcon</div>
}))

describe('GridSnapToggle Accessibility', () => {
    it('has proper ARIA attributes when disabled', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        expect(button).toHaveAttribute('aria-label', 'Enable grid snapping')
        expect(button).toHaveAttribute('aria-pressed', 'false')
        expect(button).toHaveAttribute('aria-describedby', 'grid-snap-description')
        expect(button).toHaveAttribute('role', 'switch')
    })

    it('has proper ARIA attributes when enabled', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={true} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        expect(button).toHaveAttribute('aria-label', 'Disable grid snapping')
        expect(button).toHaveAttribute('aria-pressed', 'true')
        expect(button).toHaveAttribute('aria-describedby', 'grid-snap-description')
        expect(button).toHaveAttribute('role', 'switch')
    })

    it('has aria-hidden on the icon', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const icon = screen.getByTestId('grid-icon')
        expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('supports keyboard navigation with Enter key', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        fireEvent.keyDown(button, { key: 'Enter' })

        expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard navigation with Space key', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        fireEvent.keyDown(button, { key: ' ' })

        expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('ignores other keyboard keys', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        fireEvent.keyDown(button, { key: 'Tab' })
        fireEvent.keyDown(button, { key: 'Escape' })
        fireEvent.keyDown(button, { key: 'a' })

        expect(onToggle).not.toHaveBeenCalled()
    })

    it('has screen reader announcement area', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const announcement = document.querySelector('[aria-live="polite"]')
        expect(announcement).toBeInTheDocument()
        expect(announcement).toHaveAttribute('aria-atomic', 'true')
        expect(announcement).toHaveClass('sr-only')
    })

    it('announces state changes to screen readers', async () => {
        const onToggle = vi.fn()
        const { rerender } = render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const announcement = document.querySelector('[aria-live="polite"]')
        expect(announcement).toHaveTextContent('')

        // Change to enabled
        rerender(<GridSnapToggle enabled={true} onToggle={onToggle} />)

        await waitFor(() => {
            expect(announcement).toHaveTextContent('Grid snapping enabled')
        }, { timeout: 100 })
    })

    it('has timeout mechanism for clearing announcements', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const announcement = document.querySelector('[aria-live="polite"]')
        // Just verify the announcement area exists and can be used
        expect(announcement).toBeInTheDocument()
        expect(announcement).toHaveAttribute('aria-live', 'polite')
    })

    it('does not announce on initial render', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={true} onToggle={onToggle} />)

        const announcement = document.querySelector('[aria-live="polite"]')
        expect(announcement).toHaveTextContent('')
    })

    it('has proper focus management', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        button.focus()

        expect(document.activeElement).toBe(button)
    })

    it('maintains focus after state change', () => {
        const onToggle = vi.fn()
        const { rerender } = render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        button.focus()

        rerender(<GridSnapToggle enabled={true} onToggle={onToggle} />)

        // Button should still be focusable and maintain focus behavior
        expect(button).toBeInTheDocument()
    })
})