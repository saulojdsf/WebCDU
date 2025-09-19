
import { useCallback, useState, useMemo } from 'react';
import { type Node, type Edge, type ReactFlowInstance } from 'reactflow';
import { toast } from 'sonner';
// import ELK from 'elkjs'; // Removed due to web-worker bundling issues

export const useArrangement = (
    nodes: Node[],
    edges: Edge[],
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
    reactFlowInstance: ReactFlowInstance | null,
    groups?: import('../lib/group-types').NodeGroup[],
    setGroups?: (groups: import('../lib/group-types').NodeGroup[] | ((groups: import('../lib/group-types').NodeGroup[]) => import('../lib/group-types').NodeGroup[])) => void,
    groupAwareOptions?: Partial<import('../lib/group-types').GroupArrangementOptions>
) => {
    const [currentArrangementStrategy, setCurrentArrangementStrategy] = useState('hierarchical');
    const [isArrangementPreviewActive, setIsArrangementPreviewActive] = useState(false);
    const [lockedNodes, setLockedNodes] = useState<Set<string>>(new Set());
    const [arrangementHistory, setArrangementHistory] = useState<any[]>([]);
    const [arrangementHistoryIndex, setArrangementHistoryIndex] = useState(-1);

    const applyHierarchicalLayout = useCallback(async () => {
        // Hierarchical layout - arrange nodes in layers based on signal flow
        const allNodes = nodes;
        const allEdges = edges;

        // Find nodes with no incoming edges (sources)
        const sourceNodes = allNodes.filter(node =>
            !allEdges.some(edge => edge.target === node.id)
        );

        const nodePositions = new Map();
        const processed = new Set();
        let currentLayer = 0;

        // Start with source nodes
        if (sourceNodes.length > 0) {
            sourceNodes.forEach((node, index) => {
                nodePositions.set(node.id, {
                    x: 50,
                    y: 50 + index * 120
                });
                processed.add(node.id);
            });
            currentLayer = 1;
        }

        // Process remaining nodes layer by layer
        while (processed.size < allNodes.length) {
            const currentLayerNodes = allNodes.filter(node => {
                if (processed.has(node.id)) return false;
                const incomingEdges = allEdges.filter(edge => edge.target === node.id);
                return incomingEdges.length === 0 || incomingEdges.every(edge => processed.has(edge.source));
            });

            if (currentLayerNodes.length === 0) {
                // Handle remaining nodes (likely in cycles)
                const remainingNodes = allNodes.filter(node => !processed.has(node.id));
                remainingNodes.forEach((node, index) => {
                    nodePositions.set(node.id, {
                        x: 50 + currentLayer * 250,
                        y: 50 + index * 120
                    });
                    processed.add(node.id);
                });
                break;
            }

            currentLayerNodes.forEach((node, index) => {
                nodePositions.set(node.id, {
                    x: 50 + currentLayer * 250,
                    y: 50 + index * 120
                });
                processed.add(node.id);
            });

            currentLayer++;
        }

        return Array.from(nodePositions.entries()).map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y
        }));
    }, [nodes, edges]);

    const applyGridLayout = useCallback(async () => {
        // Grid layout - arrange nodes in a regular grid
        const gridSize = Math.ceil(Math.sqrt(nodes.length));
        const spacing = 200;

        return nodes.map((node, index) => ({
            id: node.id,
            x: 50 + (index % gridSize) * spacing,
            y: 50 + Math.floor(index / gridSize) * spacing
        }));
    }, [nodes]);

    const applyCircularLayout = useCallback(async () => {
        // Circular layout - arrange nodes in a circle
        const centerX = 400;
        const centerY = 300;
        const radius = Math.max(150, nodes.length * 20);

        return nodes.map((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            return {
                id: node.id,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
    }, [nodes]);

    const applyForceDirectedLayout = useCallback(async () => {
        // Simple force-directed layout simulation
        const positions = new Map();
        const forces = new Map();

        // Initialize random positions
        nodes.forEach(node => {
            positions.set(node.id, {
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100
            });
            forces.set(node.id, { x: 0, y: 0 });
        });

        // Run simulation for a few iterations
        for (let iteration = 0; iteration < 50; iteration++) {
            // Reset forces
            forces.forEach(force => {
                force.x = 0;
                force.y = 0;
            });

            // Repulsive forces between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i];
                    const node2 = nodes[j];
                    const pos1 = positions.get(node1.id);
                    const pos2 = positions.get(node2.id);

                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const repulsiveForce = 5000 / (distance * distance);
                    const fx = (dx / distance) * repulsiveForce;
                    const fy = (dy / distance) * repulsiveForce;

                    const force1 = forces.get(node1.id);
                    const force2 = forces.get(node2.id);
                    force1.x -= fx;
                    force1.y -= fy;
                    force2.x += fx;
                    force2.y += fy;
                }
            }

            // Attractive forces for connected nodes
            edges.forEach(edge => {
                const pos1 = positions.get(edge.source);
                const pos2 = positions.get(edge.target);
                if (pos1 && pos2) {
                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const attractiveForce = distance * 0.01;
                    const fx = (dx / distance) * attractiveForce;
                    const fy = (dy / distance) * attractiveForce;

                    const force1 = forces.get(edge.source);
                    const force2 = forces.get(edge.target);
                    if (force1 && force2) {
                        force1.x += fx;
                        force1.y += fy;
                        force2.x -= fx;
                        force2.y -= fy;
                    }
                }
            });

            // Apply forces to positions
            positions.forEach((pos, nodeId) => {
                const force = forces.get(nodeId);
                if (force) {
                    pos.x += force.x * 0.1;
                    pos.y += force.y * 0.1;
                }
            });
        }

        return Array.from(positions.entries()).map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y
        }));
    }, [nodes, edges]);

    const applySmartLayout = useCallback(async () => {
        // Smart layout - choose the best layout based on diagram characteristics
        const nodeCount = nodes.length;
        const edgeCount = edges.length;
        const connectivity = nodeCount > 0 ? edgeCount / nodeCount : 0;

        // Analyze diagram structure
        const sourceNodes = nodes.filter(node =>
            !edges.some(edge => edge.target === node.id)
        );
        const sinkNodes = nodes.filter(node =>
            !edges.some(edge => edge.source === node.id)
        );

        // Choose layout based on characteristics
        if (sourceNodes.length > 0 && sinkNodes.length > 0 && connectivity < 2) {
            // Hierarchical for flow-like diagrams
            return applyHierarchicalLayout();
        } else if (nodeCount <= 10) {
            // Circular for small diagrams
            return applyCircularLayout();
        } else if (connectivity > 3) {
            // Force-directed for highly connected diagrams
            return applyForceDirectedLayout();
        } else {
            // Grid for everything else
            return applyGridLayout();
        }
    }, [nodes, edges, applyHierarchicalLayout, applyCircularLayout, applyForceDirectedLayout, applyGridLayout]);

    const handleArrangementWithStrategy = useCallback(async (strategy: string) => {
        if (!reactFlowInstance) {
            toast.error('Canvas not ready for arrangement');
            return;
        }

        try {
            // Store current positions for undo
            const currentPositions = nodes.map(node => ({
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                locked: lockedNodes.has(node.id),
            }));

            // Add to history
            setArrangementHistory(prev => [...prev.slice(0, arrangementHistoryIndex + 1), {
                positions: currentPositions,
                strategy: strategy,
                timestamp: Date.now(),
            }]);
            setArrangementHistoryIndex(prev => prev + 1);

            let newPositions;

            // Apply the selected arrangement strategy
            switch (strategy) {
                case 'hierarchical':
                    newPositions = await applyHierarchicalLayout();
                    break;
                case 'smart':
                    newPositions = await applySmartLayout();
                    break;
                case 'circular':
                    newPositions = await applyCircularLayout();
                    break;
                case 'grid':
                    newPositions = await applyGridLayout();
                    break;
                case 'force-directed':
                    newPositions = await applyForceDirectedLayout();
                    break;
                default:
                    newPositions = await applyHierarchicalLayout();
            }

            // Apply new positions to React Flow nodes
            setNodes(currentNodes => currentNodes.map(node => {
                const newPos = newPositions.find(pos => pos.id === node.id);
                if (newPos && !lockedNodes.has(node.id)) {
                    return {
                        ...node,
                        position: { x: newPos.x, y: newPos.y }
                    };
                }
                return node;
            }));

            // Fit view to show all nodes after arrangement
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
            }, 100);

            toast.success(`Nodes arranged using ${strategy} layout`);
        } catch (error) {
            console.error('Arrangement failed:', error);
            toast.error(`Failed to arrange nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [nodes, lockedNodes, reactFlowInstance, arrangementHistoryIndex, setNodes, setArrangementHistory, setArrangementHistoryIndex, applyHierarchicalLayout, applySmartLayout, applyCircularLayout, applyGridLayout, applyForceDirectedLayout]);

    const handleArrangementStrategyChange = useCallback(async (strategy: string) => {
        setCurrentArrangementStrategy(strategy);

        if (!reactFlowInstance) {
            toast.error('Canvas não está pronto para arranjo');
            return;
        }

        if (nodes.length === 0) {
            toast.error('Nenhum nó para arranjar');
            return;
        }

        try {
            toast.info(`Aplicando layout ${strategy}...`);

            let positions;
            switch (strategy) {
                case 'hierarchical':
                    positions = await applyHierarchicalLayout();
                    break;
                case 'grid':
                    positions = await applyGridLayout();
                    break;
                case 'circular':
                    positions = await applyCircularLayout();
                    break;
                case 'force':
                    positions = await applyForceDirectedLayout();
                    break;
                case 'smart':
                    positions = await applySmartLayout();
                    break;
                default:
                    positions = await applyHierarchicalLayout();
            }

            // Apply the new positions to nodes
            setNodes(nodes => nodes.map(node => {
                const newPos = positions.find(p => p.id === node.id);
                if (newPos && !lockedNodes.has(node.id)) {
                    return {
                        ...node,
                        position: { x: newPos.x, y: newPos.y }
                    };
                }
                return node;
            }));

            // Fit view to show all nodes after arrangement
            setTimeout(() => {
                reactFlowInstance?.fitView({
                    padding: 0.1,
                    duration: 800,
                    minZoom: 0.1,
                    maxZoom: 1.5
                });
            }, 100);

            toast.success(`Layout ${strategy} aplicado com sucesso`);
        } catch (error) {
            console.error('Arrangement failed:', error);
            toast.error(`Falha ao aplicar layout ${strategy}`);
        }
    }, [reactFlowInstance, nodes, lockedNodes, setNodes, applyHierarchicalLayout, applyGridLayout, applyCircularLayout, applyForceDirectedLayout, applySmartLayout]);

    const handleArrangement = useCallback(() => {
        // Use the current selected strategy
        handleArrangementStrategyChange(currentArrangementStrategy);
    }, [currentArrangementStrategy, handleArrangementStrategyChange]);

    const handlePreview = useCallback(() => {
        setIsArrangementPreviewActive(!isArrangementPreviewActive);
        toast.info(isArrangementPreviewActive ? 'Preview cancelled' : 'Preview mode activated');
    }, [isArrangementPreviewActive]);

    const handleUndo = useCallback(() => {
        if (arrangementHistoryIndex > 0) {
            const previousState = arrangementHistory[arrangementHistoryIndex - 1];

            // Restore previous positions
            setNodes(currentNodes => currentNodes.map(node => {
                const previousPos = previousState.positions.find((pos: any) => pos.id === node.id);
                if (previousPos) {
                    return {
                        ...node,
                        position: { x: previousPos.x, y: previousPos.y }
                    };
                }
                return node;
            }));

            setArrangementHistoryIndex(prev => prev - 1);
            toast.success('Arrangement undone');
        } else {
            toast.error('Nothing to undo');
        }
    }, [arrangementHistoryIndex, arrangementHistory, setNodes]);

    const handleRedo = useCallback(() => {
        if (arrangementHistoryIndex < arrangementHistory.length - 1) {
            const nextState = arrangementHistory[arrangementHistoryIndex + 1];

            // Restore next positions
            setNodes(currentNodes => currentNodes.map(node => {
                const nextPos = nextState.positions.find((pos: any) => pos.id === node.id);
                if (nextPos) {
                    return {
                        ...node,
                        position: { x: nextPos.x, y: nextPos.y }
                    };
                }
                return node;
            }));

            setArrangementHistoryIndex(prev => prev + 1);
            toast.success('Arrangement redone');
        } else {
            toast.error('Nothing to redo');
        }
    }, [arrangementHistoryIndex, arrangementHistory, setNodes]);

    const handleToggleNodeLock = useCallback((nodeIds: string[]) => {
        const newLockedNodes = new Set(lockedNodes);
        nodeIds.forEach(id => {
            if (newLockedNodes.has(id)) {
                newLockedNodes.delete(id);
            } else {
                newLockedNodes.add(id);
            }
        });
        setLockedNodes(newLockedNodes);
        toast.info(`${nodeIds.length} node(s) lock state toggled`);
    }, [lockedNodes]);

    // const elk = useMemo(() => new ELK(), []); // Removed due to web-worker bundling issues

    // Group-aware arrangement functionality
    const groupAwareArrangement = useMemo(() => {
        if (groups && setGroups) {
            // Import the hook dynamically to avoid circular dependencies
            const { useGroupAwareArrangement } = require('./useGroupAwareArrangement');
            return useGroupAwareArrangement({
                nodes,
                edges,
                groups,
                setNodes,
                setGroups,
                options: groupAwareOptions
            });
        }
        return null;
    }, [nodes, edges, groups, setNodes, setGroups, groupAwareOptions]);

    const handleGroupAwareArrangementWithStrategy = useCallback(async (strategy: string) => {
        if (!groupAwareArrangement) {
            // Fall back to regular arrangement if no groups
            return handleArrangementWithStrategy(strategy);
        }

        if (!reactFlowInstance) {
            toast.error('Canvas not ready for arrangement');
            return;
        }

        try {
            // Store current positions for undo
            const currentPositions = nodes.map(node => ({
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                locked: lockedNodes.has(node.id),
            }));

            // Add to history
            setArrangementHistory(prev => [...prev.slice(0, arrangementHistoryIndex + 1), {
                positions: currentPositions,
                strategy: strategy,
                timestamp: Date.now(),
            }]);
            setArrangementHistoryIndex(prev => prev + 1);

            // Map strategy names to group-aware equivalents
            let groupAwareStrategy: 'hierarchical' | 'grid' | 'circular';
            switch (strategy) {
                case 'hierarchical':
                case 'smart':
                    groupAwareStrategy = 'hierarchical';
                    break;
                case 'grid':
                    groupAwareStrategy = 'grid';
                    break;
                case 'circular':
                    groupAwareStrategy = 'circular';
                    break;
                case 'force-directed':
                    // Force-directed doesn't have a group-aware equivalent yet, fall back to hierarchical
                    groupAwareStrategy = 'hierarchical';
                    break;
                default:
                    groupAwareStrategy = 'hierarchical';
            }

            await groupAwareArrangement.handleGroupAwareArrangement(groupAwareStrategy);

            // Fit view to show all nodes after arrangement
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
            }, 100);

        } catch (error) {
            console.error('Group-aware arrangement failed:', error);
            toast.error(`Failed to arrange nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [groupAwareArrangement, reactFlowInstance, nodes, lockedNodes, arrangementHistoryIndex, setArrangementHistory, setArrangementHistoryIndex, handleArrangementWithStrategy]);

    return {
        currentArrangementStrategy,
        isArrangementPreviewActive,
        arrangementHistoryIndex,
        arrangementHistory,
        handleArrangementStrategyChange,
        handleArrangement,
        handlePreview,
        handleUndo,
        handleRedo,
        handleToggleNodeLock,
        // elk, // Removed due to web-worker bundling issues
        // Group-aware methods
        groupAwareArrangement,
        handleGroupAwareArrangementWithStrategy
    };
};
