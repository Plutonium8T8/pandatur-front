import { useEffect, useState, useMemo } from "react";
import { api } from "@/api";
import { useUser } from "@/hooks/useUser";

export const useSameTeamChecker = (responsibleId) => {
    const { userId } = useUser();
    const [teamUserIds, setTeamUserIds] = useState([]);

    useEffect(() => {
        const fetchTeamUsers = async () => {
            try {
                const groups = await api.user.getGroupsList();

                const userGroups = groups.filter(group =>
                    group.users?.includes(Number(userId))
                );

                const ids = new Set(
                    userGroups.flatMap(group => group.users?.map(String) || [])
                );

                setTeamUserIds([...ids]);
            } catch (e) {
                console.error("❌ Ошибка при загрузке групп пользователя", e);
            }
        };

        if (userId) fetchTeamUsers();
    }, [userId]);

    return useMemo(() => {
        return responsibleId && teamUserIds.includes(String(responsibleId));
    }, [responsibleId, teamUserIds]);
};
