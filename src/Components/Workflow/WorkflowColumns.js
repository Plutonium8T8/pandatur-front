import { Flex } from "@mantine/core";
import { useRef, useEffect } from "react";
import { workflowOptions } from "../../FormOptions";
import { WorkflowColumn } from "./components";
import { useGetTechniciansList, useApp } from "../../hooks";

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  selectedWorkflow,
  fetchTickets,
}) => {
  const { technicians } = useGetTechniciansList();
  const { isCollapsed } = useApp();

  const wrapperColumnRef = useRef(null);
  const isScrollRight = useRef(false);

  const leftSpace = isCollapsed ? 79 : 249;

  useEffect(() => {
    wrapperColumnRef.current.addEventListener("mouseleave", () => {
      isScrollRight.current = false;
    });

    wrapperColumnRef.current.addEventListener("mousemove", (e) => {
      if (!isScrollRight.current) return;
      e.preventDefault();
      wrapperColumnRef.current.scrollLeft = e.pageX - leftSpace;
    });

    wrapperColumnRef.current.addEventListener("mouseup", () => {
      isScrollRight.current = false;
    });

    wrapperColumnRef.current.addEventListener("mousedown", (e) => {
      isScrollRight.current = true;
    });
  }, []);

  return (
    <Flex
      ref={wrapperColumnRef}
      gap="xs"
      w="100%"
      h="100%"
      className="overflow-x-scroll"
    >
      {workflowOptions
        .filter((workflow) => selectedWorkflow.includes(workflow))
        .map((workflow) => (
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
