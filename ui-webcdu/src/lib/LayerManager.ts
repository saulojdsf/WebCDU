/**
 * LayerManager handles drawing layer visibility, ordering, and management
 */

export interface LayerState {
  isVisible: boolean;
  opacity: number;
  zIndex: number;
  locked: boolean;
}

export class LayerManager {
  private layerState: LayerState;
  private canvasElement: HTMLCanvasElement | null = null;
  private onStateChange?: (state: LayerState) => void;

  constructor(initialState?: Partial<LayerState>) {
    this.layerState = {
      isVisible: true,
      opacity: 1,
      zIndex: 2, // Above React Flow background, below nodes
      locked: false,
      ...initialState,
    };
  }

  /**
   * Set the canvas element to manage
   */
  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvasElement = canvas;
    this.applyLayerState();
  }

  /**
   * Set callback for state changes
   */
  public setStateChangeCallback(callback: (state: LayerState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current layer state
   */
  public getState(): LayerState {
    return { ...this.layerState };
  }

  /**
   * Toggle layer visibility
   */
  public toggleVisibility(): void {
    this.setVisibility(!this.layerState.isVisible);
  }

  /**
   * Set layer visibility
   */
  public setVisibility(visible: boolean): void {
    this.layerState.isVisible = visible;
    this.applyLayerState();
    this.notifyStateChange();
  }

  /**
   * Set layer opacity
   */
  public setOpacity(opacity: number): void {
    this.layerState.opacity = Math.max(0, Math.min(1, opacity));
    this.applyLayerState();
    this.notifyStateChange();
  }

  /**
   * Set layer z-index for proper ordering with React Flow elements
   */
  public setZIndex(zIndex: number): void {
    this.layerState.zIndex = zIndex;
    this.applyLayerState();
    this.notifyStateChange();
  }

  /**
   * Lock/unlock layer to prevent modifications
   */
  public setLocked(locked: boolean): void {
    this.layerState.locked = locked;
    this.notifyStateChange();
  }

  /**
   * Check if layer is locked
   */
  public isLocked(): boolean {
    return this.layerState.locked;
  }

  /**
   * Check if layer is visible
   */
  public isVisible(): boolean {
    return this.layerState.isVisible;
  }

  /**
   * Get layer opacity
   */
  public getOpacity(): number {
    return this.layerState.opacity;
  }

  /**
   * Get layer z-index
   */
  public getZIndex(): number {
    return this.layerState.zIndex;
  }

  /**
   * Apply current layer state to canvas element
   */
  private applyLayerState(): void {
    if (!this.canvasElement) return;

    // Apply visibility
    this.canvasElement.style.display = this.layerState.isVisible ? 'block' : 'none';
    
    // Apply opacity
    this.canvasElement.style.opacity = this.layerState.opacity.toString();
    
    // Apply z-index
    this.canvasElement.style.zIndex = this.layerState.zIndex.toString();

    // Apply pointer events based on lock state
    if (this.layerState.locked) {
      this.canvasElement.style.pointerEvents = 'none';
    } else {
      // Reset pointer events when unlocked - let the component control this
      this.canvasElement.style.pointerEvents = '';
    }
  }

  /**
   * Notify state change callback
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * Reset layer to default state
   */
  public reset(): void {
    this.layerState = {
      isVisible: true,
      opacity: 1,
      zIndex: 2,
      locked: false,
    };
    this.applyLayerState();
    this.notifyStateChange();
  }

  /**
   * Export layer state for persistence
   */
  public exportState(): LayerState {
    return { ...this.layerState };
  }

  /**
   * Import layer state from persistence
   */
  public importState(state: LayerState): void {
    this.layerState = { ...state };
    this.applyLayerState();
    this.notifyStateChange();
  }
}