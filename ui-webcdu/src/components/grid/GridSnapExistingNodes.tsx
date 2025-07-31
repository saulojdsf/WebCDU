import { AlignStartVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useReactFlow } from "reactflow"
import { useRef } from "react"

interface GridSnapExistingNodesProps {
    /** Whether grid snapping is currently enabled */
    enabled: boolean
    /** Callback to perform the basic snapping operation */
    onSnapExistingNodes: () => void
    /** Callback to perform snapping while preserving relative positioning */
    onSnapExistingNodesPreservingRelativePositioning?: () => void
    /** Callback to perform snapping while preserving groupings */
    onSnapExistingNodesPreservingGroupings?: (edges: Array<{ source: string; target: string }>) => void
    /** Optional className for styling */
    className?: string
}

/**
 * Button component for snapping all existing nodes to grid positions
 * Only visible when grid snapping is enabled
 */
export function GridSnapExistingNodes({
    enabled,
    onSnapExistingNodes,
    className
}: GridSnapExistingNodesProps) {
    const { getNodes } = useReactFlow()
    const announcementRef = useRef<HTMLDivElement>(null)

    const handleClick = () => {
        const nodes = getNodes()
        const nodeCount = nodes.length

        if (nodeCount === 0) {
            // Announce to screen readers that there are no nodes
            if (announcementRef.current) {
                announcementRef.current.textContent = "No nodes to snap to grid"
                setTimeout(() => {
                    if (announcementRef.current) {
                        announcementRef.current.textContent = ""
                    }
                }, 2000)
            }
            return
        }

        onSnapExistingNodes()

        // Announce successful snapping to screen readers
        if (announcementRef.current) {
            const message = `${nodeCount} node${nodeCount === 1 ? '' : 's'} snapped to grid`
            announcementRef.current.textContent = message
            setTimeout(() => {
                if (announcementRef.current) {
                    announcementRef.current.textContent = ""
                }
            }, 2000)
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Handle Enter and Space keys for activation
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleClick()
        }
    }

    // Don't render if grid snapping is disabled
    if (!enabled) {
        return null
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClick}
                            onKeyDown={handleKeyDown}
                            className={className}
                            aria-label="Snap all existing nodes to grid"
                            aria-describedby="snap-existing-description"
                        >
                            <AlignStartVertical className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p id="snap-existing-description">
                            Snap all nodes to grid
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Screen reader announcements for snapping operations */}
            <div
                ref={announcementRef}
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />
        </>
    )
}