import React, { useState } from "react"
import { Button, Title, Group } from "@mantine/core"
import SchedulesList from "./SchedulesGroupList"
import { translations } from "../utils/translations"
import CreateGroupDrawer from "./ModalGroup"

const Schedules = () => {
  const [opened, setOpened] = useState(false)
  const [reload, setReload] = useState(false)
  const language = localStorage.getItem("language") || "RO"

  return (
    <div style={{ padding: "10px 20px" }}>
      <Group mb="md">
        <Title order={2}>{translations["Orar"][language]}</Title>
        <Button ml="auto" onClick={() => setOpened(true)}>
          {translations["Adaugă grup"][language]}
        </Button>
      </Group>

      <SchedulesList reload={reload} />

      <CreateGroupDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        onGroupCreated={() => {
          setOpened(false)
          setReload((r) => !r)
        }}
      />
    </div>
  )
}

export default Schedules
