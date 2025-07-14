import {getSmoothStepPath, type EdgeProps} from "reactflow";

export default function DefaultEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    source,
    target,
    data
} : EdgeProps) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition
    });

    // Determine selection styles
    const strokeColor = selected ? "#3b82f6" : "#000000"; // Blue when selected, black when not
    const strokeWidth = selected ? "3" : "2";
    const strokeDasharray = selected ? "5,5" : "none";

    // Get the source node's Vout value from the edge data
    const sourceVout = data ?. sourceVout || "X";

    return (
        <>
            <path id={id}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
                style={
                    {
                        ...style,
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                        strokeDasharray: strokeDasharray
                    }
                }/>
            <text>
                <textPath href={
                        `#${id}`
                    }
                    style={
                        {
                            fontSize: 12,
                            fill: strokeColor
                        }
                    }
                    startOffset="50%"
                    textAnchor="middle">
                    {sourceVout} </textPath>
            </text>
        </>
    );
}
