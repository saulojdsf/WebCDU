"use client"

import * as React from "react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

const NODE_COMMANDS = [
 { type: "abs", label: "ABS" },
 { type: "acos", label: "ACOS" },
 { type: "asin", label: "ASIN" },
 { type: "atan", label: "ATAN" },
 { type: "atan2", label: "ATAN2" },
 { type: "cos", label: "COS" },
 { type: "degree", label: "DEGREE" },
 { type: "ledlag", label: "LEDLAG" },
 { type: "divsao", label: "DIVSAO" },
 { type: "entrad", label: "ENTRAD" },
 { type: "exp", label: "EXP" },
 { type: "fracao", label: "FRACAO" },
 { type: "ganho", label: "GANHO" },
 { type: "invrs", label: "INVRS" },
 { type: "log", label: "LOG" },
 { type: "log10", label: "LOG10" },
 { type: "menos", label: "MENOS" },
 { type: "multpl", label: "MULTPL" },
 { type: "ord1", label: "ORD1" },
 { type: "offset", label: "OFFSET" },
 { type: "proint", label: "PROINT" },
 { type: "placeholder", label: "Placeholder" },
 { type: "radian", label: "RADIAN" },
 { type: "round", label: "ROUND" },
 { type: "sin", label: "SIN" },
 { type: "sinal", label: "SINAL" },
 { type: "sqrt", label: "SQRT" },
 { type: "tan", label: "TAN" },
 { type: "trunc", label: "TRUNC" },
 { type: "x2", label: "X2" },
 { type: "xk", label: "XK" },
];

type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNode: (type: string) => void;
  resetKey?: number;
};

export function CommandMenu({ open, onOpenChange, onCreateNode, resetKey }: CommandMenuProps) {
  const [input, setInput] = React.useState("");
  React.useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  const filtered = NODE_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(input.toLowerCase()) ||
    cmd.type.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput key={resetKey} placeholder="Type a command or search..." value={input} onValueChange={setInput} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Criar bloco">
          {filtered.map(cmd => (
            <CommandItem key={cmd.type} onSelect={() => { onCreateNode(cmd.type); onOpenChange(false); }}>
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}


