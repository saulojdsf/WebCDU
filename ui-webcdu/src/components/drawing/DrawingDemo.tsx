import React, { useState } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow';
import { DrawingProvider, useDrawing } from '../../contexts/DrawingContext';
import { DrawingCanvasOverlay } from './DrawingCanvasOverlay';
import { Button } from '../ui/button';

// Demo toolbar component
function DrawingToolbar() {
    const {
        isDrawingMode,
        currentTool,
        toolSettings,
        isVisible,
        setDrawingMode,
        setCurrentTool,
        updateToolSettings,
        setVisibility,
        clearDrawing,
    } = useDrawing();

    return (
        <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg border">
            <h3 className="text-sm font-semibold mb-3">Drawing Tools</h3>

            <div className="flex flex-col gap-2">
                {/* Drawing Mode Toggle */}
                <Button
                    variant={isDrawingMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(!isDrawingMode)}
                >
                    {isDrawingMode ? 'Exit Drawing' : 'Start Drawing'}
                </Button>

                {/* Tool Selection */}
                {isDrawingMode && (
                    <>
                        <div className="flex gap-1">
                            <Button
                                variant={currentTool === 'pen' ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentTool('pen')}
                            >
                                Pen
                            </Button>
                            <Button
                                variant={currentTool === 'eraser' ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentTool('eraser')}
                            >
                                Eraser
                            </Button>
                        </div>

                        {/* Pen Settings */}
                        {currentTool === 'pen' && (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs">Size: {toolSettings.pen.size}</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={toolSettings.pen.size}
                                        onChange={(e) => updateToolSettings('pen', { size: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs">Color:</label>
                                    <input
                                        type="color"
                                        value={toolSettings.pen.color}
                                        onChange={(e) => updateToolSettings('pen', { color: e.target.value })}
                                        className="w-full h-8"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs">Opacity: {Math.round(toolSettings.pen.opacity * 100)}%</label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.1"
                                        value={toolSettings.pen.opacity}
                                        onChange={(e) => updateToolSettings('pen', { opacity: parseFloat(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Eraser Settings */}
                        {currentTool === 'eraser' && (
                            <div>
                                <label className="text-xs">Size: {toolSettings.eraser.size}</label>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={toolSettings.eraser.size}
                                    onChange={(e) => updateToolSettings('eraser', { size: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVisibility(!isVisible)}
                            >
                                {isVisible ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearDrawing}
                            >
                                Clear
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Main demo component
export function DrawingDemo() {
    const [nodes] = useState([
        {
            id: '1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Node 1' },
        },
        {
            id: '2',
            type: 'default',
            position: { x: 300, y: 100 },
            data: { label: 'Node 2' },
        },
    ]);

    const [edges] = useState([
        {
            id: 'e1-2',
            source: '1',
            target: '2',
        },
    ]);

    return (
        <div className="w-full h-screen">
            <ReactFlowProvider>
                <DrawingProvider>
                    <div className="relative w-full h-full">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            fitView
                        >
                            <Background />
                            <Controls />
                        </ReactFlow>

                        {/* Drawing overlay */}
                        <DrawingCanvasOverlay />

                        {/* Drawing toolbar */}
                        <DrawingToolbar />
                    </div>
                </DrawingProvider>
            </ReactFlowProvider>
        </div>
    );
}