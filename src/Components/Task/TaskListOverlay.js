import { useState, useEffect, useContext, useCallback, useRef, startTransition } from "react";
import {
  Paper, Text, Box, Group, Stack, Card, Divider, Collapse,
  TextInput, Button, Select, ActionIcon, Loader, Center
} from "@mantine/core";
import { FaChevronDown, FaChevronUp, FaTrash, FaCheck, FaPencil } from "react-icons/fa6";
import { getDeadlineColor, getBadgeColor, formatTasksToEdits, sortTasksByDate } from "../utils/taskUtils";
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
import { SocketContext } from "../../contexts/SocketContext";

const language = localStorage.getItem("language") || "RO";

const TaskListOverlay = ({ ticketId, creatingTask, setCreatingTask }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [listCollapsed, setListCollapsed] = useState(true);
  const [taskEdits, setTaskEdits] = useState({});
  const [editMode, setEditMode] = useState({});
  const { technicians: users } = useGetTechniciansList();
  const { userId } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [originalTaskValues, setOriginalTaskValues] = useState({});
  const { onEvent } = useContext(SocketContext);

  const [listLoading, setListLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const skipNextSocketRef = useRef(false);

  const confirmDelete = useConfirmPopup({
    subTitle: translations["Confirmare ștergere"][language],
  });

  const fetchTasks = useCallback(
    async ({ idOverride, silent } = {}) => {
      const qId = Number(idOverride ?? ticketId);
      if (!qId) { setTasks([]); return; }

      if (!silent) setListLoading(true);
      try {
        const res = await api.task.getTaskByTicket(qId);
        const list = Array.isArray(res?.data) ? res.data : res;
        const taskArray = sortTasksByDate(list.filter(t => Number(t.ticket_id) === qId && !t.status));

        startTransition(() => {
          setTasks(taskArray);
          const edits = formatTasksToEdits(taskArray);
          setTaskEdits((prev) => ({ ...edits, ...(prev.new ? { new: prev.new } : {}) }));
        });
      } catch (error) {
        console.error("Error loading tasks", error);
        setTasks([]);
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [ticketId]
  );

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!onEvent) return;
    const handler = (evt) => {
      const fromSocket = Number(evt?.data?.ticket_id ?? evt?.data?.ticketId);
      if (!fromSocket || Number(fromSocket) !== Number(ticketId)) return;
      if (skipNextSocketRef.current) {
        skipNextSocketRef.current = false;
        return;
      }
      fetchTasks({ idOverride: fromSocket, silent: true });
    };
    const unsub = onEvent("task", handler);
    return () => { typeof unsub === "function" && unsub(); };
  }, [onEvent, ticketId, fetchTasks]);

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
      return { ...updated, ...(preservedNew ? { new: preservedNew } : {}) };
    });
  }, [tasks]);

  const updateTaskField = (id, field, value) => {
    setTaskEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleUpdateTask = async (taskId) => {
    const changes = taskEdits[taskId];
    if (!changes) return;
    setActionLoading(true);
    try {
      skipNextSocketRef.current = true;
      await api.task.update({ id: taskId, ...changes, scheduled_time: formatDate(changes.scheduled_time) });
      enqueueSnackbar(translations["taskUpdated"][language], { variant: "success" });
      setEditMode((prev) => ({ ...prev, [taskId]: false }));
      await fetchTasks({ silent: true });
    } catch {
      enqueueSnackbar(translations["errorUpdatingTask"][language], { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async () => {
    const newTask = taskEdits["new"];
    if (!newTask?.task_type || !newTask?.created_for || !newTask?.scheduled_time || !newTask?.created_by) {
      enqueueSnackbar(translations["completeAllFields"][language], { variant: "warning" });
      return;
    }
    setActionLoading(true);
    try {
      skipNextSocketRef.current = true;
      await api.task.create({
        ...newTask,
        description: newTask.description || "",
        scheduled_time: formatDate(newTask.scheduled_time),
        ticket_id: ticketId,
        priority: "",
        status_task: "",
        status: "false",
      });
      enqueueSnackbar(translations["taskAdded"][language], { variant: "success" });
      setCreatingTask(false);
      await fetchTasks({ silent: true });
    } catch {
      enqueueSnackbar(translations["errorAddingTask"][language], { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = (id) => {
    confirmDelete(async () => {
      setActionLoading(true);
      try {
        skipNextSocketRef.current = true;

        setTasks((prev) => prev.filter((t) => t.id !== id));
        setTaskEdits((prev) => {
          const { [id]: _drop, ...rest } = prev;
          return rest;
        });

        await api.task.delete({ id });
        enqueueSnackbar(translations["taskDeleted"][language], { variant: "success" });

        await fetchTasks({ silent: true });
      } catch {
        enqueueSnackbar(translations["errorDeletingTask"][language], { variant: "error" });
        await fetchTasks({ silent: false });
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleMarkDone = async (id) => {
    setActionLoading(true);
    try {
      skipNextSocketRef.current = true;

      setTasks((prev) => prev.filter((t) => t.id !== id));

      await api.task.update({ id, status: true });
      enqueueSnackbar(translations["taskCompleted"][language], { variant: "success" });
      await fetchTasks({ silent: true });
    } catch {
      enqueueSnackbar(translations["errorCompletingTask"][language], { variant: "error" });
      await fetchTasks({ silent: false });
    } finally {
      setActionLoading(false);
    }
  };

  const getTaskIcon = (type) => TypeTask.find((t) => t.name === type)?.icon || null;

  const handleCancelEdit = (id) => {
    if (originalTaskValues[id]) {
      setTaskEdits((prev) => ({ ...prev, [id]: { ...originalTaskValues[id] } }));
    }
    setEditMode((prev) => ({ ...prev, [id]: false }));
  };

  const toggleList = useCallback(() => setListCollapsed((p) => !p), []);

  const renderTaskForm = (id, isNew = false, currentUserId, userGroups) => {
    const isEditing = isNew || editMode[id];
    const responsibleId = String(taskEdits[id]?.created_for);
    const isSameTeam = Array.isArray(userGroups) && userGroups.some(group =>
      Array.isArray(group.users) && group.users.map(String).includes(responsibleId)
    );

    return (
      <Card withBorder radius="md" shadow="xs" p="sm" key={id}>
        {!isNew && (
          <Box onClick={() => setExpandedCard(expandedCard === id ? null : id)} style={{ cursor: "pointer" }}>
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {getTaskIcon(taskEdits[id]?.task_type)}
                <Text fw={500}>
                  {taskEdits[id]?.task_type}
                  {!isNew && id && (
                    <Text span size="sm" c="dimmed" ml={6} style={{ fontWeight: 400 }}>
                      #{id}
                    </Text>
                  )}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" style={{ color: getDeadlineColor(taskEdits[id]?.scheduled_time) }}>
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
              disabled={!isEditing || actionLoading}
              required
            />
            <DateQuickInput
              value={taskEdits[id]?.scheduled_time}
              onChange={(value) => updateTaskField(id, "scheduled_time", value)}
              disabled={!isEditing || actionLoading}
            />
            <Select
              data={users}
              value={taskEdits[id]?.created_by}
              onChange={(value) => updateTaskField(id, "created_by", value)}
              w={180}
              label={translations["Autor"][language]}
              placeholder={translations["Autor"][language]}
              disabled={!isEditing || actionLoading}
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
              disabled={!isEditing || actionLoading}
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
              disabled={actionLoading}
            />
          </Group>

          <Group gap="xs" mt="md">
            {isNew ? (
              <>
                <Button size="xs" onClick={handleCreateTask} loading={actionLoading}>
                  {translations["Adaugă task"][language]}
                </Button>
                <Button size="xs" variant="subtle" onClick={() => setCreatingTask(false)} disabled={actionLoading}>
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : isEditing ? (
              <>
                <Button size="xs" onClick={() => handleUpdateTask(id)} variant="filled" loading={actionLoading}>
                  {translations["Save"][language]}
                </Button>
                <Button size="xs" variant="subtle" onClick={() => handleCancelEdit(id)} disabled={actionLoading}>
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : (
              <>
                <Can permission={{ module: "TASK", action: "EDIT" }} context={{ responsibleId, currentUserId: userId, isSameTeam }}>
                  <Button
                    size="xs"
                    variant="filled"
                    onClick={() => handleMarkDone(id)}
                    leftSection={<FaCheck />}
                    loading={actionLoading}
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
                    disabled={actionLoading}
                  >
                    {translations["Editare Task"][language]}
                  </Button>
                </Can>

                <Can permission={{ module: "TASK", action: "DELETE" }} context={{ responsibleId, currentUserId: userId, isSameTeam }}>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteTask(id)}
                    leftSection={<FaTrash />}
                    loading={actionLoading}
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

  const isVisible = creatingTask || tasks.length > 0;
  if (!isVisible) return null;

  return (
    <Box pos="relative" p="xs" w="100%">
      <Paper shadow="xs" radius="md" withBorder p="xs">
        <Box
          onClick={toggleList}
          role="button"
          aria-expanded={!listCollapsed}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleList(); }
          }}
          style={{ cursor: "pointer" }}
        >
          <PageHeader
            title={translations["Tasks"][language]}
            count={tasks.length}
            badgeColor={getBadgeColor(tasks)}
            withDivider={false}
            extraInfo={
              <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                <ActionIcon
                  variant="light"
                  onClick={(e) => { e.stopPropagation(); toggleList(); }}
                >
                  {listCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
                </ActionIcon>
                {listLoading && <Loader size="sm" />}
              </Group>
            }
          />
        </Box>

        <Collapse in={!listCollapsed}>
          {listLoading && tasks.length === 0 && (
            <Center my="md"><Loader /></Center>
          )}

          {!listLoading && tasks.length > 0 && (
            <Stack spacing="xs" mt="xs">
              {tasks.map((task) => renderTaskForm(task.id))}
            </Stack>
          )}

          {creatingTask && (
            <Stack spacing="xs" mt="xs">
              {renderTaskForm("new", true)}
            </Stack>
          )}
        </Collapse>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
