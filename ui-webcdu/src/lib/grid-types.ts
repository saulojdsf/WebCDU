/**
 * Grid snapping configuration interface
 */
export interface GridConfiguration {
    /** Grid cell size in pixels */
    size: number;
    /** Current snap state */
    enabled: boolean;
    /** Whether to show visual grid overlay */
    showOverlay: boolean;
    /** Distance threshold for snapping in pixels */
    snapThreshold: number;
}

/**
 * Node position with grid information
 */
export interface NodePosition {
    x: number;
    y: number;
    /** Whether position is grid-aligned */
    isSnapped: boolean;
    /** Grid coordinate X (optional) */
    gridX?: number;
    /** Grid coordinate Y (optional) */
    gridY?: number;
}

/**
 * Default grid configuration
 */
export const DEFAULT_GRID_CONFIG: GridConfiguration = {
    size: 20,
    enabled: false,
    showOverlay: false,
    snapThreshold: 10,
};