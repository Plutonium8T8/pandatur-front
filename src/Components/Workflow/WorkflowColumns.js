import { Flex } from "@mantine/core";
import { WorkflowColumn } from "./components";
import { useGetTechniciansList } from "../../hooks";

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  selectedWorkflow,
  fetchTickets,
}) => {
  const { technicians } = useGetTechniciansList();

  return (
    <Flex gap="xs" w="100%" h="100%" className="overflow-x-scroll" px="20px">
      {selectedWorkflow?.map((workflow) => (
        <WorkflowColumn
          key={workflow}
          workflow={workflow}
          tickets={tickets}
          searchTerm={searchTerm}
          onEditTicket={onEditTicket}
          technicianList={technicians}
          fetchTickets={fetchTickets}
        />
      ))}
    </Flex>
  );
};
