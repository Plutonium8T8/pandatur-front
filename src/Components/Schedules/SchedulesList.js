import React, { useEffect, useState } from "react"
import { Card, Text, Stack, Button } from "@mantine/core"
import GroupScheduleView from "./GroupScheduleView"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { translations } from "../utils/translations"

const SchedulesList = () => {
  const [technicians, setTechnicians] = useState([])
  const [groups, setGroups] = useState([])
  const [groupUsers, setGroupUsers] = useState({})
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const language = localStorage.getItem("language") || "RO"
  const { enqueueSnackbar } = useSnackbar()

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await api.users.getTechnicianList()

      const users = response.map((item) => ({
        id: item.id.id,
        name: `${item.id.name || "N/A"} ${item.id.surname || "N/A"}`,
        department: item.department || "Fără departament"
      }))

      const grouped = users.reduce((acc, user) => {
        const dept = user.department
        if (!acc[dept]) acc[dept] = []
        acc[dept].push(user)
        return acc
      }, {})

      setTechnicians(users)
      setGroupUsers(grouped)

      setGroups(
        Object.keys(grouped).map((dept, i) => ({
          id: i + 1,
          name: dept,
          key: dept
        }))
      )
    } catch (error) {
      console.error("Eroare la încărcare:", error)
      enqueueSnackbar(
        translations["Eroare la încărcarea utilizatorilor"][language],
        {
          variant: "error"
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleGroupClick = (group) => {
    setSelectedGroup(group)
  }

  const handleBack = () => {
    setSelectedGroup(null)
  }

  if (selectedGroup) {
    const users = groupUsers[selectedGroup.key] || []
    return (
      <div>
        <Button onClick={handleBack} mb="md">
          ← Назад к группам
        </Button>
        <GroupScheduleView groupUsers={users} />
      </div>
    )
  }

  return (
    <Stack spacing="sm">
      {groups.map((group) => (
        <Card
          key={group.id}
          shadow="sm"
          padding="md"
          withBorder
          onClick={() => handleGroupClick(group)}
          className="cursor-pointer hover:shadow-md transition"
        >
          <Text weight={500}>{group.name}</Text>
        </Card>
      ))}
    </Stack>
  )
}

export default SchedulesList
