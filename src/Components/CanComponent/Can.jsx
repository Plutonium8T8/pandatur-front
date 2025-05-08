import { hasPermission } from "../utils/permissions";
import { useUser } from "../../hooks";
import { convertRolesToMatrix, safeParseJson } from "../UsersComponent/rolesUtils";
import { useSameTeamChecker } from "../utils/useSameTeamChecker";

const Can = ({ permission, context = {}, children }) => {
    const { user } = useUser();

    const rawRoles = safeParseJson(user?.roles || "[]");
    const matrix = convertRolesToMatrix(rawRoles);
    const currentUserId = String(user?.id || "");
    const responsibleId = String(context?.responsibleId || "");

    const isInSameTeam = useSameTeamChecker(responsibleId);

    const isAllowed = hasPermission(matrix, permission, {
        ...context,
        currentUserId,
        isInSameTeam,
    });

    console.log("🔐 CAN CHECK:");
    console.log("Permission:", permission);
    console.log("Context:", { ...context, currentUserId, isInSameTeam });
    console.log("Matrix:", matrix);
    console.log("Result:", isAllowed);

    if (!isAllowed) return null;

    return <>{children}</>;
};

export default Can;
