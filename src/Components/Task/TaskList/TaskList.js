import { useState, useMemo, useEffect } from "react";
import { RcTable, HeaderCellRcTable } from "../../RcTable";
import { Checkbox } from "../../Checkbox";
import { translations } from "../../utils/translations";
import "./TaskList.css";
import { TypeTask } from "../OptionsTaskType";
import { useSnackbar } from "notistack";
import { api } from "../../../api";
import { Menu, Button } from "@mantine/core";
import { MantineModal } from "../../MantineModal";
import SingleChat from "../../ChatComponent/SingleChat";
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoTrash,
  IoPencil,
} from "react-icons/io5";
import { useConfirmPopup } from "../../../hooks";
import dayjs from "dayjs";

const language = localStorage.getItem("language") || "RO";

const priorityColors = {
  Low: "#4CAF50",
  Medium: "#FF9800",
  High: "#F44336",
};

const TaskList = ({
  tasks = [],
  handleMarkAsSeenTask,
  userList = [],
  loading = false,
  openEditTask,
  fetchTasks,
}) => {
  const [order, setOrder] = useState("ASC");
  const [sortColumn, setSortColumn] = useState(null);
  const [selectedRow, setSelectedRow] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [openedTicketId, setOpenedTicketId] = useState(null);
  const handleDeleteTaskById = useConfirmPopup({
    subTitle: translations["Sigur doriți să ștergeți acest task?"][language],
  });

  const handleDeleteTask = (taskId) => {
    handleDeleteTaskById(async () => {
      try {
        await api.task.delete({ id: taskId });
        enqueueSnackbar(translations["Task șters cu succes!"][language], {
          variant: "success",
        });
        fetchTasks();
      } catch (error) {
        enqueueSnackbar(
          translations["Eroare la ștergerea taskului"][language],
          { variant: "error" }
        );
      }
    });
  };

  const handleMarkTaskAsComplete = async (taskId) => {
    try {
      await api.task.update({ id: taskId, status: true });
      enqueueSnackbar(translations["Task marcat ca finalizat!"][language], {
        variant: "success",
      });
      fetchTasks();
    } catch (error) {
      enqueueSnackbar(
        translations["Eroare la actualizarea statusului taskului"][language],
        { variant: "error" }
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openMenuId &&
        !event.target.closest(".dropdown-menu") &&
        !event.target.closest(".action-button-task")
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const sortedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    if (!sortColumn) return tasks;

    return [...tasks].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (sortColumn === "scheduled_time") {
        valA = dayjs(valA).valueOf();
        valB = dayjs(valB).valueOf();
      }

      const comparison = String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
      });

      return order === "ASC" ? comparison : -comparison;
    });
  }, [tasks, sortColumn, order]);

  const columns = useMemo(
    () => [
      {
        width: 50,
        key: "checkbox",
        align: "center",
        render: (row) => (
          <Checkbox
            checked={selectedRow.includes(row.id)}
            onChange={() => {
              setSelectedRow((prev) =>
                prev.includes(row.id)
                  ? prev.filter((id) => id !== row.id)
                  : [...prev, row.id]
              );
            }}
          />
        ),
      },
      {
        title: (
          <HeaderCellRcTable
            title={translations["Lead ID"][language]}
            order={order}
          />
        ),
        dataIndex: "ticket_id",
        key: "ticket_id",
        width: 120,
        align: "center",
        onHeaderCell: () => ({
          onClick: () => {
            setSortColumn("ticket_id");
            setOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
          },
        }),
        render: (ticketId) => (
          <span
            style={{ color: "#1971c2", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setOpenedTicketId(ticketId)}
          >
            {ticketId}
          </span>
        ),
      },
      {
        title: (
          <HeaderCellRcTable
            title={translations["Lead ID"][language]}
            order={order}
          />
        ),
        dataIndex: "ticket_id",
        key: "ticket_id",
        width: 120,
        align: "center",
        onHeaderCell: () => ({
          onClick: () => {
            setSortColumn("ticket_id");
            setOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
          },
        }),
      },
      {
        title: translations["Tipul Taskului"][language],
        dataIndex: "task_type",
        key: "task_type",
        width: 180,
        align: "center",
        render: (taskType) => {
          const taskObj = TypeTask.find((task) => task.name === taskType);
          return (
            <div className="task-type">
              {taskObj?.icon || "❓"} <span>{taskType}</span>
            </div>
          );
        },
      },
      {
        title: translations["Prioritate"][language],
        dataIndex: "priority",
        key: "priority",
        width: 120,
        align: "center",
        render: (priority) => (
          <span
            style={{
              backgroundColor: priorityColors[priority] || "#ccc",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {priority}
          </span>
        ),
      },
      {
        title: translations["Etapa Task"][language],
        dataIndex: "status_task",
        key: "status_task",
        width: 120,
        align: "center",
      },
      {
        title: translations["Creat de"][language],
        dataIndex: "creator_by_full_name",
        key: "creator_by_full_name",
        width: 150,
        align: "center",
        render: (_, row) =>
          row.creator_by_full_name || `ID: ${row.created_by}`,
      },
      {
        title: translations["Pentru"][language],
        dataIndex: "created_for_full_name",
        key: "created_for_full_name",
        width: 150,
        align: "center",
        render: (_, row) =>
          row.created_for_full_name || `ID: ${row.created_for}`,
      },
      {
        title: translations["Descriere"][language],
        dataIndex: "description",
        key: "description",
        width: 200,
        align: "center",
      },
      {
        title: (
          <HeaderCellRcTable
            title={translations["Deadline"][language]}
            order={order}
          />
        ),
        dataIndex: "scheduled_time",
        key: "scheduled_time",
        width: 180,
        align: "center",
        onHeaderCell: () => ({
          onClick: () => {
            setSortColumn("scheduled_time");
            setOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
          },
        }),
        render: (date) => {
          const parsed = dayjs(date);
          return parsed.isValid()
            ? parsed.format("DD.MM.YYYY HH:mm")
            : "Invalid Date";
        },
      },
      {
        title: translations["Status"][language],
        dataIndex: "status",
        key: "status",
        width: 120,
        align: "center",
        render: (status) => (
          <span className={status ? "inactiv" : "activ"}>
            {status
              ? translations["inactiv"][language]
              : translations["activ"][language]}
          </span>
        ),
      },
      {
        title: translations["Acțiune"][language],
        dataIndex: "action",
        key: "action",
        width: 150,
        align: "center",
        render: (_, row) => (
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Button variant="default" className="action-button-task">
                <IoEllipsisHorizontal size={18} />
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IoCheckmarkCircle size={16} />}
                onClick={() => {
                  if (!row.status) {
                    handleMarkTaskAsComplete(row.id);
                  }
                }}
                disabled={row.status}
                style={
                  row.status ? { opacity: 0.5, cursor: "not-allowed" } : {}
                }
              >
                {translations["Finalizați"][language]}
              </Menu.Item>

              <Menu.Item
                leftSection={<IoPencil size={16} />}
                onClick={() => openEditTask(row)}
              >
                {translations["Modificați"][language]}
              </Menu.Item>

              <Menu.Item
                leftSection={<IoTrash size={16} />}
                onClick={() => handleDeleteTask(row.id)}
                color="red"
              >
                {translations["Ștergeți"][language]}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ),
      },
    ],
    [language, userList, handleMarkAsSeenTask, order, sortColumn, selectedRow, openMenuId]
  );

  return (
    <div style={{ margin: "10px" }}>
      <RcTable
        rowKey={({ id }) => id}
        columns={columns}
        data={sortedTasks}
        selectedRow={selectedRow}
        loading={loading}
        bordered
      />
      <MantineModal
        fullScreen
        open={!!openedTicketId}
        onClose={() => setOpenedTicketId(null)}
        height="calc(100% - 60px)"
      >
        <SingleChat
          ticketId={openedTicketId}
          onClose={() => setOpenedTicketId(null)}
        />
      </MantineModal>
    </div>
  );
};

export default TaskList;
