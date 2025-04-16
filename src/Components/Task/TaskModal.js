import React, { useState, useEffect } from "react";
import {
  Modal,
  Textarea,
  Button,
  Select as MantineSelect,
  Group,
  Stack,
  Grid,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useSnackbar } from "notistack";
import { api } from "../../api";
import IconSelect from "../IconSelect/IconSelect";
import { TypeTask } from "./OptionsTaskType";
import { translations } from "../utils/translations";
import { parseDate, formatDate } from "../utils/date";
import { useGetTechniciansList, useUser } from "../../hooks";
import dayjs from "dayjs";
import { MantineModal } from "../MantineModal";

const language = localStorage.getItem("language") || "RO";

const TaskModal = ({
  isOpen,
  onClose,
  fetchTasks,
  selectedTask,
  defaultTicketId,
  defaultCreatedBy,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [task, setTask] = useState({});
  const [scheduledTime, setScheduledTime] = useState(null);
  const [ticketIds, setTicketIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const { technicians: userList } = useGetTechniciansList();
  const { userId } = useUser();
  const now = dayjs();

  useEffect(() => {
    if (!isOpen) return;

    fetchTickets();

    if (selectedTask) {
      setTask({
        ticketId: selectedTask.ticket_id.toString(),
        scheduledTime: selectedTask.scheduled_time || "",
        description: selectedTask.description || "",
        taskType: selectedTask.task_type || "",
        createdBy: selectedTask.created_by.toString(),
        createdFor: selectedTask.created_for?.toString() || ""
      });

      setScheduledTime(parseDate(selectedTask.scheduled_time));
    } else {
      setTask({
        ticketId: defaultTicketId?.toString() || "",
        scheduledTime: "",
        description: "",
        taskType: "",
        createdBy: userId?.toString() || "",
        createdFor: ""
      });

      setScheduledTime(null);
    }
  }, [isOpen, selectedTask]);

  const handleClose = () => {
    setTask({
      ticketId: "",
      scheduledTime: "",
      description: "",
      taskType: "",
      createdBy: "",
      createdFor: ""
    });
    setScheduledTime(null);
    onClose();
  };

  const fetchTickets = async () => {
    try {
      const data = await api.tickets.list();
      setTicketIds(data.map((ticket) => ticket.id.toString()));
    } catch (error) {
      enqueueSnackbar(translations["Eroare la încărcarea tichetelor"][language], {
        variant: "error",
      });
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (
      !task.ticketId ||
      !scheduledTime ||
      !task.createdBy ||
      !task.createdFor ||
      !task.taskType
    ) {
      enqueueSnackbar(translations["Toate câmpurile sunt obligatorii"][language], {
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const updatedTask = {
        ticket_id: task.ticketId,
        scheduled_time: formatDate(scheduledTime),
        description: task.description,
        task_type: task.taskType,
        created_by: task.createdBy,
        created_for: task.createdFor,
        priority: "",
        status_task: ""
      };

      if (selectedTask) {
        await api.task.update({ id: selectedTask.id, ...updatedTask });
        enqueueSnackbar(translations["Task actualizat cu succes!"][language], {
          variant: "success",
        });
      } else {
        await api.task.create(updatedTask);
        enqueueSnackbar(translations["Task creat cu succes!"][language], {
          variant: "success",
        });
      }

      fetchTasks();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (offsetDays) => {
    setScheduledTime(now.add(offsetDays, "day").set("hour", 12).set("minute", 0).toDate());
  };

  return (
    <MantineModal
      open={isOpen}
      onClose={handleClose}
      height=""
      title={
        selectedTask
          ? translations["Editare Task"][language]
          : translations["Creare Task"][language]
      }
    >
      <form onSubmit={handleTaskSubmit}>
        <Stack spacing="md">
          <MantineSelect
            label={translations["Lead ID"][language]}
            data={ticketIds}
            value={task.ticketId}
            onChange={(value) => setTask((prev) => ({ ...prev, ticketId: value }))}
            searchable
            placeholder={translations["Lead ID"][language]}
            required
            disabled={!!defaultTicketId}
          />

          <IconSelect
            options={TypeTask}
            label={translations["Alege tip task"][language]}
            value={task.taskType}
            onChange={(value) => setTask((prev) => ({ ...prev, taskType: value }))}
            required
            placeholder={translations["Alege tip task"][language]}
          />

          <DateTimePicker
            label={translations["Deadline"][language]}
            value={scheduledTime}
            onChange={setScheduledTime}
            placeholder={translations["Deadline"][language]}
            minDate={new Date()}
            required
            clearable
          />

          <Group spacing="xl" mb="xs">
            <Button size="xs" variant="light" onClick={() => handleQuickSelect(0)}>
              {translations["today"][language]}
            </Button>
            <Button size="xs" variant="light" onClick={() => handleQuickSelect(1)}>
              {translations["tomorrow"][language]}
            </Button>
            <Button size="xs" variant="light" onClick={() => handleQuickSelect(7)}>
              {translations["inAWeek"][language]}
            </Button>
          </Group>

          <Textarea
            label={translations["Descriere task"][language]}
            name="description"
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            placeholder={translations["Descriere task"][language]}
            autosize
            minRows={3}
            maxRows={6}
          />

          <Grid>
            <Grid.Col span={6}>
              <MantineSelect
                label={translations["De la utilizatorul"][language]}
                data={userList}
                value={task.createdBy}
                onChange={(value) => setTask((prev) => ({ ...prev, createdBy: value }))}
                placeholder={translations["De la utilizatorul"][language]}
                required
                searchable
                disabled={!!defaultCreatedBy}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <MantineSelect
                label={translations["For"][language]}
                data={userList}
                value={task.createdFor}
                onChange={(value) => setTask({ ...task, createdFor: value })}
                placeholder={translations["For"][language]}
                required
                searchable
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose}>
              {translations["Anulare"][language]}
            </Button>
            <Button type="submit" loading={loading}>
              {selectedTask
                ? translations["Editare Task"][language]
                : translations["Adaugă task"][language]}
            </Button>
          </Group>
        </Stack>
      </form>
    </MantineModal >
  );
};

export default TaskModal;
