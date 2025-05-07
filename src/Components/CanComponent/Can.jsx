import { hasPermission } from "@/utils/permissions";
import { useUser } from "@/hooks/useUser";

const Can = ({ permission, context = {}, children }) => {
    const { user } = useUser();
    const roles = user?.roles || {};

    if (!hasPermission(roles, permission, context)) return null;

    return <>{children}</>;
};

export default Can;
