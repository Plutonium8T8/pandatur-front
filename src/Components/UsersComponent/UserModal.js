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
  Loader,
} from "@mantine/core";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import RolesComponent from "./Roles/RolesComponent";
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
};

const UserModal = ({ opened, onClose, onUserCreated, initialUser = null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(initialFormState);
  const [groupsList, setGroupsList] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setForm({
        name: initialUser.name || "",
        surname: initialUser.surname || "",
        username: initialUser.username || "",
        email: initialUser.email || "",
        password: "",
        job_title: initialUser.job_title || initialUser.jobTitle || "",
        status: Boolean(initialUser.status),
        groups:
          typeof initialUser.groups?.[0] === "string"
            ? initialUser.groups[0]
            : initialUser.groups?.[0]?.name || "",
      });
    } else {
      setForm(initialFormState);
    }
  }, [initialUser, opened]);

  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const data = await api.user.getGroupsList();
        setGroupsList(data);
      } catch (err) {
        console.error("Ошибка при загрузке групп", err);
      } finally {
        setGroupsLoading(false);
      }
    };

    if (opened) fetchGroups();
  }, [opened]);

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
    } = form;

    if (!initialUser) {
      if (
        !name ||
        !surname ||
        !username ||
        !email ||
        !password ||
        !job_title ||
        !groups
      ) {
        enqueueSnackbar(
          translations["Completați toate câmpurile obligatorii"][language],
          { variant: "warning" }
        );
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
          api.users.updateUsernameAndEmail(userId, { email }),
        ]);

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_name: groups,
          });
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
            roles: ["ROLE_USER", "ROLE_TECHNICIAN"],
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

        await api.users.createTechnicianUser(payload);
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

          {groupsLoading ? (
            <Loader />
          ) : (
            <Select
              label={translations["Grup utilizator"][language]}
              placeholder={translations["Alege grupul"][language]}
              data={groupsList.map((g) => ({ value: g.name, label: g.name }))}
              value={
                groupsList.map((g) => g.name).includes(form.groups)
                  ? form.groups
                  : null
              }
              onChange={(value) => setForm({ ...form, groups: value || "" })}
              required
            />
          )}

          <TextInput
            label={translations["Funcție"][language]}
            placeholder={translations["Funcție"][language]}
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            required
          />

          {initialUser && (
            <RolesComponent
              employee={{
                id: initialUser.id?.user?.id || initialUser.id,
                name: initialUser.name,
              }}
            />
          )}

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
