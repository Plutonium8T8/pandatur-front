import { useState, useEffect, useContext } from "react";
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
import {
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaCheck,
  FaPencil,
} from "react-icons/fa6";
import { translations } from "../utils/translations";
import { api } from "../../api";
import { TypeTask } from "./OptionsTaskType";
import { formatDate, parseDate } from "../utils/date";
import DateQuickInput from "./DateQuickPicker";
import { useGetTechniciansList } from "../../hooks";
import IconSelect from "../IconSelect/IconSelect";
import { useConfirmPopup } from "../../hooks/useConfirmPopup";
import dayjs from "dayjs";
import { UserContext } from "../../contexts";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId, creatingTask, setCreatingTask }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [listCollapsed, setListCollapsed] = useState(true);
  const [taskEdits, setTaskEdits] = useState({});
  const [editMode, setEditMode] = useState({});
  const { technicians: users } = useGetTechniciansList();
  const { userId } = useContext(UserContext);

  const confirmDelete = useConfirmPopup({
    subTitle: translations["Confirmare ștergere"][language],
  });

  const fetchTasks = async () => {
    if (!ticketId) return setTasks([]);
    try {
      const res = await api.task.getTaskByTicket(ticketId);
      const taskArray = (Array.isArray(res?.data) ? res.data : res)
        .filter(t => t.ticket_id === ticketId && !t.status)
        .sort((a, b) =>
          dayjs(a.scheduled_time, "DD-MM-YYYY HH:mm:ss").valueOf() -
          dayjs(b.scheduled_time, "DD-MM-YYYY HH:mm:ss").valueOf()
        );
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

  useEffect(() => {
    if (creatingTask) {
      setListCollapsed(false);
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
    }
  }, [creatingTask, userId]);

  if (!creatingTask && tasks.length === 0) return null;

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
    await api.task.update({
      id: taskId,
      ...changes,
      scheduled_time: formatDate(changes.scheduled_time),
    });
    setEditMode((prev) => ({ ...prev, [taskId]: false }));
    fetchTasks();
  };

  const handleCreateTask = async () => {
    const newTask = taskEdits["new"];
    if (!newTask?.task_type || !newTask?.created_for || !newTask?.scheduled_time || !newTask?.created_by) return;

    await api.task.create({
      ...newTask,
      description: newTask.description || "",
      scheduled_time: formatDate(newTask.scheduled_time),
      ticket_id: ticketId,
      priority: "",
      status_task: "",
    });
    setCreatingTask(false);
    fetchTasks();
  };

  const handleDeleteTask = (id) => {
    confirmDelete(() =>
      api.task.delete({ id }).then(() => fetchTasks())
    );
  };

  const handleMarkDone = async (id) => {
    await api.task.update({ id, status: true });
    fetchTasks();
  };

  const getTaskIcon = (type) => {
    const match = TypeTask.find((t) => t.name === type);
    return match?.icon || null;
  };

  const renderTaskForm = (id, isNew = false) => {
    const isEditing = isNew || editMode[id];

    return (
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
                <Text
                  size="sm"
                  style={{
                    color: new Date(taskEdits[id]?.scheduled_time) < new Date() ? "red" : undefined,
                  }}
                >
                  {formatDate(taskEdits[id]?.scheduled_time, "DD.MM.YYYY")}{" "}
                  {tasks.find((t) => t.id === id)?.created_for_full_name}
                </Text>
                {expandedCard === id ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </Group>
            </Group>
          </Box>
        )}

        <Collapse in={isNew ? creatingTask : expandedCard === id}>
          <Divider my="sm" />

          <Group gap="xs" align="end">
            <IconSelect
              options={TypeTask}
              value={taskEdits[id]?.task_type}
              onChange={(value) => updateTaskField(id, "task_type", value)}
              label={translations["Alege tip task"][language]}
              disabled={!isEditing}
            />
            <DateQuickInput
              value={taskEdits[id]?.scheduled_time}
              onChange={(value) => updateTaskField(id, "scheduled_time", value)}
              disabled={!isEditing}
            />
            <Select
              data={users}
              value={taskEdits[id]?.created_by}
              onChange={(value) => updateTaskField(id, "created_by", value)}
              w={180}
              label={translations["Autor"][language]}
              placeholder={translations["Autor"][language]}
              disabled={!isEditing}
            />
            <Select
              data={users}
              value={taskEdits[id]?.created_for}
              onChange={(value) => updateTaskField(id, "created_for", value)}
              w={180}
              label={translations["Responsabil"][language]}
              disabled={!isEditing}
              placeholder={translations["Responsabil"][language]}
            />
          </Group>

          <TextInput
            label={translations["AddResult"][language]}
            placeholder={translations["AddResult"][language]}
            value={taskEdits[id]?.description || ""}
            onChange={(e) => updateTaskField(id, "description", e.currentTarget.value)}
            mb="xs"
            mt="xs"
          />

          <Group gap="xs" mt="xs">
            {isNew ? (
              <>
                <Button size="xs" onClick={handleCreateTask}>
                  {translations["Adaugă task"][language]}
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setCreatingTask(false)}
                >
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : isEditing ? (
              <>
                <Button size="xs" onClick={() => handleUpdateTask(id)} variant="filled">
                  {translations["Save"][language]}
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setEditMode((prev) => ({ ...prev, [id]: false }))}
                >
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="xs"
                  variant="filled"
                  onClick={() => handleMarkDone(id)}
                  leftSection={<FaCheck />}
                  disabled={!taskEdits[id]?.description?.trim()}
                >
                  {translations["Done"][language]}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setEditMode((prev) => ({ ...prev, [id]: true }))}
                  leftSection={<FaPencil />}
                >
                  {translations["Editare Task"][language]}
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => handleDeleteTask(id)}
                  leftSection={<FaTrash />}
                >
                  {translations["Șterge"][language]}
                </Button>
              </>
            )}
          </Group>
        </Collapse>
      </Card>
    );
  };

  return (
    <Box pos="relative" p="xs" w="100%">
      <Paper shadow="xs" radius="md" withBorder p="xs">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <Text fw={600}>{translations["Tasks"][language]}</Text>
            <Badge size="sm" color="green">{tasks.length}</Badge>
          </Group>
          <ActionIcon variant="light" onClick={() => setListCollapsed((p) => !p)}>
            {listCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
          </ActionIcon>
        </Group>

        <Collapse in={!listCollapsed}>
          <Stack spacing="xs">
            {tasks.map((task) => renderTaskForm(task.id))}
            {creatingTask && renderTaskForm("new", true)}
          </Stack>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
