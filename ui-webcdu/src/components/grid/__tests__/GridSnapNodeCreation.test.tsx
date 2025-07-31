import { describe, it, expect, beforeEach } from 'vitest';
import { GridSnapController } from '../../../lib/GridSnapController';

describe('GridSnapNodeCreation', () => {
    let gridSnapController: GridSnapController;

    beforeEach(() => {
        gridSnapController = new GridSnapController({
            size: 20,
            enabled: true,
            showOverlay: true,
            snapThreshold: 10,
        });
    });

    it('should snap new nodes to grid when grid snapping is enabled', () => {
        const positionManager = gridSnapController.getPositionManager();
        const originalPosition = { x: 115, y: 115 };
        const snappedPosition = positionManager.snapToGrid(originalPosition);

        expect(snappedPosition.x).toBe(120);
        expect(snappedPosition.y).toBe(120);
        expect(snappedPosition.isSnapped).toBe(true);
    });

    it('should snap new nodes to grid when created at center', () => {
        const positionManager = gridSnapController.getPositionManager();
        const centerPosition = { x: 400, y: 300 };
        const snappedPosition = positionManager.snapToGrid(centerPosition);

        // Center position (400, 300) should snap to (400, 300) since it's already on grid
        expect(snappedPosition.x).toBe(400);
        expect(snappedPosition.y).toBe(300);
        expect(snappedPosition.isSnapped).toBe(true);
    });

    it('should not snap new nodes when grid snapping is disabled', () => {
        gridSnapController.disableGridSnap();
        const positionManager = gridSnapController.getPositionManager();

        const originalPosition = { x: 115, y: 115 };
        const result = positionManager.snapToGrid(originalPosition);

        // When disabled, should return original position without snapping
        expect(result.x).toBe(115);
        expect(result.y).toBe(115);
        expect(result.isSnapped).toBe(false);
    });

    it('should handle edge cases in node positioning', () => {
        const positionManager = gridSnapController.getPositionManager();

        // Test negative positions
        const negativePosition = { x: -15, y: -15 };
        const snappedNegative = positionManager.snapToGrid(negativePosition);
        expect(snappedNegative.x).toBe(-20);
        expect(snappedNegative.y).toBe(-20);

        // Test zero position
        const zeroPosition = { x: 0, y: 0 };
        const snappedZero = positionManager.snapToGrid(zeroPosition);
        expect(snappedZero.x).toBe(0);
        expect(snappedZero.y).toBe(0);

        // Test large positions
        const largePosition = { x: 1005, y: 1005 };
        const snappedLarge = positionManager.snapToGrid(largePosition);
        expect(snappedLarge.x).toBe(1000);
        expect(snappedLarge.y).toBe(1000);
    });

    it('should maintain grid alignment for various grid sizes', () => {
        // Test with different grid sizes
        const gridSizes = [10, 20, 25, 50];

        gridSizes.forEach(size => {
            const controller = new GridSnapController({
                size,
                enabled: true,
                showOverlay: true,
                snapThreshold: size / 2,
            });

            const positionManager = controller.getPositionManager();
            // Test position that's closer to the first grid intersection
            const testPosition = { x: size - 5, y: size - 5 };
            const snapped = positionManager.snapToGrid(testPosition);

            // Should snap to the nearest grid intersection (which is at size, size)
            expect(snapped.x).toBe(size);
            expect(snapped.y).toBe(size);
            expect(snapped.isSnapped).toBe(true);
        });
    });

    it('should validate grid positions correctly', () => {
        const positionManager = gridSnapController.getPositionManager();

        // Valid positions
        expect(positionManager.validateGridPosition({ x: 100, y: 100 })).toBe(true);
        expect(positionManager.validateGridPosition({ x: 0, y: 0 })).toBe(true);
        expect(positionManager.validateGridPosition({ x: -100, y: -100 })).toBe(true);

        // Invalid positions
        expect(positionManager.validateGridPosition({ x: NaN, y: 100 })).toBe(false);
        expect(positionManager.validateGridPosition({ x: 100, y: NaN })).toBe(false);
        expect(positionManager.validateGridPosition({ x: Infinity, y: 100 })).toBe(false);
        expect(positionManager.validateGridPosition({ x: 100, y: Infinity })).toBe(false);
    });

    it('should calculate grid coordinates correctly', () => {
        const positionManager = gridSnapController.getPositionManager();

        // Test grid coordinate calculation
        const position1 = { x: 40, y: 60 };
        const coords1 = positionManager.getGridCoordinates(position1);
        expect(coords1.gridX).toBe(2); // 40 / 20 = 2
        expect(coords1.gridY).toBe(3); // 60 / 20 = 3

        // Test conversion back to pixel position
        const pixelPos = positionManager.gridToPixelPosition(coords1.gridX, coords1.gridY);
        expect(pixelPos.x).toBe(40);
        expect(pixelPos.y).toBe(60);
    });

    it('should detect if position is already snapped', () => {
        const positionManager = gridSnapController.getPositionManager();

        // Position already on grid
        expect(positionManager.isPositionSnapped({ x: 40, y: 60 })).toBe(true);
        expect(positionManager.isPositionSnapped({ x: 0, y: 0 })).toBe(true);

        // Position not on grid
        expect(positionManager.isPositionSnapped({ x: 45, y: 65 })).toBe(false);
        expect(positionManager.isPositionSnapped({ x: 1, y: 1 })).toBe(false);
    });

    it('should integrate with node creation workflow', () => {
        // Simulate the workflow used in App.tsx for new node creation
        const positionManager = gridSnapController.getPositionManager();

        // Simulate drop position
        const dropPosition = { x: 237, y: 183 };
        let finalPosition = dropPosition;

        // Apply grid snapping if enabled (as done in onDrop handler)
        if (gridSnapController.isGridSnapEnabled()) {
            const snappedPosition = positionManager.snapToGrid(dropPosition);
            finalPosition = { x: snappedPosition.x, y: snappedPosition.y };
        }

        expect(finalPosition.x).toBe(240); // Snapped to nearest 20px grid
        expect(finalPosition.y).toBe(180);

        // Test with grid snapping disabled
        gridSnapController.disableGridSnap();
        let finalPositionDisabled = dropPosition;

        if (gridSnapController.isGridSnapEnabled()) {
            const snappedPosition = positionManager.snapToGrid(dropPosition);
            finalPositionDisabled = { x: snappedPosition.x, y: snappedPosition.y };
        }

        expect(finalPositionDisabled.x).toBe(237); // Original position
        expect(finalPositionDisabled.y).toBe(183);
    });
});