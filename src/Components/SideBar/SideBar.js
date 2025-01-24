import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAppContext } from '../../AppContext'; // Подключаем AppContext
import './SideBar.css';
<<<<<<< HEAD
import {
    FaUser,
    FaChartBar,
    FaTasks,
    FaComments,
    FaBell,
    FaClipboardList,
    FaSignOutAlt,
    FaUserSecret
} from 'react-icons/fa';
=======
import { useUnreadMessages } from '../../Unread';
import { FaUser, FaChartBar, FaTasks, FaComments, FaBell, FaClipboardList, FaSignOutAlt, FaUserSecret } from 'react-icons/fa';
import LanguageToggle from './LanguageToggle';
import { translations } from "../utils/translations";
>>>>>>> Restyle4

const CustomSidebar = ({ onOpenNotifications, onOpenTasks, onOpenAccount }) => {
    const location = useLocation();
    const navigate = useNavigate();
<<<<<<< HEAD
    const { unreadCount } = useAppContext(); // Получаем unreadCount из AppContext
=======
    const { unreadCount } = useUnreadMessages();

    const language = localStorage.getItem('language') || 'RO';
>>>>>>> Restyle4

    const isActive = (page) => {
        if (page === 'chat') {
            return location.pathname.startsWith('/chat');
        }
        return location.pathname === `/${page}`;
    };

    const handleNavigate = (page) => {
        navigate(`/${page}`);
    };

    const handleLogOut = () => {
        Cookies.remove('jwt');
        window.location.reload();
    };

    return (
        <div className="container-side-bar">
            <div className="menu-side-bar">
                <div className="container-item-menu">
                    <div
                        className={`menu-item ${isActive('account') ? 'active' : ''}`}
                        onClick={onOpenAccount}
                    >
                        <FaUser size={24} />
                        <span>{translations['Account'][language]}</span>
                    </div>
                    <div
                        className={`menu-item ${isActive('dashboard') ? 'active' : ''}`}
                        onClick={() => handleNavigate('dashboard')}
                    >
                        <FaChartBar size={24} />
                        <span>{translations['Dashboard'][language]}</span>
                    </div>
                    <div
                        className={`menu-item ${isActive('leads') ? 'active' : ''}`}
                        onClick={() => handleNavigate('leads')}
                    >
                        <FaClipboardList size={24} />
                        <span>{translations['Leaduri'][language]}</span>
                    </div>
                    <div
                        className={`menu-item ${isActive('chat') ? 'active' : ''}`}
                        onClick={() => handleNavigate('chat')}
                    >
                        <FaComments size={24} />
<<<<<<< HEAD
                        <span>Chat</span>
=======
                        <span>{translations['Chat'][language]}</span>
>>>>>>> Restyle4
                        {unreadCount > 0 && (
                            <span className="unread-indicator">{unreadCount}</span>
                        )}
                    </div>
                    <div
                        className={`menu-item ${isActive('notifications') ? 'active' : ''}`}
                        onClick={onOpenNotifications}
                    >
                        <FaBell size={24} />
                        <span>{translations['Notificări'][language][1]}</span>
                    </div>
                    <div
                        className={`menu-item ${isActive('tasks') ? 'active' : ''}`}
                        onClick={onOpenTasks}
                    >
                        <FaTasks size={24} />
                        <span>{translations['Taskuri'][language]}</span>
                    </div>
                    <div
                        className={`menu-item ${isActive('admin-panel') ? 'active' : ''}`}
                        onClick={() => handleNavigate('admin-panel')}
                    >
                        <FaUserSecret size={24} />
                        <span>{translations['Admin'][language]}</span>
                    </div>
                    <div
                        className={`menu-item `}
                    >
                        <LanguageToggle/>
                    </div>
                    
                </div>
            </div>
            <div className="container-log-out">
                <div className="menu-item" onClick={handleLogOut}>
                    <FaSignOutAlt size={24} />
                    <span>{translations['Log Out'][language]}</span>
                </div>
            </div>
        </div>
    );
};

export default CustomSidebar;