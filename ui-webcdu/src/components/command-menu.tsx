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
  { type: "acum", label: "ACUM" },
  { type: "alerta", label: "ALERTA" },
  { type: "and", label: "AND" },
  { type: "asin", label: "ASIN" },
  { type: "atan", label: "ATAN" },
  { type: "atan2", label: "ATAN2" },
  { type: "atraso", label: "ATRASO" },
  { type: "cos", label: "COS" },
  { type: "deadb1", label: "DEADB1" },
  { type: "deadb2", label: "DEADB2" },
  { type: "degree", label: "DEGREE" },
  { type: "delay", label: "DELAY" },
  { type: "deriva", label: "DERIVA" },
  { type: "descid", label: "DESCID" },
  { type: "dismax", label: "DISMAX" },
  { type: "dismin", label: "DISMIN" },
  { type: "divsao", label: "DIVSAO" },
  { type: "dlayof", label: "DLAYOF" },
  { type: "dlayon", label: "DLAYON" },
  { type: "entrad", label: "ENTRAD" },
  { type: "eq", label: "EQ" },
  { type: "exp", label: "EXP" },
  { type: "export", label: "EXPORT" },
  { type: "fex", label: "FEX" },
  { type: "fflop1", label: "FFLOP1" },
  { type: "fimprg", label: "FIMPRG" },
  { type: "fracao", label: "FRACAO" },
  { type: "ganho", label: "GANHO" },
  { type: "ge", label: "GE" },
  { type: "gt", label: "GT" },
  { type: "histe1", label: "HISTE1" },
  { type: "import", label: "IMPORT" },
  { type: "intres", label: "INTRES" },
  { type: "invrs", label: "INVRS" },
  { type: "lagnl", label: "LAGNL" },
  { type: "ldlag2", label: "LDLAG2" },
  { type: "le", label: "LE" },
  { type: "ledlag", label: "LEDLAG" },
  { type: "limita", label: "LIMITA" },
  { type: "log", label: "LOG" },
  { type: "log10", label: "LOG10" },
  { type: "lt", label: "LT" },
  { type: "max", label: "MAX" },
  { type: "menos", label: "MENOS" },
  { type: "min", label: "MIN" },
  { type: "monest", label: "MONEST" },
  { type: "multpl", label: "MULTPL" },
  { type: "nand", label: "NAND" },
  { type: "ne", label: "NE" },
  { type: "noise", label: "NOISE" },
  { type: "nor", label: "NOR" },
  { type: "not", label: "NOT" },
  { type: "nxor", label: "NXOR" },
  { type: "offset", label: "OFFSET" },
  { type: "or", label: "OR" },
  { type: "ord1", label: "ORD1" },
  { type: "pols", label: "POLS" },
  { type: "pontos", label: "PONTOS" },
  { type: "proin2", label: "PROIN2" },
  { type: "proint", label: "PROINT" },
  { type: "pulso", label: "PULSO" },
  { type: "radian", label: "RADIAN" },
  { type: "rampa", label: "RAMPA" },
  { type: "ratelm", label: "RATELM" },
  { type: "reta", label: "RETA" },
  { type: "round", label: "ROUND" },
  { type: "saida", label: "SAIDA" },
  { type: "sat01", label: "SAT01" },
  { type: "selet2", label: "SELET2" },
  { type: "shold", label: "SHOLD" },
  { type: "sin", label: "SIN" },
  { type: "sinal", label: "SINAL" },
  { type: "soma", label: "SOMA" },
  { type: "sqrt", label: "SQRT" },
  { type: "steps", label: "STEPS" },
  { type: "subida", label: "SUBIDA" },
  { type: "tan", label: "TAN" },
  { type: "thold", label: "THOLD" },
  { type: "trunc", label: "TRUNC" },
  { type: "wshou2", label: "WSHOU2" },
  { type: "wshout", label: "WSHOUT" },
  { type: "x2", label: "X2" },
  { type: "xk", label: "XK" },
  { type: "xor", label: "XOR" },
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


