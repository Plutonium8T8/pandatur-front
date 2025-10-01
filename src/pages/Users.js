import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container,
  TextInput,
  Button,
  Menu,
  ActionIcon,
  Text,
  Badge,
  Stack,
  Flex,
} from "@mantine/core";
import { IoMdAdd } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { translations } from "@utils";
import { PageHeader } from "@components";
import UserModal from "../Components/UsersComponent/UserModal";
import UserList from "@components/UsersComponent/UserList";
import EditGroupsListModal from "../Components/UsersComponent/GroupsUsers/EditGroupsListModal";
import CreatePermissionGroupModal from "@components/UsersComponent/Roles/CreatePermissionGroupModal";
import UserFilterModal from "../Components/UsersComponent/UserFilterModal";
import { useUser, useMobile } from "@hooks";
import { hasStrictPermission } from "../Components/utils/permissions";

const language = localStorage.getItem("language") || "RO";

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { userRoles } = useUser();
  const isMobile = useMobile();
  const canCreateUser = hasStrictPermission(userRoles, "USERS", "CREATE", "ALLOWED");
  const canEdit = hasStrictPermission(userRoles, "USERS", "EDIT", "ALLOWED");

  const [editUser, setEditUser] = useState(null);
  const [modals, setModals] = useState({
    user: false,
    groups: false,
    permissions: false,
    filter: false,
  });

  const [filters, setFilters] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const hasActiveFilters =
    (filters.group?.length || 0) > 0 ||
    (filters.role?.length || 0) > 0 ||
    !!filters.status ||
    !!filters.functie;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.users.getTechnicianList();

      const normalized = response.map((item) => {
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
          sipuni_id: item.sipuni_id,
        };
      });

      setUsers(normalized);
    } catch (err) {
      enqueueSnackbar(
        translations["Eroare la încărcarea utilizatorilor"][language],
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const filtersSafe = {
      group: filters.group || [],
      role: filters.role || [],
      status: filters.status || null,
      functie: filters.functie || null,
    };

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(term) ||
        user.surname.toLowerCase().includes(term)

      const matchesGroup =
        filtersSafe.group.length === 0 ||
        user.groups.some((g) => filtersSafe.group.includes(g.name));

      const matchesRole =
        filtersSafe.role.length === 0 ||
        user.permissions.some((p) => filtersSafe.role.includes(p.name));

      const matchesStatus =
        !filtersSafe.status ||
        (filtersSafe.status === "active" && user.status) ||
        (filtersSafe.status === "inactive" && !user.status);

      const matchesJob =
        !filtersSafe.functie || user.jobTitle === filtersSafe.functie;

      return (
        matchesSearch &&
        matchesGroup &&
        matchesRole &&
        matchesStatus &&
        matchesJob
      );
    });
  }, [users, search, filters]);

  return (
    <Container 
      size="xxl" 
      style={{ 
        height: "100%",
        padding: "20px",
        paddingTop: isMobile ? "80px" : "20px"
      }}
    >
      {isMobile ? (
        <Stack gap="md" mb="md">
          {/* Первый ряд: Заголовок, счетчик, три точки, фильтр */}
          <Flex align="center" justify="space-between" w="100%">
            <Flex align="center" gap="8">
              <Text fw={700} size="lg">
                {translations["Utilizatori"][language]}
              </Text>
              <Badge size="md" bg="#0f824c">
                {filtered.length}
              </Badge>
            </Flex>
            <Flex align="center" gap="sm">
              {canEdit && (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon size="md" variant="default">
                      <BsThreeDots />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, groups: true }))}>
                      {translations["Editează grupurile"][language]}
                    </Menu.Item>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, permissions: true }))}>
                      {translations["Editează rolurile"][language]}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
              <ActionIcon
                onClick={() => setModals((m) => ({ ...m, filter: true }))}
                variant={hasActiveFilters ? "filled" : "default"}
                color={hasActiveFilters ? "custom" : "gray"}
                size="md"
              >
                <LuFilter size={16} />
              </ActionIcon>
            </Flex>
          </Flex>

          {/* Второй ряд: Поиск */}
          <TextInput
            placeholder={translations["Căutare utilizator"][language]}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w="100%"
            autoComplete="off"
          />

          {/* Третий ряд: Кнопка добавления */}
          {canCreateUser && (
            <Button
              leftSection={<IoMdAdd size={16} />}
              onClick={() => {
                setEditUser(null);
                setModals((m) => ({ ...m, user: true }));
              }}
              w="100%"
            >
              {translations["Adaugă utilizator"][language]}
            </Button>
          )}
        </Stack>
      ) : (
        <PageHeader
          title={translations["Utilizatori"][language]}
          count={filtered.length}
          extraInfo={
            <>
              {canEdit && (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon size="lg" variant="default">
                      <BsThreeDots />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, groups: true }))}>
                      {translations["Editează grupurile"][language]}
                    </Menu.Item>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, permissions: true }))}>
                      {translations["Editează rolurile"][language]}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
              <ActionIcon
                onClick={() => setModals((m) => ({ ...m, filter: true }))}
                variant={hasActiveFilters ? "filled" : "default"}
                color={hasActiveFilters ? "custom" : "gray"}
                size="36"
              >
                <LuFilter size={16} />
              </ActionIcon>

              <TextInput
                placeholder={translations["Căutare utilizator"][language]}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-300"
                autoComplete="off"
              />

              {canCreateUser && (
                <Button
                  leftSection={<IoMdAdd size={16} />}
                  onClick={() => {
                    setEditUser(null);
                    setModals((m) => ({ ...m, user: true }));
                  }}
                >
                  {translations["Adaugă utilizator"][language]}
                </Button>
              )}
            </>
          }
        />
      )}

      <UserList
        users={filtered}
        loading={loading}
        fetchUsers={loadUsers}
        openEditUser={(user) => {
          setEditUser(user);
          setModals((m) => ({ ...m, user: true }));
        }}
      />

      <UserModal
        opened={modals.user}
        onClose={() => {
          setModals((m) => ({ ...m, user: false }));
          setEditUser(null);
        }}
        initialUser={editUser}
        onUserCreated={loadUsers}
      />

      <EditGroupsListModal
        opened={modals.groups}
        onClose={() => setModals((m) => ({ ...m, groups: false }))}
      />

      <CreatePermissionGroupModal
        opened={modals.permissions}
        onClose={() => setModals((m) => ({ ...m, permissions: false }))}
      />

      <UserFilterModal
        opened={modals.filter}
        onClose={() => setModals((m) => ({ ...m, filter: false }))}
        users={users}
        onApply={setFilters}
      />
    </Container>
  );
};
