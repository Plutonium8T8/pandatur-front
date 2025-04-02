import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../hooks";
import { translations } from "../utils/translations";
import "./SideBar.css";
import LanguageToggle from "./LanguageToggle";
import {
  FaUser,
  FaChartBar,
  FaTasks,
  FaComments,
  FaBell,
  FaClipboardList,
  FaSignOutAlt,
  FaUserSecret,
  FaCalendar,
} from "react-icons/fa";
import { clearCookies } from "../../Components/utils/clearCookies";
import { api } from "../../api";
import { LoadingOverlay } from "../LoadingOverlay";

const CustomSidebar = ({ onOpenNotifications, onOpenAccount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useApp();
  const [loading, setLoading] = useState(false);

  const language = localStorage.getItem("language") || "RO";

  const isActive = (page) => {
    if (page === "chat") {
      return location.pathname.startsWith("/chat");
    }
    return location.pathname === `/${page}`;
  };

  const handleNavigate = (page) => {
    navigate(`/${page}`);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
      clearCookies();
    } catch (_) {
      clearCookies();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container-side-bar">
        <div className="menu-side-bar">
          <div className="container-item-menu">
            <div
              className={`menu-item ${isActive("account") ? "active" : ""}`}
              onClick={onOpenAccount}
            >
              <FaUser size={24} />
              <span>{translations["Account"][language]}</span>
            </div>
            <div
              className={`menu-item ${isActive("users") ? "active" : ""}`}
              onClick={() => handleNavigate("users")}
            >
              <FaUserSecret size={24} />
              <span>{translations["Users"][language]}</span>
            </div>
            <div
              className={`menu-item ${isActive("dashboard") ? "active" : ""}`}
              onClick={() => handleNavigate("dashboard")}
            >
              <FaChartBar size={24} />
              <span>{translations["Dashboard"][language]}</span>
            </div>
            <div
              className={`menu-item ${isActive("leads") ? "active" : ""}`}
              onClick={() => handleNavigate("leads")}
            >
              <FaClipboardList size={24} />
              <span>{translations["Leads"][language]}</span>
            </div>
            <div
              className={`menu-item ${isActive("chat") ? "active" : ""}`}
              onClick={() => handleNavigate("chat")}
            >
              <FaComments size={24} />
              <span>{translations["Chat"][language]}</span>
              {unreadCount > 0 && (
                <span className="unread-indicator">{unreadCount}</span>
              )}
            </div>
            <div
              className={`menu-item ${isActive("tasks") ? "active" : ""}`}
              onClick={() => handleNavigate("tasks")}
            >
              <FaTasks size={24} />
              <span>{translations["Taskuri"][language]}</span>
            </div>
            <div
              className={`menu-item ${isActive("schedules") ? "active" : ""}`}
              onClick={() => handleNavigate("schedules")}
            >
              <FaCalendar size={24} />
              <span>{translations["schedules"][language]}</span>
            </div>
            <div
              className={`menu-item ${isActive("notifications") ? "active" : ""}`}
              onClick={onOpenNotifications}
            >
              <FaBell size={24} />
              <span>{translations["Notificări"][language][1]}</span>
            </div>
            <div className={`menu-item `}>
              <LanguageToggle />
            </div>
          </div>
        </div>
        <div className="menu-item" onClick={logout}>
          <FaSignOutAlt size={24} />
          <span>{translations["Log Out"][language]}</span>
        </div>
      </div>
      {loading && <LoadingOverlay />}
    </>
  );
};

export default CustomSidebar;
