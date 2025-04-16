import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TaskComponent from "../TaskComponent";
import SingleChat from "../../ChatComponent/SingleChat";
import { MantineModal } from "../../MantineModal";

const TaskPage = () => {
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
                height="calc(100% - 60px)"
            >
                <SingleChat ticketId={ticketId} onClose={handleCloseModal} />
            </MantineModal>
        </>
    );
};

export default TaskPage;
