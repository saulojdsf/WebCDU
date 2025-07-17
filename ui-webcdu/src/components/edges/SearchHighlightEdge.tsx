import React from 'react';
import { type EdgeProps } from 'reactflow';
import DefaultEdge from './DefaultEdge';

/**
 * Edge wrapper component that adds search highlighting functionality
 * This component wraps the DefaultEdge and adds search highlighting styles
 */
export function SearchHighlightEdge(props: EdgeProps & {
  isSearchHighlighted?: boolean;
  isSearchDimmed?: boolean;
}) {
  const { isSearchHighlighted, isSearchDimmed, style = {}, ...rest } = props;
  // Check for high contrast mode
  const isHighContrast = React.useMemo(() => {
    try {
      return window.matchMedia('(forced-colors: active)').matches;
    } catch (e) {
      return false;
    }
  }, []);
  
  // Create enhanced style object based on search state
  const enhancedStyle = React.useMemo(() => {
    let newStyle = { ...style };
    
    if (isSearchHighlighted) {
      // Apply highlighting styles for search results
      if (isHighContrast) {
        // Use system highlight color for high contrast mode
        newStyle = {
          ...newStyle,
          stroke: 'HighlightText',
          strokeWidth: 4,
          transition: 'stroke-width 200ms ease',
        };
      } else {
        // Use highlight color (orange)
        newStyle = {
          ...newStyle,
          stroke: '#ff6b35', // Bright orange for highlighted edges
          strokeWidth: 3,
          transition: 'stroke 200ms ease, stroke-width 200ms ease, opacity 200ms ease',
        };
      }
    }
    
    if (isSearchDimmed) {
      // Apply dimming for non-matching edges during search
      if (isHighContrast) {
        // Use dashed lines instead of opacity for high contrast mode
        newStyle = {
          ...newStyle,
          strokeDasharray: '4,4',
          transition: 'stroke-dasharray 200ms ease',
        };
      } else {
        newStyle = {
          ...newStyle,
          opacity: 0.5,
          transition: 'opacity 200ms ease',
        };
      }
    }
    
    return newStyle;
  }, [style, isSearchHighlighted, isSearchDimmed, isHighContrast]);
  
  // Pass enhanced style to the DefaultEdge component
  return <DefaultEdge {...rest} style={enhancedStyle} />;
}

export default SearchHighlightEdge;