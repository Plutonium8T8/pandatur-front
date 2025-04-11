import React, { useState, useEffect } from "react";
import TaskModal from "../Components/TaskModal/TaskModal";
import TaskList from "../Components/TaskList/TaskList";
import { IoMdAdd } from "react-icons/io";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { Input, Button, SegmentedControl } from "@mantine/core";
import { PageHeader } from "../../PageHeader";
import "./TaskComponent.css";
import dayjs from "dayjs";

const language = localStorage.getItem("language") || "RO";

const TaskComponent = ({ selectTicketId, updateTaskCount, userId }) => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // list | columns

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
    task.task_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TaskColumnsView = ({ tasks }) => {
    const now = dayjs();
    const grouped = {
      overdue: [],
      today: [],
      tomorrow: [],
    };

    tasks.forEach((task) => {
      const deadline = dayjs(task.scheduled_time);
      if (deadline.isBefore(now, "day")) grouped.overdue.push(task);
      else if (deadline.isSame(now, "day")) grouped.today.push(task);
      else if (deadline.isSame(now.add(1, "day"), "day")) grouped.tomorrow.push(task);
    });

    return (
      <div className="columns-view">
        {["overdue", "today", "tomorrow"].map((key) => (
          <div className="column" key={key}>
            <div className="column-header">
              {key === "overdue" && "OVERDUE TASKS"}
              {key === "today" && "TO-DO TODAY"}
              {key === "tomorrow" && "TO-DO TOMORROW"}
            </div>
            <div className="column-tasks">
              {grouped[key].map((task) => (
                <div
                  className="task-card"
                  key={task.id}
                  onClick={() => openEditTask(task)}
                >
                  <div className="task-title">{task.task_type}</div>
                  <div className="task-date">
                    {dayjs(task.scheduled_time).format("DD.MM.YYYY HH:mm")}
                  </div>
                  <div className="task-desc">{task.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="task-container">
      <PageHeader
        extraInfo={
          <>
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              data={[
                { label: "Listă", value: "list" },
                { label: "Coloane", value: "columns" },
              ]}
              className="mr-2"
            />
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
        {viewMode === "list" ? (
          <TaskList
            tasks={filteredTasks}
            openEditTask={openEditTask}
            fetchTasks={fetchTasks}
          />
        ) : (
          <TaskColumnsView tasks={filteredTasks} />
        )}
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
