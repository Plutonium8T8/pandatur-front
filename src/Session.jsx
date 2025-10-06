import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import Cookies from "js-cookie";
import { useUser } from "@hooks";
import { api } from "@api";
import { showServerError, getLanguageByKey } from "@utils";
import { LoadingOverlay } from "@components";

export const Session = ({ children }) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [loading, setLoading] = useState(true);
  const { setUserId, setName, setSurname } = useUser();

  const handleLogout = () => {
    Cookies.remove("jwt");
    setUserId(null);
    setName(null);
    setSurname(null);
  };

  const fetchSession = async () => {
    try {
      const data = await api.auth.session();

      // Проверяем роль пользователя
      if (data.roles && data.roles.includes("ROLE_USER")) {
        handleLogout();
        navigate("/auth");
        enqueueSnackbar(getLanguageByKey("accessDenied"), { variant: "error" });
        return;
      }

      setUserId(data.user_id);
      setName(data.username || "");
      setSurname(data.surname || "");

      // если уже на нужном path — не делать navigate
      if (pathname === "/auth") return;

      // остаёмся на текущем пути с сохранением query-параметров
      navigate(`${pathname}${search}`, { replace: true });
    } catch (error) {
      navigate("/auth");
      handleLogout();
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return <>{loading ? <LoadingOverlay /> : children}</>;
};
