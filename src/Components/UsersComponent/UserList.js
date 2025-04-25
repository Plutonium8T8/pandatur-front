import { RcTable } from "../RcTable";
import { Button, Menu, Checkbox, Flex } from "@mantine/core";
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
import GroupChangeModal from "./GroupsUsers/GroupChangeModal";
import { useConfirmPopup } from "../../hooks";
import PermissionGroupAssignModal from "./Roles/PermissionGroupAssignModal";

const language = localStorage.getItem("language") || "RO";

const extractId = (u) => u.id?.user?.id || u.id?.id || u.id;

const UserList = ({
  users,
  loading,
  fetchUsers = () => {},
  openEditUser = () => {},
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

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
          const newStatus = (!user?.status).toString();
          return { id, status: newStatus };
        }),
      };

      await api.users.updateMultipleTechnicians(payload);
      enqueueSnackbar(translations["Statuturi actualizate"][language], {
        variant: "success",
      });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar(
        translations["Eroare la schimbarea statusului"][language],
        { variant: "error" },
      );
    }
  };

  const confirmDeleteUsers = useConfirmPopup({
    subTitle:
      selectedIds.length > 1
        ? translations["Sigur doriți să ștergeți utilizatorii selectați?"][
            language
          ]
        : translations["Sigur doriți să ștergeți utilizatorul?"][language],
    loading: false,
  });

  const handleDeleteUsersWithConfirm = (userIds) => {
    confirmDeleteUsers(async () => {
      try {
        await api.users.deleteMultipleUsers({ user_ids: userIds });
        enqueueSnackbar(translations["Utilizator șters"][language], {
          variant: "success",
        });
        fetchUsers();
        if (userIds.length > 1) setSelectedIds([]);
      } catch (err) {
        enqueueSnackbar(translations["Eroare la ștergere"][language], {
          variant: "error",
        });
      }
    });
  };

  const handleChangeGroup = async (group) => {
    try {
      await api.users.updateUsersGroup({
        user_ids: selectedIds,
        group_name: group,
      });
      enqueueSnackbar(translations["Grup actualizat"][language], {
        variant: "success",
      });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar(
        translations["Eroare la actualizarea grupului"][language],
        { variant: "error" },
      );
    }
  };

  const handleAssignPermissionGroup = async (permissionGroupId) => {
    try {
      await api.permissions.batchAssignPermissionGroup(
        permissionGroupId,
        selectedIds,
      );
      enqueueSnackbar(translations["Grup de permisiuni atribuit"][language], {
        variant: "success",
      });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar(translations["Eroare la atribuirea grupului"][language], {
        variant: "error",
      });
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
      align: "center",
      title: translations["ID"][language],
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (id) => id,
    },
    {
      align: "center",
      title: translations["Nume"][language],
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      align: "center",
      title: translations["Prenume"][language],
      dataIndex: "surname",
      key: "surname",
      width: 150,
    },
    {
      align: "center",
      title: translations["Email"][language],
      dataIndex: "email",
      key: "email",
      width: 250,
      render: (email) => <div className="break-word">{email}</div>,
    },
    {
      align: "center",
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
      align: "center",
      title: translations["Grup permisiuni"][language],
      dataIndex: "permissions",
      key: "permissions",
      width: 200,
      render: (permissions) =>
        Array.isArray(permissions) && permissions.length > 0
          ? permissions[0].name
          : "—",
    },
    {
      align: "center",
      title: translations["Funcție"][language],
      dataIndex: "job_title",
      key: "job_title",
      width: 200,
      render: (_, row) => row.jobTitle || "—",
    },
    {
      align: "center",
      title: translations["Status"][language],
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) =>
        status
          ? translations["Activ"][language]
          : translations["Inactiv"][language],
    },
    {
      align: "center",
      title: "Sipuni ID",
      dataIndex: "sipuni_id",
      key: "sipuni_id",
      width: 120,
      render: (sipuni_id) => <Flex justify="center">{sipuni_id || "—"}</Flex>,
    },
    {
      title: translations["Acțiune"][language],
      dataIndex: "action",
      key: "action",
      width: 100,
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
              onClick={() => handleDeleteUsersWithConfirm([row.id])}
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
            {translations["Schimbǎ status"][language]}
          </Button>
          <Button variant="light" onClick={() => setGroupModalOpen(true)}>
            {translations["Schimbă grupul"][language]}
          </Button>
          <Button
            variant="light"
            color="grape"
            onClick={() => setPermissionModalOpen(true)}
          >
            {translations["Schimbǎ grup de permisiuni"][language]}
          </Button>
          <Button
            variant="light"
            color="red"
            onClick={() => handleDeleteUsersWithConfirm(selectedIds)}
          >
            {translations["Șterge"][language]}
          </Button>
        </div>
      )}

      <GroupChangeModal
        opened={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onConfirm={handleChangeGroup}
      />

      <PermissionGroupAssignModal
        opened={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onConfirm={handleAssignPermissionGroup}
      />

      <RcTable
        rowKey={(row) => extractId(row)}
        columns={columns}
        data={users}
        loading={loading}
        bordered
        selectedRow={[]}
        pagination={false}
        scroll={{ y: "calc(100vh - 200px)" }}
      />
    </>
  );
};

export default UserList;
