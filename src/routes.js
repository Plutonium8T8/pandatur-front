import Dashboard from "./Components/DashboardComponent/Dashboard"
import Leads from "./Components/LeadsComponent/LeadsComponent"
import ChatComponent from "./Components/ChatComponent/ChatComponent"
import LoginForm from "./Components/LoginComponent/LoginForm"
import AdminPanel from "./Components/AdminPanelComponent/AdminPanel"
import { NoAccess } from "./Components/NoAccess"
import TaskPage from "./Components/Task/Page/TaskComponent"
import { Test } from "./Components/Test"

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
    component: ChatComponent
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
  },
  {
    path: "/test",
    component: Test
  }
]
