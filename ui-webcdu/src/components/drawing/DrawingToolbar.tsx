import React, { useState } from 'react';
import {
    Pen,
    Eraser,
    Square,
    Circle,
    Minus,
    Palette,
    Settings,
    Eye,
    EyeOff,
    Trash2,
    Lock,
    Unlock,
    Layers,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/slider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/switch';
import { useDrawing } from '@/contexts/DrawingContext';
import type { DrawingTool } from '@/lib/drawing-types';

interface DrawingToolbarProps {
    className?: string;
}

const TOOL_ICONS = {
    pen: Pen,
    eraser: Eraser,
    rectangle: Square,
    circle: Circle,
    line: Minus,
} as const;

const TOOL_LABELS = {
    pen: 'Caneta',
    eraser: 'Borracha',
    rectangle: 'Retângulo',
    circle: 'Círculo',
    line: 'Linha',
} as const;

export function DrawingToolbar({ className }: DrawingToolbarProps) {
    const {
        isDrawingMode,
        currentTool,
        toolSettings,
        isVisible,
        layerState,
        setDrawingMode,
        setCurrentTool,
        updateToolSettings,
        setVisibility,
        clearDrawing,
        setLayerOpacity,
        setLayerZIndex,
        setLayerLocked,
        toggleLayerVisibility,
        resetLayer,
    } = useDrawing();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [layerSettingsOpen, setLayerSettingsOpen] = useState(false);

    const handleToolSelect = (tool: DrawingTool) => {
        setCurrentTool(tool);
        if (!isDrawingMode) {
            setDrawingMode(true);
        }
    };

    const handleSizeChange = (tool: DrawingTool, value: number[]) => {
        if (tool === 'pen') {
            updateToolSettings('pen', { size: value[0] });
        } else if (tool === 'eraser') {
            updateToolSettings('eraser', { size: value[0] });
        } else {
            updateToolSettings(tool, { strokeWidth: value[0] });
        }
    };

    const handleColorChange = (tool: DrawingTool, color: string) => {
        if (tool === 'pen') {
            updateToolSettings('pen', { color });
        } else {
            updateToolSettings(tool, { strokeColor: color });
        }
    };

    const handleOpacityChange = (value: number[]) => {
        updateToolSettings('pen', { opacity: value[0] / 100 });
    };

    const handleFillColorChange = (color: string) => {
        updateToolSettings(currentTool, { fillColor: color });
    };

    const handleFilledToggle = (filled: boolean) => {
        updateToolSettings(currentTool, { filled });
    };

    const toggleDrawingMode = () => {
        setDrawingMode(!isDrawingMode);
    };

    const toggleVisibility = () => {
        toggleLayerVisibility();
    };

    const toggleLocked = () => {
        setLayerLocked(!layerState.locked);
    };

    const handleLayerOpacityChange = (value: number[]) => {
        setLayerOpacity(value[0] / 100);
    };

    const handleZIndexChange = (value: number[]) => {
        setLayerZIndex(value[0]);
    };

    const getCurrentSize = () => {
        if (currentTool === 'pen') {
            return toolSettings.pen.size;
        } else if (currentTool === 'eraser') {
            return toolSettings.eraser.size;
        } else {
            return toolSettings.shapes.strokeWidth;
        }
    };

    const getCurrentColor = () => {
        if (currentTool === 'pen') {
            return toolSettings.pen.color;
        } else {
            return toolSettings.shapes.strokeColor;
        }
    };

    return (
        <>
            {/* Main Drawing Toggle Button - Always visible in top-right */}
            <div className={`${className || ''}`}>
                <Button
                    variant={isDrawingMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleDrawingMode}
                    className="h-8"
                >
                    <Pen className="h-4 w-4 mr-1" />
                    Desenho
                </Button>
            </div>

            {/* Full Drawing Toolbar - Only visible when drawing mode is active, positioned at bottom */}
            {isDrawingMode && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white border rounded-lg shadow-lg p-4">
                    <div className="flex items-center gap-2">
                        {/* Tool Selection */}
                        <div className="flex items-center gap-1">
                            {(Object.keys(TOOL_ICONS) as DrawingTool[]).map((tool) => {
                                const Icon = TOOL_ICONS[tool];
                                const isActive = currentTool === tool;

                                return (
                                    <Button
                                        key={tool}
                                        variant={isActive ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => handleToolSelect(tool)}
                                        className="h-8 w-8 p-0"
                                        title={TOOL_LABELS[tool]}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                );
                            })}
                        </div>

                        <Separator orientation="vertical" className="h-6" />

                        {/* Quick Settings */}
                        <div className="flex items-center gap-2">
                            {/* Size Slider */}
                            <div className="flex items-center gap-2 min-w-[80px]">
                                <Label className="text-xs">Tamanho:</Label>
                                <Slider
                                    value={[getCurrentSize()]}
                                    onValueChange={(value) => handleSizeChange(currentTool, value)}
                                    max={currentTool === 'eraser' ? 50 : currentTool === 'pen' ? 20 : 10}
                                    min={1}
                                    step={1}
                                    className="w-16"
                                />
                                <span className="text-xs w-6 text-center">{getCurrentSize()}</span>
                            </div>

                            {/* Color Picker */}
                            {currentTool !== 'eraser' && (
                                <div className="flex items-center gap-1">
                                    <Label className="text-xs">Cor:</Label>
                                    <Input
                                        type="color"
                                        value={getCurrentColor()}
                                        onChange={(e) => handleColorChange(currentTool, e.target.value)}
                                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Pen Opacity */}
                            {currentTool === 'pen' && (
                                <div className="flex items-center gap-2 min-w-[80px]">
                                    <Label className="text-xs">Opacidade:</Label>
                                    <Slider
                                        value={[toolSettings.pen.opacity * 100]}
                                        onValueChange={handleOpacityChange}
                                        max={100}
                                        min={10}
                                        step={5}
                                        className="w-16"
                                    />
                                    <span className="text-xs w-8 text-center">{Math.round(toolSettings.pen.opacity * 100)}%</span>
                                </div>
                            )}
                        </div>

                        <Separator orientation="vertical" className="h-6" />

                        {/* Advanced Settings */}
                        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Configurações avançadas"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                    <h4 className="font-medium">Configurações da Ferramenta</h4>

                                    {/* Shape Fill Settings */}
                                    {['rectangle', 'circle'].includes(currentTool) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">Preenchimento</Label>
                                                <Switch
                                                    checked={toolSettings.shapes.filled}
                                                    onCheckedChange={handleFilledToggle}
                                                />
                                            </div>

                                            {toolSettings.shapes.filled && (
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-sm">Cor de preenchimento:</Label>
                                                    <Input
                                                        type="color"
                                                        value={toolSettings.shapes.fillColor}
                                                        onChange={(e) => handleFillColorChange(e.target.value)}
                                                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pen Settings */}
                                    {currentTool === 'pen' && (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-sm">Tamanho do pincel</Label>
                                                <Slider
                                                    value={[toolSettings.pen.size]}
                                                    onValueChange={(value) => updateToolSettings('pen', { size: value[0] })}
                                                    max={20}
                                                    min={1}
                                                    step={0.5}
                                                    className="w-full"
                                                />
                                                <div className="text-xs text-muted-foreground text-center">
                                                    {toolSettings.pen.size}px
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Eraser Settings */}
                                    {currentTool === 'eraser' && (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-sm">Tamanho da borracha</Label>
                                                <Slider
                                                    value={[toolSettings.eraser.size]}
                                                    onValueChange={(value) => updateToolSettings('eraser', { size: value[0] })}
                                                    max={50}
                                                    min={5}
                                                    step={1}
                                                    className="w-full"
                                                />
                                                <div className="text-xs text-muted-foreground text-center">
                                                    {toolSettings.eraser.size}px
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Separator orientation="vertical" className="h-6" />

                        {/* Layer Controls */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleVisibility}
                                className="h-8 w-8 p-0"
                                title={layerState.isVisible ? "Ocultar camada de desenho" : "Mostrar camada de desenho"}
                            >
                                {layerState.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleLocked}
                                className="h-8 w-8 p-0"
                                title={layerState.locked ? "Desbloquear camada" : "Bloquear camada"}
                            >
                                {layerState.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>

                            {/* Layer Settings */}
                            <Popover open={layerSettingsOpen} onOpenChange={setLayerSettingsOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        title="Configurações da camada"
                                    >
                                        <Layers className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Configurações da Camada</h4>

                                        {/* Layer Opacity */}
                                        <div className="space-y-2">
                                            <Label className="text-sm">Opacidade da camada</Label>
                                            <Slider
                                                value={[layerState.opacity * 100]}
                                                onValueChange={handleLayerOpacityChange}
                                                max={100}
                                                min={10}
                                                step={5}
                                                className="w-full"
                                            />
                                            <div className="text-xs text-muted-foreground text-center">
                                                {Math.round(layerState.opacity * 100)}%
                                            </div>
                                        </div>

                                        {/* Layer Z-Index */}
                                        <div className="space-y-2">
                                            <Label className="text-sm">Ordem da camada (Z-Index)</Label>
                                            <Slider
                                                value={[layerState.zIndex]}
                                                onValueChange={handleZIndexChange}
                                                max={10}
                                                min={1}
                                                step={1}
                                                className="w-full"
                                            />
                                            <div className="text-xs text-muted-foreground text-center">
                                                Z-Index: {layerState.zIndex}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                1-2: Atrás dos nós • 3-5: Entre nós • 6-10: Na frente dos nós
                                            </div>
                                        </div>

                                        {/* Layer Status */}
                                        <div className="space-y-2">
                                            <Label className="text-sm">Status da camada</Label>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs">Visível</span>
                                                <Switch
                                                    checked={layerState.isVisible}
                                                    onCheckedChange={setVisibility}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs">Bloqueada</span>
                                                <Switch
                                                    checked={layerState.locked}
                                                    onCheckedChange={setLayerLocked}
                                                />
                                            </div>
                                        </div>

                                        {/* Reset Layer */}
                                        <div className="pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={resetLayer}
                                                className="w-full"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Resetar camada
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearDrawing}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Limpar todos os desenhos"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}