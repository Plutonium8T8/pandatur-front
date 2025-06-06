import React, { createContext, useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { api } from "../api";

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
      const technicians = await api.users.getTechnicianList();
      const me = technicians.find((t) => t.id?.user?.id === userId);

      setUserRoles(rawRoles);
      setUserGroups(groups);
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
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
