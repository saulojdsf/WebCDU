import { SidebarIcon } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

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

export function SiteHeader({ onNew, onExport, showBlockNumbers, onToggleBlockNumbers, showVariableNames, onToggleVariableNames }: { onNew?: () => void, onExport?: () => void, showBlockNumbers: boolean, onToggleBlockNumbers: () => void, showVariableNames: boolean, onToggleVariableNames: () => void }) {
  const [open, setOpen] = useState(false);
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
            <MenubarItem>
                Abrir
                <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onExport}>
                Salvar
                <MenubarShortcut>Ctrl+S</MenubarShortcut>
            </MenubarItem>

            <MenubarItem>
                Salvar como...
                <MenubarShortcut>Ctrl+Alt+S</MenubarShortcut>
            </MenubarItem>

            <MenubarSeparator/>
            <MenubarSub>
                <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                <MenubarSubContent>
                    <MenubarItem>SVG</MenubarItem>
                    <MenubarItem>CDU</MenubarItem>
                    <MenubarItem>CSV</MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator/>
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
            <MenubarSeparator/>
            <MenubarSub>
                <MenubarSubTrigger>Localizar</MenubarSubTrigger>
                <MenubarSubContent>
                    <MenubarItem>Bloco</MenubarItem>
                    <MenubarSeparator/>
                    <MenubarItem>Variavel...</MenubarItem>
                    <MenubarItem>Localizar proxima</MenubarItem>
                    <MenubarItem>Localizar anterior</MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator/>
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

            <MenubarSeparator/>
            <MenubarItem>
                Recarregar
                <MenubarShortcut>Ctrl+R</MenubarShortcut>
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger>Ajuda</MenubarTrigger>
        <MenubarContent>
            <MenubarItem>Sobre</MenubarItem>
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
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </header>
  )
}
