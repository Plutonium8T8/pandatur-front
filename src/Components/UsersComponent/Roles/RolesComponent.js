import React, { useEffect, useState, useCallback } from "react"
import {
  Box,
  Group,
  Title,
  Divider
} from "@mantine/core"
import { FaHandshake } from "react-icons/fa"
import { translations } from "../../utils/translations"
import { api } from "../../../api"
import RoleMatrix from "./RoleMatrix"

const language = localStorage.getItem("language") || "RO"

const RolesComponent = ({ employee }) => {
  const [roles, setRoles] = useState([])

  const fetchRoles = useCallback(async () => {
    try {
      const data = await api.users.getById(employee.id)
      setRoles(data.roles)
    } catch (error) {
      console.error("Ошибка загрузки ролей:", error.message)
    }
  }, [employee.id])

  useEffect(() => {
    fetchRoles()
  }, [])

  const sendPermissionToServer = async (role) => {
    try {
      await api.admin.user.createRoles({
        id: employee.id,
        role: "ROLE_" + role
      })
      fetchRoles()
    } catch (error) {
      console.error(`Ошибка при добавлении роли "${role}":`, error)
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
      console.error(`Ошибка при удалении роли "${role}":`, error)
    }
  }

  const handleToggleChange = (role, isActive) => {
    isActive ? deletePermissionToServer(role) : sendPermissionToServer(role)
  }

  const isRoleActive = (role) => roles.includes(`ROLE_${role}`)

  const selectedRoles = [
    "CHAT", "LEAD", "DASHBOARD", "ACCOUNT", "NOTIFICATION", "TASK"
  ].flatMap((category) =>
    ["READ", "WRITE", "ADMIN"]
      .map((action) => `${category}_${action}`)
      .filter((role) => isRoleActive(role))
  )

  return (
    <Box mt="lg">
      <Group mb="md">
        <FaHandshake size={22} />
        <Title order={4}>
          {translations["Permisiuni"][language]} {employee.name}
        </Title>
      </Group>

      <Divider mb="sm" />

      <RoleMatrix
        selectedRoles={selectedRoles}
        onToggle={(role) => handleToggleChange(role, isRoleActive(role))}
      />
    </Box>
  )
}

export default RolesComponent
