import React from 'react';
import type { NodeGroup } from '@/lib/group-types';
import { GroupConstraintIndicator } from './GroupConstraintIndicator';
import type { UseNodeDragConstraintIntegrationReturn } from '@/hooks/useNodeDragConstraintIntegration';

interface GroupConstraintIndicatorsProps {
    groups: NodeGroup[];
    constraintIntegration: UseNodeDragConstraintIntegrationReturn;
}

/**
 * Component that renders constraint indicators for all groups
 */
export const GroupConstraintIndicators: React.FC<GroupConstraintIndicatorsProps> = ({
    groups,
    constraintIntegration
}) => {
    const { constraintViolation, constraintFeedback } = constraintIntegration;

    // If there's no constraint violation or feedback, don't render anything
    if (!constraintViolation && !constraintFeedback.active) {
        return null;
    }

    // If there's a constraint violation, find the group
    if (constraintViolation) {
        const group = groups.find(g => g.id === constraintViolation.groupId);
        if (group) {
            return (
                <GroupConstraintIndicator
                    group={group}
                    direction={constraintViolation.direction}
                    active={true}
                    pulsing={true}
                />
            );
        }
    }

    // If there's constraint feedback, find the group
    if (constraintFeedback.active && constraintFeedback.groupId) {
        const group = groups.find(g => g.id === constraintFeedback.groupId);
        if (group) {
            return (
                <GroupConstraintIndicator
                    group={group}
                    direction={constraintFeedback.direction}
                    active={constraintFeedback.active}
                    pulsing={constraintFeedback.pulsing}
                />
            );
        }
    }

    return null;
};

export default GroupConstraintIndicators;