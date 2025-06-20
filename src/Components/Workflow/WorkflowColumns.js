import { Flex } from "@mantine/core";
import { useRef, useEffect } from "react";
import { WorkflowColumn } from "./components";
import { useGetTechniciansList, useApp } from "../../hooks";

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  fetchTickets,
  kanbanFilterActive
}) => {
  const { technicians } = useGetTechniciansList();
  const { workflowOptions, isCollapsed } = useApp();

  const wrapperRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  const excludedWorkflows = ["Realizat cu succes", "Închis și nerealizat", "Auxiliar"];
  const visibleWorkflows = kanbanFilterActive
    ? workflowOptions
    : workflowOptions.filter((w) => !excludedWorkflows.includes(w));

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleMouseDown = (e) => {
      dragRef.current = {
        isDragging: true,
        startX: e.pageX - el.offsetLeft,
        scrollLeft: el.scrollLeft,
      };
      document.body.style.userSelect = "none";
    };

    const handleMouseMove = (e) => {
      if (!dragRef.current.isDragging) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = x - dragRef.current.startX;
      el.scrollLeft = dragRef.current.scrollLeft - walk;
    };

    const stopDragging = () => {
      dragRef.current.isDragging = false;
      document.body.style.userSelect = "";
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseup", stopDragging);
    el.addEventListener("mouseleave", stopDragging);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseup", stopDragging);
      el.removeEventListener("mouseleave", stopDragging);
    };
  }, [isCollapsed]);

  return (
    <div
      ref={wrapperRef}
      style={{
        overflowX: "scroll",
        overflowY: "hidden",
        height: "100%",
        cursor: "grab",
        padding: "0 20px",
      }}
    >
      <Flex gap="xs" w="fit-content" h="100%">
        {visibleWorkflows.map((workflow) => (
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
    </div>
  );
};
