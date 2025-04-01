import { useEffect, useState } from "react"
import {
  Button,
  Drawer,
  Stack,
  TextInput,
  Switch,
  Avatar,
  Group,
  ActionIcon,
  Divider,
  Select
} from "@mantine/core"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { IoEye, IoEyeOff } from "react-icons/io5"
import RolesComponent from "./RolesComponent"
import { GroupUsersOptions } from "./GroupUsersOptions"

const UserModal = ({ opened, onClose, onUserCreated, initialUser = null }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    job_title: "",
    status: false,
    groups: ""
  })

  useEffect(() => {
    if (initialUser) {
      setForm({
        username: initialUser.username || "",
        email: initialUser.email || "",
        password: "",
        job_title: initialUser.job_title || initialUser.jobTitle || "",
        status: Boolean(initialUser.status),
        groups:
          typeof initialUser.groups?.[0] === "string"
            ? initialUser.groups[0]
            : initialUser.groups?.[0]?.name || ""
      })
    } else {
      setForm({
        username: "",
        email: "",
        password: "",
        job_title: "",
        status: false,
        groups: ""
      })
    }
  }, [initialUser, opened])

  const handleCreate = async () => {
    const { username, email, password, job_title, status, groups } = form

    if (!initialUser) {
      if (!username || !email || !password || !job_title || !groups) {
        enqueueSnackbar("Заполните все обязательные поля", {
          variant: "warning"
        })
        return
      }
    }

    try {
      if (initialUser) {
        const technicianId =
          initialUser.id?.user?.id || initialUser.id?.id || initialUser.id
        const payload = {
          status: status.toString(),
          job_title
        }

        await api.users.updateTechnician(technicianId, payload)

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_name: groups
          })
        }

        enqueueSnackbar("Пользователь успешно обновлён", { variant: "success" })
      } else {
        const payload = {
          user: {
            username,
            email,
            password,
            roles: ["ROLE_USER", "ROLE_TECHNICIAN"]
          },
          technician: {
            status: status.toString(),
            job_title
          },
          groups: [groups]
        }

        await api.users.createTechnicianUser(payload)
        enqueueSnackbar("Пользователь успешно создан", { variant: "success" })
      }

      setForm({
        username: "",
        email: "",
        password: "",
        job_title: "",
        status: false,
        groups: ""
      })

      onClose()
      onUserCreated()
    } catch (err) {
      console.error("Ошибка при сохранении пользователя:", err.message)
      enqueueSnackbar("Ошибка при сохранении пользователя", {
        variant: "error"
      })
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title={
        initialUser
          ? "Редактировать пользователя"
          : "Создать нового пользователя"
      }
      padding="xl"
      size="lg"
    >
      <Group align="flex-start" spacing="xl">
        <Avatar
          src="https://storage.googleapis.com/pandatur_bucket/utils/icon-5359554_640.webp"
          size={120}
        />

        <Stack style={{ flex: 1 }}>
          <Switch
            label="Активен"
            checked={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.currentTarget.checked })
            }
          />

          <TextInput
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />

          <TextInput
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <TextInput
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            label="Grup user"
            placeholder="Alege grupul"
            data={GroupUsersOptions.map((g) => ({ value: g, label: g }))}
            value={GroupUsersOptions.includes(form.groups) ? form.groups : null}
            onChange={(value) => setForm({ ...form, groups: value || "" })}
          />

          <TextInput
            label="Job title"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          />

          <Divider label="Drepturi in app" labelPosition="center" />

          <RolesComponent
            employee={{ id: form.username, name: form.username }}
          />

          <Button fullWidth mt="sm" onClick={handleCreate}>
            {initialUser ? "Сохранить изменения" : "Создать"}
          </Button>
        </Stack>
      </Group>
    </Drawer>
  )
}

export default UserModal
