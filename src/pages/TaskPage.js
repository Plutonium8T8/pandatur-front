import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TaskComponent from "@components/Task/TaskComponent";
import SingleChat from "@components/ChatComponent/SingleChat";
import { MantineModal } from "@components";

export const TaskPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const handleCloseModal = () => navigate("/tasks");

  return (
    <>
      <TaskComponent />
      <MantineModal
        fullScreen
        open={!!ticketId}
        onClose={handleCloseModal}
        title={false}
        withCloseButton={false}
        style={{ padding: 0 }}
        height="100%"
      >
        <SingleChat id={ticketId} onClose={handleCloseModal} />
      </MantineModal>
    </>
  );
};
