import { useState, useEffect } from "react";
import { Drawer, Button } from "@mantine/core";
import TaskComponent from "./TaskComponent";
import { translations } from "../utils/translations";
import { api } from "../../api";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId, userId }) => {
  const [opened, setOpened] = useState(false);
  const [taskCount, setTaskCount] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTaskCount = async () => {
    try {
      if (ticketId) {
        const tasks = await api.task.getTaskByTicket(ticketId);
        setTaskCount(tasks.length);
      } else {
        setTaskCount(0);
      }
    } catch (error) {
      console.error(error);
      setTaskCount(0);
    }
  };

  useEffect(() => {
    fetchTaskCount();
  }, [ticketId, refreshKey]);

  const handleTasksUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <Button
        fullWidth
        color={taskCount > 0 ? "blue" : "gray"}
        onClick={() => setOpened(true)}
      >
        {taskCount > 0
          ? `${translations["Tasks"][language]}: ${taskCount}`
          : translations["noTasksCreate"][language]}
      </Button>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        padding="md"
        size="lg"
      >
        <TaskComponent
          selectTicketId={ticketId}
          userId={userId}
          onTasksUpdated={handleTasksUpdated}
        />
      </Drawer>
    </>
  );
};

export default TaskListOverlay;
