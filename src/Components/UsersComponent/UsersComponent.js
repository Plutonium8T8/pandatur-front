import { useEffect, useState } from "react"
import { Text, TextInput, Button, Flex } from "@mantine/core"
import { api } from "../../api"
import UserModal from "./UserModal"
import UserList from "./UserList"
import { translations } from "../utils/translations"

const UsersComponent = () => {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [opened, setOpened] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const language = localStorage.getItem("language") || "RO"

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!search) return setFiltered(users)

    const s = search.toLowerCase()
    setFiltered(
      users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(s) ||
          u.groups?.some((g) => g.toLowerCase().includes(s)) ||
          u.roles?.some((r) => r.role.toLowerCase().includes(s))
      )
    )
  }, [search, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.users.getTechnicianList()
      const normalized = data.map((item) => {
        const personal = item.id || {}
        const user = personal.user || {}
        return {
          id: personal.id,
          fullName: user.username || "-",
          email: user.email,
          username: user.username,
          // roles: user.roles ? JSON.parse(user.roles).map((r) => ({ role: r })) : [],
          groups: item.groups || [],
          jobTitle: item.job_title,
          department: item.department,
          salary: item.salary,
          policyNumber: item.policy_number,
          status: item.status
        }
      })

      setUsers(normalized)
      setFiltered(normalized)
    } catch (err) {
      console.error("Ошибка при загрузке:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      await api.technicianDetails.deleteTechnician(id)
      fetchUsers()
    } catch (err) {
      console.error("Ошибка при удалении пользователя:", err.message)
    }
  }

  return (
    <div className="task-container">
      <Flex justify="space-between" align="center" mb="md">
        <Text size="lg" fw={700}>
          {translations["Utilizatori"][language]} ({filtered.length})
        </Text>
        <Button
          onClick={() => {
            setEditUser(null)
            setOpened(true)
          }}
        >
          {translations["Adaugă utilizator"][language]}
        </Button>
      </Flex>

      <TextInput
        placeholder={translations["Căutare utilizator"][language]}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb="md"
      />

      <UserList
        users={filtered}
        loading={loading}
        fetchUsers={fetchUsers}
        openEditUser={(user) => {
          setEditUser(user)
          setOpened(true)
        }}
        handleDeleteUser={handleDeleteUser}
      />

      <UserModal
        opened={opened}
        onClose={() => {
          setOpened(false)
          setEditUser(null)
        }}
        onUserCreated={fetchUsers}
        initialUser={editUser}
      />
    </div>
  )
}

export default UsersComponent
