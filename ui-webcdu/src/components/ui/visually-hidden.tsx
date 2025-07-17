import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * VisuallyHidden component
 * 
 * This component hides content visually while keeping it accessible to screen readers.
 * It's useful for providing additional context to screen reader users without affecting the visual layout.
 */
export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-rect-0 border-0",
          className
        )}
        {...props}
      />
    )
  }
)
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }