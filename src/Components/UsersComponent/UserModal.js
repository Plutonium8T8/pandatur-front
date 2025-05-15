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
import {
  safeParseJson,
  convertMatrixToRoles,
  convertRolesToMatrix,
} from "./rolesUtils";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import RoleMatrix from "./Roles/RoleMatrix";
import { translations } from "../utils/translations";
import { DEFAULT_PHOTO } from "../../app-constants";

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
  const customRolesMatrixRef = useRef({});

  const updateRoleMatrix = (roleKey, level) => {
    const newMatrix = { ...form.roleMatrix };

    if (level === undefined) {
      delete newMatrix[roleKey];
    } else {
      newMatrix[roleKey] = level;
    }

    const newRolesList = convertMatrixToRoles(newMatrix);
    const originalRolesList = permissionGroupInitialRolesRef.current;

    const isChanged =
      newRolesList.some((role) => !originalRolesList.includes(role)) ||
      originalRolesList.some((role) => !newRolesList.includes(role));

    if (form.permissionGroupId && isChanged) {
      if (Object.keys(customRolesMatrixRef.current).length === 0) {
        customRolesMatrixRef.current = { ...newMatrix };
      }

      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        roleMatrix: newMatrix,
      }));
      setPermissionGroupRoles([]);
      setCustomRoles(Object.keys(newMatrix));
    } else {
      setForm((prev) => ({
        ...prev,
        roleMatrix: newMatrix,
      }));
    }
  };

  useEffect(() => {
    if (initialUser) {
      const permissionGroupId = initialUser.permissions?.[0]?.id?.toString() || null;

      const rawRoles = initialUser?.id?.user?.roles || initialUser?.rawRoles;
      const parsedUserRoles = Array.isArray(rawRoles) ? rawRoles : safeParseJson(rawRoles);
      const userRolesMap = convertRolesToMatrix(parsedUserRoles || []);
      customRolesMatrixRef.current = userRolesMap;

      const rawPermissionRoles = initialUser?.permissions?.[0]?.roles;
      const parsedPermissionRoles = Array.isArray(rawPermissionRoles)
        ? rawPermissionRoles
        : safeParseJson(rawPermissionRoles);
      const groupRolesMap = convertRolesToMatrix(parsedPermissionRoles || []);

      const fullMatrix = { ...groupRolesMap, ...userRolesMap };

      setPermissionGroupRoles(parsedPermissionRoles || []);
      permissionGroupInitialRolesRef.current = parsedPermissionRoles || [];
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

    const groupMatrix = convertRolesToMatrix(rawRoles);

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
      const hasCustomChanges = Object.keys(customRolesMatrixRef.current || {}).length > 0;

      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        roleMatrix: hasCustomChanges ? customRolesMatrixRef.current : {},
      }));

      setPermissionGroupRoles([]);
      return;
    }

    handleSelectPermissionGroup(value);
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
        const hadPermissionBefore = initialUser?.permissions?.length > 0;
        const isExitingGroup = !permissionGroupId && hadPermissionBefore;

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
        ]);

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          const selectedGroup = groupsList.find((g) => g.name === groups);
          const group_id = selectedGroup?.id;

          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_id,
          });
        }

        if (isExitingGroup) {
          await api.permissions.removePermissionFromTechnician(userId);
        }

        const userUpdate = { email };
        if (password) userUpdate.password = password;

        const newRoles = convertMatrixToRoles(form.roleMatrix);
        const currentRolesRaw = initialUser?.id?.user?.roles || "[]";
        const currentRoles = Array.isArray(currentRolesRaw)
          ? currentRolesRaw
          : safeParseJson(currentRolesRaw);

        const rolesChanged =
          JSON.stringify(currentRoles.sort()) !== JSON.stringify(newRoles.sort());

        if (rolesChanged && !permissionGroupId) {
          userUpdate.roles = newRoles;
        }

        await api.users.updateUser(userId, userUpdate);

        if (permissionGroupId) {
          await api.users.updateUser(userId, { roles: [] });

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
            ...(permissionGroupId ? {} : { roles: convertMatrixToRoles(form.roleMatrix) }),
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

          {initialUser && (
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
