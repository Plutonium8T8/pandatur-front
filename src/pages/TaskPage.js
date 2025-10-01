import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Modal } from "@mantine/core";
import TaskComponent from "../Components/Task/TaskComponent";
import SingleChat from "@components/ChatComponent/SingleChat";
import { useGetTechniciansList } from "../hooks";

export const TaskPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const { technicians } = useGetTechniciansList();

  const handleCloseModal = () => navigate("/tasks");

  return (
    <>
      <TaskComponent tasks={tasks} setTasks={setTasks} />
      <Modal
        opened={!!ticketId}
        onClose={handleCloseModal}
        size="100%"
        fullScreen
        withCloseButton={false}
        styles={{
          content: {
            height: "100vh",
            maxHeight: "100vh",
          },
          body: {
            height: "100%",
            padding: 0,
          },
        }}
      >
        <SingleChat ticketId={ticketId} onClose={handleCloseModal} tasks={tasks} technicians={technicians} />
      </Modal>
    </>
  );
};
