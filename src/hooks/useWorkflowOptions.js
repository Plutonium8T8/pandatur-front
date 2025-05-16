import { useEffect, useState, useMemo } from "react";
import {
    userGroupsToGroupTitle,
    workflowOptionsLimitedByGroupTitle,
    workflowOptionsByGroupTitle
} from "../Components/utils/workflowUtils";
import { api } from "../api"; // поправь путь, если надо

export const useWorkflowOptions = ({ groupTitle, userId }) => {
    const [userGroups, setUserGroups] = useState([]);

    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const technicians = await api.users.getTechnicianList();
                // ищем пользователя по userId внутри id.user.id
                const me = technicians.find(
                    t => t.id && t.id.user && String(t.id.user.id) === String(userId)
                );
                setUserGroups(me?.groups || []);
            } catch (err) {
                console.error("Ошибка при получении списка техников:", err);
                setUserGroups([]);
            }
        };
        if (userId) fetchTechnicians();
    }, [userId]);

    // Проверка на админа — теперь только по названию группы
    const isAdmin = useMemo(() => {
        return userGroups.some((g) => g.name === "Admin");
    }, [userGroups]);

    const hasAccessToGroupTitle = useMemo(() => {
        return userGroups.some((group) => userGroupsToGroupTitle[group.name] === groupTitle);
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
        userGroups, // возвращаем для дебага/отображения
    };
};
