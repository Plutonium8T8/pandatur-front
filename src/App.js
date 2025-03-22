import React, { useEffect } from "react"
import { UserProvider, AppProvider } from "./contexts"
import Cookies from "js-cookie"
import { SnackbarProvider } from "notistack"
import { publicRoutes } from "./routes"
import { AppLayout } from "./layout"
import { useNavigate, useLocation } from "react-router-dom"
import { PrivateRoutes, PublicRoutes } from "./AppRoutes"
import { Session } from "./Session"
import "./App.css"
import { MantineProvider } from "./MantineProvider"
import { ModalsProvider } from "@mantine/modals"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
// FIXME: Server sends date in an unsupported format (DD-MM-YYYY HH:mm:ss)
import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"

dayjs.extend(customParseFormat)

const JWT_TOKEN = Cookies.get("jwt")

function App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const publicPaths = publicRoutes.map(({ path }) => path)

  useEffect(() => {
    if (!JWT_TOKEN) {
      navigate(publicPaths.includes(pathname) ? pathname : "/auth")
    }
  }, [])

  return (
    <MantineProvider>
      <ModalsProvider>
        <SnackbarProvider
          autoHideDuration={5000}
          maxSnack={5}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {JWT_TOKEN ? (
            <UserProvider>
              <Session>
                <AppProvider>
                  <AppLayout>
                    <PrivateRoutes />
                  </AppLayout>
                </AppProvider>
              </Session>
            </UserProvider>
          ) : (
            <PublicRoutes />
          )}
        </SnackbarProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}

export default App
