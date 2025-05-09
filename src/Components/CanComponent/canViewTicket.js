import { convertRolesToMatrix, safeParseJson } from "../UsersComponent/rolesUtils";
import { useUser } from "../../hooks";
import { useSameTeamChecker } from "../utils/useSameTeamChecker";

export const useTicketVisibilityChecker = () => {
  const { user, userId } = useUser();
  const matrix = convertRolesToMatrix(safeParseJson(user?.roles || []));
  const isSameTeam = useSameTeamChecker();
  const currentUserId = String(userId);

  return (ticket) => {
    const technicianId = String(ticket.technician_id);
    const level = matrix["CHAT_VIEW"];

    if (!level || level === "Denied") return false;
    if (level === "Allowed") return true;
    if (level === "IfResponsible") return technicianId === currentUserId;
    if (level === "Team") return technicianId === currentUserId || isSameTeam(technicianId);

    return false;
  };
};
