import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TaskComponent from "../Components/Task/TaskComponent";
import SingleChat from "@components/ChatComponent/SingleChat";
import { MantineModal } from "@components";
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
      <MantineModal
        fullScreen
        open={!!ticketId}
        onClose={handleCloseModal}
        title={false}
        withCloseButton={false}
        style={{ padding: 0 }}
        height="100%"
      >
        <SingleChat ticketId={ticketId} onClose={handleCloseModal} tasks={tasks} technicians={technicians} />
      </MantineModal>
    </>
  );
};
