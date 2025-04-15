import { useState } from "react";
import { SideBar } from "../../Components/SideBar";
import UserPage from "../../Components/UserPage/UserPage";
import { useApp } from "../../hooks";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const [isAccountComponentOpen, setIsAccountComponentOpen] = useState(false);
  const { isCollapsed } = useApp();

  return (
    <div className="app-container">
      <SideBar onOpenAccount={() => setIsAccountComponentOpen(true)} />
      <div
        style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
        className="page-content"
      >
        {children}
      </div>
      {/* TODO: Please check if this modal is still relevant. If it's no longer used or needed, please remove it  */}
      <UserPage
        isOpen={isAccountComponentOpen}
        onClose={() => setIsAccountComponentOpen(false)}
      />
    </div>
  );
};
