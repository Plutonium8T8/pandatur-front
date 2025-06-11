import { useState, useMemo } from "react";
import { RcTable } from "../../RcTable";
import { FaFingerprint } from "react-icons/fa6";
import { Checkbox } from "../../Checkbox";
import { translations } from "../../utils/translations";
import { TypeTask } from "../OptionsTaskType";
import { useSnackbar } from "notistack";
import { api } from "../../../api";
import { Menu, Button, Flex } from "@mantine/core";
import { Link } from "react-router-dom";
import { Tag } from "../../Tag";
import { WorkflowTag } from "../../Workflow/components/WorkflowTag";
import { useConfirmPopup, useUser } from "../../../hooks";
import dayjs from "dayjs";
import "./TaskList.css";
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoTrash,
  IoPencil,
} from "react-icons/io5";
import { useSameTeamChecker } from "../../utils/useSameTeamChecker";
import Can from "../../CanComponent/Can";

const language = localStorage.getItem("language") || "RO";

const TaskList = ({
  tasks = [],
  userList = [],
  loading = false,
  openEditTask,
  fetchTasks,
}) => {
  const [selectedRow, setSelectedRow] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUser();
  const currentUserId = user?.id?.toString();

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

  const ActionMenu = ({ row }) => {
    const isSameTeam = useSameTeamChecker(String(row.created_for));

    return (
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <Button variant="default" className="action-button-task" size="xs" p="xs">
            <IoEllipsisHorizontal size={18} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Can
            permission={{ module: "TASK", action: "EDIT" }}
            context={{
              responsibleId: String(row.created_for),
              currentUserId,
              isSameTeam,
            }}
          >
            <Menu.Item
              leftSection={<IoCheckmarkCircle size={16} />}
              onClick={() => !row.status && handleMarkTaskAsComplete(row.id)}
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
          </Can>

          <Can
            permission={{ module: "TASK", action: "DELETE" }}
            context={{
              responsibleId: String(row.created_for),
              currentUserId,
              isSameTeam,
            }}
          >
            <Menu.Item
              leftSection={<IoTrash size={16} />}
              onClick={() => handleDeleteTask(row.id)}
              color="red"
            >
              {translations["Ștergeți"][language]}
            </Menu.Item>
          </Can>
        </Menu.Dropdown>
      </Menu>
    );
  };

  const allSelected = tasks.length > 0 && selectedRow.length === tasks.length;

  const columns = useMemo(
    () => [
      {
        width: 50,
        key: "checkbox",
        align: "center",
        title: (
          <Checkbox
            checked={allSelected}
            indeterminate={
              selectedRow.length > 0 && selectedRow.length < tasks.length
            }
            onChange={() => {
              setSelectedRow(allSelected ? [] : tasks.map((t) => t.id));
            }}
          />
        ),
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
        title: translations["Deadline"][language],
        dataIndex: "scheduled_time",
        key: "scheduled_time",
        width: 180,
        align: "center",
        render: (date) => {
          const parsed = dayjs(date, "DD-MM-YYYY HH:mm:ss");
          if (!parsed.isValid()) return "Invalid Date";

          const today = dayjs().startOf("day");
          const isToday = parsed.isSame(today, "day");
          const isPast = parsed.isBefore(today);

          const color = isPast ? "#d32f2f" : isToday ? "#2e7d32" : "#000000";

          return (
            <span style={{ color, fontWeight: 500 }}>
              {parsed.format("DD.MM.YYYY HH:mm")}
            </span>
          );
        },
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
        title: translations["Lead ID"][language],
        dataIndex: "ticket_id",
        key: "ticket_id",
        width: 120,
        align: "center",
        render: (ticketId) => (
          <Link to={`/tasks/${ticketId}`}>
            <Flex justify="center" gap="8" align="center">
              <FaFingerprint />
              {ticketId}
            </Flex>
          </Link>
        ),
      },
      {
        title: translations["Workflow"][language],
        dataIndex: "workflow",
        key: "workflow",
        width: 160,
        align: "center",
        render: (value) => <WorkflowTag type={value} />,
      },
      {
        title: translations["groupTitle"][language],
        dataIndex: "group_title",
        key: "group_title",
        width: 120,
        align: "center",
        render: (value) => <Tag type="default">{value}</Tag>,
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
          <Tag type={status ? "success" : "danger"}>
            {status
              ? translations["done"][language]
              : translations["toDo"][language]}
          </Tag>
        ),
      },
      {
        title: translations["Acțiune"][language],
        dataIndex: "action",
        key: "action",
        width: 100,
        align: "center",
        render: (_, row) => <ActionMenu row={row} />,
      }
    ],
    [language, selectedRow, currentUserId, allSelected, tasks]
  );

  return (
    <RcTable
      rowKey={({ id }) => id}
      columns={columns}
      data={tasks}
      selectedRow={selectedRow}
      loading={loading}
      bordered
      scroll={{ y: "calc(100vh - 200px)" }}
    />
  );
};

export default TaskList;
