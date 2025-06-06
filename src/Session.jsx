import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import Cookies from "js-cookie";
import { useUser } from "@hooks";
import { api } from "@api";
import { showServerError } from "@utils";
import { LoadingOverlay } from "@components";
import { privatePaths } from "./routes";

export const Session = ({ children }) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [loading, setLoading] = useState(true);
  const { setUserId, setName, setSurname } = useUser();

  const navigateToRightPath = (path) => {
    const firstPathUrl = path.split("/").filter(Boolean)[0];

    if (path.startsWith("/leads")) {
      return path + search;
    }

    return privatePaths.includes(firstPathUrl) ? path : "/leads";
  };

  const handleLogout = () => {
    Cookies.remove("jwt");
    setUserId(null);
    setName(null);
    setSurname(null);
  };

  const fetchSession = async () => {
    try {
      const data = await api.auth.session();

      setUserId(data.user_id);
      setName(data.username || "");
      setSurname(data.surname || "");
      navigate(navigateToRightPath(pathname), { replace: true });
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
