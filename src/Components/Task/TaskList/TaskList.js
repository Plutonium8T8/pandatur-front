import { useState, useMemo, useEffect } from "react";
import { RcTable, HeaderCellRcTable } from "../../RcTable";
import { FaFingerprint } from "react-icons/fa6";
import { Checkbox } from "../../Checkbox";
import { translations } from "../../utils/translations";
import { TypeTask } from "../OptionsTaskType";
import { useSnackbar } from "notistack";
import { api } from "../../../api";
import { Menu, Button, Flex } from "@mantine/core";
import { Link } from "react-router-dom";
import { Tag } from "../../Tag";
import { useConfirmPopup } from "../../../hooks";
import dayjs from "dayjs";
import "./TaskList.css";
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoTrash,
  IoPencil,
} from "react-icons/io5";

const language = localStorage.getItem("language") || "RO";

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
        const dateA = dayjs(valA, "DD-MM-YYYY HH:mm:ss");
        const dateB = dayjs(valB, "DD-MM-YYYY HH:mm:ss");

        if (!dateA.isValid() || !dateB.isValid()) return 0;

        return order === "ASC"
          ? dateA.valueOf() - dateB.valueOf()
          : dateB.valueOf() - dateA.valueOf();
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
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedRow.includes(row.id)}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedRow((prev) =>
                  prev.includes(row.id)
                    ? prev.filter((id) => id !== row.id)
                    : [...prev, row.id]
                );
              }}
            />
          </div>
        ),
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
          const parsed = dayjs(date, "DD-MM-YYYY HH:mm:ss");
          if (!parsed.isValid()) return "Invalid Date";

          const today = dayjs().startOf("day");
          const isToday = parsed.isSame(today, "day");
          const isPast = parsed.isBefore(today);

          const color = isPast ? "#d32f2f" : isToday ? "#2e7d32" : "#000000";
          const fontWeight = isPast || isToday ? 600 : 400;

          return (
            <span style={{ color, fontWeight }}>
              {parsed.format("DD.MM.YYYY HH:mm")}
            </span>
          );
        }
      },
      {
        title: translations["Autor"][language],
        dataIndex: "creator_by_full_name",
        key: "creator_by_full_name",
        width: 150,
        align: "center",
        render: (_, row) =>
          row.creator_by_full_name || `ID: ${row.created_by}`,
      },
      {
        title: translations["Responsabil"][language],
        dataIndex: "created_for_full_name",
        key: "created_for_full_name",
        width: 150,
        align: "center",
        render: (_, row) =>
          row.created_for_full_name || `ID: ${row.created_for}`,
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
          <Link
            to={`/tasks/${ticketId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="center" gap="8" align="center">
              <FaFingerprint />
              {ticketId}
            </Flex>
          </Link>
        ),
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
            <Tag type="processing" fontSize={16}>
              {taskObj?.icon || "❓"} {taskType}
            </Tag>
          );
        },
      },
      {
        title: translations["Descriere"][language],
        dataIndex: "description",
        key: "description",
        width: 200,
        align: "center",
      },
      {
        title: translations["Status"][language],
        dataIndex: "status",
        key: "status",
        width: 120,
        align: "center",
        render: (status) => (
          <Tag type={status ? "danger" : "success"}>
            {status
              ? translations["inactiv"][language]
              : translations["activ"][language]}
          </Tag>
        ),
      },
      {
        title: translations["Acțiune"][language],
        dataIndex: "action",
        key: "action",
        width: 70,
        align: "center",
        render: (_, row) => (
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <div
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="default" className="action-button-task" size="xs" p="xs">
                  <IoEllipsisHorizontal size={18} />
                </Button>
              </div>
            </Menu.Target>

            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
              <Menu.Item
                leftSection={<IoCheckmarkCircle size={16} />}
                onClick={() => {
                  if (!row.status) handleMarkTaskAsComplete(row.id);
                }}
                disabled={row.status}
                style={row.status ? { opacity: 0.5, cursor: "not-allowed" } : {}}
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
        onRow={(record) => ({
          onClick: () => openEditTask(record),
        })}
      />
    </div>
  );
};

export default TaskList;
