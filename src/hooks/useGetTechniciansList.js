import { useState, useEffect } from "react";
import { api } from "@api";
import { showServerError } from "@utils";

let cachedTechnicians = null;
let fetchingPromise = null;

export const useGetTechniciansList = () => {
  const [technicians, setTechnicians] = useState(cachedTechnicians || []);
  const [loading, setLoading] = useState(!cachedTechnicians);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (cachedTechnicians) {
      setTechnicians(cachedTechnicians);
      setLoading(false);
      return;
    }

    if (fetchingPromise) {
      setLoading(true);
      fetchingPromise
        .then((merged) => {
          setTechnicians(merged);
          setLoading(false);
        })
        .catch((error) => {
          setErrors(showServerError(error));
          setLoading(false);
        });
      return;
    }

    fetchingPromise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        const data = await api.users.getTechnicianList();

        const groupMap = new Map();

        data.forEach((item) => {
          const userId = item?.id?.id;
          if (!userId) return;

          const groupName = item.groups?.[0]?.name || "Fără grupă";
          const label = `${item.id?.surname || ""} ${item.id?.name || ""}`.trim();

          const userItem = {
            value: `${userId}`,
            label,
            id: item.id,
            sipuni_id: item.sipuni_id,
            groupName,
          };

          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, []);
          }
          const groupUsers = groupMap.get(groupName);
          if (!groupUsers.some((u) => u.value === userItem.value)) {
            groupUsers.push(userItem);
          }
        });

        const merged = [];
        for (const [groupName, users] of groupMap.entries()) {
          merged.push({
            value: `__group__${groupName}`,
            label: groupName,
            disabled: true,
          });
          merged.push(...users);
        }

        cachedTechnicians = merged;
        setTechnicians(merged);
        setLoading(false);

        resolve(merged);
      } catch (error) {
        setErrors(showServerError(error));
        setLoading(false);
        reject(error);
      } finally {
        fetchingPromise = null;
      }
    });
  }, []);

  return {
    technicians,
    loading,
    errors,
  };
};
