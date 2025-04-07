import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import {
  FaUser,
  FaChartBar,
  FaTasks,
  FaComments,
  FaBell,
  FaClipboardList,
  FaSignOutAlt,
  FaCalendar,
} from "react-icons/fa";
import { FaUsers } from "react-icons/fa6";
import { Badge } from "@mantine/core";
import { Link } from "react-router-dom";
import { clearCookies } from "../../Components/utils/clearCookies";
import { api } from "../../api";
import { LoadingOverlay } from "../LoadingOverlay";
import { useApp } from "../../hooks";
import LanguageToggle from "./LanguageToggle";
import { getLanguageByKey } from "../utils";
import "./SideBar.css";

const CustomSidebar = ({ onOpenNotifications, onOpenAccount }) => {
  const location = useLocation();
  const { unreadCount } = useApp();
  const [loading, setLoading] = useState(false);

  const isActive = (page) => {
    if (page === "chat") {
      return location.pathname.startsWith("/chat");
    }
    return location.pathname === `/${page}`;
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
      <Sidebar backgroundColor="#1f2937">
        <Menu>
          <MenuItem onClick={onOpenAccount} icon={<FaUser />}>
            {getLanguageByKey("Account")}
          </MenuItem>
          <MenuItem
            active={isActive("users")}
            icon={<FaUsers />}
            component={<Link to="/users" />}
          >
            {getLanguageByKey("Users")}
          </MenuItem>
          <MenuItem
            active={isActive("dashboard")}
            icon={<FaChartBar />}
            component={<Link to="/dashboard" />}
          >
            {getLanguageByKey("Dashboard")}
          </MenuItem>
          <MenuItem
            active={isActive("leads")}
            icon={<FaClipboardList />}
            component={<Link to="/leads" />}
          >
            {getLanguageByKey("Leads")}
          </MenuItem>
          <MenuItem
            suffix={unreadCount > 0 && <Badge bg="red">{unreadCount}</Badge>}
            active={isActive("chat")}
            icon={<FaComments />}
            component={<Link to="/chat" />}
          >
            {getLanguageByKey("Chat")}
          </MenuItem>

          <MenuItem
            active={isActive("tasks")}
            icon={<FaTasks />}
            component={<Link to="/tasks" />}
          >
            {getLanguageByKey("Taskuri")}
          </MenuItem>
          <MenuItem
            active={isActive("schedules")}
            icon={<FaCalendar />}
            component={<Link to="/schedules" />}
          >
            {getLanguageByKey("schedules")}
          </MenuItem>
          <MenuItem onClick={onOpenNotifications} icon={<FaBell />}>
            {getLanguageByKey("Notificări")[1]}
          </MenuItem>
          <MenuItem>
            <LanguageToggle />
          </MenuItem>
        </Menu>

        <Menu>
          <MenuItem
            icon={<FaSignOutAlt />}
            onClick={logout}
            active={isActive("notifications")}
          >
            {getLanguageByKey("Log Out")}
          </MenuItem>
        </Menu>
      </Sidebar>

      {loading && <LoadingOverlay />}
    </>
  );
};

export default CustomSidebar;
