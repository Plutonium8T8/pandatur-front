import { RcTable } from "../RcTable";
import { Button, Menu, Checkbox } from "@mantine/core";
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoPencil,
  IoTrash,
} from "react-icons/io5";
import { translations } from "../utils/translations";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import { useState } from "react";
import GroupChangeModal from "./GroupChangeModal";

const UserList = ({
  users,
  loading,
  fetchUsers = () => {},
  handleDeleteUser = () => {},
  openEditUser = () => {},
}) => {
  const language = localStorage.getItem("language") || "RO";
  const { enqueueSnackbar } = useSnackbar();
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const extractId = (u) => u.id?.user?.id || u.id?.id || u.id;
  const allIds = users.map(extractId).filter(Boolean);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : allIds);
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const newStatus = (!currentStatus).toString();
      await api.users.updateTechnician(id, { status: newStatus });
      fetchUsers();
      enqueueSnackbar(
        currentStatus
          ? translations["Utilizator dezactivat"][language]
          : translations["Utilizator activat"][language],
        { variant: "success" },
      );
    } catch (err) {
      console.error("Ошибка при смене статуса:", err);
      enqueueSnackbar(
        translations["Eroare la actualizarea statusului"][language],
        { variant: "error" },
      );
    }
  };

  const handleToggleStatusSelected = async () => {
    try {
      const payload = {
        users: selectedIds.map((id) => {
          const user = users.find((u) => extractId(u) === id);
          return { id, status: !user?.status };
        }),
      };
      await api.users.updateMultipleTechnicians(payload);
      enqueueSnackbar("Статусы обновлены", { variant: "success" });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      enqueueSnackbar("Ошибка при изменении статуса", { variant: "error" });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await api.users.deleteMultipleUsers({ user_ids: selectedIds });
      enqueueSnackbar("Пользователи удалены", { variant: "success" });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      console.error("Ошибка при удалении пользователей:", err);
      enqueueSnackbar("Ошибка при удалении", { variant: "error" });
    }
  };

  const handleChangeGroup = async (group) => {
    try {
      await api.users.updateUsersGroup({
        user_ids: selectedIds,
        group_name: group,
      });
      enqueueSnackbar("Группа обновлена", { variant: "success" });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      console.error("Ошибка при смене группы:", err);
      enqueueSnackbar("Не удалось обновить группу", { variant: "error" });
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={selectedIds.length > 0 && !allSelected}
          onChange={toggleSelectAll}
        />
      ),
      dataIndex: "select",
      key: "select",
      width: 50,
      render: (_, row) => {
        const rowId = extractId(row);
        return (
          <Checkbox
            checked={selectedIds.includes(rowId)}
            onChange={() => toggleSelect(rowId)}
          />
        );
      },
    },
    {
      title: translations["ID"][language],
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => id,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Surname",
      dataIndex: "surname",
      key: "surname",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
    },
    {
      title: translations["Grup"][language],
      dataIndex: "groups",
      key: "groups",
      width: 200,
      render: (groups) =>
        Array.isArray(groups)
          ? groups.map((g) => (typeof g === "string" ? g : g.name)).join(", ")
          : "—",
    },
    {
      title: "Job Title",
      dataIndex: "job_title",
      key: "job_title",
      width: 200,
      render: (_, row) => row.jobTitle || "—",
    },
    {
      title: translations["Status"][language],
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) =>
        status
          ? translations["Activ"][language]
          : translations["Inactiv"][language],
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
              onClick={() => toggleUserStatus(row.id, row.status)}
            >
              {row.status
                ? translations["Dezactivați"][language]
                : translations["Activați"][language]}
            </Menu.Item>

            <Menu.Item
              leftSection={<IoPencil size={16} />}
              onClick={() => openEditUser(row)}
            >
              {translations["Modificați"][language]}
            </Menu.Item>

            <Menu.Item
              leftSection={<IoTrash size={16} />}
              onClick={() => handleDeleteUser(row.id)}
              color="red"
            >
              {translations["Ștergeți"][language]}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <>
      {selectedIds.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Button
            variant="light"
            color="blue"
            onClick={handleToggleStatusSelected}
          >
            {translations["Activați/Inactivați"][language]}
          </Button>
          <Button variant="light" onClick={() => setGroupModalOpen(true)}>
            Сменить группу
          </Button>
          <Button variant="light" color="red" onClick={handleDeleteSelected}>
            {translations["Ștergeți selectați"][language]}
          </Button>
        </div>
      )}

      <GroupChangeModal
        opened={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onConfirm={handleChangeGroup}
        groupOptions={["IT", "Marketing", "HR", "Test"]}
      />

      <RcTable
        columns={columns}
        data={users}
        loading={loading}
        bordered
        selectedRow={[]}
        pagination={false}
        scroll={{ y: "calc(100vh - 300px)" }}
      />
    </>
  );
};

export default UserList;
