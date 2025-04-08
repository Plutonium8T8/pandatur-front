import Dashboard from "./Components/DashboardComponent/Dashboard";
import Leads from "./Components/LeadsComponent/LeadsComponent";
import ChatComponent from "./Components/ChatComponent/ChatComponent";
import LoginForm from "./Components/LoginComponent/LoginForm";
import UsersComponent from "./Components/UsersComponent/UsersComponent";
import { NoAccess } from "./Components/NoAccess";
import TaskPage from "./Components/Task/Page/TaskComponent";
import Schedules from "./Components/Schedules/Schedules";
import { Test } from "./Components/Test";
import { Logs } from "./pages";

export const publicRoutes = [
  {
    path: "/auth",
    component: LoginForm,
  },
];

export const privateRoutes = (isAllowRole) => [
  {
    path: "/dashboard",
    component: Dashboard,
  },
  {
    path: "/leads",
    component: Leads,
  },
  {
    path: "/chat/:ticketId?",
    component: ChatComponent,
  },
  {
    path: "/users",
    component: isAllowRole ? UsersComponent : NoAccess,
  },
  {
    path: "/leads/:ticketId?",
    component: Leads,
  },
  {
    path: "/tasks",
    component: TaskPage,
  },
  {
    path: "/schedules",
    component: Schedules,
  },
  {
    path: "/logs",
    component: Logs,
  },
  {
    path: "/test",
    component: Test,
  },
];
