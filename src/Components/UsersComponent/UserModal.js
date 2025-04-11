import { useEffect, useState, useRef } from "react";
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

const safeParseJson = (str) => {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("error JSON.parse:", err, str);
    }
    return [];
  }
};

const UserModal = ({ opened, onClose, onUserCreated, initialUser = null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(initialFormState);
  const [groupsList, setGroupsList] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [permissionGroupRoles, setPermissionGroupRoles] = useState([]);
  const permissionGroupInitialRolesRef = useRef([]);
  const [customRoles, setCustomRoles] = useState([]);

  useEffect(() => {
    if (initialUser) {
      const permissionGroupId = initialUser.permissions?.[0]?.id?.toString() || null;

      const rawRoles = initialUser?.id?.user?.roles || initialUser?.rawRoles;
      const userRoles = safeParseJson(rawRoles)
        .map((r) => r.replace(/^ROLE_/, ""))
        .filter(Boolean);

      const rawPermissionRoles = initialUser?.permissions?.[0]?.roles;
      const permissionRoles = safeParseJson(rawPermissionRoles)
        .map((r) => r.replace(/^ROLE_/, ""))
        .filter(Boolean);

      setPermissionGroupRoles(permissionRoles);
      permissionGroupInitialRolesRef.current = permissionRoles;

      const onlyCustom = userRoles.filter((r) => !permissionRoles.includes(r));
      setCustomRoles(onlyCustom);

      setForm((prev) => ({
        ...prev,
        permissionGroupId,
        selectedRoles: Array.from(new Set([...onlyCustom, ...permissionRoles])),
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
      }));
    } else {
      setForm(initialFormState);
      setCustomRoles([]);
      setPermissionGroupRoles([]);
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
          permissionGroups = await api.permissions.getAllPermissionGroups();
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

  const handleSelectPermissionGroup = (permissionGroupId) => {
    const selectedGroup = permissionGroups.find(
      (g) => g.permission_id.toString() === permissionGroupId
    );

    const groupRoles = formatRoles(selectedGroup?.roles)
      .map((r) => r.replace(/^ROLE_/, ""))
      .filter(Boolean);

    permissionGroupInitialRolesRef.current = groupRoles;
    setPermissionGroupRoles(groupRoles);

    setForm((prev) => ({
      ...prev,
      permissionGroupId,
      selectedRoles: Array.from(new Set([...customRoles, ...groupRoles])),
    }));
  };

  const handlePermissionGroupChange = (value) => {
    if (!value) {
      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        selectedRoles: customRoles,
      }));
      setPermissionGroupRoles([]);
    } else {
      handleSelectPermissionGroup(value);
    }
  };

  const toggleRole = (role) => {
    setCustomRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );

    setForm((prev) => {
      const nextRoles = prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter((r) => r !== role)
        : [...prev.selectedRoles, role];

      return {
        ...prev,
        selectedRoles: nextRoles,
      };
    });
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
            roles: selectedRoles
              .filter((r) => !permissionGroupRoles.includes(r))
              .map((r) => `ROLE_${r}`),
          }),
        ]);

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_name: groups,
          });
        }

        const hadPermissionBefore = initialUser?.permissions?.length > 0;

        if (!permissionGroupId && hadPermissionBefore) {
          await api.permissions.removePermissionFromTechnician(userId);
        } else if (permissionGroupId) {
          await api.permissions.assignPermissionToUser(permissionGroupId, userId);
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
          await api.permissions.assignPermissionToUser(
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
