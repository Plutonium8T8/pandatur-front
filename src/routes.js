import Dashboard from "./Components/DashboardComponent/Dashboard";
import ChatComponent from "./Components/ChatComponent/ChatComponent";
import LoginForm from "./Components/LoginComponent/LoginForm";
import UsersComponent from "./Components/UsersComponent/UsersComponent";
import Schedules from "./Components/Schedules/Schedules";
import { Test } from "./Components/Test";
import { Logs, Leads, TaskPage } from "./pages";

export const privatePaths = [
  "dashboard",
  "leads",
  "chat",
  "users",
  "tasks",
  "schedules",
  "logs",
];

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
    // component: isAllowRole ? UsersComponent : NoAccess
    component: UsersComponent,
  },
  {
    path: "/leads/:ticketId?",
    component: Leads,
  },
  {
    path: "/tasks/:ticketId?",
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
