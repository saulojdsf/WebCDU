import { useEffect } from 'react';
import { useDrawing } from '@/contexts/DrawingContext';

/**
 * Custom hook to manage cursor appearance based on drawing tool
 */
export function useDrawingCursor() {
  const { isDrawingMode, currentTool, toolSettings } = useDrawing();

  useEffect(() => {
    if (!isDrawingMode) {
      document.body.style.cursor = '';
      return;
    }

    let cursor = 'default';

    switch (currentTool) {
      case 'pen':
        cursor = 'crosshair';
        break;
      case 'eraser':
        // Create a custom cursor for eraser with size indication
        const size = toolSettings.eraser.size;
        const cursorSize = Math.min(Math.max(size / 2, 8), 32);
        cursor = `url("data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns='http://www.w3.org/2000/svg' width='${cursorSize}' height='${cursorSize}' viewBox='0 0 ${cursorSize} ${cursorSize}'>
            <circle cx='${cursorSize/2}' cy='${cursorSize/2}' r='${cursorSize/2 - 1}' fill='none' stroke='black' stroke-width='1'/>
            <circle cx='${cursorSize/2}' cy='${cursorSize/2}' r='${cursorSize/2 - 2}' fill='none' stroke='white' stroke-width='1'/>
          </svg>
        `)}")  ${cursorSize/2} ${cursorSize/2}, auto`;
        break;
      case 'rectangle':
      case 'circle':
      case 'line':
        cursor = 'crosshair';
        break;
      default:
        cursor = 'default';
    }

    document.body.style.cursor = cursor;

    // Cleanup function to reset cursor
    return () => {
      document.body.style.cursor = '';
    };
  }, [isDrawingMode, currentTool, toolSettings.eraser.size]);

  // Return cursor info for components that might need it
  return {
    isDrawingMode,
    currentTool,
    cursor: isDrawingMode ? currentTool : null,
  };
}