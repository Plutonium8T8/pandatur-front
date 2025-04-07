import { useEffect, useState } from "react";
import { Text, TextInput, Button, Flex, Menu } from "@mantine/core";
import { api } from "../../api";
import UserModal from "./UserModal";
import UserList from "./UserList";
import { translations } from "../utils/translations";
import { useSnackbar } from "notistack";
import EditGroupsListModal from "./GroupsUsers/EditGroupsListModal";
import CreatePermissionGroupModal from "./Roles/CreatePermissionGroupModal";

const language = localStorage.getItem("language") || "RO";

const UsersComponent = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editGroupsOpen, setEditGroupsOpen] = useState(false);
  const [createPermissionModalOpen, setCreatePermissionModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchUsers = async () => {
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
        };
      });

      setUsers(normalized);
      setFiltered(normalized);
    } catch (err) {
      enqueueSnackbar(
        translations["Eroare la încărcarea utilizatorilor"][language],
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!search) return setFiltered(users);

    const s = search.toLowerCase();
    setFiltered(
      users.filter(
        (user) =>
          user.name?.toLowerCase().includes(s) ||
          user.surname?.toLowerCase().includes(s) ||
          user.email?.toLowerCase().includes(s)
      )
    );
  }, [search, users]);

  return (
    <div className="task-container">
      <Flex justify="space-between" align="center" mb="md">
        <Text size="lg" fw={700}>
          {translations["Utilizatori"][language]} ({filtered.length})
        </Text>
        <Flex gap="sm">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="default">⋯</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setEditGroupsOpen(true)}>
                {translations["Editează grupurile"]?.[language]}
              </Menu.Item>
              <Menu.Item onClick={() => setCreatePermissionModalOpen(true)}>
                {translations["Editează rolurile"]?.[language]}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            onClick={() => {
              setEditUser(null);
              setOpened(true);
            }}
          >
            {translations["Adaugă utilizator"][language]}
          </Button>
        </Flex>
      </Flex>

      <TextInput
        placeholder={translations["Căutare utilizator"][language]}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb="md"
        autoComplete="off"
        name="search-user-field"
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
    </div>
  );
};

export default UsersComponent;
