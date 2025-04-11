import { useEffect, useState, useCallback, useMemo } from "react";
import { TextInput, Button, Menu, ActionIcon, Container } from "@mantine/core";
import { IoMdAdd } from "react-icons/io";
import { BsThreeDots } from "react-icons/bs";
import { api } from "../../api";
import UserModal from "./UserModal";
import UserList from "./UserList";
import { translations } from "../utils/translations";
import { useSnackbar } from "notistack";
import EditGroupsListModal from "./GroupsUsers/EditGroupsListModal";
import CreatePermissionGroupModal from "./Roles/CreatePermissionGroupModal";
import { PageHeader } from "../PageHeader";

const language = localStorage.getItem("language") || "RO";

const UsersComponent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editGroupsOpen, setEditGroupsOpen] = useState(false);
  const [createPermissionModalOpen, setCreatePermissionModalOpen] =
    useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.users.getTechnicianList();
      const normalized = data.map((item) => {
        const personal = item.id || {};
        const user = personal.user || {};
        return {
          id: personal.id,
          name: personal.name || "-",
          surname: personal.surname || "-",
          username: user.username || "-",
          email: user.email || "-",
          groups: item.groups || [],
          jobTitle: item.job_title,
          status: item.status,
          permissions: item.permissions || [],
          rawRoles: user.roles || "[]",
        };
      });

      setUsers(normalized);
    } catch (err) {
      enqueueSnackbar(
        translations["Eroare la încărcarea utilizatorilor"][language],
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(s) ||
        user.surname?.toLowerCase().includes(s) ||
        user.email?.toLowerCase().includes(s),
    );
  }, [users, search]);

  return (
    <Container p="20" size="xxl" style={{ height: "100%" }}>
      <PageHeader
        extraInfo={
          <>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon size="lg" variant="default">
                  <BsThreeDots />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setEditGroupsOpen(true)}>
                  {translations["Editează grupurile"][language]}
                </Menu.Item>
                <Menu.Item onClick={() => setCreatePermissionModalOpen(true)}>
                  {translations["Editează rolurile"][language]}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <TextInput
              className="min-w-300"
              placeholder={translations["Căutare utilizator"][language]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            <Button
              leftSection={<IoMdAdd size={16} />}
              onClick={() => {
                setEditUser(null);
                setOpened(true);
              }}
            >
              {translations["Adaugă utilizator"][language]}
            </Button>
          </>
        }
        title={translations["Utilizatori"][language]}
        count={filtered.length}
      />

      <UserList
        users={filtered}
        loading={loading}
        fetchUsers={fetchUsers}
        openEditUser={(user) => {
          setEditUser(user);
          setOpened(true);
        }}
      />

      <UserModal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditUser(null);
        }}
        onUserCreated={fetchUsers}
        initialUser={editUser}
      />

      <EditGroupsListModal
        opened={editGroupsOpen}
        onClose={() => setEditGroupsOpen(false)}
      />

      <CreatePermissionGroupModal
        opened={createPermissionModalOpen}
        onClose={() => setCreatePermissionModalOpen(false)}
      />
    </Container>
  );
};

export default UsersComponent;
