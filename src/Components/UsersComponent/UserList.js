import { RcTable } from "../RcTable";
import { Button, Menu, Checkbox, Flex, Card, Text, Stack, Group, Badge, ActionIcon } from "@mantine/core";
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoPencil,
  IoTrash,
} from "react-icons/io5";
import { translations } from "../utils/translations";
import { getLanguageByKey } from "../utils/getLanguageByKey";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import { useState } from "react";
import GroupChangeModal from "./GroupsUsers/GroupChangeModal";
import { useConfirmPopup, useMobile } from "../../hooks";
import PermissionGroupAssignModal from "./Roles/PermissionGroupAssignModal";
import { useUser } from "../../hooks";
import { hasStrictPermission } from "../utils/permissions";
const language = localStorage.getItem("language") || "RO";

const extractId = (u) => u.id?.user?.id || u.id?.id || u.id;

const UserList = ({
  users,
  loading,
  fetchUsers = () => { },
  openEditUser = () => { },
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const { userRoles } = useUser();
  const isMobile = useMobile();
  const canDelete = hasStrictPermission(userRoles, "USERS", "DELETE", "ALLOWED");
  const canEdit = hasStrictPermission(userRoles, "USERS", "EDIT", "ALLOWED");

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
            ? getLanguageByKey("Utilizator dezactivat")
            : getLanguageByKey("Utilizator activat"),
          { variant: "success" },
        );
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la actualizarea statusului"),
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
      enqueueSnackbar(getLanguageByKey("Statuturi actualizate"), {
        variant: "success",
      });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la schimbarea statusului"),
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
        : getLanguageByKey("Sigur doriți să ștergeți utilizatorul?"),
    loading: false,
  });

  const handleDeleteUsersWithConfirm = (userIds) => {
    confirmDeleteUsers(async () => {
      try {
        await api.users.deleteMultipleUsers({ user_ids: userIds });
        enqueueSnackbar(getLanguageByKey("Utilizator șters"), {
          variant: "success",
        });
        fetchUsers();
        if (userIds.length > 1) setSelectedIds([]);
      } catch (err) {
        enqueueSnackbar(getLanguageByKey("Eroare la ștergere"), {
          variant: "error",
        });
      }
    });
  };

  const handleChangeGroup = async (groupName) => {
    try {
      const allGroups = await api.user.getGroupsList();
      const selectedGroup = allGroups.find((g) => g.name === groupName);

      await api.users.updateUsersGroup({
        group_id: selectedGroup.id,
        user_ids: selectedIds,
      });

      enqueueSnackbar(getLanguageByKey("Grup actualizat"), {
        variant: "success",
      });

      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la actualizarea grupului"),
        { variant: "error" }
      );
    }
  };

  const handleAssignPermissionGroup = async (permissionGroupId) => {
    try {
      await api.permissions.batchAssignPermissionGroup(
        permissionGroupId,
        selectedIds,
      );
      enqueueSnackbar(getLanguageByKey("Grup de permisiuni atribuit"), {
        variant: "success",
      });
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar(getLanguageByKey("Eroare la atribuirea grupului"), {
        variant: "error",
      });
    }
  };

  // Мобильный компонент карточки пользователя
  const MobileUserCard = ({ user }) => {
    const userId = extractId(user);
    const isSelected = selectedIds.includes(userId);

    return (
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          opacity: isSelected ? 0.7 : 1,
          borderColor: isSelected ? '#0f824c' : undefined
        }}
      >
        <Flex justify="space-between" align="flex-start" mb="sm">
          <Flex align="center" gap="sm">
            {(canEdit || canDelete) && (
              <Checkbox
                color="var(--crm-ui-kit-palette-link-primary)"
                checked={isSelected}
                onChange={() => toggleSelect(userId)}
              />
            )}
            <Text fw={600} size="sm">
              {user.name} {user.surname}
            </Text>
          </Flex>
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" size="sm">
                <IoEllipsisHorizontal size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {canEdit && (
                <Menu.Item
                  leftSection={<IoCheckmarkCircle size={16} />}
                  onClick={() => toggleUserStatus(user.id, user.status)}
                >
                  {user.status
                    ? getLanguageByKey("Dezactivați")
                    : getLanguageByKey("Activați")}
                </Menu.Item>
              )}
              {canEdit && (
                <Menu.Item
                  leftSection={<IoPencil size={16} />}
                  onClick={() => openEditUser(user)}
                >
                  {getLanguageByKey("Modificați")}
                </Menu.Item>
              )}
              {canDelete && (
                <Menu.Item
                  leftSection={<IoTrash size={16} />}
                  onClick={() => handleDeleteUsersWithConfirm([user.id])}
                  color="red"
                >
                  {getLanguageByKey("Ștergeți")}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Flex>

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="xs" c="dimmed">ID:</Text>
            <Text size="xs">{user.id}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">{getLanguageByKey("Email")}:</Text>
            <Text size="xs" style={{ wordBreak: 'break-word' }}>{user.email || "—"}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">Username:</Text>
            <Text size="xs">{user.username || "—"}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">{getLanguageByKey("Grup")}:</Text>
            <Text size="xs">
              {Array.isArray(user.groups)
                ? user.groups.map((g) => (typeof g === "string" ? g : g.name)).join(", ")
                : "—"}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">{getLanguageByKey("Grup permisiuni")}:</Text>
            <Text size="xs">
              {Array.isArray(user.permissions) && user.permissions.length > 0
                ? user.permissions[0].name
                : "—"}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">{getLanguageByKey("Funcție")}:</Text>
            <Text size="xs">{user.jobTitle || "—"}</Text>
          </Group>

          {user.department && (
            <Group justify="space-between">
              <Text size="xs" c="dimmed">{translations["Departament"]?.[language] || "Departament"}:</Text>
              <Text size="xs">{user.department}</Text>
            </Group>
          )}

          <Group justify="space-between">
            <Text size="xs" c="dimmed">{getLanguageByKey("Status")}:</Text>
            <Badge
              size="xs"
              color={user.status ? "green" : "red"}
            >
              {user.status
                ? getLanguageByKey("Activ")
                : getLanguageByKey("Inactiv")}
            </Badge>
          </Group>

          {user.sipuni_id && (
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Sipuni ID:</Text>
              <Text size="xs">{user.sipuni_id}</Text>
            </Group>
          )}
        </Stack>
      </Card>
    );
  };

  const columns = [
    ...(canEdit || canDelete
      ? [
        {
          title: (
            <Checkbox
              color="var(--crm-ui-kit-palette-link-primary)"
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
                color="var(--crm-ui-kit-palette-link-primary)"
                checked={selectedIds.includes(rowId)}
                onChange={() => toggleSelect(rowId)}
              />
            );
          },
        },
      ]
      : []),
    {
      align: "center",
      title: getLanguageByKey("ID"),
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (id) => id,
    },
    {
      align: "center",
      title: getLanguageByKey("Nume"),
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      align: "center",
      title: getLanguageByKey("Prenume"),
      dataIndex: "surname",
      key: "surname",
      width: 150,
    },
    {
      align: "center",
      title: getLanguageByKey("Email"),
      dataIndex: "email",
      key: "email",
      width: 250,
      render: (email) => <div className="break-word">{email || "—"}</div>,
    },
    {
      align: "center",
      title: getLanguageByKey("Login"),
      dataIndex: "username",
      key: "username",
      width: 250,
      render: (username) => username || "—",
    },
    {
      align: "center",
      title: getLanguageByKey("Grup utilizator"),
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
      title: getLanguageByKey("Grup permisiuni"),
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
      title: getLanguageByKey("Funcție"),
      dataIndex: "job_title",
      key: "job_title",
      width: 200,
      render: (_, row) => row.jobTitle || "—",
    },
    {
      align: "center",
      title: translations["Departament"]?.[language] || "Departament",
      dataIndex: "department",
      key: "department",
      width: 150,
      render: (department) => department || "—",
    },
    {
      align: "center",
      title: getLanguageByKey("Status"),
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) =>
        status
          ? getLanguageByKey("Activ")
          : getLanguageByKey("Inactiv"),
    },
    {
      align: "center",
      title: "Sipuni ID",
      dataIndex: "sipuni_id",
      key: "sipuni_id",
      width: 100,
      render: (sipuni_id) => <Flex justify="center">{sipuni_id || "—"}</Flex>,
    },
    ...(canEdit || canDelete
      ? [
        {
          title: getLanguageByKey("Acțiune"),
          dataIndex: "action",
          key: "action",
          width: 100,
          align: "center",
          render: (_, row) => (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Button
                  variant="default"
                  className="action-button-task"
                  size="xs"
                  p="xs"
                >
                  <IoEllipsisHorizontal size={18} />
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                {canEdit && (
                  <Menu.Item
                    leftSection={<IoCheckmarkCircle size={16} />}
                    onClick={() => toggleUserStatus(row.id, row.status)}
                  >
                    {row.status
                      ? getLanguageByKey("Dezactivați")
                      : getLanguageByKey("Activați")}
                  </Menu.Item>
                )}
                {canEdit && (
                  <Menu.Item
                    leftSection={<IoPencil size={16} />}
                    onClick={() => openEditUser(row)}
                  >
                    {getLanguageByKey("Modificați")}
                  </Menu.Item>
                )}
                {canDelete && (
                  <Menu.Item
                    leftSection={<IoTrash size={16} />}
                    onClick={() => handleDeleteUsersWithConfirm([row.id])}
                    color="red"
                  >
                    {getLanguageByKey("Ștergeți")}
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          ),
        },
      ]
      : []),
  ];

  return (
    <>
      {selectedIds.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canEdit && (
            <Button
              variant="outline"
              color="blue"
              onClick={handleToggleStatusSelected}
              size={isMobile ? "sm" : "md"}
            >
              {getLanguageByKey("Schimbǎ status")}
            </Button>
          )}

          {canEdit && (
            <Button
              // variant="outline"
              onClick={() => setGroupModalOpen(true)}
              size={isMobile ? "sm" : "md"}
            >
              {getLanguageByKey("Schimbă grupul")}
            </Button>
          )}

          {canEdit && (
            <Button
              variant="warning"
              color="grape"
              onClick={() => setPermissionModalOpen(true)}
              size={isMobile ? "sm" : "md"}
            >
              {getLanguageByKey("Schimbǎ grup de permisiuni")}
            </Button>
          )}

          {canDelete && (
            <Button
              variant="danger"
              color="red"
              onClick={() => handleDeleteUsersWithConfirm(selectedIds)}
              size={isMobile ? "sm" : "md"}
            >
              {getLanguageByKey("Șterge")}
            </Button>
          )}
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

      {isMobile ? (
        <div
          style={{
            height: "calc(133.33vh - 400px)", // Компенсируем zoom: 0.75
            overflowY: "auto",
            paddingRight: "8px"
          }}
          className="mobile-scroll-container"
        >
          <Stack gap="md">
            {users.map((user) => (
              <MobileUserCard key={extractId(user)} user={user} />
            ))}
          </Stack>
        </div>
      ) : (
        <div style={{ height: "calc(120vh)" }}>
          <RcTable
            rowKey={(row) => extractId(row)}
            columns={columns}
            data={users}
            loading={loading}
            bordered
            selectedRow={[]}
            pagination={false}
            scroll={{ y: "100%" }}
            onRow={(row) => ({
              onDoubleClick: () => {
                if (canEdit) openEditUser(row);
              },
            })}
          />
        </div>
      )}
    </>
  );
};

export default UserList;
