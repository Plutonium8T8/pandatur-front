import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Sidebar as BaseSideBar, Menu, MenuItem } from "react-pro-sidebar";
import {
  FaChartBar,
  FaTasks,
  FaComments,
  FaClipboardList,
  FaSignOutAlt,
  FaCalendar,
  FaHistory,
} from "react-icons/fa";
import { FaUsers, FaBars } from "react-icons/fa6";
import { Badge, Flex, Divider } from "@mantine/core";
import { clearCookies } from "@utils";
import { api } from "@api";
import { LoadingOverlay } from "@components";
import { useApp, useLanguageToggle, LANGUAGES, useUser } from "@hooks";
import { getLanguageByKey } from "@utils";
import { hasPermission } from "../utils/permissions";
import "./SideBar.css";

const LOGO = "/logo.png";

export const SideBar = () => {
  const location = useLocation();
  const { unreadCount, isCollapsed, setIsCollapsed } = useApp();
  const { surname, name, userId, userRoles } = useUser();
  const [loading, setLoading] = useState(false);
  const { toggleLanguage, selectedLanguage } = useLanguageToggle();

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
      <BaseSideBar collapsed={isCollapsed} backgroundColor="#1f2937">
        <Menu>
          <MenuItem
            suffix={<FaBars />}
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="logo-menu"
            icon={isCollapsed && <FaBars />}
          >
            {!isCollapsed && (
              <Flex ml="8px">
                <img width="80px" height="100%" src={LOGO} alt="PANDATUR CRM" />
              </Flex>
            )}
          </MenuItem>

          {/* {hasPermission(userRoles, "USERS", "VIEW") && ( */}
          <MenuItem
            active={isActive("users")}
            icon={<FaUsers />}
            component={<Link to="/users" />}
          >
            {getLanguageByKey("Users")}
          </MenuItem>
          {/* )} */}

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

          {/* {hasPermission(userRoles, "SCHEDULES", "VIEW") && ( */}
          <MenuItem
            active={isActive("schedules")}
            icon={<FaCalendar />}
            component={<Link to="/schedules" />}
          >
            {getLanguageByKey("schedules")}
          </MenuItem>
          {/* )} */}

          {/* {hasPermission(userRoles, "LOGS", "VIEW") && ( */}
          <MenuItem
            active={isActive("logs")}
            icon={<FaHistory />}
            component={<Link to="/logs" />}
          >
            {getLanguageByKey("logs")}
          </MenuItem>
          {/* )} */}

          <MenuItem
            onClick={toggleLanguage}
            icon={LANGUAGES[selectedLanguage].icon}
          >
            {LANGUAGES[selectedLanguage].label}
          </MenuItem>
        </Menu>

        <Menu>
          {!isCollapsed && (
            <MenuItem>
              {surname} {name} ({userId})
            </MenuItem>
          )}
          <Divider />
          <MenuItem icon={<FaSignOutAlt />} onClick={logout}>
            {getLanguageByKey("Log Out")}
          </MenuItem>
        </Menu>
      </BaseSideBar>

      {loading && <LoadingOverlay />}
    </>
  );
};
