import { useState, useContext } from "react";
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
  FaChartPie
} from "react-icons/fa";
import { FaUsers, FaBars } from "react-icons/fa6";
import { Badge, Flex, Divider, Select, Burger } from "@mantine/core";
import { clearCookies } from "@utils";
import { api } from "@api";
import { LoadingOverlay } from "@components";
import { useApp, useLanguageToggle, useUser, useMobile } from "../../hooks";
import { getLanguageByKey } from "@utils";
import Can from "../CanComponent/Can";
import "./SideBar.css";
import { safeParseJson } from "../UsersComponent/rolesUtils";
import { convertRolesToMatrix } from "../UsersComponent/rolesUtils";
import { hasRouteAccess, hasStrictPermission } from "../utils/permissions";
import { AppContext } from "../../contexts/AppContext";

const LOGO = "/logo.png";

export const SideBar = () => {
  const location = useLocation();
  const { unreadCount, isCollapsed, setIsCollapsed } = useApp();
  const { surname, name, userId, userRoles } = useUser();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMobile();
  const { setLanguage, selectedLanguage, LANGUAGE_OPTIONS, LANGUAGES } = useLanguageToggle();

  const { customGroupTitle, groupTitleForApi } = useContext(AppContext);
  const currentGroupTitle = customGroupTitle || groupTitleForApi;

  const isActive = (page) => {
    if (page === "chat") return location.pathname.startsWith("/chat");
    if (page === "analytics") return location.pathname.startsWith("/analytics");
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

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Мобильная верхняя панель */}
      {isMobile && (
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img className="logo" src={LOGO} alt="PANDATUR CRM" />
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
              {surname} {name}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Select
              value={selectedLanguage}
              onChange={setLanguage}
              data={LANGUAGE_OPTIONS}
              size="xs"
              w={80}
              styles={{
                input: {
                  backgroundColor: "transparent",
                  color: "white",
                  border: "1px solid transparent",
                  fontSize: "12px"
                },
                dropdown: {
                  backgroundColor: "white",
                  color: "black",
                },
              }}
            />
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title={getLanguageByKey("Log Out")}
            >
              <FaSignOutAlt size={14} />
            </button>
            <Burger
              opened={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              color="white"
              size="sm"
              className="burger"
            />
          </div>
        </div>
      )}

      {/* Оверлей для мобильного меню */}
      {isMobile && mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <BaseSideBar 
        collapsed={isMobile ? false : isCollapsed} 
        backgroundColor="#1f2937"
        className={isMobile && mobileMenuOpen ? 'mobile-open' : ''}
      >
        <Menu>
          {/* Информация о пользователе в мобильном меню */}
          {isMobile && (
            <>
              <MenuItem>
                {surname} {name} ({userId})
              </MenuItem>
              <Divider />
            </>
          )}
          
          {!isMobile && (
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
          )}

          {hasStrictPermission(userRoles, "USERS", "VIEW") && (
            <MenuItem
              active={isActive("users")}
              icon={<FaUsers />}
              component={<Link to="/users" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Users")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "DASHBOARD", "VIEW") && (
            <MenuItem
              active={isActive("dashboard")}
              icon={<FaChartPie />}
              component={<Link to="/dashboard" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Dashboard")}
            </MenuItem>
          )}

          <Can permission={{ module: "chat", action: "view" }} skipContextCheck>
            <MenuItem
              active={isActive("leads")}
              icon={<FaClipboardList />}
              component={<Link to="/leads" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Leads")} {currentGroupTitle && `(${currentGroupTitle})`}
            </MenuItem>
          </Can>

          <Can permission={{ module: "chat", action: "view" }} skipContextCheck>
            <MenuItem
              suffix={unreadCount > 0 && <Badge bg="red">{unreadCount}</Badge>}
              active={isActive("chat")}
              icon={<FaComments />}
              component={<Link to="/chat" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Chat")}
            </MenuItem>
          </Can>

          {hasRouteAccess(convertRolesToMatrix(safeParseJson(userRoles)), "TASK", "VIEW") && (
            <MenuItem
              active={isActive("tasks")}
              icon={<FaTasks />}
              component={<Link to="/tasks" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Taskuri")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "SCHEDULES", "VIEW") && (
            <MenuItem
              active={isActive("schedules")}
              icon={<FaCalendar />}
              component={<Link to="/schedules" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("schedules")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "ANALYTICS", "VIEW") && (
            <MenuItem
              active={isActive("analytics")}
              icon={<FaChartBar />}
              component={<Link to="/analytics" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Analytics")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "LOGS", "VIEW") && (
            <MenuItem
              active={isActive("logs")}
              icon={<FaHistory />}
              component={<Link to="/logs" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("logs")}
            </MenuItem>
          )}

          {!isMobile && (
            <MenuItem>
              {isCollapsed ? (
                <div
                  style={{ textAlign: "center", fontSize: "20px", cursor: "pointer" }}
                  onClick={() => {
                    const nextLanguage = selectedLanguage === "RO" ? "RU" : selectedLanguage === "RU" ? "EN" : "RO";
                    setLanguage(nextLanguage);
                  }}
                  title={selectedLanguage}
                >
                  {LANGUAGES[selectedLanguage].icon}
                </div>
              ) : (
                <Select
                  value={selectedLanguage}
                  onChange={setLanguage}
                  data={LANGUAGE_OPTIONS}
                  styles={{
                    input: {
                      backgroundColor: "transparent",
                      color: "white",
                      border: "1px solid transparent",
                    },
                    dropdown: {
                      backgroundColor: "white",
                      color: "black",
                    },
                  }}
                />
              )}
            </MenuItem>
          )}
        </Menu>

        <Menu>
          {/* Информация о пользователе на десктопе */}
          {!isMobile && (
            <>
              <MenuItem>
                {surname} {name} ({userId})
              </MenuItem>
              <Divider />
              <MenuItem icon={<FaSignOutAlt />} onClick={logout}>
                {getLanguageByKey("Log Out")}
              </MenuItem>
            </>
          )}
          
          {/* Кнопка logout в мобильном меню */}
          {isMobile && (
            <MenuItem icon={<FaSignOutAlt />} onClick={logout}>
              {getLanguageByKey("Log Out")}
            </MenuItem>
          )}
        </Menu>
      </BaseSideBar>

      {loading && <LoadingOverlay />}
    </>
  );
};
