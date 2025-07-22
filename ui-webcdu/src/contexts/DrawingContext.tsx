import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type {
    DrawingContextType,
    DrawingContextState,
    DrawingTool,
    ToolSettings,
    DrawingData,
    Stroke,
    Shape,
    LayerState
} from '../lib/drawing-types';
import { LayerManager } from '../lib/LayerManager';

// Default tool settings
const defaultToolSettings: ToolSettings = {
    pen: {
        size: 2,
        color: '#FF0000',
        opacity: 1,
    },
    eraser: {
        size: 10,
    },
    shapes: {
        strokeColor: '#FF0000',
        fillColor: '#ffffff',
        strokeWidth: 2,
        filled: false,
    },
};

// Initial state
const initialState: DrawingContextState = {
    isDrawingMode: false,
    currentTool: 'pen',
    toolSettings: defaultToolSettings,
    drawingData: {
        version: '1.0.0',
        strokes: [],
        shapes: [],
    },
    isVisible: true,
    canvasRef: null,
    layerState: {
        isVisible: true,
        opacity: 1,
        zIndex: 2,
        locked: false,
    },
};

// Action types
type DrawingAction =
    | { type: 'SET_DRAWING_MODE'; payload: boolean }
    | { type: 'SET_CURRENT_TOOL'; payload: DrawingTool }
    | { type: 'UPDATE_TOOL_SETTINGS'; payload: { tool: DrawingTool; settings: any } }
    | { type: 'ADD_STROKE'; payload: Stroke }
    | { type: 'ADD_SHAPE'; payload: Shape }
    | { type: 'CLEAR_DRAWING' }
    | { type: 'SET_VISIBILITY'; payload: boolean }
    | { type: 'SET_CANVAS_REF'; payload: React.RefObject<HTMLCanvasElement> }
    | { type: 'IMPORT_DRAWING_DATA'; payload: DrawingData }
    | { type: 'UPDATE_LAYER_STATE'; payload: Partial<LayerState> };

// Reducer function
function drawingReducer(state: DrawingContextState, action: DrawingAction): DrawingContextState {
    switch (action.type) {
        case 'SET_DRAWING_MODE':
            return { ...state, isDrawingMode: action.payload };

        case 'SET_CURRENT_TOOL':
            return { ...state, currentTool: action.payload };

        case 'UPDATE_TOOL_SETTINGS':
            const { tool, settings } = action.payload;
            if (tool === 'pen') {
                return {
                    ...state,
                    toolSettings: {
                        ...state.toolSettings,
                        pen: { ...state.toolSettings.pen, ...settings },
                    },
                };
            } else if (tool === 'eraser') {
                return {
                    ...state,
                    toolSettings: {
                        ...state.toolSettings,
                        eraser: { ...state.toolSettings.eraser, ...settings },
                    },
                };
            } else {
                return {
                    ...state,
                    toolSettings: {
                        ...state.toolSettings,
                        shapes: { ...state.toolSettings.shapes, ...settings },
                    },
                };
            }

        case 'ADD_STROKE':
            return {
                ...state,
                drawingData: {
                    ...state.drawingData,
                    strokes: [...state.drawingData.strokes, action.payload],
                },
            };

        case 'ADD_SHAPE':
            return {
                ...state,
                drawingData: {
                    ...state.drawingData,
                    shapes: [...state.drawingData.shapes, action.payload],
                },
            };

        case 'CLEAR_DRAWING':
            return {
                ...state,
                drawingData: {
                    ...state.drawingData,
                    strokes: [],
                    shapes: [],
                },
            };

        case 'SET_VISIBILITY':
            return { ...state, isVisible: action.payload };

        case 'SET_CANVAS_REF':
            return { ...state, canvasRef: action.payload };

        case 'IMPORT_DRAWING_DATA':
            return { ...state, drawingData: action.payload };

        case 'UPDATE_LAYER_STATE':
            return {
                ...state,
                layerState: { ...state.layerState, ...action.payload },
                // Keep isVisible in sync with layerState for backward compatibility
                isVisible: action.payload.isVisible !== undefined ? action.payload.isVisible : state.isVisible,
            };

        default:
            return state;
    }
}

// Create context
const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

