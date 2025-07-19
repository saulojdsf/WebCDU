import React from 'react';
import { render, act } from '@testing-library/react';
import { DrawingProvider, useDrawing } from '../DrawingContext';

// Test component to access the drawing context
function TestComponent() {
    const context = useDrawing();

    return (
        <div>
            <div data-testid="layer-visible">{context.layerState.isVisible.toString()}</div>
            <div data-testid="layer-opacity">{context.layerState.opacity}</div>
            <div data-testid="layer-zindex">{context.layerState.zIndex}</div>
            <div data-testid="layer-locked">{context.layerState.locked.toString()}</div>
            <button
                data-testid="toggle-visibility"
                onClick={context.toggleLayerVisibility}
            >
                Toggle Visibility
            </button>
            <button
                data-testid="set-opacity"
                onClick={() => context.setLayerOpacity(0.5)}
            >
                Set Opacity
            </button>
            <button
                data-testid="set-zindex"
                onClick={() => context.setLayerZIndex(5)}
            >
                Set Z-Index
            </button>
            <button
                data-testid="set-locked"
                onClick={() => context.setLayerLocked(true)}
            >
                Set Locked
            </button>
            <button
                data-testid="reset-layer"
                onClick={context.resetLayer}
            >
                Reset Layer
            </button>
        </div>
    );
}

describe('DrawingContext Layer Management', () => {
    let component: ReturnType<typeof render>;

    beforeEach(() => {
        component = render(
            <DrawingProvider>
                <TestComponent />
            </DrawingProvider>
        );
    });

    describe('initial state', () => {
        it('should have default layer state', () => {
            expect(component.getByTestId('layer-visible')).toHaveTextContent('true');
            expect(component.getByTestId('layer-opacity')).toHaveTextContent('1');
            expect(component.getByTestId('layer-zindex')).toHaveTextContent('2');
            expect(component.getByTestId('layer-locked')).toHaveTextContent('false');
        });
    });

    describe('layer visibility', () => {
        it('should toggle layer visibility', async () => {
            const toggleButton = component.getByTestId('toggle-visibility');

            await act(async () => {
                toggleButton.click();
            });

            expect(component.getByTestId('layer-visible')).toHaveTextContent('false');

            await act(async () => {
                toggleButton.click();
            });

            expect(component.getByTestId('layer-visible')).toHaveTextContent('true');
        });
    });

    describe('layer opacity', () => {
        it('should set layer opacity', async () => {
            const setOpacityButton = component.getByTestId('set-opacity');

            await act(async () => {
                setOpacityButton.click();
            });

            expect(component.getByTestId('layer-opacity')).toHaveTextContent('0.5');
        });
    });

    describe('layer z-index', () => {
        it('should set layer z-index', async () => {
            const setZIndexButton = component.getByTestId('set-zindex');

            await act(async () => {
                setZIndexButton.click();
            });

            expect(component.getByTestId('layer-zindex')).toHaveTextContent('5');
        });
    });

    describe('layer lock', () => {
        it('should set layer locked state', async () => {
            const setLockedButton = component.getByTestId('set-locked');

            await act(async () => {
                setLockedButton.click();
            });

            expect(component.getByTestId('layer-locked')).toHaveTextContent('true');
        });
    });

    describe('layer reset', () => {
        it('should reset layer to default state', async () => {
            // First modify the layer state
            await act(async () => {
                component.getByTestId('toggle-visibility').click();
                component.getByTestId('set-opacity').click();
                component.getByTestId('set-zindex').click();
                component.getByTestId('set-locked').click();
            });

            // Verify state is modified
            expect(component.getByTestId('layer-visible')).toHaveTextContent('false');
            expect(component.getByTestId('layer-opacity')).toHaveTextContent('0.5');
            expect(component.getByTestId('layer-zindex')).toHaveTextContent('5');
            expect(component.getByTestId('layer-locked')).toHaveTextContent('true');

            // Reset layer
            await act(async () => {
                component.getByTestId('reset-layer').click();
            });

            // Verify state is reset to defaults
            expect(component.getByTestId('layer-visible')).toHaveTextContent('true');
            expect(component.getByTestId('layer-opacity')).toHaveTextContent('1');
            expect(component.getByTestId('layer-zindex')).toHaveTextContent('2');
            expect(component.getByTestId('layer-locked')).toHaveTextContent('false');
        });
    });
});