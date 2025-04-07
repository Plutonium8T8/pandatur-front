import { useState } from "react";
import { SideBar } from "../../Components/SideBar";
import UserPage from "../../Components/UserPage/UserPage";
import NotificationModal from "../../Components/SlideInComponent/NotificationModal";
import { useApp } from "../../hooks";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAccountComponentOpen, setIsAccountComponentOpen] = useState(false);
  const { isCollapsed } = useApp();

  return (
    <div className="app-container">
      <SideBar
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenAccount={() => setIsAccountComponentOpen(true)}
      />
      <div
        style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
        className="page-content"
      >
        {children}
      </div>
      <UserPage
        isOpen={isAccountComponentOpen}
        onClose={() => setIsAccountComponentOpen(false)}
      />
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </div>
  );
};
