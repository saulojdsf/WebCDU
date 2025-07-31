import { Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEffect, useRef } from "react"

interface GridSnapToggleProps {
    /** Whether grid snapping is currently enabled */
    enabled: boolean
    /** Callback when toggle is clicked */
    onToggle: () => void
    /** Optional className for styling */
    className?: string
}

/**
 * Toggle button component for enabling/disabling grid snapping
 * Provides visual feedback, tooltip, and accessibility features
 */
export function GridSnapToggle({ enabled, onToggle, className }: GridSnapToggleProps) {
    const announcementRef = useRef<HTMLDivElement>(null)
    const previousEnabledRef = useRef<boolean | undefined>(undefined)

    // Announce state changes to screen readers
    useEffect(() => {
        // Skip announcement on initial render
        if (previousEnabledRef.current !== undefined && previousEnabledRef.current !== enabled && announcementRef.current) {
            const message = enabled ? "Grid snapping enabled" : "Grid snapping disabled"
            announcementRef.current.textContent = message

            // Clear the announcement after a short delay to avoid cluttering screen reader
            const timer = setTimeout(() => {
                if (announcementRef.current) {
                    announcementRef.current.textContent = ""
                }
            }, 1000)

            return () => clearTimeout(timer)
        }
        previousEnabledRef.current = enabled
    }, [enabled])

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Handle Enter and Space keys for activation (Button already handles this, but being explicit)
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
        }
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={enabled ? "default" : "ghost"}
                            size="icon"
                            onClick={onToggle}
                            onKeyDown={handleKeyDown}
                            className={className}
                            aria-label={enabled ? "Disable grid snapping" : "Enable grid snapping"}
                            aria-pressed={enabled}
                            aria-describedby="grid-snap-description"
                            role="switch"
                        >
                            <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p id="grid-snap-description">
                            Grid Snap: {enabled ? "On" : "Off"}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Screen reader announcements for state changes */}
            <div
                ref={announcementRef}
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />
        </>
    )
}