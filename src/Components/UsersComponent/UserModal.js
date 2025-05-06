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
  Loader
} from "@mantine/core";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import RoleMatrix from "./Roles/RoleMatrix";
import { translations } from "../utils/translations";
import { DEFAULT_PHOTO } from "../../app-constants";
import { LEVEL_VALUES } from "../utils/permissionConstants";

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
  roleMatrix: {},
  sipuni_id: "",
};

const safeParseJson = (str) => {
  if (typeof str !== "string") return [];
  try {
    return JSON.parse(str);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRoleMatrix = (roleKey, level) => {
    setForm((prev) => ({
      ...prev,
      roleMatrix: {
        ...prev.roleMatrix,
        [roleKey]: level,
      },
    }));
  };

  useEffect(() => {
    if (initialUser) {
      const permissionGroupId = initialUser.permissions?.[0]?.id?.toString() || null;

      const rawRoles = initialUser?.id?.user?.roles || initialUser?.rawRoles;
      let userRolesMap = {};

      let parsedRoles = safeParseJson(rawRoles);
      if (typeof parsedRoles === "string") {
        parsedRoles = safeParseJson(parsedRoles);
      }

      if (Array.isArray(parsedRoles)) {
        parsedRoles.forEach((roleStr) => {
          const withoutPrefix = roleStr.replace(/^ROLE_/, "");
          const parts = withoutPrefix.split("_");
          const level = parts.pop();
          const key = parts.join("_");

          const readable = Object.keys(LEVEL_VALUES).find(
            (k) => LEVEL_VALUES[k] === level.toUpperCase()
          );

          if (readable) {
            userRolesMap[key] = readable;
          }
        });
      }

      const rawPermissionRoles = initialUser?.permissions?.[0]?.roles;
      const permissionRoles = safeParseJson(rawPermissionRoles);
      const matrix = {};

      if (Array.isArray(permissionRoles)) {
        permissionRoles.forEach((roleStr) => {
          const withoutPrefix = roleStr.replace(/^ROLE_/, "");
          const parts = withoutPrefix.split("_");
          const level = parts.pop();
          const key = parts.join("_");

          const readable = Object.keys(LEVEL_VALUES).find(
            (k) => LEVEL_VALUES[k] === level.toUpperCase()
          );

          if (readable) {
            matrix[key] = readable;
          }
        });
      }

      const fullMatrix = { ...matrix, ...userRolesMap };

      setPermissionGroupRoles(permissionRoles || []);
      permissionGroupInitialRolesRef.current = permissionRoles || [];
      setCustomRoles(Object.keys(userRolesMap));

      setForm((prev) => ({
        ...prev,
        permissionGroupId,
        roleMatrix: fullMatrix,
        name: initialUser.name || "",
        surname: initialUser.surname || "",
        username: initialUser.username || "",
        email: initialUser.email || "",
        job_title: initialUser.job_title || initialUser.jobTitle || "",
        sipuni_id: initialUser.sipuni_id || "",
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
            translations["Eroare la încărcarea grupurilor de utilizatori"][
            language
            ],
            { variant: "error" },
          );
        }

        try {
          permissionGroups = await api.permissions.getAllPermissionGroups();
          setPermissionGroups(permissionGroups);
        } catch (e) {
          enqueueSnackbar(
            translations["Eroare la încărcarea grupurilor de permisiuni"][
            language
            ],
            { variant: "error" },
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

    if (!selectedGroup) return;

    const rawRoles = typeof selectedGroup.roles === "string"
      ? safeParseJson(selectedGroup.roles)
      : selectedGroup.roles || [];

    const groupMatrix = {};

    rawRoles.forEach((roleStr) => {
      const withoutPrefix = roleStr.replace(/^ROLE_/, "");
      const parts = withoutPrefix.split("_");
      const levelRaw = parts.pop();
      const key = parts.join("_");

      const readableLevel = Object.keys(LEVEL_VALUES).find(
        (k) => LEVEL_VALUES[k].toUpperCase() === levelRaw.toUpperCase()
      ) || "Denied";

      groupMatrix[key] = readableLevel;
    });

    permissionGroupInitialRolesRef.current = rawRoles;
    setPermissionGroupRoles(rawRoles);

    setForm((prev) => ({
      ...prev,
      permissionGroupId,
      roleMatrix: groupMatrix,
    }));
  };

  const handlePermissionGroupChange = (value) => {
    if (!value) {
      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        roleMatrix: {},
      }));
      setPermissionGroupRoles([]);
    } else {
      handleSelectPermissionGroup(value);
    }
  };

  const convertMatrixToRoles = (matrix) => {
    return Object.entries(matrix).map(([key, level]) => {
      const levelValue = LEVEL_VALUES[level] || "DENIED";
      return `ROLE_${key.toUpperCase()}_${levelValue}`;
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
      sipuni_id,
    } = form;

    if (!initialUser) {
      if (
        !name ||
        !surname ||
        !username ||
        !email ||
        !password ||
        !job_title ||
        !groups ||
        !sipuni_id
      ) {
        enqueueSnackbar(
          translations["Completați toate câmpurile obligatorii"][language],
          { variant: "warning" }
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (initialUser) {
        const technicianId = initialUser.id?.id || initialUser.id;
        const userId = initialUser.id?.user?.id || initialUser.id;

        await Promise.all([
          api.users.updateTechnician(technicianId, {
            status: status.toString(),
            job_title,
            sipuni_id,
          }),
          api.users.updateExtended(technicianId, {
            name,
            surname,
          }),
          api.users.updateUser(userId, {
            email,
            ...(password ? { password } : {}),
            roles: JSON.stringify(convertMatrixToRoles(form.roleMatrix)),
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

        enqueueSnackbar(
          translations["Utilizator actualizat cu succes"][language],
          { variant: "success" }
        );
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
            sipuni_id,
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

        enqueueSnackbar(
          translations["Utilizator creat cu succes"][language],
          { variant: "success" }
        );
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
    } finally {
      setIsSubmitting(false);
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
      size="xl"
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
                rightSection={groupsLoading ? <Loader size="xs" /> : null}
              />

              <TextInput
                label={translations["Funcție"][language]}
                placeholder={translations["Funcție"][language]}
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                required
              />

              <TextInput
                label="Sipuni ID"
                placeholder="Sipuni ID"
                value={form.sipuni_id}
                onChange={(e) => setForm({ ...form, sipuni_id: e.target.value })}
                required
              />

              {!initialUser && null}

              {initialUser && permissionGroups.length > 0 && (
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
                  rightSection={groupsLoading ? <Loader size="xs" /> : null}
                />
              )}

              {initialUser && (
                <RoleMatrix
                  key={form.permissionGroupId}
                  permissions={form.roleMatrix}
                  onChange={updateRoleMatrix}
                />
              )}
            </>
          )}

          <Button fullWidth mt="sm" onClick={handleCreate} loading={isSubmitting}>
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
