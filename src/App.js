import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { ModalsProvider } from "@mantine/modals";
import { UserProvider, AppProvider } from "@contexts";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import { AppLayout } from "@layout";
import { PrivateRoutes, PublicRoutes } from "./AppRoutes";
import { Session } from "./Session";
import { MantineProvider } from "./MantineProvider";
import { publicRoutes } from "./routes";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./App.css";

dayjs.extend(customParseFormat);

const JWT_TOKEN = Cookies.get("jwt");

function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const publicPaths = publicRoutes.map(({ path }) => path);

  useEffect(() => {
    if (!JWT_TOKEN) {
      navigate(publicPaths.includes(pathname) ? pathname : "/auth");
    }
  }, []);

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
  );
}

export default App;
