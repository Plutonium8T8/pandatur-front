import { Routes, Route } from "react-router-dom";
import { useUser } from "@hooks";
import { privateRoutes, publicRoutes } from "./routes";

const ADMIN_ROLE = "ROLE_ADMIN";

export const PublicRoutes = () => {
  return (
    <Routes>
      {publicRoutes.map(({ path, component: Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
    </Routes>
  );
};

export const PrivateRoutes = () => {
  const { hasRole } = useUser();

  return (
    <Routes>
      {privateRoutes(hasRole(ADMIN_ROLE)).map(
        ({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ),
      )}
    </Routes>
  );
};
