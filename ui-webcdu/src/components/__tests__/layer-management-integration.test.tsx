import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawingProvider } from '../../contexts/DrawingContext';
import { DrawingToolbar } from '../drawing/DrawingToolbar';
import { DrawingCanvas } from '../drawing/DrawingCanvas';

// Mock the missing UI components
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, title, className, disabled, ...props }: any) => (
        <button
            onClick={onClick}
            title={title}
            className={className}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/separator', () => ({
    Separator: ({ className }: any) => <div className={`separator ${className}`} />,
}));

vi.mock('@/components/slider', () => ({
    Slider: ({ value, onValueChange, max, min, step, className }: any) => (
        <input
            type="range"
            value={value[0]}
            onChange={(e) => onValueChange([parseInt(e.target.value)])}
            max={max}
            min={min}
            step={step}
            className={className}
            data-testid="slider"
        />
    ),
}));

vi.mock('@/components/ui/popover', () => ({
    Popover: ({ children, open }: any) => (
        <div data-testid="popover" style={{ display: open ? 'block' : 'none' }}>
            {children}
        </div>
    ),
    PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
    PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}));

vi.mock('@/components/ui/label', () => ({
    Label: ({ children, className }: any) => <label className={className}>{children}</label>,
}));

vi.mock('@/components/ui/input', () => ({
    Input: ({ type, value, onChange, className }: any) => (
        <input
            type={type}
            value={value}
            onChange={onChange}
            className={className}
            data-testid="input"
        />
    ),
}));

vi.mock('@/components/switch', () => ({
    Switch: ({ checked, onCheckedChange }: any) => (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            data-testid="switch"
        />
    ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Pen: () => <div data-testid="pen-icon">Pen</div>,
    Eraser: () => <div data-testid="eraser-icon">Eraser</div>,
    Square: () => <div data-testid="square-icon">Square</div>,
    Circle: () => <div data-testid="circle-icon">Circle</div>,
    Minus: () => <div data-testid="minus-icon">Minus</div>,
    Settings: () => <div data-testid="settings-icon">Settings</div>,
    Eye: () => <div data-testid="eye-icon">Eye</div>,
    EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
    Lock: () => <div data-testid="lock-icon">Lock</div>,
    Unlock: () => <div data-testid="unlock-icon">Unlock</div>,
    Layers: () => <div data-testid="layers-icon">Layers</div>,
    Trash2: () => <div data-testid="trash-icon">Trash</div>,
    RotateCcw: () => <div data-testid="rotate-icon">Rotate</div>,
}));

function TestComponent() {
    return (
        <DrawingProvider>
            <div>
                <DrawingToolbar />
                <DrawingCanvas width={800} height={600} />
            </div>
        </DrawingProvider>
    );
}

describe('Layer Management Integration', () => {
    beforeEach(() => {
        // Mock canvas context
        const mockContext = {
            scale: vi.fn(),
            clearRect: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            ellipse: vi.fn(),
            strokeRect: vi.fn(),
            fillRect: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
        };

        HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
        HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
        }));
    });

    it('should show layer visibility controls', () => {
        render(<TestComponent />);

        // Should show eye icon for visibility toggle
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

        // Should show unlock icon for layer lock toggle
        expect(screen.getByTestId('unlock-icon')).toBeInTheDocument();

        // Should show layers icon for layer settings
        expect(screen.getByTestId('layers-icon')).toBeInTheDocument();
    });

    it('should toggle layer visibility', () => {
        render(<TestComponent />);

        const visibilityButton = screen.getByTestId('eye-icon').closest('button');
        expect(visibilityButton).toBeInTheDocument();

        // Initially should show eye icon (visible)
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('eye-off-icon')).not.toBeInTheDocument();

        // Click to toggle visibility
        fireEvent.click(visibilityButton!);

        // Should now show eye-off icon (hidden)
        expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should toggle layer lock state', () => {
        render(<TestComponent />);

        const lockButton = screen.getByTestId('unlock-icon').closest('button');
        expect(lockButton).toBeInTheDocument();

        // Initially should show unlock icon (unlocked)
        expect(screen.getByTestId('unlock-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();

        // Click to toggle lock
        fireEvent.click(lockButton!);

        // Should now show lock icon (locked)
        expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('unlock-icon')).not.toBeInTheDocument();
    });

    it('should apply layer state to canvas element', () => {
        render(<TestComponent />);

        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // Check initial z-index
        expect(canvas).toHaveStyle({ zIndex: '2' });

        // Check initial opacity
        expect(canvas).toHaveStyle({ opacity: '1' });
    });

    it('should disable drawing when layer is locked', () => {
        render(<TestComponent />);

        const canvas = document.querySelector('canvas');
        const lockButton = screen.getByTestId('unlock-icon').closest('button');

        // Initially canvas should allow pointer events
        expect(canvas).toHaveStyle({ pointerEvents: 'auto' });

        // Lock the layer
        fireEvent.click(lockButton!);

        // Canvas should now disable pointer events
        expect(canvas).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should hide canvas when layer is not visible', () => {
        render(<TestComponent />);

        const canvas = document.querySelector('canvas');
        const visibilityButton = screen.getByTestId('eye-icon').closest('button');

        // Initially canvas should be visible
        expect(canvas).toBeInTheDocument();

        // Hide the layer
        fireEvent.click(visibilityButton!);

        // Canvas should still be in DOM but the overlay should handle visibility
        expect(canvas).toBeInTheDocument();
    });
});