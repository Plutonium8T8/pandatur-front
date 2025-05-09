import { useState, useEffect } from "react";
import {
  Paper,
  Text,
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
import {
  getDeadlineColor,
  getBadgeColor,
  formatTasksToEdits,
  sortTasksByDate
} from "../utils/taskUtils";
import { translations } from "../utils/translations";
import { api } from "../../api";
import { TypeTask } from "./OptionsTaskType";
import { formatDate, parseDate } from "../utils/date";
import DateQuickInput from "./Components/DateQuickPicker";
import { useGetTechniciansList, useUser, useConfirmPopup } from "../../hooks";
import IconSelect from "../IconSelect/IconSelect";
import { useSnackbar } from "notistack";
import { PageHeader } from "../PageHeader";
import dayjs from "dayjs";
import Can from "../CanComponent/Can";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({
  ticketId,
  creatingTask,
  setCreatingTask
}) => {
  const [tasks, setTasks] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [listCollapsed, setListCollapsed] = useState(true);
  const [taskEdits, setTaskEdits] = useState({});
  const [editMode, setEditMode] = useState({});
  const { technicians: users } = useGetTechniciansList();
  const { userId } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [originalTaskValues, setOriginalTaskValues] = useState({});
  const { user } = useUser();
  const currentUserId = String(user?.id);
  const userGroups = user?.groups || [];

  const confirmDelete = useConfirmPopup({
    subTitle: translations["Confirmare ștergere"][language],
  });

  const fetchTasks = async () => {
    if (!ticketId) return setTasks([]);
    try {
      const res = await api.task.getTaskByTicket(ticketId);
      const taskArray = sortTasksByDate(
        (Array.isArray(res?.data) ? res.data : res)
          .filter(t => t.ticket_id === ticketId && !t.status)
      );
      setTasks(taskArray);

      const edits = formatTasksToEdits(taskArray);
      setTaskEdits((prev) => ({ ...edits, ...(prev.new ? { new: prev.new } : {}) }));
    } catch (error) {
      console.error("Error loading tasks", error);
      setTasks([]);
    }
  };

  useEffect(() => {
    if (creatingTask) {
      setListCollapsed(false);
      setTaskEdits((prev) => ({
        ...prev,
        new: {
          task_type: "",
          scheduled_time: dayjs().add(1, "day").toDate(),
          created_for: userId?.toString() || "",
          created_by: userId?.toString() || "",
          description: "",
        },
      }));
    }
  }, [creatingTask, userId]);

  useEffect(() => {
    setCreatingTask(false);
    setListCollapsed(true);
    fetchTasks();
  }, [ticketId]);

  useEffect(() => {
    setTaskEdits((prev) => {
      const preservedNew = prev.new;

      const updated = {};
      tasks.forEach((t) => {
        updated[t.id] = {
          task_type: t.task_type,
          scheduled_time: parseDate(t.scheduled_time),
          created_for: String(t.created_for),
          created_by: String(t.created_by),
          description: t.description || "",
        };
      });

      return {
        ...updated,
        ...(preservedNew ? { new: preservedNew } : {}),
      };
    });
  }, [tasks]);

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

    try {
      await api.task.update({
        id: taskId,
        ...changes,
        scheduled_time: formatDate(changes.scheduled_time),
      });
      enqueueSnackbar(translations["taskUpdated"][language],
        { variant: "success" });
      setEditMode((prev) => ({ ...prev, [taskId]: false }));
      fetchTasks();
    } catch (err) {
      enqueueSnackbar(translations["errorUpdatingTask"][language], { variant: "error" });
    }
  };

  const handleCreateTask = async () => {
    const newTask = taskEdits["new"];
    if (!newTask?.task_type || !newTask?.created_for || !newTask?.scheduled_time || !newTask?.created_by) {
      enqueueSnackbar(translations["completeAllFields"][language], { variant: "warning" });
      return;
    }

    try {
      await api.task.create({
        ...newTask,
        description: newTask.description || "",
        scheduled_time: formatDate(newTask.scheduled_time),
        ticket_id: ticketId,
        priority: "",
        status_task: "",
        status: "false"
      });
      enqueueSnackbar(translations["taskAdded"][language], { variant: "success" });
      setCreatingTask(false);
      fetchTasks();
    } catch (err) {
      enqueueSnackbar(translations["errorAddingTask"][language], { variant: "error" });
    }
  };

  const handleDeleteTask = (id) => {
    confirmDelete(() =>
      api.task.delete({ id })
        .then(() => {
          enqueueSnackbar(translations["taskDeleted"][language], { variant: "success" });
          fetchTasks();
        })
        .catch(() => {
          enqueueSnackbar(translations["errorDeletingTask"][language], { variant: "error" });
        })
    );
  };

  const handleMarkDone = async (id) => {
    try {
      await api.task.update({ id, status: true });
      enqueueSnackbar(translations["taskCompleted"][language], { variant: "success" });
      fetchTasks();
    } catch (err) {
      enqueueSnackbar(translations["errorCompletingTask"][language], { variant: "error" });
    }
  };

  const getTaskIcon = (type) => {
    const match = TypeTask.find((t) => t.name === type);
    return match?.icon || null;
  };

  const handleCancelEdit = (id) => {
    if (originalTaskValues[id]) {
      setTaskEdits((prev) => ({
        ...prev,
        [id]: { ...originalTaskValues[id] },
      }));
    }
    setEditMode((prev) => ({ ...prev, [id]: false }));
  };

  const renderTaskForm = (id, isNew = false, currentUserId, userGroups) => {
    const isEditing = isNew || editMode[id];
    const responsibleId = String(taskEdits[id]?.created_for);

    const isSameTeam = Array.isArray(userGroups) && userGroups.some(group =>
      Array.isArray(group.users) && group.users.map(String).includes(responsibleId)
    );

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
                  style={{ color: getDeadlineColor(taskEdits[id]?.scheduled_time) }}
                >
                  {formatDate(taskEdits[id]?.scheduled_time)}{" "}
                  {tasks.find((t) => t.id === id)?.created_for_full_name}
                </Text>
                {expandedCard === id ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </Group>
            </Group>
          </Box>
        )}

        <Collapse in={isNew ? creatingTask : expandedCard === id}>
          {!isNew && <Divider my="sm" />}

          <Group gap="xs" align="end">
            <IconSelect
              options={TypeTask}
              value={taskEdits[id]?.task_type}
              onChange={(value) => updateTaskField(id, "task_type", value)}
              label={translations["Alege tip task"][language]}
              disabled={!isEditing}
              required
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
              required
              searchable
              clearable
            />
            <Select
              data={users}
              value={taskEdits[id]?.created_for}
              onChange={(value) => updateTaskField(id, "created_for", value)}
              w={180}
              label={translations["Responsabil"][language]}
              disabled={!isEditing}
              placeholder={translations["Responsabil"][language]}
              required
              searchable
              clearable
            />
            <TextInput
              label={translations["Comentariu"][language]}
              placeholder={translations["Comentariu"][language]}
              value={taskEdits[id]?.description || ""}
              onChange={(e) => updateTaskField(id, "description", e.currentTarget.value)}
              w="100%"
            />
          </Group>

          <Group gap="xs" mt="md">
            {isNew ? (
              <>
                <Button size="xs" onClick={handleCreateTask}>
                  {translations["Adaugă task"][language]}
                </Button>
                <Button size="xs" variant="subtle" onClick={() => setCreatingTask(false)}>
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : isEditing ? (
              <>
                <Button size="xs" onClick={() => handleUpdateTask(id)} variant="filled">
                  {translations["Save"][language]}
                </Button>
                <Button size="xs" variant="subtle" onClick={() => handleCancelEdit(id)}>
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : (
              <>
                <Can
                  permission={{ module: "TASK", action: "EDIT" }}
                  context={{ responsibleId, currentUserId, isSameTeam }}
                >
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
                    onClick={() => {
                      const original = tasks.find((t) => t.id === id);
                      if (original) {
                        setOriginalTaskValues((prev) => ({
                          ...prev,
                          [id]: {
                            task_type: original.task_type,
                            scheduled_time: parseDate(original.scheduled_time),
                            created_for: String(original.created_for),
                            created_by: String(original.created_by),
                            description: original.description || "",
                          },
                        }));
                      }
                      setEditMode((prev) => ({ ...prev, [id]: true }));
                    }}
                    leftSection={<FaPencil />}
                  >
                    {translations["Editare Task"][language]}
                  </Button>
                </Can>

                <Can
                  permission={{ module: "TASK", action: "DELETE" }}
                  context={{ responsibleId, currentUserId, isSameTeam }}
                >
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteTask(id)}
                    leftSection={<FaTrash />}
                  >
                    {translations["Șterge"][language]}
                  </Button>
                </Can>
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
        <PageHeader
          title={translations["Tasks"][language]}
          count={tasks.length}
          badgeColor={getBadgeColor(tasks)}
          withDivider={false}
          extraInfo={
            <ActionIcon variant="light" onClick={() => setListCollapsed((p) => !p)}>
              {listCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
            </ActionIcon>
          }
        />

        <Collapse in={!listCollapsed}>
          <Stack spacing="xs" mt="xs">
            {tasks.map((task) => renderTaskForm(task.id))}
            {creatingTask && renderTaskForm("new", true)}
          </Stack>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
