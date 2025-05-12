import { hasPermission } from "../utils/permissions";
import { useUser } from "../../hooks";
import { convertRolesToMatrix, safeParseJson } from "../UsersComponent/rolesUtils";
import { useSameTeamChecker } from "../utils/useSameTeamChecker";

const Can = ({ permission, context = {}, children, skipContextCheck = false }) => {
    const { user } = useUser();

    const rawRoles = safeParseJson(user?.roles || "[]");
    const matrix = convertRolesToMatrix(rawRoles);
    const currentUserId = String(user?.id || "");
    const responsibleId = context?.responsibleId ? String(context.responsibleId) : null;

    const isSameTeam = useSameTeamChecker(responsibleId);

    const extendedContext = {
        ...(context || {}),
        ...(currentUserId && { currentUserId }),
        ...(responsibleId && { responsibleId }),
        ...(responsibleId && { isSameTeam }),
    };

    const isAllowed = hasPermission(matrix, permission, extendedContext, { skipContextCheck });

    console.log("🔐 CAN CHECK:");
    console.log("→ Permission:", permission);
    console.log("→ Context:", extendedContext);
    console.log("→ Matrix:", matrix);
    console.log("→ Result:", isAllowed);

    if (typeof children === "function") {
        return children(isAllowed);
    }

    if (!isAllowed) return null;

    return <>{children}</>;
};

export default Can;
