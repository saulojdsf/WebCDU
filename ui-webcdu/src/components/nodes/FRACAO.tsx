import { type NodeProps, Handle, Position, useReactFlow } from "reactflow";
import { useState, useRef } from "react";
import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { toast } from "sonner";
import { useTheme } from "next-themes";

function padId(num: string | number) {
  return num.toString().padStart(4, '0');
}

const PARAMS = [
  { key: "id", label: "ID" },
  { key: "Vin", label: "Vin" },
  { key: "Vout", label: "Vout" },
  { key: "P1", label: "P1" },
  { key: "P2", label: "P2" },
  { key: "P3", label: "P3" },
  { key: "P4", label: "P4" },
];

export function FRACAO(props: NodeProps & {
  updateConnectedVins?: (id: string) => void;
  showBlockNumbers?: boolean;
  showVariableNames?: boolean;
}) {
  const isSelected = props.selected;
  const selectionStyles = isSelected ? "ring-4 ring-blue-500 ring-opacity-50 shadow-lg" : "";
  const [open, setOpen] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { setNodes, getNodes } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [form, setForm] = useState(() => {
    // Default values or from node data
    return PARAMS.reduce((acc, param) => {
      acc[param.key] = props.data?.[param.key] ?? "";
      return acc;
    }, {} as Record<string, string>);
  });

  React.useEffect(() => {
    setForm(PARAMS.reduce((acc, param) => {
      acc[param.key] = props.data?.[param.key] ?? "";
      return acc;
    }, {} as Record<string, string>));
  }, [props.data]);

  const updateConnectedVins = props.updateConnectedVins;
  const showBlockNumbers = props.showBlockNumbers;
  const showVariableNames = props.showVariableNames;

  const handleDoubleClick = () => setOpen(true);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'id') {
      // Remove non-digits and leading zeros, limit to 4 digits
      let sanitized = value.replace(/\D/g, '').replace(/^0+/, '');
      if (sanitized.length > 4) sanitized = sanitized.slice(0, 4);
      setForm(f => ({ ...f, [name]: sanitized }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleSave = () => {
    // Always pad the ID to 4 digits
    const newId = padId(form.id);
    const currentId = padId(props.data?.id ?? '');
    const numericId = parseInt(form.id, 10);
    if (numericId < 1 || numericId > 9999 || isNaN(numericId)) {
      toast.error('O ID deve estar entre 1 e 9999.');
      setForm(f => ({ ...f, id: currentId }));
      setOpen(false);
      return;
    }
    // Check Vout constraints
    const newVout = form.Vout;
    const currentVout = props.data?.Vout ?? '';
    if (newVout.length > 5) {
      toast.error('Vout não pode ter mais de 5 caracteres.');
      setForm(f => ({ ...f, Vout: currentVout }));
      setOpen(false);
      return;
    }
    if (/^[0-9]/.test(newVout)) {
      toast.error('Vout não pode começar com número.');
      setForm(f => ({ ...f, Vout: currentVout }));
      setOpen(false);
      return;
    }
    if (newVout !== currentVout) {
      const nodes = getNodes();
      if (nodes.some(n => n.id !== props.id && n.data?.Vout === newVout)) {
        toast.error(`${newVout} já está em uso. O Vout do bloco não foi alterado.`);
        setForm(f => ({ ...f, Vout: currentVout }));
        setOpen(false);
        return;
      }
    }
    if (newId !== currentId) {
      const nodes = getNodes();
      if (nodes.some(n => n.id !== props.id && padId(n.data?.id) === newId)) {
        toast.error(`ID ${newId} já está em uso. O ID do bloco não foi alterado.`);
        setForm(f => ({ ...f, id: currentId }));
        setOpen(false);
        return;
      }
    }
    let idChanged = newId !== currentId;
    let voutChanged = newVout !== currentVout;
    setNodes(nodes => nodes.map(n => n.id === props.id ? { ...n, id: newId, data: { ...n.data, ...form, id: newId } } : n));
    if ((idChanged || voutChanged) && typeof updateConnectedVins === 'function') {
      updateConnectedVins(props.id);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
      <div
          ref={nodeRef}
          className={`bg-transparent rounded w-[150px] h-[150px] border-2 border-transparent flex flex-col items-center justify-center font-bold relative cursor-pointer transition-all duration-200 ${selectionStyles} ${isDarkMode ? "text-white" : "text-black"}`}
          onDoubleClick={handleDoubleClick}
        >
          
          <Handle id="vin" type="target" position={Position.Left} className={`!absolute !-left-3 !w-3 !h-3 border-0 ${isDarkMode ? "!bg-white" : "!bg-black"}`}  />
          <Handle id="vout" type="source" position={Position.Right} className={`!absolute !-right-3 !w-3 !h-3 border-0 ${isDarkMode ? "!bg-white" : "!bg-black"}`}/>

          <svg className="w-[150px] h-[150px]">
            <text x="5" y="35" fontFamily="Arial" fontSize="10" fill={isDarkMode ? "#fff" : "#000"}>{"FRACAO"}</text>
            <rect x="0" y="37.5" width={150} height={75} rx={10} ry={10} fill={isDarkMode ? "#333" : "#fff"} stroke={isDarkMode ? "#fff" : "#000"} strokeWidth="2" />
            <text x="40" y="69.5" fontFamily="Arial" fontSize="20" fill={isDarkMode ? "#fff" : "#000"}>{"P1+P2"}</text>
            <line x1="30" y1="73.5" x2="120" y2="73.5" stroke={isDarkMode ? "#fff" : "#000"} strokeWidth="2" />
            <text x="40" y="92.5" fontFamily="Arial" fontSize="20" fill={isDarkMode ? "#fff" : "#000"}>{"P3+P4"}</text>
            {showVariableNames && (<text x="115" y="47.5" fontFamily="Arial" fontSize="10" fill={isDarkMode ? "#fff" : "#000"}>{(props.data?.Vout || "?")}</text>)}
            {showBlockNumbers && (<text x="115" y="125" fontFamily="Arial" fontSize="10" fill={isDarkMode ? "#fff" : "#000"}>{"(" + (props.data?.id + ")" || "?")}</text>)}
          </svg>
        </div>

      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-80">
        <div className="mb-2 font-semibold">Editar Parâmetros</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-2"
        >
          {PARAMS.map(param => (
            <div key={param.key} className="flex items-center gap-2">
              <label htmlFor={param.key} className="w-14 text-right text-xs">{param.label}:</label>
              <input
                id={param.key}
                name={param.key}
                value={form[param.key]}
                onChange={handleInputChange}
                className="flex-1 border rounded px-2 py-1 text-xs"
                {...(param.key === 'id' ? { inputMode: 'numeric', pattern: '[0-9]*' } : {})}
                {...(param.key === 'Vin' ? { disabled: true } : {})}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="px-2 py-1 text-xs border rounded bg-blue-500 text-white">Salvar</button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}