// Provider component
export function DrawingProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(drawingReducer, initialState);
    const layerManagerRef = useRef<LayerManager>(new LayerManager(initialState.layerState));

    // Action creators
    const setDrawingMode = useCallback((enabled: boolean) => {
        dispatch({ type: 'SET_DRAWING_MODE', payload: enabled });
    }, []);

    const setCurrentTool = useCallback((tool: DrawingTool) => {
        dispatch({ type: 'SET_CURRENT_TOOL', payload: tool });
    }, []);

    const updateToolSettings = useCallback((tool: DrawingTool, settings: any) => {
        dispatch({ type: 'UPDATE_TOOL_SETTINGS', payload: { tool, settings } });
    }, []);

    const addStroke = useCallback((stroke: Stroke) => {
        dispatch({ type: 'ADD_STROKE', payload: stroke });
    }, []);

    const addShape = useCallback((shape: Shape) => {
        dispatch({ type: 'ADD_SHAPE', payload: shape });
    }, []);

    const clearDrawing = useCallback(() => {
        dispatch({ type: 'CLEAR_DRAWING' });
    }, []);

    const setVisibility = useCallback((visible: boolean) => {
        dispatch({ type: 'SET_VISIBILITY', payload: visible });
    }, []);

    const setCanvasRef = useCallback((ref: React.RefObject<HTMLCanvasElement>) => {
        dispatch({ type: 'SET_CANVAS_REF', payload: ref });
    }, []);

    const exportDrawingData = useCallback((): DrawingData => {
        return state.drawingData;
    }, [state.drawingData]);

    const importDrawingData = useCallback((data: DrawingData) => {
        dispatch({ type: 'IMPORT_DRAWING_DATA', payload: data });
    }, []);

    // Layer management actions
    const setLayerOpacity = useCallback((opacity: number) => {
        layerManagerRef.current.setOpacity(opacity);
        dispatch({ type: 'UPDATE_LAYER_STATE', payload: { opacity } });
    }, []);

    const setLayerZIndex = useCallback((zIndex: number) => {
        layerManagerRef.current.setZIndex(zIndex);
        dispatch({ type: 'UPDATE_LAYER_STATE', payload: { zIndex } });
    }, []);

    const setLayerLocked = useCallback((locked: boolean) => {
        layerManagerRef.current.setLocked(locked);
        dispatch({ type: 'UPDATE_LAYER_STATE', payload: { locked } });
    }, []);

    const toggleLayerVisibility = useCallback(() => {
        const newVisibility = !state.layerState.isVisible;
        layerManagerRef.current.setVisibility(newVisibility);
        dispatch({ type: 'UPDATE_LAYER_STATE', payload: { isVisible: newVisibility } });
    }, [state.layerState.isVisible]);

    const resetLayer = useCallback(() => {
        layerManagerRef.current.reset();
        const resetState = layerManagerRef.current.getState();
        dispatch({ type: 'UPDATE_LAYER_STATE', payload: resetState });
    }, []);

    // Update layer manager when canvas ref changes
    const setCanvasRefWithLayerManager = useCallback((ref: React.RefObject<HTMLCanvasElement>) => {
        dispatch({ type: 'SET_CANVAS_REF', payload: ref });
        if (ref?.current) {
            layerManagerRef.current.setCanvas(ref.current);
        }
    }, []);

    // Override setVisibility to use layer manager
    const setVisibilityWithLayerManager = useCallback((visible: boolean) => {
        layerManagerRef.current.setVisibility(visible);
        dispatch({ type: 'UPDATE_LAYER_STATE', payload: { isVisible: visible } });
    }, []);

    const contextValue: DrawingContextType = {
        ...state,
        setDrawingMode,
        setCurrentTool,
        updateToolSettings,
        addStroke,
        addShape,
        clearDrawing,
        setVisibility: setVisibilityWithLayerManager,
        setCanvasRef: setCanvasRefWithLayerManager,
        exportDrawingData,
        importDrawingData,
        setLayerOpacity,
        setLayerZIndex,
        setLayerLocked,
        toggleLayerVisibility,
        resetLayer,
    };

    return (
        <DrawingContext.Provider value={contextValue}>
            {children}
        </DrawingContext.Provider>
    );
}

// Custom hook to use the drawing context
export function useDrawing(): DrawingContextType {
    const context = useContext(DrawingContext);
    if (context === undefined) {
        throw new Error('useDrawing must be used within a DrawingProvider');
    }
    return context;
}