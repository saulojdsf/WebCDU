import React from "react";
import { getSmoothStepPath, type EdgeProps } from "reactflow";
import { useTheme } from "next-themes";

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
  data = {},
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Get current theme
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // Determine selection styles
  const strokeColor = selected ? "#3b82f6" : isDarkMode ? "#ffffff" : "#000000";
  const strokeWidth = selected ? "3" : "2";
  const strokeDasharray = selected ? "5,5" : "none";

  // Get the source node's Vout value from the edge data
  const sourceVout = data?.sourceVout || "X";
  const isSplit = !!data?.split;

  // Calculate arrow positions with fixed size
  const arrowSize = 8; // Fixed arrow size

  // Calculate direction vector from source to target
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Normalize direction vector
  const dirX = dx / distance;
  const dirY = dy / distance;

  // Position arrows at fixed distances from endpoints
  const sourceArrowDistance = 10; // Distance from source endpoint
  const targetArrowDistance = 10; // Distance from target endpoint

  // Source arrow position
  const sourceArrowX = sourceX + dirX * sourceArrowDistance;
  const sourceArrowY = sourceY + dirY * sourceArrowDistance;

  // Target arrow position
  const targetArrowX = targetX - dirX * targetArrowDistance;
  const targetArrowY = targetY - dirY * targetArrowDistance;

  // Calculate arrow points (perpendicular to direction)
  const perpX = -dirY;
  const perpY = dirX;

  // Invisible path for interaction if split, otherwise normal
  const pathProps = isSplit
    ? {
      style: { stroke: "transparent", strokeWidth: 10, cursor: "pointer" },
    }
    : {
      style: {
        ...style,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDasharray: strokeDasharray,
      },
    };

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={isSplit ? undefined : markerEnd}
        {...pathProps}
      />
      {isSplit && (
        <>
          {/* Arrow at source */}
          <polygon
            points={`
              ${sourceArrowX},${sourceArrowY}
              ${sourceArrowX - dirX * arrowSize + perpX * arrowSize},${sourceArrowY - dirY * arrowSize + perpY * arrowSize}
              ${sourceArrowX - dirX * arrowSize - perpX * arrowSize},${sourceArrowY - dirY * arrowSize - perpY * arrowSize}
            `}
            fill={isDarkMode ? "#fff" : "#000"}
          />
          {/* Arrow at target */}
          <polygon
            points={`
              ${targetArrowX},${targetArrowY}
              ${targetArrowX + dirX * arrowSize + perpX * arrowSize},${targetArrowY + dirY * arrowSize + perpY * arrowSize}
              ${targetArrowX + dirX * arrowSize - perpX * arrowSize},${targetArrowY + dirY * arrowSize - perpY * arrowSize}
            `}
            fill={isDarkMode ? "#fff" : "#000"}
          />
          {/* Signal name above target */}
          <text
            x={targetX - 10}
            y={targetY - 10}
            textAnchor="middle"
            style={{ fontSize: 12, fill: isDarkMode ? "#fff" : "#000" }}
          >
            {sourceVout}
          </text>
        </>
      )}
    </>
  );
}
