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
    department: "",
    job_title: "",
    policy_number: "",
    salary: "",
    personal_exemption_number: "",
    status: false,
    groups: ""
  })

  useEffect(() => {
    if (initialUser) {
      setForm({
        username: initialUser.username || "",
        email: initialUser.email || "",
        password: "", // не загружаем пароль
        department: initialUser.department || "",
        job_title: initialUser.job_title || "",
        policy_number: initialUser.policy_number || "",
        salary: initialUser.salary || "",
        personal_exemption_number: initialUser.personal_exemption_number || "",
        status: initialUser.status === "true" || initialUser.status === true,
        groups: initialUser.groups?.[0] || ""
      })
    } else {
      setForm({
        username: "",
        email: "",
        password: "",
        department: "",
        job_title: "",
        policy_number: "",
        salary: "",
        personal_exemption_number: "",
        status: false,
        groups: ""
      })
    }
  }, [initialUser, opened])

  const handleCreate = async () => {
    const {
      username,
      email,
      password,
      department,
      job_title,
      policy_number,
      salary,
      personal_exemption_number,
      groups
    } = form

    if (
      !username ||
      !email ||
      !password ||
      !department ||
      !job_title ||
      !policy_number ||
      !salary ||
      !personal_exemption_number ||
      !groups
    ) {
      enqueueSnackbar("Заполните все обязательные поля", { variant: "warning" })
      return
    }

    const payload = {
      user: {
        username,
        email,
        password,
        roles: ["ROLE_USER", "ROLE_TECHNICIAN"]
      },
      technician: {
        status: form.status.toString(),
        policy_number,
        salary,
        personal_exemption_number,
        job_title,
        department,
        groups: [groups]
      }
    }

    try {
      await api.technicianDetails.createTechnicianUser(payload)
      enqueueSnackbar("Пользователь успешно создан", { variant: "success" })
      setForm({
        username: "",
        email: "",
        password: "",
        department: "",
        job_title: "",
        policy_number: "",
        salary: "",
        personal_exemption_number: "",
        status: false,
        groups: ""
      })
      onClose()
      onUserCreated()
    } catch (err) {
      console.error("Ошибка при создании пользователя:", err.message)
      enqueueSnackbar("Ошибка при создании пользователя", { variant: "error" })
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title="Создать нового пользователя"
      padding="xl"
      size="lg"
    >
      <Group align="flex-start" spacing="xl">
        <Avatar
          src="https://randomuser.me/api/portraits/women/43.jpg"
          size={100}
          radius="xl"
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
            data={GroupUsersOptions.map((g) => ({ value: g }))}
            value={GroupUsersOptions.includes(form.groups) ? form.groups : null}
            onChange={(value) => setForm({ ...form, groups: value || "" })}
          />

          <Divider label="Drepturi in app" labelPosition="center" />

          <RolesComponent
            employee={{ id: form.username, name: form.username }}
          />

          <Divider label="Technician informations" labelPosition="center" />

          <TextInput
            label="Departament"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <TextInput
            label="Job title"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          />
          <TextInput
            label="Nr polis"
            value={form.policy_number}
            onChange={(e) =>
              setForm({ ...form, policy_number: e.target.value })
            }
          />
          <TextInput
            label="Salariu"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
          />
          <TextInput
            label="IDNP"
            value={form.personal_exemption_number}
            onChange={(e) =>
              setForm({
                ...form,
                personal_exemption_number: e.target.value
              })
            }
          />

          <Button fullWidth mt="sm" onClick={handleCreate}>
            Create
          </Button>
        </Stack>
      </Group>
    </Drawer>
  )
}

export default UserModal
