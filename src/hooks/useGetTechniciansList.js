import { useState, useEffect } from "react";
import { api } from "@api";
import { showServerError } from "@utils";

export const useGetTechniciansList = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        const data = await api.users.getTechnicianList();

        const groupMap = new Map();

        data.forEach((item) => {
          const userId = item?.id?.id;
          if (!userId) return; // пропускаем если нет ID

          const groupName = item.groups?.[0]?.name || "Fără grupă";
          const label = `${item.id?.surname || ""} ${item.id?.name || ""}`.trim();

          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, []);
          }

          // добавляем только если value не дублируется
          const groupUsers = groupMap.get(groupName);
          if (!groupUsers.some((u) => u.value === `${userId}`)) {
            groupUsers.push({
              value: `${userId}`,
              label,
            });
          }
        });

        const formatted = [];

        for (const [groupName, users] of groupMap.entries()) {
          formatted.push({
            value: `__group__${groupName}`,
            label: groupName,
          });
          formatted.push(...users);
        }

        setTechnicians(formatted);
      } catch (error) {
        setErrors(showServerError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  return {
    errors,
    loading,
    technicians,
  };
};
