import { useMemo } from "react";
import { useUser } from "../../hooks";

export const useSameTeamChecker = (responsibleId) => {
    const { userId, userGroups } = useUser();

    return useMemo(() => {
        if (!userGroups?.length || !responsibleId || !userId) return false;

        const myGroups = userGroups.filter(group =>
            group.users?.includes(Number(userId))
        );

        const allTeamUserIds = new Set(
            myGroups.flatMap(group => group.users?.map(String) || [])
        );

        return allTeamUserIds.has(String(responsibleId));
    }, [userGroups, responsibleId, userId]);
};
