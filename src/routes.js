import {
  Logs,
  Leads,
  TaskPage,
  Schedules,
  Users,
  Login,
  Chat,
  Dashboard,
  TermsAndConditions,
} from "@pages";
import { hasStrictPermission, hasRouteAccess } from "./Components/utils/permissions";
import { convertRolesToMatrix, safeParseJson } from "./Components/UsersComponent/rolesUtils";

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

  const matrix = convertRolesToMatrix(safeParseJson(userRoles || []));

  if (hasStrictPermission(userRoles, "DASHBOARD", "VIEW")) {
    routes.push({ path: "/dashboard", component: Dashboard });
  }

  if (hasRouteAccess(matrix, "LEADS", "VIEW")) {
    routes.push({ path: "/leads/:ticketId?", component: Leads });
  }

  if (hasRouteAccess(matrix, "chat", "view")) {
    routes.push({ path: "/chat/:ticketId?", component: Chat });
  }

  if (hasStrictPermission(userRoles, "USERS", "VIEW")) {
    routes.push({ path: "/users", component: Users });
  }

  if (hasRouteAccess(matrix, "TASK", "VIEW")) {
    routes.push({ path: "/tasks/:ticketId?", component: TaskPage });
  }

  if (hasStrictPermission(userRoles, "SCHEDULES", "VIEW")) {
    routes.push({ path: "/schedules", component: Schedules });
  }

  if (hasStrictPermission(userRoles, "LOGS", "VIEW")) {
    routes.push({ path: "/logs", component: Logs });
  }

  routes.push({ path: "/terms-and-conditions", component: TermsAndConditions });

  return routes;
};
