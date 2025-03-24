import { useEffect, useState } from "react"
import {
  Table,
  ScrollArea,
  Button,
  Group,
  Text,
  Modal,
  TextInput
} from "@mantine/core"
import { FaPlusSquare } from "react-icons/fa"
import { api } from "../../api"

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState(false)
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    department: "",
    job_title: ""
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersData = await api.users.getTechnicianList()
      setUsers(usersData)
      console.log("✅ Пользователи загружены:", usersData)
    } catch (error) {
      console.error("❌ Ошибка при загрузке пользователей:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      await api.users.createTechnicianUser(form)
      setOpened(false)
      setForm({
        name: "",
        surname: "",
        email: "",
        department: "",
        job_title: ""
      })
      fetchUsers()
    } catch (error) {
      console.error("❌ Ошибка при создании пользователя:", error.message)
    }
  }

  const rows = users.map((user) => (
    <tr key={user.id.id}>
      <td>
        <Text size="sm">
          {user.id.name} {user.id.surname}
        </Text>
      </td>
      <td>{user.department || "—"}</td>
      <td>{user.id.user.email}</td>
      <td>{user.job_title || "—"}</td>
    </tr>
  ))

  return (
    <>
      <Group position="apart" mb="md">
        <Text size="lg" fw={700}>
          Пользователи
        </Text>
        <Button
          leftIcon={<FaPlusSquare size={16} />}
          onClick={() => setOpened(true)}
        >
          Добавить пользователя
        </Button>
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Группа</th>
              <th>Email</th>
              <th>Должность</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Загрузка...</td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </Table>
      </ScrollArea>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Создать нового пользователя"
      >
        <TextInput
          label="Имя"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextInput
          label="Фамилия"
          value={form.surname}
          onChange={(e) => setForm({ ...form, surname: e.target.value })}
          mt="sm"
        />
        <TextInput
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          mt="sm"
        />
        <TextInput
          label="Отдел"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          mt="sm"
        />
        <TextInput
          label="Должность"
          value={form.job_title}
          onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          mt="sm"
        />
        <Button fullWidth mt="md" onClick={handleCreateUser}>
          Создать
        </Button>
      </Modal>
    </>
  )
}
