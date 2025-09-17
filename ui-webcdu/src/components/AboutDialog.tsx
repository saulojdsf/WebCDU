import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Sobre</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Webcdu</h3>
            <span className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
              Versão 0.1.0
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-base">Descrição</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aplicação web interativa para criação de diagramas de sistemas de
              controle. Permite arrastar e soltar blocos de controle,
              conectá-los, configurar parâmetros e exportar diagramas para
              formato CDU compatível com ANATEM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Desenvolvido por</h4>
              <p className="text-sm text-muted-foreground">
                Saulo José da Silva Filho
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Copyright</h4>
              <p className="text-sm text-muted-foreground">© 2025 Webcdu</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-base">Tecnologias Utilizadas</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                React 19 + TypeScript
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                React Flow
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Shadcn/ui + Tailwind
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                FastAPI (Python)
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
