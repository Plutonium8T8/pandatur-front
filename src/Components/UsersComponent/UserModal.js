import { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Stack,
  TextInput,
  Switch,
  Avatar,
  Group,
  Select,
  PasswordInput,
} from "@mantine/core";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import RoleMatrix from "./Roles/RoleMatrix";
import { translations } from "../utils/translations";
import { DEFAULT_PHOTO } from "../../app-constants";
import { formatRoles } from "../utils/formatRoles";

const language = localStorage.getItem("language") || "RO";

const initialFormState = {
  name: "",
  surname: "",
  username: "",
  email: "",
  password: "",
  job_title: "",
  status: false,
  groups: "",
  permissionGroupId: null,
  selectedRoles: [],
};

const UserModal = ({ opened, onClose, onUserCreated, initialUser = null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(initialFormState);
  const [groupsList, setGroupsList] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    if (initialUser) {
      const permissionGroupId =
        initialUser.permissions?.[0]?.id?.toString() || null;

      let selectedRoles = [];

      try {
        const rawRoles = initialUser?.id?.user?.roles;

        if (rawRoles) {
          const parsed = JSON.parse(rawRoles);
          if (Array.isArray(parsed)) {
            selectedRoles = parsed
              .map((role) => role.replace(/^ROLE_/, ""))
              .filter(Boolean);
          }
        }
      } catch (e) {
        console.warn("Ошибка парсинга user.roles:", e);
      }

      // Если роли из user пустые — пробуем из permission
      if (
        selectedRoles.length === 0 &&
        initialUser?.permissions?.[0]?.roles
      ) {
        try {
          const parsed = JSON.parse(initialUser.permissions[0].roles);
          if (Array.isArray(parsed)) {
            selectedRoles = parsed
              .map((role) => role.replace(/^ROLE_/, ""))
              .filter(Boolean);
          }
        } catch (e) {
          console.warn("Ошибка парсинга permissions.roles:", e);
        }
      }

      setForm({
        ...initialFormState,
        name: initialUser.name || "",
        surname: initialUser.surname || "",
        username: initialUser.username || "",
        email: initialUser.email || "",
        job_title: initialUser.job_title || initialUser.jobTitle || "",
        status: Boolean(initialUser.status),
        groups:
          typeof initialUser.groups?.[0] === "string"
            ? initialUser.groups[0]
            : initialUser.groups?.[0]?.name || "",
        permissionGroupId,
        selectedRoles,
      });
    } else {
      setForm(initialFormState);
    }
  }, [initialUser, opened]);

  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        let userGroups = [];
        let permissionGroups = [];

        try {
          userGroups = await api.user.getGroupsList();
          setGroupsList(userGroups);
        } catch (e) {
          enqueueSnackbar(
            translations["Eroare la încărcarea grupurilor de utilizatori"][language],
            { variant: "error" }
          );
        }

        try {
          permissionGroups = await api.users.getAllPermissionGroups();
          setPermissionGroups(permissionGroups);
        } catch (e) {
          enqueueSnackbar(
            translations["Eroare la încărcarea grupurilor de permisiuni"][language],
            { variant: "error" }
          );
        }
      } finally {
        setGroupsLoading(false);
      }
    };

    if (opened) fetchGroups();
  }, [opened]);

  const handlePermissionGroupChange = (value) => {
    if (!value) {
      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        selectedRoles: [],
      }));
    } else {
      handleSelectPermissionGroup(value);
    }
  };

  const handleSelectPermissionGroup = (permissionGroupId) => {
    const selected = permissionGroups.find(
      (g) => g.permission_id.toString() === permissionGroupId
    );
    const roles = formatRoles(selected?.roles)
      .map((r) => r.replace(/^ROLE_/, ""))
      .filter(Boolean);
    setForm((prev) => ({
      ...prev,
      permissionGroupId,
      selectedRoles: roles,
    }));
  };

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter((r) => r !== role)
        : [...prev.selectedRoles, role],
    }));
  };

  const handleCreate = async () => {
    const {
      name,
      surname,
      username,
      email,
      password,
      job_title,
      status,
      groups,
      permissionGroupId,
      selectedRoles,
    } = form;

    if (!initialUser) {
      if (!name || !surname || !username || !email || !password || !job_title || !groups) {
        enqueueSnackbar(translations["Completați toate câmpurile obligatorii"][language], {
          variant: "warning",
        });
        return;
      }
    }

    try {
      if (initialUser) {
        const technicianId = initialUser.id?.id || initialUser.id;
        const userId = initialUser.id?.user?.id || initialUser.id;

        await Promise.all([
          api.users.updateTechnician(technicianId, {
            status: status.toString(),
            job_title,
          }),
          api.users.updateExtended(technicianId, {
            name,
            surname,
          }),
          api.users.updateUser(userId, {
            email,
            roles: selectedRoles.map((r) => `ROLE_${r}`),
          }),
        ]);

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_name: groups,
          });
        }

        // 👉 Обработка удаления или назначения permission group
        const hadPermissionBefore = initialUser?.permissions?.length > 0;

        if (!permissionGroupId && hadPermissionBefore) {
          await api.users.removePermissionFromTechnician(userId);
        } else if (permissionGroupId) {
          await api.users.assignPermissionToUser(permissionGroupId, userId);
        }

        enqueueSnackbar(translations["Utilizator actualizat cu succes"][language], {
          variant: "success",
        });
      } else {
        const payload = {
          user: {
            username,
            email,
            password,
            roles: [],
          },
          extended: {
            name,
            surname,
          },
          technician: {
            status: status.toString(),
            job_title,
          },
          groups: [groups],
        };

        const { id: createdUser } = await api.users.createTechnicianUser(payload);

        if (permissionGroupId) {
          await api.users.assignPermissionToUser(
            permissionGroupId,
            createdUser?.user?.id
          );
        }

        enqueueSnackbar(translations["Utilizator creat cu succes"][language], {
          variant: "success",
        });
      }

      setForm(initialFormState);
      onClose();
      onUserCreated();
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      const fallbackMessage =
        translations["Eroare la salvarea utilizatorului"][language];
      enqueueSnackbar(serverMessage || fallbackMessage, { variant: "error" });
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title={
        initialUser
          ? translations["Modificați utilizator"][language]
          : translations["Adaugă utilizator"][language]
      }
      padding="md"
      size="lg"
    >
      <Group align="flex-start" spacing="xl">
        <Avatar src={DEFAULT_PHOTO} size={120} />

        <Stack style={{ flex: 1 }}>
          <Switch
            label={translations["Activ"][language]}
            checked={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.currentTarget.checked })
            }
            required
          />

          <TextInput
            label={translations["Nume"][language]}
            placeholder={translations["Nume"][language]}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <TextInput
            label={translations["Prenume"][language]}
            placeholder={translations["Prenume"][language]}
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
            required
          />

          {!initialUser && (
            <TextInput
              label={translations["Login"][language]}
              placeholder={translations["Login"][language]}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          )}

          <TextInput
            type="email"
            label={translations["Email"][language]}
            placeholder={translations["Email"][language]}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="off"
            required
          />

          <PasswordInput
            label={translations["password"][language]}
            placeholder={translations["password"][language]}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!initialUser}
            autoComplete="new-password"
            name="new-password-field"
          />

          {groupsList.length > 0 && (
            <>
              <Select
                label={translations["Grup utilizator"][language]}
                placeholder={translations["Alege grupul"][language]}
                data={groupsList.map((g) => ({ value: g.name, label: g.name }))}
                value={form.groups}
                onChange={(value) => setForm({ ...form, groups: value || "" })}
                required
              />

              {initialUser && (
                <>
                  {permissionGroups.length > 0 && (
                    <Select
                      clearable
                      label={translations["Grup permisiuni"][language]}
                      placeholder={translations["Alege grupul de permisiuni"][language]}
                      data={permissionGroups.map((g) => ({
                        value: g.permission_id.toString(),
                        label: g.permission_name,
                      }))}
                      value={form.permissionGroupId}
                      onChange={handlePermissionGroupChange}
                    />
                  )}

                  <RoleMatrix
                    selectedRoles={form.selectedRoles}
                    onToggle={toggleRole}
                  />
                </>
              )}
            </>
          )}

          <TextInput
            label={translations["Funcție"][language]}
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            required
          />

          <Button fullWidth mt="sm" onClick={handleCreate}>
            {initialUser
              ? translations["Salvează"][language]
              : translations["Creează"][language]}
          </Button>
        </Stack>
      </Group>
    </Drawer>
  );
};

export default UserModal;
