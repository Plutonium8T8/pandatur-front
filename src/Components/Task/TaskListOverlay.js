import { useState, useEffect } from "react";
import { Paper, Text, Badge, Box, Group, Stack } from "@mantine/core";
import { translations } from "../utils/translations";
import { api } from "../../api";
import dayjs from "dayjs";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId, userId }) => {
  const [tasks, setTasks] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTasks = async () => {
    try {
      if (!ticketId) {
        setTasks([]);
        return;
      }

      const res = await api.task.getTaskByTicket(ticketId);
      const taskArray = Array.isArray(res?.data) ? res.data : res;
      setTasks(taskArray);
    } catch (error) {
      console.error("Ошибка загрузки задач:", error);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [ticketId, refreshKey]);

  if (tasks.length === 0) return null;

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
          <Badge color="blue">{tasks.length}</Badge>
        </Box>

        <Stack spacing="sm">
          {tasks.map((task) => (
            <Box key={task.id} style={{ border: "1px solid #2c2e33", borderRadius: 8, padding: 8 }}>
              <Group justify="space-between" align="center">
                <Text fw={500}>{task.task_type}</Text>
                <Text size="sm" c="dimmed">
                  {task.created_for_full_name}
                </Text>
              </Group>
              <Text size="sm" mt={4}>
                {dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss").format("DD.MM.YYYY HH:mm")}
              </Text>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
