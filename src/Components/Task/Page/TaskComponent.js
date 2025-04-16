import React, { useState, useEffect } from "react";
import {
  Button,
  TextInput,
  SegmentedControl,
  Box,
  Group,
  Tooltip,
} from "@mantine/core";
import { IoMdAdd } from "react-icons/io";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import TaskModal from "../TaskModal";
import TaskList from "../TaskList/TaskList";
import TaskColumnsView from "../TaskColumnsView";
import { PageHeader } from "../../PageHeader";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { FaList } from "react-icons/fa6";

const language = localStorage.getItem("language") || "RO";

const TaskComponent = ({ selectTicketId, updateTaskCount = () => { }, userId }) => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const fetchTasks = async () => {
    try {
      const data = selectTicketId
        ? await api.task.getTaskByTicket(selectTicketId)
        : await api.task.getAllTasks();
      setTasks(Array.isArray(data) ? data : []);
      updateTaskCount();
    } catch (error) {
      console.error("Ошибка загрузки задач:", error);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectTicketId]);

  const openNewTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const filteredTasks = Array.isArray(tasks)
    ? tasks.filter((task) =>
      (task?.task_type || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    : [];

  return (
    <Box p="md">
      <PageHeader
        title={translations["Tasks"][language]}
        count={filteredTasks.length}
        extraInfo={
          <Group gap="sm">
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              data={[
                {
                  value: "list",
                  label: (
                    <Tooltip label={translations["listView"][language]}>
                      <span>
                        <FaList size={16} />
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  value: "columns",
                  label: (
                    <Tooltip label={translations["columnView"][language]}>
                      <span>
                        <TbLayoutKanbanFilled size={16} />
                      </span>
                    </Tooltip>
                  ),
                },
              ]}
            />
            <TextInput
              placeholder={translations["Cautare"][language]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              w={350}
            />
            <Button leftSection={<IoMdAdd size={16} />} onClick={openNewTask}>
              {translations["New Task"][language]}
            </Button>
          </Group>
        }
      />

      {viewMode === "list" ? (
        <TaskList
          tasks={filteredTasks}
          openEditTask={openEditTask}
          fetchTasks={fetchTasks}
        />
      ) : (
        <TaskColumnsView
          tasks={filteredTasks}
          onEdit={openEditTask}
        />
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchTasks={fetchTasks}
        selectedTask={selectedTask}
        defaultTicketId={selectTicketId}
        defaultCreatedBy={userId}
      />
    </Box>
  );
};

export default TaskComponent;
