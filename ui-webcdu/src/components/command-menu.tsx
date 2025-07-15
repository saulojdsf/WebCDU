"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"

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
  { type: "placeholder", label: "Placeholder" },
  { type: "soma", label: "SOMA" },
  { type: "multpl", label: "MULTPL" },
  { type: "ganho", label: "GANHO" },
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


