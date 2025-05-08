import React, { createContext, useState, useEffect } from "react";
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

  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    if (userId) {
      localStorage.setItem("user_id", userId);
      fetchRoles();
    } else {
      localStorage.removeItem("user_id");
      setUserRoles([]);
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

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const token = Cookies.get("jwt");
      if (!token || !userId) {
        setUserRoles([]);
        setIsLoadingRoles(false);
        return;
      }

      const data = await api.users.getById(userId);
      const rawArray = JSON.parse(data.roles);
      setUserRoles(rawArray);
      localStorage.setItem("user_roles", JSON.stringify(rawArray));
    } catch (error) {
      console.error("❌ Ошибка при загрузке ролей:", error.message);
      setUserRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const user = {
    id: userId,
    name,
    surname,
    roles: userRoles,
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
        isLoadingRoles,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
