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
import { useGetTechniciansList } from "../../hooks";
import dayjs from "dayjs";
import { useUser } from "../../hooks";

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
        createdFor: selectedTask.created_for?.toString() || "",
        priority: selectedTask.priority || "",
        status_task: selectedTask.status_task || "",
      });

      setScheduledTime(parseDate(selectedTask.scheduled_time));
    } else {
      setTask({
        ticketId: defaultTicketId?.toString() || "",
        scheduledTime: "",
        description: "",
        taskType: "",
        createdBy: userId?.toString() || "",
        createdFor: "",
        priority: "",
        status_task: "",
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
      createdFor: "",
      priority: "",
      status_task: "",
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
      !task.description ||
      !task.createdBy ||
      !task.createdFor ||
      !task.taskType ||
      !task.priority ||
      !task.status_task
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
        priority: task.priority,
        status_task: task.status_task,
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

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const regex = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
    const match = dateString.match(regex);
    if (!match) return null;
    const [, day, month, year, hours, minutes, seconds] = match;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return "";
    return `${date.getDate().toString().padStart(2, "0")}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
          .getSeconds()
          .toString()
          .padStart(2, "0")}`;
  };

  const handleQuickSelect = (offsetDays) => {
    setScheduledTime(now.add(offsetDays, "day").set("hour", 12).set("minute", 0).toDate());
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={
        selectedTask
          ? translations["Editare Task"][language]
          : translations["Creare Task"][language]
      }
      centered
      size="xl"
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

          <Grid>
            <Grid.Col span={6}>
              <MantineSelect
                label={translations["Prioritate"][language]}
                data={["Low", "Medium", "High"]}
                value={task.priority}
                onChange={(value) => setTask({ ...task, priority: value })}
                placeholder={translations["Prioritate"][language]}
                required
                searchable
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <MantineSelect
                label={translations["Status"][language]}
                data={["To Do", "In Progress", "Done", "Overdue"]}
                value={task.status_task}
                onChange={(value) => setTask({ ...task, status_task: value })}
                placeholder={translations["Status"][language]}
                required
                searchable
              />
            </Grid.Col>
          </Grid>

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
              Сегодня
            </Button>
            <Button size="xs" variant="light" onClick={() => handleQuickSelect(1)}>
              Завтра
            </Button>
            <Button size="xs" variant="light" onClick={() => handleQuickSelect(7)}>
              Через неделю
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
                label={translations["Pentru"][language]}
                data={userList}
                value={task.createdFor}
                onChange={(value) => setTask({ ...task, createdFor: value })}
                placeholder={translations["Pentru"][language]}
                required
                searchable
              />
            </Grid.Col>

          </Grid>

          <Group position="right" mt="md">
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
    </Modal>
  );
};

export default TaskModal;
