import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridSnapController } from '../GridSnapController';
import { DEFAULT_GRID_CONFIG } from '../grid-types';

describe('GridSnapController', () => {
    let controller: GridSnapController;

    beforeEach(() => {
        controller = new GridSnapController();
    });

    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const config = controller.getConfig();
            expect(config).toEqual(DEFAULT_GRID_CONFIG);
        });

        it('should initialize with custom configuration', () => {
            const customConfig = { size: 30, enabled: true };
            const customController = new GridSnapController(customConfig);
            const config = customController.getConfig();

            expect(config.size).toBe(30);
            expect(config.enabled).toBe(true);
            expect(config.showOverlay).toBe(false); // Should use default for unspecified values
        });
    });

    describe('grid snapping state management', () => {
        it('should start with grid snapping disabled', () => {
            expect(controller.isGridSnapEnabled()).toBe(false);
        });

        it('should toggle grid snapping from disabled to enabled', () => {
            controller.toggleGridSnap();

            expect(controller.isGridSnapEnabled()).toBe(true);
            expect(controller.getConfig().showOverlay).toBe(true);
        });

        it('should toggle grid snapping from enabled to disabled', () => {
            controller.enableGridSnap();
            controller.toggleGridSnap();

            expect(controller.isGridSnapEnabled()).toBe(false);
            expect(controller.getConfig().showOverlay).toBe(false);
        });

        it('should enable grid snapping explicitly', () => {
            controller.enableGridSnap();

            expect(controller.isGridSnapEnabled()).toBe(true);
            expect(controller.getConfig().showOverlay).toBe(true);
        });

        it('should disable grid snapping explicitly', () => {
            controller.enableGridSnap();
            controller.disableGridSnap();

            expect(controller.isGridSnapEnabled()).toBe(false);
            expect(controller.getConfig().showOverlay).toBe(false);
        });

        it('should not change state when enabling already enabled grid', () => {
            const listener = vi.fn();
            controller.subscribe(listener);

            controller.enableGridSnap();
            listener.mockClear();

            controller.enableGridSnap();
            expect(listener).not.toHaveBeenCalled();
        });

        it('should not change state when disabling already disabled grid', () => {
            const listener = vi.fn();
            controller.subscribe(listener);

            controller.disableGridSnap();
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('configuration management', () => {
        it('should return current grid size', () => {
            expect(controller.getGridSize()).toBe(DEFAULT_GRID_CONFIG.size);
        });

        it('should update configuration', () => {
            const updates = { size: 25, snapThreshold: 15 };
            controller.updateConfig(updates);

            const config = controller.getConfig();
            expect(config.size).toBe(25);
            expect(config.snapThreshold).toBe(15);
            expect(config.enabled).toBe(DEFAULT_GRID_CONFIG.enabled); // Should preserve other values
        });

        it('should return immutable configuration copy', () => {
            const config1 = controller.getConfig();
            const config2 = controller.getConfig();

            expect(config1).not.toBe(config2); // Different object references
            expect(config1).toEqual(config2); // Same values
        });
    });

    describe('event subscription and notification', () => {
        it('should notify listeners when toggling grid snap', () => {
            const listener = vi.fn();
            controller.subscribe(listener);

            controller.toggleGridSnap();

            expect(listener).toHaveBeenCalledWith(controller.getConfig());
        });

        it('should notify listeners when updating configuration', () => {
            const listener = vi.fn();
            controller.subscribe(listener);

            controller.updateConfig({ size: 30 });

            expect(listener).toHaveBeenCalledWith(controller.getConfig());
        });

        it('should notify multiple listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            controller.subscribe(listener1);
            controller.subscribe(listener2);

            controller.toggleGridSnap();

            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        it('should allow unsubscribing listeners', () => {
            const listener = vi.fn();
            const unsubscribe = controller.subscribe(listener);

            unsubscribe();
            controller.toggleGridSnap();

            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle multiple unsubscribe calls safely', () => {
            const listener = vi.fn();
            const unsubscribe = controller.subscribe(listener);

            unsubscribe();
            unsubscribe(); // Should not throw

            controller.toggleGridSnap();
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('state transitions', () => {
        it('should maintain consistent state during rapid toggles', () => {
            // Start disabled
            expect(controller.isGridSnapEnabled()).toBe(false);

            // Toggle to enabled
            controller.toggleGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(true);
            expect(controller.getConfig().showOverlay).toBe(true);

            // Toggle back to disabled
            controller.toggleGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(false);
            expect(controller.getConfig().showOverlay).toBe(false);

            // Toggle to enabled again
            controller.toggleGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(true);
            expect(controller.getConfig().showOverlay).toBe(true);
        });

        it('should handle mixed enable/disable/toggle operations', () => {
            controller.enableGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(true);

            controller.toggleGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(false);

            controller.disableGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(false);

            controller.toggleGridSnap();
            expect(controller.isGridSnapEnabled()).toBe(true);
        });
    });

    describe('future functionality placeholders', () => {
        it('should have snapExistingNodes method for future implementation', () => {
            // Should not throw and should be callable
            expect(() => controller.snapExistingNodes()).not.toThrow();
        });
    });
});