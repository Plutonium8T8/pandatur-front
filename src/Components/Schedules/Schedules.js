import React, { useState, useEffect } from "react"
import {
  Button,
  Title,
  Group,
  Drawer,
  TextInput,
  MultiSelect
} from "@mantine/core"
import SchedulesList from "./SchedulesList"
import { translations } from "../utils/translations"
import { schedules } from "../../api/schedules"
import { api } from "../../api"

const Schedules = () => {
  const [opened, setOpened] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [users, setUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [reload, setReload] = useState(false)

  const handleAddGroup = () => setOpened(true)

  const handleSubmit = async () => {
    try {
      await schedules.createGroup({
        name: groupName,
        user_ids: selectedUserIds.map((id) => parseInt(id))
      })
      setOpened(false)
      setGroupName("")
      setSelectedUserIds([])
      setReload((r) => !r)
    } catch (err) {
      console.error("Ошибка при создании группы:", err.message)
    }
  }

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

  useEffect(() => {
    if (opened) fetchUsers()
  }, [opened])

  return (
    <div style={{ padding: "10px 20px" }}>
      <Group mb="md">
        <Title order={2}>Schedules</Title>
        <Button ml="auto" onClick={handleAddGroup}>
          Добавить группу
        </Button>
      </Group>

      <SchedulesList reload={reload} />

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title="Создать группу"
        position="right"
        padding="md"
        size="md"
      >
        <TextInput
          label="Название группы"
          placeholder="Например: Утро"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          mb="md"
        />
        <MultiSelect
          data={users}
          label="Техники"
          placeholder="Выберите техников"
          value={selectedUserIds}
          onChange={setSelectedUserIds}
          searchable
          nothingFound="Ничего не найдено"
        />
        <Group mt="md" position="right">
          <Button onClick={handleSubmit}>Создать</Button>
        </Group>
      </Drawer>
    </div>
  )
}

export default Schedules
