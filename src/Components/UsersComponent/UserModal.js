import { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Stack,
  TextInput,
  Switch,
  Avatar,
  Group,
  ActionIcon,
  Select,
} from "@mantine/core";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import { IoEye, IoEyeOff } from "react-icons/io5";
import RolesComponent from "./RolesComponent";
import { GroupUsersOptions } from "./GroupUsersOptions";
import { translations } from "../utils/translations";

const UserModal = ({ opened, onClose, onUserCreated, initialUser = null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const language = localStorage.getItem("language") || "RO";

  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    job_title: "",
    status: false,
    groups: "",
  });

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
      setForm({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
        job_title: "",
        status: false,
        groups: "",
      });
    }
  }, [initialUser, opened]);

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
          {
            variant: "warning",
          },
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
          api.users.updateUsernameAndEmail(userId, {
            email,
          }),
        ]);

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_name: groups,
          });
        }

        enqueueSnackbar(
          translations["Utilizator actualizat cu succes"][language],
          { variant: "success" },
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
        enqueueSnackbar(translations["Utilizator creat cu succes"][language], {
          variant: "success",
        });
      }

      setForm({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
        job_title: "",
        status: false,
        groups: "",
      });

      onClose();
      onUserCreated();
    } catch (err) {
      console.error("Ошибка при сохранении пользователя:", err);

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
        <Avatar
          src="https://storage.googleapis.com/pandatur_bucket/utils/icon-5359554_640.webp"
          size={120}
        />

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
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <TextInput
            label={translations["Prenume"][language]}
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
            required
          />

          {!initialUser && (
            <TextInput
              label={translations["Login"][language]}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          )}

          <TextInput
            label={translations["Email"][language]}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <TextInput
            label={translations["password"][language]}
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!initialUser}
            rightSection={
              <ActionIcon
                variant="subtle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
              </ActionIcon>
            }
          />

          <Select
            label={translations["Grup utilizator"][language]}
            placeholder={translations["Alege grupul"][language]}
            data={GroupUsersOptions.map((g) => ({ value: g, label: g }))}
            value={GroupUsersOptions.includes(form.groups) ? form.groups : null}
            onChange={(value) => setForm({ ...form, groups: value || "" })}
            required
          />

          <TextInput
            label={translations["Funcție"][language]}
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            required
          />

          <RolesComponent
            employee={{ id: form.username, name: form.username }}
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
