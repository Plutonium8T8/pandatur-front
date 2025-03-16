import LoginForm from "./Components/LoginComponent/LoginForm"
import { AdminPanel, Chat, Leads, Dashboard } from "./features"
import { NoAccess } from "./Components/NoAccess"
import TaskPage from "./Components/TaskComponent/TaskPage"

export const publicRoutes = [
  {
    path: "/auth",
    component: LoginForm
  }
]

export const privateRoutes = (isAllowRole) => [
  {
    path: "/dashboard",
    component: Dashboard
  },
  {
    path: "/leads",
    component: Leads
  },
  {
    path: "/chat/:ticketId?",
    component: Chat
  },
  {
    path: "/admin-panel",
    component: isAllowRole ? AdminPanel : NoAccess
  },
  {
    path: "/leads/:ticketId?",
    component: Leads
  },
  {
    path: "/tasks",
    component: TaskPage
  }
]
