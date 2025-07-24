import React, { useState } from 'react';
import { useCopyPaste } from '../hooks/useCopyPaste';
import type { Node } from 'reactflow';

export function CopyPasteTest() {
    const [nodes, setNodes] = useState<Node[]>([
        {
            id: '0001',
            type: 'ganho',
            position: { x: 100, y: 100 },
            data: { id: '0001', Vout: 'X0001', P1: '2.5' },
        }
    ]);
    const [selectedNodes, setSelectedNodes] = useState<string[]>(['0001']);

    const mockReactFlowInstance = {
        screenToFlowPosition: () => ({ x: 200, y: 200 }),
        getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    };

    const { copyNodes, pasteNodes } = useCopyPaste({
        nodes,
        setNodes,
        selectedNodes,
        reactFlowInstance: mockReactFlowInstance
    });

    return (
        <div style={{ padding: '20px' }}>
            <h2>Copy/Paste Test</h2>
            <div>
                <button onClick={copyNodes}>Copy Selected Nodes</button>
                <button onClick={pasteNodes} style={{ marginLeft: '10px' }}>Paste Nodes</button>
            </div>
            <div style={{ marginTop: '20px' }}>
                <h3>Nodes:</h3>
                <pre>{JSON.stringify(nodes, null, 2)}</pre>
            </div>
            <div style={{ marginTop: '20px' }}>
                <h3>Selected: {selectedNodes.join(', ')}</h3>
            </div>
        </div>
    );
}