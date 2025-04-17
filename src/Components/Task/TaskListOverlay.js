import { useState, useEffect } from "react";
import {
  Paper,
  Text,
  Badge,
  Box,
  Group,
  Stack,
  Card,
  Divider,
  Collapse,
  TextInput,
  Button,
  Select,
  ActionIcon,
} from "@mantine/core";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { translations } from "../utils/translations";
import { api } from "../../api";
import dayjs from "dayjs";
import { TypeTask } from "./OptionsTaskType";
import { formatDate, parseDate } from "../utils/date";
import DateQuickInput from "./DateQuickPicker";
import { useGetTechniciansList } from "../../hooks";
import IconSelect from "../IconSelect/IconSelect";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [listCollapsed, setListCollapsed] = useState(true);
  const [taskEdits, setTaskEdits] = useState({});
  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const { technicians: users } = useGetTechniciansList();

  const fetchTasks = async () => {
    try {
      if (!ticketId) return setTasks([]);
      const res = await api.task.getTaskByTicket(ticketId);
      const taskArray = Array.isArray(res?.data) ? res.data : res;
      setTasks(taskArray);

      const edits = {};
      taskArray.forEach((t) => {
        edits[t.id] = {
          task_type: t.task_type,
          description: t.description || "",
          scheduled_time: parseDate(t.scheduled_time),
          created_for: t.created_for?.toString(),
        };
      });
      setTaskEdits(edits);
    } catch (error) {
      console.error("Error loading tasks", error);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [ticketId]);

  const updateTaskField = (id, field, value) => {
    setTaskEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleUpdateTask = async (taskId) => {
    const changes = taskEdits[taskId];
    if (!changes) return;
    try {
      await api.task.update({
        id: taskId,
        ...changes,
        scheduled_time: formatDate(changes.scheduled_time),
      });
      fetchTasks();
      setEditingDeadlineId(null);
    } catch (error) {
      console.error("Error updating task", error);
    }
  };

  const getTaskIcon = (type) => {
    const match = TypeTask.find((t) => t.name === type);
    return match?.icon || null;
  };

  if (tasks.length === 0) return null;

  return (
    <Box pos="relative" p="xs" w="100%">
      <Paper shadow="xs" radius="md" withBorder p="md">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <Text fw={600}>{translations["Tasks"][language]}</Text>
            <Badge size="sm" color="blue">
              {tasks.length}
            </Badge>
          </Group>
          <ActionIcon variant="light" onClick={() => setListCollapsed((prev) => !prev)}>
            {listCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
          </ActionIcon>
        </Group>

        <Collapse in={!listCollapsed}>
          <Stack spacing="xs">
            {tasks.map((task) => {
              const isOpen = expandedCard === task.id;

              return (
                <Card key={task.id} withBorder radius="md" shadow="xs" p="sm">
                  <Box
                    onClick={() => setExpandedCard(isOpen ? null : task.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        {getTaskIcon(task.task_type)}
                        <Text fw={500}>{task.task_type}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          {dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss").format("DD.MM.YYYY")} •{" "}
                          {task.created_for_full_name}
                        </Text>
                        {isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                      </Group>
                    </Group>
                  </Box>

                  <Collapse in={isOpen}>
                    <Divider my="sm" />

                    <TextInput
                      placeholder={translations["Adaugă rezultat"]?.[language] || "Add result"}
                      value={taskEdits[task.id]?.description || ""}
                      onChange={(e) =>
                        updateTaskField(task.id, "description", e.currentTarget.value)
                      }
                      mb="xs"
                      label={translations["Descriere task"][language]}
                    />

                    <Group gap="xs" align="end">
                      <IconSelect
                        options={TypeTask}
                        value={taskEdits[task.id]?.task_type}
                        onChange={(value) => updateTaskField(task.id, "task_type", value)}
                        label={translations["Alege tip task"][language]}
                        placeholder={translations["Alege tip task"][language]}
                      />

                      <DateQuickInput
                        value={taskEdits[task.id]?.scheduled_time}
                        onChange={(value) =>
                          updateTaskField(task.id, "scheduled_time", value)
                        }
                      />

                      <Select
                        data={users.map((u) => ({ label: u.label, value: u.value }))}
                        value={taskEdits[task.id]?.created_for}
                        onChange={(value) => updateTaskField(task.id, "created_for", value)}
                        w={180}
                        placeholder={translations["Responsabil"][language]}
                        label={translations["Responsabil"][language]}
                      />

                      <Button
                        variant="light"
                        size="s"
                        onClick={() => handleUpdateTask(task.id)}
                      >
                        {translations["Save"]?.[language] || "Save"}
                      </Button>
                    </Group>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
