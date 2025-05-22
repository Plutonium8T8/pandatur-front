import { Flex } from "@mantine/core";
import { WorkflowColumn } from "./components";
import { useGetTechniciansList, useApp } from "../../hooks";

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  fetchTickets,
}) => {
  const { technicians } = useGetTechniciansList();
  const { workflowOptions } = useApp();

  return (
    <Flex gap="xs" w="100%" h="100%" className="overflow-x-scroll" px="20px">
      {workflowOptions.map((workflow) => (
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
