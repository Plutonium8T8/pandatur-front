import React, { useEffect, useState } from "react"
import {
  Box,
  Grid,
  Group,
  Switch,
  Text,
  Title,
  Divider,
  Stack
} from "@mantine/core"
import { FaHandshake } from "react-icons/fa"
import { translations } from "../utils/translations"
import { api } from "../../api"

const RolesComponent = ({ employee }) => {
  const [roles, setRoles] = useState([])
  const language = localStorage.getItem("language") || "RO"

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const data = await api.users.getById(employee.id)
      setRoles(data.roles)
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error.message)
    }
  }

  const sendPermissionToServer = async (role) => {
    try {
      await api.admin.user.createRoles({
        id: employee.id,
        role: "ROLE_" + role
      })
      fetchRoles()
    } catch (error) {
      console.error(`Ошибка при добавлении разрешения "${role}":`, error)
    }
  }

  const deletePermissionToServer = async (role) => {
    try {
      await api.admin.user.deleteRoles({
        id: employee.id,
        role: "ROLE_" + role
      })
      fetchRoles()
    } catch (error) {
      console.error(`Ошибка при удалении разрешения "${role}":`, error)
    }
  }

  const handleToggleChange = (permission, isActive) => {
    if (isActive) {
      deletePermissionToServer(permission)
    } else {
      sendPermissionToServer(permission)
    }
  }

  const isRoleActive = (role) => roles.includes(role)

  const categories = [
    "CHAT",
    "LEAD",
    "DASHBOARD",
    "ACCOUNT",
    "NOTIFICATION",
    "TASK"
  ]
  const actions = ["READ", "WRITE", "ADMIN"]

  return (
    <Box mt="lg">
      <Group mb="md">
        <FaHandshake size={22} />
        <Title order={4}>
          {translations["Permisiuni"][language]} {employee.name}
        </Title>
      </Group>

      <Grid columns={4} gutter="xs" mb="xs" style={{ fontWeight: 600 }}>
        <Grid.Col span={1}></Grid.Col>
        {actions.map((action) => (
          <Grid.Col span={1} key={action}>
            {action}
          </Grid.Col>
        ))}
      </Grid>

      <Divider mb="xs" />

      <Stack gap="xs">
        {categories.map((category) => (
          <Grid columns={4} gutter="xs" key={category} align="center">
            <Grid.Col span={1}>
              <Text fw={500}>{category}</Text>
            </Grid.Col>
            {actions.map((action) => {
              const role = `${category}_${action}`
              return (
                <Grid.Col span={1} key={role}>
                  <Switch
                    checked={isRoleActive(role)}
                    onChange={() =>
                      handleToggleChange(role, isRoleActive(role))
                    }
                    size="md"
                  />
                </Grid.Col>
              )
            })}
          </Grid>
        ))}
      </Stack>
    </Box>
  )
}

export default RolesComponent
