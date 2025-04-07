import { useState } from "react";
import { SideBar } from "../../Components/SideBar";
import UserPage from "../../Components/UserPage/UserPage";
import NotificationModal from "../../Components/SlideInComponent/NotificationModal";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAccountComponentOpen, setIsAccountComponentOpen] = useState(false);

  return (
    <div className="app-container">
      <SideBar
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenAccount={() => setIsAccountComponentOpen(true)}
      />
      <div className="page-content">{children}</div>
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
