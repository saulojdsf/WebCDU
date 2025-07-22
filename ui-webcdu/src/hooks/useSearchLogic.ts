import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { visualizationController } from '@/lib/visualization-controller';
import type { SearchableNode, SearchableEdge } from '@/lib/search-types';
import type { Node, Edge } from 'reactflow';

export const useSearchLogic = (nodes: Node[], edges: Edge[], reactFlowInstance: any) => {
    const searchableNodes: SearchableNode[] = useMemo(() =>
        nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                id: node.data?.id || node.id,
                Vin: node.data?.Vin,
                Vout: node.data?.Vout
            }
        })), [nodes]
    );

    const searchableEdges: SearchableEdge[] = useMemo(() =>
        edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            data: edge.data,
            label: edge.label
        })), [edges]
    );

    const {
        searchState,
        handleSearchInput,
        handleSearchModeChange,
        clearSearch
    } = useSearch(searchableNodes, searchableEdges);

    useEffect(() => {
        if (reactFlowInstance) {
            visualizationController.setReactFlowInstance(reactFlowInstance);
        }
    }, [reactFlowInstance]);

    useEffect(() => {
        if (searchState.results && searchState.isActive) {
            visualizationController.highlightSearchResults(searchState.results);
            visualizationController.debouncedCenterOnNodes(searchState.results.nodes);
        } else {
            visualizationController.clearHighlighting();
        }
    }, [searchState.results, searchState.isActive]);

    const handleClearSearch = useCallback(() => {
        clearSearch();
        visualizationController.clearHighlighting();
    }, [clearSearch]);

    const searchStateRef = useRef(searchState);
    useEffect(() => {
        searchStateRef.current = searchState;
    }, [searchState]);

    return {
        searchState,
        handleSearchInput,
        handleSearchModeChange,
        handleClearSearch,
        searchStateRef
    };
};