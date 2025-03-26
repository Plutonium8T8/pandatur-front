import React, { useEffect, useState } from "react"
import { Drawer, TextInput, MultiSelect, Button, Group } from "@mantine/core"
import { api } from "../../api"
import { schedules } from "../../api/schedules"
import { translations } from "../utils/translations"

const CreateGroupDrawer = ({ opened, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("")
  const [users, setUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const language = localStorage.getItem("language") || "RO"

  const fetchUsers = async () => {
    try {
      const data = await api.users.getTechnicianList()
      const parsed = data.map((item) => {
        const user = item.id?.user
        return {
          label: user?.username || "—",
          value: user?.id?.toString()
        }
      })
      setUsers(parsed)
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err.message)
    }
  }

  const handleSubmit = async () => {
    try {
      await schedules.createGroup({
        name: groupName,
        user_ids: selectedUserIds.map((id) => parseInt(id))
      })
      onClose()
      setGroupName("")
      setSelectedUserIds([])
      onGroupCreated()
    } catch (err) {
      console.error("Ошибка при создании группы:", err.message)
    }
  }

  useEffect(() => {
    if (opened) fetchUsers()
  }, [opened])

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={translations["Adaugă grup"][language]}
      position="right"
      padding="md"
      size="md"
    >
      <TextInput
        label={translations["Nume grup"][language]}
        placeholder={translations["Nume grup"][language]}
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        mb="md"
      />
      <MultiSelect
        data={users}
        label={translations["Utilizatori"][language]}
        placeholder={translations["Selectează utilizator"][language]}
        value={selectedUserIds}
        onChange={setSelectedUserIds}
        searchable
      />
      <Group mt="md" position="right">
        <Button onClick={handleSubmit}>
          {translations["Creează"][language]}
        </Button>
      </Group>
    </Drawer>
  )
}

export default CreateGroupDrawer
