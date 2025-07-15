import {type NodeProps, Handle, Position, useReactFlow} from "reactflow";
import { useState, useRef } from "react";
import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { toast } from "sonner";

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
  { key: "Vmin", label: "Vmin" },
  { key: "Vmax", label: "Vmax" },
];

export function Placeholder(props : NodeProps) {
    const isSelected = props.selected;
    const selectionStyles = isSelected ? "ring-4 ring-blue-500 ring-opacity-50 shadow-lg" : "";
    const [open, setOpen] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const { setNodes, getNodes } = useReactFlow();
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

    const handleDoubleClick = () => setOpen(true);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm(f => ({ ...f, [name]: name === 'id' ? value.replace(/\D/g, '').slice(0, 4) : value }));
    };
    const handleSave = () => {
      // Always pad the ID to 4 digits
      const newId = padId(form.id);
      const currentId = padId(props.data?.id ?? '');
      if (newId !== currentId) {
        const nodes = getNodes();
        if (nodes.some(n => n.id !== props.id && padId(n.data?.id) === newId)) {
          toast.error(`ID ${newId} já está em uso. O ID do bloco não foi alterado.`);
          setForm(f => ({ ...f, id: currentId }));
          setOpen(false);
          return;
        }
      }
      setNodes(nodes => nodes.map(n => n.id === props.id ? { ...n, id: newId, data: { ...n.data, ...form, id: newId } } : n));
      setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div
              ref={nodeRef}
              className={`bg-white rounded w-[180px] h-[110px] border-2 border-black flex flex-col items-center justify-center text-black font-bold relative cursor-pointer transition-all duration-200 ${selectionStyles}`}
              onDoubleClick={handleDoubleClick}
            >
              <Handle id="vout" type="source" position={Position.Right} className="-right-3 w-3 h-3 border-0 bg-black"/>
              <Handle id="vin" type="target" position={Position.Left} className="-left-3 w-3 h-3 border-0 bg-black"/>
              <div className="text-center">
                <div className="text-xs font-bold text-blue-700 mb-1">ID: {padId(props.data?.id || "-")}</div>
                <div className="text-sm mb-1">{props.data?.label || "PLACEHOLDER"}</div>
                <div className="text-xs font-normal">
                  {PARAMS.filter(p => p.key !== 'id').map(param => (
                    <span key={param.key} className="inline-block mr-1">
                      {param.label}:{" "}{props.data?.[param.key] ?? "-"}
                    </span>
                  ))}
                </div>
              </div>
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
