import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the NodeHighlightWrapper component
 */
export interface NodeHighlightWrapperProps {
  /** Whether the node is selected */
  isSelected?: boolean;
  /** Whether the node is highlighted from search */
  isSearchHighlighted?: boolean;
  /** Whether the node is dimmed during search */
  isSearchDimmed?: boolean;
  /** Additional class names */
  className?: string;
  /** Child elements */
  children: React.ReactNode;
  /** Reference to the node element */
  nodeRef?: React.RefObject<HTMLDivElement>;
  /** Double click handler */
  onDoubleClick?: () => void;
}

/**
 * Wrapper component for nodes that adds search highlighting styles
 * This component provides consistent highlighting behavior across all node types
 */
export function NodeHighlightWrapper({
  isSelected,
  isSearchHighlighted,
  isSearchDimmed,
  className,
  children,
  nodeRef,
  onDoubleClick,
}: NodeHighlightWrapperProps) {
  // Check for high contrast mode
  const isHighContrast = React.useMemo(() => {
    try {
      return window.matchMedia('(forced-colors: active)').matches;
    } catch (e) {
      return false;
    }
  }, []);

  // Determine styles based on selection and search state
  const highlightStyles = React.useMemo(() => {
    if (isSearchHighlighted) {
      return isHighContrast
        ? "outline-4 outline outline-[HighlightText] z-10" // High contrast mode
        : "ring-4 ring-orange-500 ring-opacity-75 shadow-lg z-10";
    } else if (isSelected) {
      return isHighContrast
        ? "outline-4 outline outline-[Highlight] z-5" // High contrast mode
        : "ring-4 ring-blue-500 ring-opacity-50 shadow-lg";
    }
    return "";
  }, [isSearchHighlighted, isSelected, isHighContrast]);

  // Apply dimming when search is active but this node is not highlighted
  // In high contrast mode, use a different visual indicator instead of opacity
  const opacityStyle = React.useMemo(() => {
    if (!isSearchDimmed) return "opacity-100";
    
    return isHighContrast 
      ? "border-dashed border-2" // Use dashed border in high contrast mode
      : "opacity-50";
  }, [isSearchDimmed, isHighContrast]);
  
  // Combine all styles
  const combinedStyles = cn(
    "bg-transparent rounded flex flex-col items-center justify-center relative cursor-pointer transition-all duration-200",
    highlightStyles,
    opacityStyle,
    className
  );

  return (
    <div
      ref={nodeRef}
      className={combinedStyles}
      onDoubleClick={onDoubleClick}
      aria-selected={isSelected}
      aria-label={isSearchHighlighted ? "Search result" : undefined}
    >
      {children}
    </div>
  );
}

export default NodeHighlightWrapper;