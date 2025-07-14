import React, { createContext, useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { api } from "../api";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  userGroupsToGroupTitle,
} from "../Components/utils/workflowUtils";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(() => {
    const savedUserId = localStorage.getItem("user_id");
    return savedUserId ? Number(savedUserId) : null;
  });

  const [name, setName] = useState(() => localStorage.getItem("user_name") || null);
  const [surname, setSurname] = useState(() => localStorage.getItem("user_surname") || null);
  const [userRoles, setUserRoles] = useState(() => {
    const saved = localStorage.getItem("user_roles");
    return saved ? JSON.parse(saved) : [];
  });
  const [userGroups, setUserGroups] = useState([]);
  const [technician, setTechnician] = useState(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [customGroupTitle, setCustomGroupTitle] = useState(null);

  const teamUserIds = useMemo(() => {
    const groups = userGroups || [];
    const all = groups
      .filter((group) => group.users?.includes(userId))
      .flatMap((group) => group.users || []);
    return new Set(all.map(String));
  }, [userGroups, userId]);

  const isSameTeam = (responsibleId) => {
    if (!responsibleId) return false;
    return teamUserIds.has(String(responsibleId));
  };

  const isAdmin = useMemo(
    () => userGroups.some((g) =>
      ["Admin", "IT dep.", "Quality Department"].includes(g.name)
    ),
    [userGroups]
  );

  const accessibleGroupTitles = useMemo(() => {
    const titles = userGroups.flatMap((group) => userGroupsToGroupTitle[group.name] || []);
    return [...new Set(titles)];
  }, [userGroups]);

  const groupTitleForApi = useMemo(
    () => customGroupTitle || accessibleGroupTitles[0] || null,
    [customGroupTitle, accessibleGroupTitles]
  );

  const workflowOptions = useMemo(() => {
    if (!groupTitleForApi) return [];
    if (isAdmin) return workflowOptionsByGroupTitle[groupTitleForApi] || [];
    return workflowOptionsLimitedByGroupTitle[groupTitleForApi] || [];
  }, [groupTitleForApi, isAdmin]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem("user_id", userId);
      fetchRolesAndGroups();
    } else {
      localStorage.removeItem("user_id");
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
      setIsLoadingRoles(false);
    }
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
    name
      ? localStorage.setItem("user_name", name)
      : localStorage.removeItem("user_name");
  }, [name]);

  useEffect(() => {
    surname
      ? localStorage.setItem("user_surname", surname)
      : localStorage.removeItem("user_surname");
  }, [surname]);

  useEffect(() => {
    userRoles.length > 0
      ? localStorage.setItem("user_roles", JSON.stringify(userRoles))
      : localStorage.removeItem("user_roles");
  }, [userRoles]);

  const fetchRolesAndGroups = async () => {
    setIsLoadingRoles(true);
    try {
      const token = Cookies.get("jwt");
      if (!token || !userId) {
        setUserRoles([]);
        setUserGroups([]);
        setTechnician(null);
        setIsLoadingRoles(false);
        return;
      }

      const data = await api.users.getById(userId);
      const rawRoles = JSON.parse(data.roles);
      const groups = await api.user.getGroupsList();
      const myGroups = (groups || []).filter((g) => (g.users || []).includes(userId));

      const technicians = await api.users.getTechnicianList();
      const me = technicians.find((t) => t.id?.user?.id === userId);

      setUserRoles(rawRoles);
      setUserGroups(myGroups);
      setTechnician(me || null);
      localStorage.setItem("user_roles", JSON.stringify(rawRoles));
    } catch (error) {
      console.error("error get data users", error.message);
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const user = {
    id: userId,
    name,
    surname,
    roles: userRoles,
    groups: userGroups,
    technician,
    isAdmin,
    workflowOptions,
    accessibleGroupTitles,
    groupTitleForApi,
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        name,
        setName,
        surname,
        setSurname,
        userRoles,
        setUserRoles,
        userGroups,
        teamUserIds,
        isSameTeam,
        isLoadingRoles,
        technician,
        isAdmin,
        accessibleGroupTitles,
        customGroupTitle,
        setCustomGroupTitle,
        groupTitleForApi,
        workflowOptions,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
