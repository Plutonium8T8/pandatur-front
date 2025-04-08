import React, { useState, useEffect } from "react";
import TaskModal from "../Components/TaskModal/TaskModal";
import TaskList from "../Components/TaskList/TaskList";
import { IoMdAdd } from "react-icons/io";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { Input, Button } from "@mantine/core";
import { PageHeader } from "../../PageHeader";
import "./TaskComponent.css";

const language = localStorage.getItem("language") || "RO";

const TaskComponent = ({ selectTicketId, updateTaskCount, userId }) => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    try {
      let data;
      if (selectTicketId) {
        data = await api.task.getTaskByTicket(selectTicketId);
      } else {
        data = await api.task.getAllTasks();
      }
      setTasks(data);
      updateTaskCount();
    } catch (error) {
      console.error("Ошибка загрузки задач:", error);
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

  const filteredTasks = tasks.filter((task) =>
    task.task_type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="task-container">
      <PageHeader
        extraInfo={
          <>
            <Input
              className="min-w-300"
              type="text"
              placeholder={translations["Cautare"][language]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button leftSection={<IoMdAdd size={16} />} onClick={openNewTask}>
              {translations["New Task"][language]}
            </Button>
          </>
        }
        title={translations["Tasks"][language]}
        count={filteredTasks.length}
      />

      <div className="task-list-container">
        <TaskList
          tasks={filteredTasks}
          openEditTask={openEditTask}
          fetchTasks={fetchTasks}
        />
      </div>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchTasks={fetchTasks}
        selectedTask={selectedTask}
        defaultTicketId={selectTicketId}
        defaultCreatedBy={userId}
      />
    </div>
  );
};

export default TaskComponent;
