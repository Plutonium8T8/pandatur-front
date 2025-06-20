import React, { useState, useEffect } from "react";
import {
  Textarea,
  Button,
  Select as MantineSelect,
  Group,
  Stack,
  Grid,
  Modal,
  Text,
} from "@mantine/core";
import DateQuickInput from "./Components/DateQuickPicker";
import { useSnackbar } from "notistack";
import { api } from "../../api";
import IconSelect from "../IconSelect/IconSelect";
import { TypeTask } from "./OptionsTaskType";
import { translations } from "../utils/translations";
import { parseDate, formatDate } from "../utils/date";
import { useGetTechniciansList, useUser } from "../../hooks";

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
  const [loading, setLoading] = useState(false);
  const { technicians: userList } = useGetTechniciansList();
  const { userId } = useUser();

  useEffect(() => {
    if (!isOpen) return;

    if (selectedTask) {
      setTask({
        ticketId: selectedTask.ticket_id?.toString() || "",
        description: selectedTask.description || "",
        taskType: selectedTask.task_type || "",
        createdBy: selectedTask.created_by?.toString() || "",
        createdFor: selectedTask.created_for?.toString() || "",
      });

      setScheduledTime(parseDate(selectedTask.scheduled_time));
    } else {
      setTask({
        ticketId: defaultTicketId?.toString() || "",
        description: "",
        taskType: "",
        createdBy: userId?.toString() || "",
        createdFor: "",
      });

      setScheduledTime(null);
    }
  }, [isOpen, selectedTask]);

  const handleClose = () => {
    setTask({
      ticketId: "",
      description: "",
      taskType: "",
      createdBy: "",
      createdFor: "",
    });
    setScheduledTime(null);
    onClose();
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
        status_task: "",
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

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      centered
      size="xl"
      title={
        selectedTask
          ? translations["Editare Task"][language]
          : translations["Creare Task"][language]
      }
    >
      <form onSubmit={handleTaskSubmit}>
        <Stack spacing="md">
          <Text size="sm" fw="800">
            {translations["Lead ID"][language]}:{" "}
            <Text span fw={800}>
              {task.ticketId}
            </Text>
          </Text>

          <IconSelect
            options={TypeTask}
            label={translations["Alege tip task"][language]}
            value={task.taskType}
            onChange={(value) => setTask((prev) => ({ ...prev, taskType: value }))}
            required
            placeholder={translations["Alege tip task"][language]}
          />

          <DateQuickInput value={scheduledTime} onChange={setScheduledTime} />

          <Textarea
            label={translations["Comentariu"][language]}
            name="description"
            value={task.description}
            onChange={(e) => setTask((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={translations["Comentariu"][language]}
            autosize
            minRows={3}
            maxRows={6}
          />

          <Grid>
            <Grid.Col span={6}>
              <MantineSelect
                label={translations["Autor"][language]}
                data={userList}
                value={task.createdBy}
                onChange={(value) => setTask((prev) => ({ ...prev, createdBy: value }))}
                placeholder={translations["Autor"][language]}
                required
                searchable
                disabled={!!defaultCreatedBy}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <MantineSelect
                label={translations["Responsabil"][language]}
                data={userList}
                value={task.createdFor}
                onChange={(value) => setTask((prev) => ({ ...prev, createdFor: value }))}
                placeholder={translations["Responsabil"][language]}
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
    </Modal>
  );
};

export default TaskModal;
