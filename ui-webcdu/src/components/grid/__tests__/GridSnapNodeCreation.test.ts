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

    it('should not snap new nodes when grid snapping is disabled', () => {
        gridSnapController.disableGridSnap();
        const positionManager = gridSnapController.getPositionManager();

        const originalPosition = { x: 115, y: 115 };
        const result = positionManager.snapToGrid(originalPosition);

        expect(result.x).toBe(115);
        expect(result.y).toBe(115);
        expect(result.isSnapped).toBe(false);
    });

    it('should integrate with node creation workflow', () => {
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
    });
});