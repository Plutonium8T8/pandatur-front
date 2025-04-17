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
import { FaChevronDown, FaChevronUp, FaPlus } from "react-icons/fa6";
import { translations } from "../utils/translations";
import { api } from "../../api";
import { TypeTask } from "./OptionsTaskType";
import { formatDate, parseDate } from "../utils/date";
import DateQuickInput from "./DateQuickPicker";
import { useGetTechniciansList, useUser } from "../../hooks";
import IconSelect from "../IconSelect/IconSelect";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [listCollapsed, setListCollapsed] = useState(true);
  const [taskEdits, setTaskEdits] = useState({});
  const [creatingTask, setCreatingTask] = useState(false);
  const { technicians: users } = useGetTechniciansList();
  const { userId } = useUser();

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
          created_by: t.created_by?.toString() || "",
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
    } catch (error) {
      console.error("Error updating task", error);
    }
  };

  const handleStartCreatingTask = () => {
    setCreatingTask(true);
    setTaskEdits((prev) => ({
      ...prev,
      new: {
        task_type: "",
        scheduled_time: null,
        created_for: "",
        created_by: userId?.toString() || "",
        description: "",
      },
    }));
  };

  const handleCreateTask = async () => {
    const newTask = taskEdits["new"];
    if (!newTask?.task_type || !newTask?.created_for || !newTask?.scheduled_time || !newTask?.created_by) return;

    try {
      await api.task.create({
        ...newTask,
        scheduled_time: formatDate(newTask.scheduled_time),
        ticket_id: ticketId,
        priority: "",
        status_task: "",
      });
      setCreatingTask(false);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task", error);
    }
  };

  const getTaskIcon = (type) => {
    const match = TypeTask.find((t) => t.name === type);
    return match?.icon || null;
  };

  const renderTaskForm = (id, isNew = false) => (
    <Card withBorder radius="md" shadow="xs" p="sm" key={id}>
      {!isNew && (
        <Box
          onClick={() => setExpandedCard(expandedCard === id ? null : id)}
          style={{ cursor: "pointer" }}
        >
          <Group justify="space-between" align="center">
            <Group gap="xs">
              {getTaskIcon(taskEdits[id]?.task_type)}
              <Text fw={500}>{taskEdits[id]?.task_type}</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                {formatDate(taskEdits[id]?.scheduled_time, "DD.MM.YYYY")}{" "}
                {tasks.find((t) => t.id === id)?.created_for_full_name}
              </Text>
              {expandedCard === id ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </Group>
          </Group>
        </Box>
      )}

      <Collapse in={isNew || expandedCard === id}>
        <Divider my="sm" />
        <TextInput
          label={translations["Descriere task"][language]}
          placeholder={translations["AddResult"][language]}
          value={taskEdits[id]?.description || ""}
          onChange={(e) => updateTaskField(id, "description", e.currentTarget.value)}
          mb="xs"
        />
        <Group gap="xs" align="end">
          <IconSelect
            options={TypeTask}
            value={taskEdits[id]?.task_type}
            onChange={(value) => updateTaskField(id, "task_type", value)}
            label={translations["Alege tip task"][language]}
          />
          <DateQuickInput
            value={taskEdits[id]?.scheduled_time}
            onChange={(value) => updateTaskField(id, "scheduled_time", value)}
          />
          <Select
            data={users.map((u) => ({ label: u.label, value: u.value }))}
            value={taskEdits[id]?.created_by}
            onChange={(value) => updateTaskField(id, "created_by", value)}
            w={180}
            label={translations["Autor"][language]}
          />
          <Select
            data={users.map((u) => ({ label: u.label, value: u.value }))}
            value={taskEdits[id]?.created_for}
            onChange={(value) => updateTaskField(id, "created_for", value)}
            w={180}
            label={translations["Responsabil"][language]}
          />
          {isNew ? (
            <>
              <Button size="xs" onClick={handleCreateTask} variant="filled">
                {translations["Adaugă task"]?.[language] || "Adaugă"}
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setCreatingTask(false)}
              >
                {translations["Anulare"]?.[language] || "Cancel"}
              </Button>
            </>
          ) : (
            <Button size="xs" onClick={() => handleUpdateTask(id)} variant="light">
              {translations["Save"]?.[language] || "Save"}
            </Button>
          )}
        </Group>
      </Collapse>
    </Card>
  );

  return (
    <Box pos="relative" p="xs" w="100%">
      <Paper shadow="xs" radius="md" withBorder p="xs">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <Text fw={600}>{translations["Tasks"][language]}</Text>
            <Badge size="sm" color="green">
              {tasks.length}
            </Badge>
          </Group>
          <ActionIcon variant="light" onClick={() => setListCollapsed((prev) => !prev)}>
            {listCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
          </ActionIcon>
        </Group>

        <Collapse in={!listCollapsed}>
          <Stack spacing="xs">
            {tasks.map((task) => renderTaskForm(task.id))}
            {creatingTask
              ? renderTaskForm("new", true)
              : (
                <Button
                  leftSection={<FaPlus size={12} />}
                  variant="light"
                  size="xs"
                  onClick={handleStartCreatingTask}
                >
                  {translations["New Task"]?.[language] || "New Task"}
                </Button>
              )}
          </Stack>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
