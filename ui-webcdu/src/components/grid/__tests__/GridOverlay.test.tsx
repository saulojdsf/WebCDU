import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { GridOverlay } from '../GridOverlay';
import { DEFAULT_GRID_CONFIG } from '@/lib/grid-types';

// Mock useReactFlow hook
const mockGetViewport = vi.fn();
vi.mock('reactflow', async () => {
    const actual = await vi.importActual('reactflow');
    return {
        ...actual,
        useReactFlow: () => ({
            getViewport: mockGetViewport,
        }),
    };
});

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
});

describe('GridOverlay', () => {
    beforeEach(() => {
        mockGetViewport.mockReturnValue({ x: 0, y: 0, zoom: 1 });
    });

    const renderGridOverlay = (props: any) => {
        return render(
            <ReactFlowProvider>
                <GridOverlay {...props} />
            </ReactFlowProvider>
        );
    };

    describe('visibility control', () => {
        it('should not render when showOverlay is false', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: false };
            const { container } = renderGridOverlay({ config });

            expect(container.firstChild).toBeNull();
        });

        it('should render when showOverlay is true', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveClass('grid-overlay');
        });

        it('should not render when zoom is below minimum threshold', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.2 });

            expect(container.firstChild).toBeNull();
        });

        it('should render when zoom is above minimum threshold', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.3 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('grid line rendering', () => {
        it('should render vertical and horizontal grid lines', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 20 };
            const { container } = renderGridOverlay({ config, zoom: 1 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(lines).toBeDefined();
            expect(lines!.length).toBeGreaterThan(0);
        });

        it('should use correct stroke properties', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 1 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            expect(firstLine).toHaveAttribute('stroke', 'currentColor');
            expect(firstLine).toHaveAttribute('stroke-width', '1');
        });

        it('should adjust stroke width based on zoom level', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const zoom = 2;
            const { container } = renderGridOverlay({ config, zoom });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            expect(firstLine).toHaveAttribute('stroke-width', '0.5'); // 1 / zoom
        });
    });

    describe('opacity calculations', () => {
        it('should use base opacity at normal zoom', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 1 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 1.0, base opacity is 0.3, zoom factor is 1.0/1.5 ≈ 0.667
            // Final opacity should be 0.3 * 0.667 ≈ 0.2
            const expectedOpacity = 0.3 * (1.0 / 1.5);
            const actualOpacity = parseFloat(firstLine!.getAttribute('opacity')!);
            expect(actualOpacity).toBeCloseTo(expectedOpacity, 3);
        });

        it('should increase opacity at higher zoom levels', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 2 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 2.0, base opacity is 0.3, zoom factor is capped at 1.0
            // Final opacity should be 0.3 * 1.0 = 0.3
            expect(firstLine).toHaveAttribute('opacity', '0.3');
        });

        it('should cap opacity at maximum zoom density', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 4 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 4.0, base opacity is 0.4 (high zoom), zoom factor is capped at 1.0
            // Final opacity should be 0.4 * 1.0 = 0.4
            expect(firstLine).toHaveAttribute('opacity', '0.4');
        });
    });

    describe('configurable grid size', () => {
        it('should use default grid size from configuration', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 25 };
            mockGetViewport.mockReturnValue({ x: 0, y: 0, zoom: 1 });

            const { container } = renderGridOverlay({ config, zoom: 1 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Grid lines should be spaced according to the configured size
            // This is verified by checking that lines exist (detailed positioning would require more complex testing)
            const lines = svg?.querySelectorAll('line');
            expect(lines!.length).toBeGreaterThan(0);
        });

        it('should handle different grid sizes', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 50 };
            const { container } = renderGridOverlay({ config, zoom: 1 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(lines!.length).toBeGreaterThan(0);
        });
    });

    describe('viewport integration', () => {
        it('should handle viewport offset', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            mockGetViewport.mockReturnValue({ x: -100, y: -50, zoom: 1 });

            const { container } = renderGridOverlay({ config, zoom: 1 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Should still render lines even with viewport offset
            const lines = svg?.querySelectorAll('line');
            expect(lines!.length).toBeGreaterThan(0);
        });

        it('should handle different zoom levels from viewport', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            mockGetViewport.mockReturnValue({ x: 0, y: 0, zoom: 1.5 });

            const { container } = renderGridOverlay({ config, zoom: 1.5 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('styling and accessibility', () => {
        it('should have correct CSS classes and styles', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config });

            const svg = container.querySelector('svg');

            expect(svg).toHaveClass('grid-overlay');
            expect(svg).toHaveStyle({ position: 'absolute' });
            expect(svg).toHaveStyle({ pointerEvents: 'none' });
            expect(svg).toHaveStyle({ zIndex: '0' });
        });

        it('should use subtle color for grid lines', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config });

            const svg = container.querySelector('svg');

            expect(svg).toHaveStyle({ color: 'rgb(156, 163, 175)' }); // gray-400
        });

        it('should not interfere with pointer events', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config });

            const svg = container.querySelector('svg');

            expect(svg).toHaveStyle({ pointerEvents: 'none' });
        });
    });
});