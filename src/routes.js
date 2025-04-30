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
    component: Chat,
  },
  {
    path: "/users",
    // component: isAllowRole ? UsersComponent : NoAccess
    component: Users,
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
  {
    path: "/terms-and-conditions",
    component: TermsAndConditions,
  },
];
