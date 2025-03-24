import React, { useState } from "react"
import { Card, Text, Stack, Button } from "@mantine/core"
import GroupScheduleView from "./GroupScheduleView"

// Заглушка пользователей по группам
const groupData = {
  1: [
    { id: 101, name: "Иван Иванов" },
    { id: 102, name: "Мария Смирнова" }
  ],
  2: [{ id: 201, name: "Алексей Петров" }],
  3: [
    { id: 301, name: "Ольга Кузнецова" },
    { id: 302, name: "Дмитрий Орлов" }
  ]
}

const groups = [
  { id: 1, name: "Группа A" },
  { id: 2, name: "Группа B" },
  { id: 3, name: "Группа C" }
]

const SchedulesList = () => {
  const [selectedGroup, setSelectedGroup] = useState(null)

  const handleGroupClick = (group) => {
    setSelectedGroup(group)
  }

  const handleBack = () => {
    setSelectedGroup(null)
  }

  if (selectedGroup) {
    const users = groupData[selectedGroup.id] || []
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
