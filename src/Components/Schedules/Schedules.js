import React from "react"
import { Button, Title, Group } from "@mantine/core"
import SchedulesList from "./SchedulesList"
import { translations } from "../utils/translations"

const Schedules = () => {
  const handleAddGroup = () => {
    console.log(
      "aici trebuie sa fie logica de creare de a grupului, cu group name and list_users"
    )
  }

  return (
    <div className="p-4">
      <Group position="apart" mb="md">
        <Title order={2}>Schedules</Title>
        <Button onClick={handleAddGroup}>Добавить группу</Button>
      </Group>

      <SchedulesList />
    </div>
  )
}

export default Schedules
