import { hasPermission } from "../utils/permissions";
import { useUser } from "../../hooks";
import { convertRolesToMatrix, safeParseJson } from "../UsersComponent/rolesUtils";

const Can = ({ permission, context = {}, children }) => {
    const { user } = useUser();

    const rawRoles = safeParseJson(user?.roles || "[]");
    const matrix = convertRolesToMatrix(rawRoles);
    const currentUserId = String(user?.id || "");

    const isAllowed = hasPermission(matrix, permission, {
        ...context,
        currentUserId,
    });

    console.log("🔐 CAN CHECK:");
    console.log("Permission:", permission);
    console.log("Context:", { ...context, currentUserId });
    console.log("Matrix:", matrix);
    console.log("Result:", isAllowed);

    if (!isAllowed) return null;

    return <>{children}</>;
};

export default Can;
