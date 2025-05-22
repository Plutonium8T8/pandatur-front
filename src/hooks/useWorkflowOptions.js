import { useEffect, useState, useMemo } from "react";
import {
    userGroupsToGroupTitle,
    workflowOptionsLimitedByGroupTitle,
    workflowOptionsByGroupTitle,
} from "../Components/utils/workflowUtils";
import { api } from "../api";

export const useWorkflowOptions = ({ groupTitle, userId }) => {
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ новый флаг

    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const technicians = await api.users.getTechnicianList();
                const me = technicians.find(
                    (t) => t.id && t.id.user && String(t.id.user.id) === String(userId)
                );
                setUserGroups(me?.groups || []);
            } catch (err) {
                console.error("error get technician list", err);
                setUserGroups([]);
            } finally {
                setLoading(false); // ✅ загрузка завершена
            }
        };
        if (userId) fetchTechnicians();
    }, [userId]);

    const isAdmin = useMemo(
        () => userGroups.some((g) => g.name === "Admin"),
        [userGroups]
    );

    const hasAccessToGroupTitle = useMemo(() => {
        return userGroups.some((group) => {
            const mapped = userGroupsToGroupTitle[group.name];
            if (!mapped) return false;
            if (Array.isArray(mapped)) return mapped.includes(groupTitle);
            return mapped === groupTitle;
        });
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

    const groupTitleForApi = useMemo(() => {
        const found = userGroups.find((group) => {
            const mapped = userGroupsToGroupTitle[group.name];
            return mapped && (Array.isArray(mapped) ? mapped.length > 0 : true);
        });

        const mapped = found ? userGroupsToGroupTitle[found.name] : null;
        return Array.isArray(mapped) ? mapped[0] : mapped;
    }, [userGroups]);

    return {
        workflowOptions,
        isAdmin,
        hasAccessToGroupTitle,
        userGroups,
        groupTitleForApi,
        loading, // ✅ экспортируем состояние загрузки
    };
};
