import { useState, useEffect } from "react";
import { Paper, Text, Badge, Box } from "@mantine/core";
import TaskComponent from "./TaskComponent";
import { translations } from "../utils/translations";
import { api } from "../../api";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId, userId }) => {
  const [taskCount, setTaskCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasTasks, setHasTasks] = useState(false);

  const fetchTaskCount = async () => {
    try {
      if (ticketId) {
        const tasks = await api.task.getTaskByTicket(ticketId);
        setTaskCount(tasks.length);
        setHasTasks(tasks.length > 0);
      } else {
        setTaskCount(0);
        setHasTasks(false);
      }
    } catch (error) {
      console.error(error);
      setTaskCount(0);
      setHasTasks(false);
    }
  };

  useEffect(() => {
    fetchTaskCount();
  }, [ticketId, refreshKey]);

  if (!hasTasks) return null;

  return (
    <Box
      style={{
        position: "absolute",
        bottom: "70px",
        left: 0,
        right: 0,
        zIndex: 10,
        padding: "8px",
        pointerEvents: "auto",
      }}
    >
      <Paper shadow="sm" radius="md" p="md" withBorder>
        <Box mb="xs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text fw={600}>{translations["Tasks"][language]}</Text>
          <Badge color="blue">{taskCount}</Badge>
        </Box>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
