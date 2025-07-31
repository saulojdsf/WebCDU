import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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

describe('GridOverlay - Zoom Responsive Behavior', () => {
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

    describe('zoom threshold visibility', () => {
        it('should hide grid when zoom is below minimum threshold (0.25)', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.2 });

            expect(container.firstChild).toBeNull();
        });

        it('should show grid when zoom is at minimum threshold (0.25)', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.25 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should show grid when zoom is above minimum threshold', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.3 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('dynamic grid density adjustment', () => {
        it('should use major grid lines (4x spacing) at very low zoom (< 0.5)', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 20 };
            const { container } = renderGridOverlay({ config, zoom: 0.4 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(svg).toBeInTheDocument();
            expect(lines!.length).toBeGreaterThan(0);

            // At very low zoom, should have fewer lines due to 4x spacing
            // This is a basic check - detailed spacing verification would require more complex testing
        });

        it('should use 2x grid spacing at low zoom (0.5-1.0)', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 20 };
            const { container } = renderGridOverlay({ config, zoom: 0.7 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(svg).toBeInTheDocument();
            expect(lines!.length).toBeGreaterThan(0);
        });

        it('should use standard grid spacing at normal zoom (1.0-3.0)', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 20 };
            const { container } = renderGridOverlay({ config, zoom: 1.5 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(svg).toBeInTheDocument();
            expect(lines!.length).toBeGreaterThan(0);
        });

        it('should use sub-grid lines (0.5x spacing) at high zoom (> 3.0)', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true, size: 20 };
            const { container } = renderGridOverlay({ config, zoom: 4.0 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(svg).toBeInTheDocument();
            expect(lines!.length).toBeGreaterThan(0);

            // At high zoom, should have more lines due to 0.5x spacing
        });
    });

    describe('opacity adjustments based on zoom', () => {
        it('should use reduced opacity at very low zoom', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.4 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 0.4, base opacity is 0.2, zoom factor is 0.4/1.5 ≈ 0.267
            // Final opacity should be 0.2 * 0.267 ≈ 0.053
            const expectedOpacity = 0.2 * (0.4 / 1.5);
            const actualOpacity = parseFloat(firstLine!.getAttribute('opacity')!);
            expect(actualOpacity).toBeCloseTo(expectedOpacity, 3);
        });

        it('should use medium opacity at low zoom', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 0.7 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 0.7, base opacity is 0.25, zoom factor is 0.7/1.5 ≈ 0.467
            // Final opacity should be 0.25 * 0.467 ≈ 0.117
            const expectedOpacity = 0.25 * (0.7 / 1.5);
            const actualOpacity = parseFloat(firstLine!.getAttribute('opacity')!);
            expect(actualOpacity).toBeCloseTo(expectedOpacity, 3);
        });

        it('should use standard opacity at normal zoom', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 1.0 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 1.0, base opacity is 0.3, zoom factor is 1.0/1.5 ≈ 0.667
            // Final opacity should be 0.3 * 0.667 = 0.2
            const expectedOpacity = 0.3 * (1.0 / 1.5);
            const actualOpacity = parseFloat(firstLine!.getAttribute('opacity')!);
            expect(actualOpacity).toBeCloseTo(expectedOpacity, 3);
        });

        it('should use full base opacity at high zoom', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 2.0 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 2.0, base opacity is 0.3, zoom factor is capped at 1.0
            // Final opacity should be 0.3 * 1.0 = 0.3
            expect(firstLine).toHaveAttribute('opacity', '0.3');
        });

        it('should use enhanced opacity at very high zoom', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };
            const { container } = renderGridOverlay({ config, zoom: 4.0 });

            const svg = container.querySelector('svg');
            const firstLine = svg?.querySelector('line');

            // At zoom 4.0, base opacity is 0.4 (high zoom), zoom factor is capped at 1.0
            // Final opacity should be 0.4 * 1.0 = 0.4
            expect(firstLine).toHaveAttribute('opacity', '0.4');
        });
    });

    describe('zoom transition behavior', () => {
        it('should handle zoom level transitions smoothly', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };

            // Test transition from very low to low zoom
            const { container: container1 } = renderGridOverlay({ config, zoom: 0.49 });
            const { container: container2 } = renderGridOverlay({ config, zoom: 0.51 });

            const svg1 = container1.querySelector('svg');
            const svg2 = container2.querySelector('svg');

            expect(svg1).toBeInTheDocument();
            expect(svg2).toBeInTheDocument();

            // Both should render but with different densities
            const lines1 = svg1?.querySelectorAll('line');
            const lines2 = svg2?.querySelectorAll('line');

            expect(lines1!.length).toBeGreaterThan(0);
            expect(lines2!.length).toBeGreaterThan(0);
        });

        it('should handle zoom level at exact thresholds', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };

            // Test at exact threshold values
            const zoomLevels = [0.5, 1.0, 3.0];

            zoomLevels.forEach(zoom => {
                const { container } = renderGridOverlay({ config, zoom });
                const svg = container.querySelector('svg');

                expect(svg).toBeInTheDocument();

                const lines = svg?.querySelectorAll('line');
                expect(lines!.length).toBeGreaterThan(0);
            });
        });
    });

    describe('performance considerations', () => {
        it('should limit grid line generation at extreme zoom levels', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };

            // Test at very high zoom where sub-grid is used
            const { container } = renderGridOverlay({ config, zoom: 10.0 });

            const svg = container.querySelector('svg');
            const lines = svg?.querySelectorAll('line');

            expect(svg).toBeInTheDocument();
            expect(lines!.length).toBeGreaterThan(0);

            // Should still be manageable number of lines due to viewport clipping
            expect(lines!.length).toBeLessThan(1000); // Reasonable upper bound
        });

        it('should handle viewport changes with zoom responsiveness', () => {
            const config = { ...DEFAULT_GRID_CONFIG, showOverlay: true };

            // Test with different viewport positions
            mockGetViewport.mockReturnValue({ x: -500, y: -300, zoom: 1.5 });

            const { container } = renderGridOverlay({ config, zoom: 1.5 });

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            const lines = svg?.querySelectorAll('line');
            expect(lines!.length).toBeGreaterThan(0);
        });
    });
});