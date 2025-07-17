import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, X, Loader2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import type { 
  SearchComponentProps, 
  SearchMode 
} from '@/lib/search-types';

/**
 * SearchComponent - Main search interface for node search functionality
 * Implements requirements 3.1, 3.2, and provides the UI for search operations
 */
export function SearchComponent({
  searchState,
  onSearchInput,
  onSearchModeChange,
  onClearSearch,
  placeholder = "Search nodes by ID or variable...",
  disabled = false,
  className,
  ...props
}: SearchComponentProps & { className?: string } & React.ComponentProps<"div">) {
  const [inputValue, setInputValue] = useState(searchState.query);

  // Update input value when searchState changes externally
  useEffect(() => {
    setInputValue(searchState.query);
  }, [searchState.query]);

  // Handle input changes with controlled state
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    onSearchInput(value);
  }, [onSearchInput]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setInputValue('');
    onClearSearch();
  }, [onClearSearch]);

  // Reference to the search input element
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus the search input when pressing / key
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Check if the active element is not an input or textarea
      const isInputActive = document.activeElement instanceof HTMLInputElement || 
                           document.activeElement instanceof HTMLTextAreaElement;
      
      // Focus search input when pressing / key (unless already in an input)
      if (event.key === '/' && !isInputActive) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Toggle search mode with Alt+M
      if (event.key === 'm' && event.altKey) {
        event.preventDefault();
        onSearchModeChange(searchState.mode === 'id' ? 'variable' : 'id');
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchState.mode, onSearchModeChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleClearSearch();
    }
  }, [handleClearSearch]);

  // Determine search mode based on input pattern
  const detectedMode: SearchMode = useMemo(() => {
    if (!inputValue.trim()) return 'id';
    
    // Simple heuristic: if it looks like a node ID (starts with number or contains only alphanumeric)
    // treat as ID search, otherwise treat as variable search
    const trimmed = inputValue.trim();
    const isNumericStart = /^\d/.test(trimmed);
    const isShortAlphanumeric = /^[a-zA-Z0-9]{1,6}$/.test(trimmed);
    
    return (isNumericStart || isShortAlphanumeric) ? 'id' : 'variable';
  }, [inputValue]);

  // Update search mode when detected mode changes
  useEffect(() => {
    if (inputValue.trim() && detectedMode !== searchState.mode) {
      onSearchModeChange(detectedMode);
    }
  }, [detectedMode, searchState.mode, onSearchModeChange, inputValue]);

  // Generate status message based on search state
  const statusMessage = useMemo(() => {
    if (!searchState.isActive || !searchState.results) {
      return null;
    }

    const { results } = searchState;
    
    if (results.error) {
      return {
        type: 'error' as const,
        message: results.error
      };
    }

    if (results.found) {
      const nodeCount = results.nodes.length;
      const edgeCount = results.edges.length;
      
      if (results.searchType === 'id') {
        return {
          type: 'success' as const,
          message: `Found node: ${results.nodes[0]?.id || 'Unknown'}`
        };
      } else {
        const nodeText = nodeCount === 1 ? 'node' : 'nodes';
        const edgeText = edgeCount > 0 ? ` and ${edgeCount} connection${edgeCount === 1 ? '' : 's'}` : '';
        return {
          type: 'success' as const,
          message: `Found ${nodeCount} ${nodeText}${edgeText}`
        };
      }
    }

    return null;
  }, [searchState]);

  return (
    <TooltipProvider>
      <div className={cn("relative flex items-center gap-2", className)} {...props}>
        {/* Search Input Container */}
        <div className="relative flex-1">
          <Label htmlFor="node-search" className="sr-only">
            Search nodes by ID or variable name
          </Label>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            
            <Input
              id="node-search"
              ref={searchInputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pl-8 pr-8 h-8",
                searchState.isLoading && "opacity-75",
                statusMessage?.type === 'error' && "border-destructive focus-visible:ring-destructive"
              )}
              aria-describedby={statusMessage ? "search-status" : "search-instructions"}
              aria-label="Search nodes by ID or variable name"
              aria-autocomplete="list"
              aria-controls={searchState.isActive ? "search-results" : undefined}
              aria-expanded={searchState.isActive && searchState.results?.found}
              aria-busy={searchState.isLoading}
            />

            {/* Loading indicator */}
            {searchState.isLoading && (
              <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}

            {/* Clear button */}
            {inputValue && !searchState.isLoading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
                    onClick={handleClearSearch}
                    disabled={disabled}
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Clear search (Esc)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Search Mode Indicator */}
        {inputValue.trim() && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Mode:</span>
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              searchState.mode === 'id' 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            )}>
              {searchState.mode === 'id' ? 'ID' : 'Variable'}
            </span>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div 
            id="search-status"
            className={cn(
              "absolute top-full left-0 right-0 mt-1 px-2 py-1 text-xs rounded border z-10",
              statusMessage.type === 'success' 
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
            )}
            role="status"
            aria-live="polite"
          >
            {statusMessage.message}
          </div>
        )}
        
        {/* Screen reader instructions */}
        <div id="search-instructions" className="sr-only" aria-live="polite">
          Press slash (/) to focus search. Press Alt+M to toggle between ID and variable search modes. 
          Press Escape to clear search. Search results will be announced automatically.
        </div>
        
        {/* Live region for search result announcements */}
        <div 
          aria-live="assertive" 
          className="sr-only"
          role="region"
          aria-atomic="true"
        >
          {searchState.isActive && searchState.results?.found && (
            <>
              {searchState.mode === 'id' 
                ? `Found node ${searchState.results.nodes[0]?.id || 'Unknown'}. The view has been centered on this node.` 
                : `Found ${searchState.results.nodes.length} ${searchState.results.nodes.length === 1 ? 'node' : 'nodes'} 
                   ${searchState.results.edges.length > 0 ? `and ${searchState.results.edges.length} ${searchState.results.edges.length === 1 ? 'connection' : 'connections'}` : ''}.
                   The view has been adjusted to show all matching nodes.`
              }
            </>
          )}
          {searchState.isActive && !searchState.results?.found && searchState.results?.error && (
            `Search error: ${searchState.results.error}`
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Default export for easier importing
 */
export default SearchComponent;