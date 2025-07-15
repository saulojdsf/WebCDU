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
];

export function MULTPL(props : NodeProps) {
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

    const updateConnectedVins = props.data?.updateConnectedVins;
    const updateNodeAndConnectedVins = props.data?.updateNodeAndConnectedVins;

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
      if ((idChanged || voutChanged) && typeof updateNodeAndConnectedVins === 'function') {
        updateNodeAndConnectedVins(props.id, (nodes: any[]) => nodes.map((n: any) => n.id === props.id ? { ...n, id: newId, data: { ...n.data, ...form, id: newId } } : n), idChanged ? newId : undefined);
      } else {
        setNodes(nodes => nodes.map(n => n.id === props.id ? { ...n, id: newId, data: { ...n.data, ...form, id: newId } } : n));
      }
      setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div
              ref={nodeRef}
              className={`bg-white rounded w-[150px] h-[75px] border-2 border-black flex flex-col items-center justify-center text-black font-bold relative cursor-pointer transition-all duration-200 ${selectionStyles}`}
              onDoubleClick={handleDoubleClick}
            >
              <Handle id="vout" type="source" position={Position.Right} className="-right-3 w-3 h-3 border-0 bg-black"/>
              <Handle id="vin" type="target" position={Position.Left} className="-left-3 w-3 h-3 border-0 bg-black"/>
              <div className="text-center w-full">
<div className="text-sm mb-1">{"Π"}</div>


                
              </div>
<div className="absolute bottom-0 right-1 text-[10px] font-bold text-black bg-white bg-opacity-80 px-0 rounded">
    {padId(props.data?.id || "-")}
</div>
<div className="absolute top-0 right-1 text-[10px] font-bold text-black bg-white bg-opacity-80 px-0 rounded">
    {(props.data?.Vout || "?")}
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
