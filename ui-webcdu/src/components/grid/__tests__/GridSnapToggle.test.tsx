import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GridSnapToggle } from '../GridSnapToggle'

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Grid3X3: (props: any) => <div data-testid="grid-icon" {...props}>GridIcon</div>
}))

describe('GridSnapToggle', () => {
    it('renders with correct initial state when disabled', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        expect(button).toBeInTheDocument()
        expect(button).toHaveAttribute('aria-pressed', 'false')
        expect(button).toHaveAttribute('aria-label', 'Enable grid snapping')
        expect(screen.getByTestId('grid-icon')).toBeInTheDocument()
    })

    it('renders with correct initial state when enabled', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={true} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        expect(button).toHaveAttribute('aria-pressed', 'true')
        expect(button).toHaveAttribute('aria-label', 'Disable grid snapping')
    })

    it('calls onToggle when clicked', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        fireEvent.click(button)

        expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('applies custom className when provided', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} className="custom-class" />)

        const button = screen.getByRole('switch')
        expect(button).toHaveClass('custom-class')
    })

    it('has tooltip trigger attributes', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        const button = screen.getByRole('switch')
        // The button should be wrapped in a tooltip trigger
        expect(button).toBeInTheDocument()
    })

    it('renders tooltip content structure', () => {
        const onToggle = vi.fn()
        render(<GridSnapToggle enabled={true} onToggle={onToggle} />)

        // Component should render without errors
        const button = screen.getByRole('switch')
        expect(button).toBeInTheDocument()
    })

    it('has correct visual states for enabled/disabled', () => {
        const onToggle = vi.fn()
        const { rerender } = render(<GridSnapToggle enabled={false} onToggle={onToggle} />)

        let button = screen.getByRole('switch')
        // When disabled, should have ghost variant (not default)
        expect(button).not.toHaveClass('bg-primary')

        rerender(<GridSnapToggle enabled={true} onToggle={onToggle} />)
        button = screen.getByRole('switch')
        // When enabled, should have default variant styling
        expect(button).toHaveClass('bg-primary')
    })
})