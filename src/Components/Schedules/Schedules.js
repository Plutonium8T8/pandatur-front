import React from "react"
import { Button, Title, Group } from "@mantine/core"
import SchedulesList from "./SchedulesList"

const Schedules = () => {
  const handleAddGroup = () => {
    console.log("Добавить группу")
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
