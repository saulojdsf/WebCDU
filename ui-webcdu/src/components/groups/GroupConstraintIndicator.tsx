import React, { useEffect, useState } from 'react';
import type { NodeGroup } from '@/lib/group-types';
import type { ConstraintDirection } from '@/hooks/useGroupConstraintFeedback';
import './group-constraints.css';

interface GroupConstraintIndicatorProps {
    group: NodeGroup;
    direction: ConstraintDirection;
    active: boolean;
    pulsing?: boolean;
}

/**
 * Component that renders visual indicators when a node reaches a group boundary
 */
export const GroupConstraintIndicator: React.FC<GroupConstraintIndicatorProps> = ({
    group,
    direction,
    active,
    pulsing = false,
}) => {
    const [visible, setVisible] = useState(false);

    // Add a slight delay before showing the indicator to avoid flicker
    useEffect(() => {
        if (active) {
            const timer = setTimeout(() => {
                setVisible(true);
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [active]);

    if (!direction || !visible) {
        return null;
    }

    const className = `group-constraint-indicator ${direction} ${active ? 'active' : ''} ${pulsing ? 'pulsing' : ''}`;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: direction === 'left' ? group.bounds.x : (direction === 'right' ? group.bounds.x + group.bounds.width - 4 : group.bounds.x),
        top: direction === 'top' ? group.bounds.y : (direction === 'bottom' ? group.bounds.y + group.bounds.height - 4 : group.bounds.y),
        width: direction === 'left' || direction === 'right' ? 4 : group.bounds.width,
        height: direction === 'top' || direction === 'bottom' ? 4 : group.bounds.height,
    };

    return (
        <div
            className={className}
            style={style}
            data-testid={`constraint-indicator-${group.id}-${direction}`}
            aria-hidden="true"
        />
    );
};

export default GroupConstraintIndicator;