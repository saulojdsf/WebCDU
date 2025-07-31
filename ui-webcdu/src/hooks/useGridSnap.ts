import { useState, useEffect, useCallback, useRef } from 'react'
import { GridSnapController } from '@/lib/GridSnapController'
import type { GridConfiguration } from '@/lib/grid-types'
import type { Node } from 'reactflow'

/**
 * Hook for managing grid snapping functionality
 * Provides integration between GridSnapController and React Flow
 */
export function useGridSnap(initialConfig?: Partial<GridConfiguration>) {
    const controllerRef = useRef<GridSnapController | null>(null)

    // Initialize controller only once
    if (!controllerRef.current) {
        controllerRef.current = new GridSnapController(initialConfig)
    }

    const controller = controllerRef.current

    // State for grid configuration
    const [config, setConfig] = useState<GridConfiguration>(controller.getConfig())

    // Subscribe to controller changes
    useEffect(() => {
        const unsubscribe = controller.subscribe((newConfig) => {
            setConfig(newConfig)
        })

        return unsubscribe
    }, [controller])

    // Toggle grid snapping
    const toggleGridSnap = useCallback(() => {
        controller.toggleGridSnap()
    }, [controller])

    // Enable grid snapping
    const enableGridSnap = useCallback(() => {
        controller.enableGridSnap()
    }, [controller])

    // Disable grid snapping
    const disableGridSnap = useCallback(() => {
        controller.disableGridSnap()
    }, [controller])

    // Snap existing nodes to grid - now takes nodes and setNodes as parameters
    const snapExistingNodes = useCallback((nodes: Node[], setNodes: (nodes: Node[]) => void) => {
        const snapFunction = controller.snapExistingNodes()
        snapFunction(nodes, setNodes)
    }, [controller])

    // Snap existing nodes while preserving relative positioning
    const snapExistingNodesPreservingRelativePositioning = useCallback((nodes: Node[], setNodes: (nodes: Node[]) => void) => {
        const snapFunction = controller.snapExistingNodesPreservingRelativePositioning()
        snapFunction(nodes, setNodes)
    }, [controller])

    // Snap existing nodes while preserving groupings and connections
    const snapExistingNodesPreservingGroupings = useCallback((
        nodes: Node[],
        edges: Array<{ source: string; target: string }>,
        setNodes: (nodes: Node[]) => void
    ) => {
        const snapFunction = controller.snapExistingNodesPreservingGroupings()
        snapFunction(nodes, edges, setNodes)
    }, [controller])

    // Update configuration
    const updateConfig = useCallback((updates: Partial<GridConfiguration>) => {
        controller.updateConfig(updates)
    }, [controller])

    return {
        // State
        config,
        isEnabled: config.enabled,
        showOverlay: config.showOverlay,
        gridSize: config.size,

        // Actions
        toggleGridSnap,
        enableGridSnap,
        disableGridSnap,
        snapExistingNodes,
        snapExistingNodesPreservingRelativePositioning,
        snapExistingNodesPreservingGroupings,
        updateConfig,

        // Direct access to controller and position manager
        controller,
        positionManager: controller.getPositionManager(),
    }
}