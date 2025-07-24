import { SidebarIcon, Brush, SlidersHorizontal } from "lucide-react"

import { SearchComponent } from "@/components/SearchComponent"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { SearchState, SearchMode } from "@/lib/search-types"

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useState } from "react";
import { AboutDialog } from "@/components/AboutDialog";

export function SiteHeader({
  onNew,
  onExport,
  onOpen,
  onImport,
  showBlockNumbers,
  onToggleBlockNumbers,
  showVariableNames,
  onToggleVariableNames,
  searchState,
  onSearchInput,
  onSearchModeChange,
  onClearSearch,
  isDrawingMode,
  onToggleDrawingMode,
  // New arrangement system props
  currentArrangementStrategy,
  onArrangementStrategyChange,
  onArrangement,
  onArrangementPreview,
  onArrangementUndo,
  onArrangementRedo,
  isArrangementPreviewActive,
  canUndo,
  canRedo,
  onToggleParameterSidebar,
  isParameterSidebarOpen,
  onCopy,
  onPaste
}: {
  onNew?: () => void,
  onExport?: () => void,
  onOpen?: () => void,
  onImport?: () => void,
  showBlockNumbers: boolean,
  onToggleBlockNumbers: () => void,
  showVariableNames: boolean,
  onToggleVariableNames: () => void,
  searchState: SearchState,
  onSearchInput: (query: string) => void,
  onSearchModeChange: (mode: SearchMode) => void,
  onClearSearch: () => void,
  isDrawingMode?: boolean,
  onToggleDrawingMode?: () => void,
  // New arrangement system props
  currentArrangementStrategy?: string,
  onArrangementStrategyChange?: (strategy: string) => void,
  onArrangement?: () => void,
  onArrangementPreview?: () => void,
  onArrangementUndo?: () => void,
  onArrangementRedo?: () => void,
  isArrangementPreviewActive?: boolean,
  canUndo?: boolean,
  canRedo?: boolean,
  onToggleParameterSidebar?: () => void,
  isParameterSidebarOpen?: boolean,
  // Copy/paste functions for testing
  onCopy?: () => void,
  onPaste?: () => void
}) {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { toggleSidebar } = useSidebar()

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />

        <AlertDialog open={open} onOpenChange={setOpen}>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Arquivo</MenubarTrigger>
              <MenubarContent>
                <AlertDialogTrigger asChild>
                  <MenubarItem onSelect={e => e.preventDefault()}>
                    Novo
                    <MenubarShortcut>Ctrl+N</MenubarShortcut>
                  </MenubarItem>
                </AlertDialogTrigger>
                <MenubarItem onClick={onOpen}>
                  Abrir
                  <MenubarShortcut>Ctrl+O</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={onImport}>
                  Importar CDU
                  <MenubarShortcut>Ctrl+I</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={onExport}>
                  Salvar
                  <MenubarShortcut>Ctrl+S</MenubarShortcut>
                </MenubarItem>

                <MenubarItem>
                  Salvar como...
                  <MenubarShortcut>Ctrl+Alt+S</MenubarShortcut>
                </MenubarItem>

                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>SVG</MenubarItem>
                    <MenubarItem>CDU</MenubarItem>
                    <MenubarItem>CSV</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem>
                  Imprimir...
                  <MenubarShortcut>Ctrl+P</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Editar</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Desfazer
                  <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Refazer
                  <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Arranjo</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem onClick={() => onArrangementStrategyChange?.('hierarchical')}>
                      Hierárquico
                      {currentArrangementStrategy === 'hierarchical' && ' ✓'}
                    </MenubarItem>
                    <MenubarItem onClick={() => onArrangementStrategyChange?.('grid')}>
                      Grade
                      {currentArrangementStrategy === 'grid' && ' ✓'}
                    </MenubarItem>
                    <MenubarItem onClick={() => onArrangementStrategyChange?.('circular')}>
                      Circular
                      {currentArrangementStrategy === 'circular' && ' ✓'}
                    </MenubarItem>
                    <MenubarItem onClick={() => onArrangementStrategyChange?.('force')}>
                      Força Dirigida
                      {currentArrangementStrategy === 'force' && ' ✓'}
                    </MenubarItem>
                    <MenubarItem onClick={() => onArrangementStrategyChange?.('smart')}>
                      Inteligente
                      {currentArrangementStrategy === 'smart' && ' ✓'}
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={onArrangement}>
                      Aplicar Arranjo
                      <MenubarShortcut>Ctrl+Shift+A</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={onArrangementPreview}>
                      {isArrangementPreviewActive ? 'Cancelar Preview' : 'Preview'}
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={onArrangementUndo} disabled={!canUndo}>
                      Desfazer Arranjo
                      <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={onArrangementRedo} disabled={!canRedo}>
                      Refazer Arranjo
                      <MenubarShortcut>Ctrl+Y</MenubarShortcut>
                    </MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Localizar</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem onClick={() => {
                      onSearchModeChange?.('id');
                      document.getElementById('node-search')?.focus();
                    }}>
                      Buscar por ID
                      <MenubarShortcut>/</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={() => {
                      onSearchModeChange?.('variable');
                      document.getElementById('node-search')?.focus();
                    }}>
                      Buscar por Variável
                      <MenubarShortcut>Alt+M</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={onClearSearch}>
                      Limpar busca
                      <MenubarShortcut>Esc</MenubarShortcut>
                    </MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem>Cortar</MenubarItem>
                <MenubarItem>Copiar</MenubarItem>
                <MenubarItem>Colar</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Exibir</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem checked={showVariableNames} onCheckedChange={onToggleVariableNames}>
                  Nomes de variáveis
                </MenubarCheckboxItem>
                <MenubarCheckboxItem checked={showBlockNumbers} onCheckedChange={onToggleBlockNumbers}>
                  Numero dos blocos
                </MenubarCheckboxItem>
                <MenubarSeparator />
                {onToggleDrawingMode && (
                  <MenubarCheckboxItem checked={isDrawingMode} onCheckedChange={onToggleDrawingMode}>
                    Modo desenho
                    <MenubarShortcut>D</MenubarShortcut>
                  </MenubarCheckboxItem>
                )}
                <MenubarSeparator />
                <MenubarItem>
                  Recarregar
                  <MenubarShortcut>Ctrl+R</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Ajuda</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setAboutOpen(true)}>Sobre</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar tudo?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja limpar todos os blocos e conexões? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onNew}>Limpar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {onToggleDrawingMode && (
          <>
            <Button
              className="h-8 w-8"
              variant={isDrawingMode ? "default" : "ghost"}
              size="icon"
              onClick={onToggleDrawingMode}
              title={isDrawingMode ? "Sair do modo desenho" : "Entrar no modo desenho"}
            >
              <Brush className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mr-2 h-4" />
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {searchState && onSearchInput && onSearchModeChange && onClearSearch && (
            <SearchComponent
              searchState={searchState}
              onSearchInput={onSearchInput}
              onSearchModeChange={onSearchModeChange}
              onClearSearch={onClearSearch}
              className="w-full sm:w-auto"
            />
          )}
          {onToggleParameterSidebar && (
            <Button
              className="h-8 w-8"
              variant={isParameterSidebarOpen ? "default" : "ghost"}
              size="icon"
              onClick={onToggleParameterSidebar}
              title={isParameterSidebarOpen ? "Hide Parameters" : "Show Parameters"}
              aria-label={isParameterSidebarOpen ? "Hide Parameters" : "Show Parameters"}
            >
              <SlidersHorizontal />
            </Button>
          )}
          {/* Temporary test buttons for copy/paste */}
          {onCopy && (
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={onCopy}
              title="Test Copy (Ctrl+C)"
            >
              Copy
            </Button>
          )}
          {onPaste && (
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={onPaste}
              title="Test Paste (Ctrl+V)"
            >
              Paste
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </header>
  )
}
