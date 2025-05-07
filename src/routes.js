import {
  Logs,
  Leads,
  TaskPage,
  Test,
  Schedules,
  Users,
  Login,
  Chat,
  Dashboard,
  TermsAndConditions,
} from "@pages";
import { hasPermission } from "./Components/utils/permissions";

export const privatePaths = [
  "dashboard",
  "leads",
  "chat",
  "users",
  "tasks",
  "schedules",
  "logs",
  "terms-and-conditions",
];

export const publicRoutes = [
  {
    path: "/auth",
    component: Login,
  },
  {
    path: "/terms-and-conditions",
    component: TermsAndConditions,
  },
];

export const privateRoutes = (userRoles) => {
  const routes = [];

  if (hasPermission(userRoles, "DASHBOARD", "VIEW")) {
    routes.push({ path: "/dashboard", component: Dashboard });
  }

  if (hasPermission(userRoles, "LEADS", "VIEW")) {
    routes.push({ path: "/leads/:ticketId?", component: Leads });
  }

  if (hasPermission(userRoles, "CHAT", "VIEW")) {
    routes.push({ path: "/chat/:ticketId?", component: Chat });
  }

  if (hasPermission(userRoles, "USERS", "VIEW")) {
    routes.push({ path: "/users", component: Users });
  }

  if (hasPermission(userRoles, "TASK", "VIEW")) {
    routes.push({ path: "/tasks/:ticketId?", component: TaskPage });
  }

  if (hasPermission(userRoles, "SCHEDULES", "VIEW")) {
    routes.push({ path: "/schedules", component: Schedules });
  }

  if (hasPermission(userRoles, "LOGS", "VIEW")) {
    routes.push({ path: "/logs", component: Logs });
  }

  routes.push({ path: "/test", component: Test });
  routes.push({ path: "/terms-and-conditions", component: TermsAndConditions });

  return routes;
};
