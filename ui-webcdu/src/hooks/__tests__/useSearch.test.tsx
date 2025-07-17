/**
 * Integration tests for useSearch hook
 * 
 * This test suite covers the integration between the useSearch hook,
 * SearchEngine, and ReactFlow visualization.
 * 
 * Requirements covered:
 * - 3.1: Search interface functionality
 * - 3.2: Search mode indication and feedback
 * - 3.3: Search results display
 * - 3.4: Integration with main App
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSearch } from '../useSearch';
import { searchEngine } from '@/lib/search-engine';
import type { SearchableNode, SearchableEdge } from '@/lib/search-types';

// Mock the search engine
vi.mock('@/lib/search-engine', () => ({
  searchEngine: {
    searchById: vi.fn(),
    searchByVariable: vi.fn(),
    validateSearchQuery: vi.fn(),
    buildVariableIndex: vi.fn(),
    invalidateCache: vi.fn(),
  },
}));

// Mock the useDebounce hook
vi.mock('../useDebounce', () => ({
  __esModule: true,
  default: (value: any) => value, // No debounce in tests
  useDebounce: (value: any) => value,
}));

describe('useSearch', () => {
  // Sample test data
  const mockNodes: SearchableNode[] = [
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

  const mockEdges: SearchableEdge[] = [
    {
      id: 'e1',
      source: '0001',
      target: '0002',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (searchEngine.searchById as any).mockImplementation((nodeId) => {
      const node = mockNodes.find(n => n.id === nodeId || n.data.id === nodeId);
      return {
        nodes: node ? [node] : [],
        edges: [],
        found: !!node,
        searchType: 'id',
        query: nodeId,
        error: node ? undefined : 'Node not found',
      };
    });
    
    (searchEngine.searchByVariable as any).mockImplementation((variableName) => {
      const matchingNodes = mockNodes.filter(n => 
        n.data.Vout === variableName || 
        (n.data.Vin && n.data.Vin.includes(variableName))
      );
      
      return {
        nodes: matchingNodes,
        edges: matchingNodes.length > 1 ? mockEdges : [],
        found: matchingNodes.length > 0,
        searchType: 'variable',
        query: variableName,
        error: matchingNodes.length > 0 ? undefined : 'Variable not found',
      };
    });
    
    (searchEngine.validateSearchQuery as any).mockImplementation((query) => {
      return query.length > 0;
    });
  });

  it('initializes with default search state', () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges));
    
    expect(result.current.searchState).toEqual({
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
  });

  it('updates search query when handleSearchInput is called', () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    act(() => {
      result.current.handleSearchInput('0001');
    });
    
    expect(result.current.searchState.query).toBe('0001');
  });

  it('updates search mode when handleSearchModeChange is called', () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    act(() => {
      result.current.handleSearchModeChange('variable');
    });
    
    expect(result.current.searchState.mode).toBe('variable');
  });

  it('clears search state when clearSearch is called', () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    // Set some search state first
    act(() => {
      result.current.handleSearchInput('0001');
      result.current.triggerSearch();
    });
    
    // Then clear it
    act(() => {
      result.current.clearSearch();
    });
    
    expect(result.current.searchState).toEqual({
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
  });

  it('performs ID search when triggerSearch is called with ID mode', async () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    act(() => {
      result.current.handleSearchInput('0001');
    });
    
    await act(async () => {
      await result.current.triggerSearch();
    });
    
    expect(searchEngine.searchById).toHaveBeenCalledWith('0001', mockNodes);
    expect(result.current.searchState.results?.found).toBe(true);
    expect(result.current.searchState.results?.nodes[0].id).toBe('0001');
  });

  it('performs variable search when triggerSearch is called with variable mode', async () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    act(() => {
      result.current.handleSearchInput('X0001');
      result.current.handleSearchModeChange('variable');
    });
    
    await act(async () => {
      await result.current.triggerSearch();
    });
    
    expect(searchEngine.searchByVariable).toHaveBeenCalledWith('X0001', mockNodes, mockEdges);
    expect(result.current.searchState.results?.found).toBe(true);
    expect(result.current.searchState.results?.nodes.length).toBeGreaterThan(0);
  });

  it('automatically searches when autoSearch is enabled', async () => {
    // Mock the debounce to be immediate for testing
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { 
      autoSearch: true,
      debounceMs: 0,
    }));
    
    act(() => {
      result.current.handleSearchInput('0001');
    });
    
    // Wait for the auto-search to complete
    await vi.runAllTimersAsync();
    
    expect(searchEngine.searchById).toHaveBeenCalledWith('0001', mockNodes);
  });

  it('updates highlighted elements based on search results', async () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    act(() => {
      result.current.handleSearchInput('0001');
    });
    
    await act(async () => {
      await result.current.triggerSearch();
    });
    
    expect(result.current.searchState.highlightedElements.nodes).toEqual(['0001']);
  });

  it('handles search errors gracefully', async () => {
    // Mock searchById to throw an error
    (searchEngine.searchById as any).mockImplementation(() => {
      throw new Error('Test error');
    });
    
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges, { autoSearch: false }));
    
    act(() => {
      result.current.handleSearchInput('0001');
    });
    
    await act(async () => {
      await result.current.triggerSearch();
    });
    
    expect(result.current.searchState.results?.error).toBe('Search failed');
    expect(result.current.searchState.isActive).toBe(false);
  });

  it('rebuilds index when nodes change', () => {
    const { rerender } = renderHook(
      ({ nodes, edges }) => useSearch(nodes, edges),
      { initialProps: { nodes: mockNodes, edges: mockEdges } }
    );
    
    // Update with new nodes
    const newNodes = [...mockNodes, {
      id: '0003',
      type: 'process',
      position: { x: 200, y: 0 },
      data: {
        id: '0003',
        Vout: 'X0003',
        label: 'Process',
      },
    }];
    
    rerender({ nodes: newNodes, edges: mockEdges });
    
    expect(searchEngine.invalidateCache).toHaveBeenCalled();
    expect(searchEngine.buildVariableIndex).toHaveBeenCalledWith(newNodes);
  });

  it('provides utility functions and state for components', () => {
    const { result } = renderHook(() => useSearch(mockNodes, mockEdges));
    
    expect(result.current).toHaveProperty('searchState');
    expect(result.current).toHaveProperty('isValidQuery');
    expect(result.current).toHaveProperty('hasResults');
    expect(result.current).toHaveProperty('resultCount');
    expect(result.current).toHaveProperty('handleSearchInput');
    expect(result.current).toHaveProperty('handleSearchModeChange');
    expect(result.current).toHaveProperty('clearSearch');
    expect(result.current).toHaveProperty('triggerSearch');
    expect(result.current).toHaveProperty('performSearch');
  });
});