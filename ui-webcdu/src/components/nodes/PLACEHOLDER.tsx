import {type NodeProps, Handle, Position} from "reactflow";

export function Placeholder(props : NodeProps) {

    const isSelected = props.selected;
    const selectionStyles = isSelected ? "ring-4 ring-blue-500 ring-opacity-50 shadow-lg" : "";

    return (
        <div className={`bg-white rounded w-[150px] h-[75px] border-2 border-black flex flex-col items-center justify-center text-black font-bold relative cursor-pointer transition-all duration-200 ${selectionStyles}`}>
            <Handle id="vout" type="source" position={Position.Right} className="-right-3 w-3 h-3 border-0 bg-black"/>
            <Handle id="vin" type="target" position={Position.Left} className="-left-3 w-3 h-3 border-0 bg-black"/>
            <div className="text-center">
                <div className="text-sm mb-1">PLACEHOLDER</div>
            </div>
        </div>
    );
}
