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
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);
  const { setUserId, setName, setSurname } = useUser();

  const navigateToRightPath = (path) => {
    const firstPathUrl = path.split("/").filter(Boolean)[0];

    // Special case: Opening a new window with the lead's ID in the format `/leads/{id}`
    if (path.startsWith("/leads")) {
      return path;
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
      navigate(navigateToRightPath(pathname));
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
