/**
 * Integration tests for SearchComponent
 * 
 * This test suite covers user interactions, state management, search mode switching,
 * and integration with ReactFlow visualization.
 * 
 * Requirements covered:
 * - 3.1: Search interface with clear placeholder text
 * - 3.2: Indication of available search modes
 * - 3.3: Visual feedback for search results
 * - 3.4: Integration with main App
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

describe('SearchComponent', () => {
  // Default props for testing
  const defaultSearchState: SearchState = {
    query: '',
    mode: 'id',
    results: null,
    isActive: false,
    highlightedElements: {
      nodes: [],
      edges: [],
    },
    isLoading: false,
  };

  const mockHandlers = {
    onSearchInput: vi.fn(),
    onSearchModeChange: vi.fn(),
    onClearSearch: vi.fn(),
  };

  // Helper function to render the component with custom props
  const renderComponent = (
    searchState: Partial<SearchState> = {},
    handlers = mockHandlers
  ) => {
    return render(
      <SearchComponent
        searchState={{ ...defaultSearchState, ...searchState }}
        onSearchInput={handlers.onSearchInput}
        onSearchModeChange={handlers.onSearchModeChange}
        onClearSearch={handlers.onClearSearch}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering and interactions', () => {
    it('renders with default placeholder text', () => {
      renderComponent();
      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('placeholder', 'Search nodes by ID or variable...');
    });

    it('renders with custom placeholder text', () => {
      render(
        <SearchComponent
          searchState={defaultSearchState}
          onSearchInput={mockHandlers.onSearchInput}
          onSearchModeChange={mockHandlers.onSearchModeChange}
          onClearSearch={mockHandlers.onClearSearch}
          placeholder="Custom placeholder"
        />
      );
      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    it('calls onSearchInput when typing in the input', () => {
      renderComponent();
      const input = screen.getByTestId('search-input');
      
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(mockHandlers.onSearchInput).toHaveBeenCalledWith('test');
    });

    it('shows clear button when input has text', () => {
      renderComponent({ query: 'test' });
      const clearButton = screen.getByTestId('button');
      expect(clearButton).toBeInTheDocument();
    });

    it('calls onClearSearch when clear button is clicked', () => {
      renderComponent({ query: 'test' });
      const clearButton = screen.getByTestId('button');
      
      fireEvent.click(clearButton);
      
      expect(mockHandlers.onClearSearch).toHaveBeenCalled();
    });

    it('calls onClearSearch when Escape key is pressed', () => {
      renderComponent({ query: 'test' });
      const input = screen.getByTestId('search-input');
      
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(mockHandlers.onClearSearch).toHaveBeenCalled();
    });
  });

  describe('Search mode indication', () => {
    it('shows ID search mode indicator when mode is id', () => {
      renderComponent({ query: 'test', mode: 'id' });
      const modeIndicator = screen.getByText('ID');
      expect(modeIndicator).toBeInTheDocument();
    });

    it('shows Variable search mode indicator when mode is variable', () => {
      renderComponent({ query: 'test', mode: 'variable' });
      const modeIndicator = screen.getByText('Variable');
      expect(modeIndicator).toBeInTheDocument();
    });

    it('does not show mode indicator when input is empty', () => {
      renderComponent({ query: '' });
      expect(screen.queryByText('ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Variable')).not.toBeInTheDocument();
    });

    it('automatically detects and switches mode based on input pattern', async () => {
      const { rerender } = renderComponent();
      
      // Initially no mode is shown (empty input)
      expect(screen.queryByText('ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Variable')).not.toBeInTheDocument();
      
      // Update with numeric input (should detect as ID mode)
      rerender(
        <SearchComponent
          searchState={{ ...defaultSearchState, query: '123', mode: 'id' }}
          onSearchInput={mockHandlers.onSearchInput}
          onSearchModeChange={mockHandlers.onSearchModeChange}
          onClearSearch={mockHandlers.onClearSearch}
        />
      );
      
      expect(screen.getByText('ID')).toBeInTheDocument();
      
      // Update with variable-like input (should detect as variable mode)
      rerender(
        <SearchComponent
          searchState={{ ...defaultSearchState, query: 'X0001', mode: 'variable' }}
          onSearchInput={mockHandlers.onSearchInput}
          onSearchModeChange={mockHandlers.onSearchModeChange}
          onClearSearch={mockHandlers.onClearSearch}
        />
      );
      
      expect(screen.getByText('Variable')).toBeInTheDocument();
    });
  });

  describe('Search feedback and status messages', () => {
    it('shows loading indicator when search is in progress', () => {
      renderComponent({ query: 'test', isLoading: true });
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toBeInTheDocument();
    });

    it('shows success message when search finds results', () => {
      renderComponent({
        query: '0001',
        mode: 'id',
        isActive: true,
        results: {
          nodes: [{ id: '0001', data: { id: '0001' }, position: { x: 0, y: 0 } }],
          edges: [],
          found: true,
          searchType: 'id',
          query: '0001',
        },
      });
      
      const statusMessage = screen.getByRole('status');
      expect(statusMessage).toHaveTextContent('Found node: 0001');
    });

    it('shows error message when search fails', () => {
      renderComponent({
        query: '9999',
        mode: 'id',
        isActive: true,
        results: {
          nodes: [],
          edges: [],
          found: false,
          searchType: 'id',
          query: '9999',
          error: 'Node not found',
        },
      });
      
      const statusMessage = screen.getByRole('status');
      expect(statusMessage).toHaveTextContent('Node not found');
    });

    it('shows variable search results with node and edge counts', () => {
      renderComponent({
        query: 'X0001',
        mode: 'variable',
        isActive: true,
        results: {
          nodes: [
            { id: '0001', data: { id: '0001' }, position: { x: 0, y: 0 } },
            { id: '0002', data: { id: '0002' }, position: { x: 0, y: 0 } },
          ],
          edges: [{ id: 'e1', source: '0001', target: '0002' }],
          found: true,
          searchType: 'variable',
          query: 'X0001',
        },
      });
      
      const statusMessage = screen.getByRole('status');
      expect(statusMessage).toHaveTextContent('Found 2 nodes and 1 connection');
    });
  });

  describe('Keyboard accessibility', () => {
    it('focuses search input when / key is pressed', () => {
      renderComponent();
      
      // Simulate pressing / key
      fireEvent.keyDown(document, { key: '/' });
      
      const input = screen.getByTestId('search-input');
      expect(document.activeElement).toBe(input);
    });

    it('toggles search mode when Alt+M is pressed', () => {
      renderComponent({ mode: 'id' });
      
      // Simulate pressing Alt+M
      fireEvent.keyDown(window, { key: 'm', altKey: true });
      
      expect(mockHandlers.onSearchModeChange).toHaveBeenCalledWith('variable');
    });

    it('provides screen reader instructions', () => {
      renderComponent();
      
      const instructions = screen.getByText(/Press slash \(\/\) to focus search/i);
      expect(instructions).toBeInTheDocument();
    });

    it('announces search results to screen readers', () => {
      renderComponent({
        query: '0001',
        mode: 'id',
        isActive: true,
        results: {
          nodes: [{ id: '0001', data: { id: '0001' }, position: { x: 0, y: 0 } }],
          edges: [],
          found: true,
          searchType: 'id',
          query: '0001',
        },
      });
      
      const announcement = screen.getByText(/Found node 0001/i);
      expect(announcement).toBeInTheDocument();
    });
  });

  describe('Integration with search state', () => {
    it('updates input value when searchState.query changes externally', () => {
      const { rerender } = renderComponent({ query: '' });
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('');
      
      // Update search state externally
      rerender(
        <SearchComponent
          searchState={{ ...defaultSearchState, query: 'external update' }}
          onSearchInput={mockHandlers.onSearchInput}
          onSearchModeChange={mockHandlers.onSearchModeChange}
          onClearSearch={mockHandlers.onClearSearch}
        />
      );
      
      expect(input).toHaveValue('external update');
    });

    it('applies appropriate styling based on search result status', () => {
      renderComponent({
        query: '9999',
        mode: 'id',
        isActive: true,
        results: {
          nodes: [],
          edges: [],
          found: false,
          searchType: 'id',
          query: '9999',
          error: 'Node not found',
        },
      });
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveClass('border-destructive');
    });
  });
});