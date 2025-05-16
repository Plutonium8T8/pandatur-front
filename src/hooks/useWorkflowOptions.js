import { useMemo } from "react";
import {
    userGroupsToGroupTitle,
    workflowOptionsLimitedByGroupTitle,
    workflowOptionsByGroupTitle
} from "../Components/utils/workflowUtils";

export const useWorkflowOptions = ({ groupTitle, userGroups, userId }) => {
    const isAdmin = useMemo(() => {
        const adminGroup = userGroups?.find((g) => g.name === "Admin");
        return adminGroup?.users?.includes(userId);
    }, [userGroups, userId]);

    const hasAccessToGroupTitle = useMemo(() => {
        return userGroups?.some((group) => userGroupsToGroupTitle[group.name] === groupTitle);
    }, [userGroups, groupTitle]);

    const workflowOptions = useMemo(() => {
        if (isAdmin) {
            return workflowOptionsByGroupTitle[groupTitle] || [];
        }
        if (hasAccessToGroupTitle) {
            return workflowOptionsLimitedByGroupTitle[groupTitle] || [];
        }
        return [];
    }, [groupTitle, isAdmin, hasAccessToGroupTitle]);

    return {
        workflowOptions,
        isAdmin,
        hasAccessToGroupTitle,
    };
};
