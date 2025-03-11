import React, { useEffect, Suspense } from "react"
import "./App.css"
import { UserProvider } from "./UserContext"
import Cookies from "js-cookie"
import { AppProvider } from "./AppContext"
import { SnackbarProvider } from "notistack"
import "./App.css"
import "./reset.css"
import { publicRoutes } from "./routes"
import { Layout } from "./Layout"
import { useNavigate, useLocation } from "react-router-dom"
import { PrivateRoutes, PublicRoutes } from "./AppRoutes"
import { Session } from "./Session"
import { SpinnerRightBottom } from "./Components/SpinnerRightBottom"

const JWT_TOKEN = Cookies.get("jwt")

function App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const publicPaths = publicRoutes.filter(({ isPublic }) => isPublic)

  useEffect(() => {
    if (!JWT_TOKEN) {
      navigate(publicPaths.includes(pathname) ? pathname : "/auth")
    }
  }, [])

  return (
    <Suspense fallback={<SpinnerRightBottom />}>
      <SnackbarProvider
        autoHideDuration={5000}
        maxSnack={5}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <UserProvider>
          {JWT_TOKEN ? (
            <>
              <Session />
              <AppProvider>
                <Layout>
                  <PrivateRoutes />
                </Layout>
              </AppProvider>
            </>
          ) : (
            <PublicRoutes />
          )}
        </UserProvider>
      </SnackbarProvider>
    </Suspense>
  )
}

export default App
