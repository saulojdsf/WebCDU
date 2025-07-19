import { vi } from 'vitest';
import { LayerManager } from '../LayerManager';

describe('LayerManager', () => {
  let layerManager: LayerManager;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create a mock canvas element
    mockCanvas = document.createElement('canvas');
    
    layerManager = new LayerManager();
    layerManager.setCanvas(mockCanvas);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = layerManager.getState();
      expect(state).toEqual({
        isVisible: true,
        opacity: 1,
        zIndex: 2,
        locked: false,
      });
    });

    it('should initialize with custom state', () => {
      const customManager = new LayerManager({
        isVisible: false,
        opacity: 0.5,
        zIndex: 5,
        locked: true,
      });

      const state = customManager.getState();
      expect(state).toEqual({
        isVisible: false,
        opacity: 0.5,
        zIndex: 5,
        locked: true,
      });
    });
  });

  describe('visibility management', () => {
    it('should toggle visibility', () => {
      expect(layerManager.isVisible()).toBe(true);
      
      layerManager.toggleVisibility();
      expect(layerManager.isVisible()).toBe(false);
      expect(mockCanvas.style.display).toBe('none');
      
      layerManager.toggleVisibility();
      expect(layerManager.isVisible()).toBe(true);
      expect(mockCanvas.style.display).toBe('block');
    });

    it('should set visibility directly', () => {
      layerManager.setVisibility(false);
      expect(layerManager.isVisible()).toBe(false);
      expect(mockCanvas.style.display).toBe('none');

      layerManager.setVisibility(true);
      expect(layerManager.isVisible()).toBe(true);
      expect(mockCanvas.style.display).toBe('block');
    });
  });

  describe('opacity management', () => {
    it('should set opacity within valid range', () => {
      layerManager.setOpacity(0.5);
      expect(layerManager.getOpacity()).toBe(0.5);
      expect(mockCanvas.style.opacity).toBe('0.5');
    });

    it('should clamp opacity to valid range', () => {
      layerManager.setOpacity(-0.5);
      expect(layerManager.getOpacity()).toBe(0);

      layerManager.setOpacity(1.5);
      expect(layerManager.getOpacity()).toBe(1);
    });
  });

  describe('z-index management', () => {
    it('should set z-index', () => {
      layerManager.setZIndex(5);
      expect(layerManager.getZIndex()).toBe(5);
      expect(mockCanvas.style.zIndex).toBe('5');
    });
  });

  describe('lock management', () => {
    it('should set lock state', () => {
      expect(layerManager.isLocked()).toBe(false);
      
      layerManager.setLocked(true);
      expect(layerManager.isLocked()).toBe(true);
      expect(mockCanvas.style.pointerEvents).toBe('none');

      layerManager.setLocked(false);
      expect(layerManager.isLocked()).toBe(false);
    });
  });

  describe('state management', () => {
    it('should export and import state', () => {
      const originalState = {
        isVisible: false,
        opacity: 0.7,
        zIndex: 3,
        locked: true,
      };

      layerManager.importState(originalState);
      const exportedState = layerManager.exportState();
      
      expect(exportedState).toEqual(originalState);
    });

    it('should reset to default state', () => {
      // Modify state
      layerManager.setVisibility(false);
      layerManager.setOpacity(0.5);
      layerManager.setZIndex(10);
      layerManager.setLocked(true);

      // Reset
      layerManager.reset();

      const state = layerManager.getState();
      expect(state).toEqual({
        isVisible: true,
        opacity: 1,
        zIndex: 2,
        locked: false,
      });
    });
  });

  describe('state change notifications', () => {
    it('should notify on state changes', () => {
      const mockCallback = vi.fn();
      layerManager.setStateChangeCallback(mockCallback);

      layerManager.setVisibility(false);
      expect(mockCallback).toHaveBeenCalledWith({
        isVisible: false,
        opacity: 1,
        zIndex: 2,
        locked: false,
      });

      layerManager.setOpacity(0.5);
      expect(mockCallback).toHaveBeenCalledWith({
        isVisible: false,
        opacity: 0.5,
        zIndex: 2,
        locked: false,
      });
    });
  });
});