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
  const isScrollRight = useRef({});

  const leftSpace = isCollapsed ? 79 : 249;

  useEffect(() => {
    wrapperColumnRef.current.addEventListener("mouseleave", () => {
      isScrollRight.current.isScrollRight = false;
    });

    wrapperColumnRef.current.addEventListener("mousemove", (e) => {
      if (!isScrollRight.current.isScrollRight) return;
      e.preventDefault();

      const x = e.pageX - wrapperColumnRef.current.scrollLeft;
      const walk = x - isScrollRight.current.startX;
      wrapperColumnRef.current.scrollLeft = walk;
    });

    wrapperColumnRef.current.addEventListener("mouseup", () => {
      isScrollRight.current.isScrollRight = false;
    });

    wrapperColumnRef.current.addEventListener("mousedown", (e) => {
      isScrollRight.current = {
        isScrollRight: true,
        startX: e.pageX - leftSpace,
        scrollLeft: wrapperColumnRef.current.scrollLeft,
      };
    });
  }, []);

  return (
    <Flex
      ref={wrapperColumnRef}
      gap="xs"
      w="100%"
      h="100%"
      className="overflow-x-scroll"
      style={{ cursor: "grab" }}
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
