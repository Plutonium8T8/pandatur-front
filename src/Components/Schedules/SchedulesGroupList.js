import React, { useEffect, useState } from "react"
import {
  Card,
  Text,
  Stack,
  Button,
  Group,
  Badge,
  Avatar,
  Tooltip,
  ActionIcon
} from "@mantine/core"
import { schedules } from "../../api/schedules"
import { api } from "../../api"
import GroupScheduleView from "./ScheduleView"
import { useSnackbar } from "notistack"
import { translations } from "../utils/translations"

const SchedulesList = ({}) => {
  const [groups, setGroups] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const language = localStorage.getItem("language") || "RO"
  const { enqueueSnackbar } = useSnackbar()

  const fetchData = async () => {
    try {
      const [groupData, userData] = await Promise.all([
        schedules.getAllGroups(),
        api.users.getTechnicianList()
      ])

      const users = userData.map((item) => ({
        id: item.id.id,
        username: item.id.user?.username || "N/A",
        photo: item.id.photo
      }))
      setTechnicians(users)

      const formattedGroups = groupData.map((group) => ({
        id: group.id,
        name: group.name,
        user_ids: group.user_ids
      }))
      setGroups(formattedGroups)
    } catch (err) {
      enqueueSnackbar("Eroare la încărcare", { variant: "error" })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleGroupClick = (group) => {
    setSelectedGroup(group)
  }

  const handleBack = () => {
    setSelectedGroup(null)
  }

  const handleDelete = async (id) => {
    try {
      await schedules.deleteGroup(id)
      fetchData()
      enqueueSnackbar("Grupul a fost șters", { variant: "success" })
    } catch (err) {
      enqueueSnackbar("Eroare la ștergere", { variant: "error" })
    }
  }

  if (selectedGroup) {
    const groupUsers = technicians.filter((t) =>
      selectedGroup.user_ids.includes(t.id)
    )

    return (
      <div>
        <Button onClick={handleBack} mb="md">
          ← Назад к группам
        </Button>
        <GroupScheduleView groupUsers={groupUsers} />
      </div>
    )
  }

  return (
    <Stack spacing="md">
      {groups.map((group) => {
        const groupUsers = technicians.filter((u) =>
          group.user_ids.includes(u.id)
        )

        return (
          <Card
            key={group.id}
            shadow="xs"
            padding="lg"
            radius="md"
            withBorder
            className="group-card"
          >
            <Group position="apart" align="start">
              <div
                style={{ flex: 1, cursor: "pointer" }}
                onClick={() => handleGroupClick(group)}
              >
                <Group spacing="xs" mb={10}>
                  <Text size="md" fw={600}>
                    {group.name}
                  </Text>
                  <Badge color="blue" variant="light">
                    For a week
                  </Badge>
                </Group>

                <Tooltip.Group openDelay={300} closeDelay={100}>
                  <Avatar.Group spacing="sm">
                    {groupUsers.slice(0, 5).map((u) => (
                      <Tooltip label={u.username} withArrow key={u.id}>
                        <Avatar
                          size="md"
                          radius="xl"
                          src={u.photo || undefined}
                          color="blue"
                        >
                          {u.username?.[0]?.toUpperCase() || "?"}
                        </Avatar>
                      </Tooltip>
                    ))}

                    {groupUsers.length > 5 && (
                      <Tooltip
                        withArrow
                        label={
                          <>
                            {groupUsers.slice(5).map((u) => (
                              <div key={u.id}>{u.username}</div>
                            ))}
                          </>
                        }
                      >
                        <Avatar size="md" radius="xl" color="blue">
                          +{groupUsers.length - 5}
                        </Avatar>
                      </Tooltip>
                    )}
                  </Avatar.Group>
                </Tooltip.Group>
              </div>

              <ActionIcon
                color="red"
                variant="light"
                onClick={() => handleDelete(group.id)}
              >
                🗑
              </ActionIcon>
            </Group>
          </Card>
        )
      })}
    </Stack>
  )
}

export default SchedulesList
