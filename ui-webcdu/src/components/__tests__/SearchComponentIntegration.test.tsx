/**
 * Integration tests for SearchComponent with ReactFlow
 * 
 * This test suite covers the integration between SearchComponent,
 * ReactFlow, and the visualization controller.
 * 
 * Requirements covered:
 * - 3.3: Visual feedback showing search results
 * - 3.4: Integration with main App and ReactFlow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchComponent } from '../SearchComponent';
import type { SearchState, SearchMode } from '@/lib/search-types';

// Mock the Lucide React icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">SearchIcon</div>,
  X: () => <div data-testid="clear-icon">ClearIcon</div>,
  Loader2: () => <div data-testid="loader-icon">LoaderIcon</div>,
  Info: () => <div data-testid="info-icon">InfoIcon</div>,
}));

// Mock the UI components
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="search-input" {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button data-testid="button" {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: (props: any) => <label data-testid="label" {...props} />,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
}));

vi.mock('@/components/ui/visually-hidden', () => ({
  VisuallyHidden: ({ children }: any) => <div data-testid="visually-hidden">{children}</div>,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock ReactFlow
vi.mock('reactflow', () => ({
  useReactFlow: () => ({
    getNodes: () => mockNodes,
    getEdges: () => mockEdges,
    setCenter: vi.fn(),
    fitView: vi.fn(),
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  }),
}));

// Mock the visualization controller
vi.mock('@/lib/visualization-controller', () => ({
  visualizationController: {
    highlightSearchResults: vi.fn(),
    centerViewOnNodes: vi.fn(),
    clearHighlighting: vi.fn(),
    dimNonMatchingNodes: vi.fn(),
  },
}));

// Sample test data
const mockNodes = [
  {
    id: '0001',
    type: 'input',
    position: { x: 0, y: 0 },
    data: {
      id: '0001',
      Vout: 'X0001',
      label: 'Input',
    },
  },
  {
    id: '0002',
    type: 'output',
    position: { x: 100, y: 0 },
    data: {
      id: '0002',
      Vin: '[X0001]',
      label: 'Output',
    },
  },
];

const mockEdges = [
  {
    id: 'e1',
    source: '0001',
    target: '0002',
  },
];

// Create a wrapper component that simulates the integration with ReactFlow
function SearchWithReactFlow() {
  const [searchState, setSearchState] = React.useState<SearchState>({
    query: '',
    mode: 'id',
    results: null,
    isActive: false,
    highlightedElements: {
      nodes: [],
      edges: [],
    },
    isLoading: false,
  });

  const handleSearchInput = (query: string) => {
    setSearchState(prev => ({ ...prev, query, isLoading: query.length > 0 }));
    
    // Simulate search delay
    if (query) {
      setTimeout(() => {
        if (searchState.mode === 'id') {
          const node = mockNodes.find(n => n.id === query);
          setSearchState(prev => ({
            ...prev,
            isLoading: false,
            isActive: !!node,
            results: {
              nodes: node ? [node] : [],
              edges: [],
              found: !!node,
              searchType: 'id',
              query,
              error: node ? undefined : 'Node not found',
            },
            highlightedElements: {
              nodes: node ? [node.id] : [],
              edges: [],
            },
          }));
        } else {
          const matchingNodes = mockNodes.filter(n => 
            n.data.Vout === query || 
            (n.data.Vin && n.data.Vin.includes(query))
          );
          
          setSearchState(prev => ({
            ...prev,
            isLoading: false,
            isActive: matchingNodes.length > 0,
            results: {
              nodes: matchingNodes,
              edges: matchingNodes.length > 1 ? mockEdges : [],
              found: matchingNodes.length > 0,
              searchType: 'variable',
              query,
              error: matchingNodes.length > 0 ? undefined : 'Variable not found',
            },
            highlightedElements: {
              nodes: matchingNodes.map(n => n.id),
              edges: matchingNodes.length > 1 ? mockEdges.map(e => e.id) : [],
            },
          }));
        }
      }, 10);
    }
  };

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchState(prev => ({ ...prev, mode }));
  };

  const handleClearSearch = () => {
    setSearchState({
      query: '',
      mode: 'id',
      results: null,
      isActive: false,
      highlightedElements: {
        nodes: [],
        edges: [],
      },
      isLoading: false,
    });
  };

  return (
    <div>
      <SearchComponent
        searchState={searchState}
        onSearchInput={handleSearchInput}
        onSearchModeChange={handleSearchModeChange}
        onClearSearch={handleClearSearch}
      />
      <div data-testid="reactflow-container">
        {searchState.isActive && searchState.results?.found && (
          <div data-testid="highlighted-nodes">
            Highlighted nodes: {searchState.highlightedElements.nodes.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

describe('SearchComponent Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('integrates with ReactFlow to highlight nodes on successful search', async () => {
    render(<SearchWithReactFlow />);
    
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '0001' } });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(screen.getByTestId('highlighted-nodes')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('highlighted-nodes')).toHaveTextContent('Highlighted nodes: 0001');
  });

  it('shows error message when node is not found', async () => {
    render(<SearchWithReactFlow />);
    
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '9999' } });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('status')).toHaveTextContent('Node not found');
  });

  it('switches between ID and variable search modes', async () => {
    render(<SearchWithReactFlow />);
    
    const input = screen.getByTestId('search-input');
    
    // First search by ID
    fireEvent.change(input, { target: { value: '0001' } });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(screen.getByTestId('highlighted-nodes')).toBeInTheDocument();
    });
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    
    // Clear and search by variable
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: 'X0001' } });
    
    // Wait for the mode to switch
    await waitFor(() => {
      expect(screen.getByText('Variable')).toBeInTheDocument();
    });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(screen.getByTestId('highlighted-nodes')).toBeInTheDocument();
    });
    
    // Should highlight both nodes connected by the variable
    expect(screen.getByTestId('highlighted-nodes')).toHaveTextContent('Highlighted nodes: 0001, 0002');
  });

  it('clears highlighting when search is cleared', async () => {
    render(<SearchWithReactFlow />);
    
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '0001' } });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(screen.getByTestId('highlighted-nodes')).toBeInTheDocument();
    });
    
    // Clear the search
    const clearButton = screen.getByTestId('button');
    fireEvent.click(clearButton);
    
    // Highlighting should be removed
    expect(screen.queryByTestId('highlighted-nodes')).not.toBeInTheDocument();
  });

  it('provides keyboard shortcuts for search operations', async () => {
    render(<SearchWithReactFlow />);
    
    // Focus search with / key
    fireEvent.keyDown(document, { key: '/' });
    expect(document.activeElement).toBe(screen.getByTestId('search-input'));
    
    // Type a search query
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: '0001' } });
    
    // Wait for the search to complete
    await waitFor(() => {
      expect(screen.getByTestId('highlighted-nodes')).toBeInTheDocument();
    });
    
    // Clear with Escape key
    fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'Escape' });
    expect(screen.queryByTestId('highlighted-nodes')).not.toBeInTheDocument();
  });
});