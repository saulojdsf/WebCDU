import { useCallback, useRef } from 'react';
import type { Node } from 'reactflow';
import { toast } from 'sonner';

interface CopyPasteHookParams {
    nodes: Node[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    selectedNodes: string[];
    reactFlowInstance: any;
}

interface CopiedNodeData {
    type: string;
    data: any;
    position: { x: number; y: number };
}

function padId(num: number) {
    return num.toString().padStart(4, '0');
}

export function useCopyPaste({ nodes, setNodes, selectedNodes, reactFlowInstance }: CopyPasteHookParams) {
    const copiedNodesRef = useRef<CopiedNodeData[]>([]);

    const copyNodes = useCallback(() => {
        if (selectedNodes.length === 0) {
            toast.error('No nodes selected to copy');
            return;
        }

        const nodesToCopy = nodes.filter(node => selectedNodes.includes(node.id));

        // Store the copied nodes data (without IDs since they need to be unique)
        copiedNodesRef.current = nodesToCopy.map(node => ({
            type: node.type || 'placeholder',
            data: { ...node.data },
            position: { ...node.position }
        }));

        toast.success(`Copied ${nodesToCopy.length} node${nodesToCopy.length > 1 ? 's' : ''}`);
    }, [nodes, selectedNodes]);

    const pasteNodes = useCallback(() => {
        if (copiedNodesRef.current.length === 0) {
            toast.error('Sem blocos para colar');
            return;
        }

        if (!reactFlowInstance) {
            toast.error('Canvas não pronto');
            return;
        }

        // Find the lowest available IDs for the new nodes
        const usedIds = new Set(nodes.map(n => parseInt(n.data?.id || '0', 10)));
        const usedVouts = new Set(nodes.map(n => n.data?.Vout).filter(Boolean));

        const newNodes: Node[] = [];
        let nextId = 1;

        // Get viewport center for pasting
        const viewport = reactFlowInstance.getViewport();
        const canvasCenter = reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        // Calculate offset for pasting (slightly offset from original position)
        const pasteOffset = { x: 50, y: 50 };

        copiedNodesRef.current.forEach((copiedNode, index) => {
            // Find next available ID
            while (usedIds.has(nextId) && nextId <= 9999) {
                nextId++;
            }

            if (nextId > 9999) {
                toast.error('Erro: Número mácimo de blocos  alcançado (9999)');
                return;
            }

            const newId = padId(nextId);
            usedIds.add(nextId);

            // Generate unique Vout
            let newVout = `X${newId}`;
            let voutCounter = 1;
            while (usedVouts.has(newVout)) {
                newVout = `X${newId}_${voutCounter}`;
                voutCounter++;
            }
            usedVouts.add(newVout);

            // Calculate new position with offset
            const newPosition = {
                x: copiedNode.position.x + pasteOffset.x,
                y: copiedNode.position.y + pasteOffset.y
            };

            // Create new node with unique ID and Vout
            const newNode: Node = {
                id: newId,
                type: copiedNode.type,
                position: newPosition,
                data: {
                    ...copiedNode.data,
                    id: newId,
                    Vout: newVout,
                    // Clear Vin since connections won't be copied
                    Vin: '',
                    Vin2: copiedNode.data.Vin2 ? '' : undefined, // Clear Vin2 if it exists
                },
            };

            newNodes.push(newNode);
            nextId++;
        });

        if (newNodes.length > 0) {
            setNodes(currentNodes => [...currentNodes, ...newNodes]);
            toast.success(`Pasted ${newNodes.length} node${newNodes.length > 1 ? 's' : ''}`);
        }
    }, [nodes, setNodes, reactFlowInstance]);

    return {
        copyNodes,
        pasteNodes,
        hasCopiedNodes: copiedNodesRef.current.length > 0
    };
}