import React, { useState, useEffect } from "react";
import {
  Button,
  TextInput,
  SegmentedControl,
  Box,
  Group,
  Tooltip,
  Flex,
  ActionIcon,
} from "@mantine/core";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { FaList } from "react-icons/fa6";
import { LuFilter } from "react-icons/lu";
import { api } from "../../api";
import { translations } from "../utils/translations";
import TaskModal from "./TaskModal";
import TaskList from "./TaskList/TaskList";
import TaskColumnsView from "./Kanban/TaskColumnsView";
import TaskFilterModal from "./Components/FilterTask";
import { PageHeader } from "../PageHeader";
import { Pagination } from "../Pagination";
import { useUser } from "../../hooks";
import { useSnackbar } from "notistack";
import { showServerError } from "../utils";

const language = localStorage.getItem("language") || "RO";

const TaskComponent = ({ updateTaskCount = () => { }, userId, tasks = [], setTasks, setFetchTasksRef }) => {
  const { userId: currentUserId } = useUser();
  const [filters, setFilters] = useState({ created_for: [String(currentUserId)] });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTasks = async () => {
    try {
      const res = await api.task.filterTasks({
        ...filters,
        search: searchQuery,
        page: currentPage,
        sort_by: "scheduled_time",
      });

      setTasks?.(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.pagination?.total_pages || 1);
      updateTaskCount();
    } catch (error) {
      console.error("error upload tasks", error);
      setTasks([]);
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  useEffect(() => {
    if (setFetchTasksRef) setFetchTasksRef(fetchTasks);
  }, [setFetchTasksRef, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [filters, searchQuery, currentPage]);


  // *** TO DO *** need to refactor window create task
  const openNewTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "created_for") {
      return JSON.stringify(value) !== JSON.stringify([String(currentUserId)]);
    }
    return value && value.length > 0;
  });

  return (
    <Box p="md">
      <PageHeader
        title={translations["Tasks"][language]}
        count={tasks.length}
        extraInfo={
          <Group gap="sm">
            <ActionIcon
              size="36"
              variant={hasActiveFilters ? "filled" : "default"}
              onClick={() => setFilterModalOpen(true)}
            >
              <LuFilter size={16} />
            </ActionIcon>

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
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              w={350}
              rightSection={
                searchInput ? (
                  <IoMdClose
                    size={16}
                    className="pointer"
                    onClick={() => setSearchInput("")}
                  />
                ) : null
              }
            />
            {/* <Button leftSection={<IoMdAdd size={16} />} onClick={openNewTask}>
              {translations["New Task"][language]}
            </Button> */}
          </Group>
        }
      />

      {viewMode === "list" ? (
        <TaskList
          tasks={tasks}
          currentPage={currentPage}
          totalPages={totalPages}
          onChangePagination={setCurrentPage}
          searchQuery={searchQuery}
          openEditTask={openEditTask}
          fetchTasks={fetchTasks}
        />
      ) : (
        <TaskColumnsView tasks={tasks} onEdit={openEditTask} />
      )}

      {totalPages > 1 && (
        <Flex p="20" justify="center" className="leads-table-pagination">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPaginationChange={setCurrentPage}
          />
        </Flex>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchTasks={fetchTasks}
        selectedTask={selectedTask}
        defaultCreatedBy={userId}
      />

      <TaskFilterModal
        opened={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
      />
    </Box>
  );
};

export default TaskComponent;
