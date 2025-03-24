import React, { useEffect, useState } from "react"
import "./ModalWithToggles.css"
import { FaHandshake } from "react-icons/fa"
import UserGroupComponent from "./UserGroupComponent"
import { translations } from "../utils/translations"
import { api } from "../../api"

const ToggleComponent = ({ employee }) => {
  const [roles, setRoles] = useState([])
  const [error, setError] = useState(null)
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

  return (
    <div style={{ marginTop: "42px" }}>
      <div className="modal-header">
        <h2>
          <FaHandshake /> {translations["Permisiuni"][language]} {employee.name}
        </h2>
      </div>

      <div className="modal-body">
        <div className="permissions-table">
          <div className="permissions-header">
            <div className="permissions-header-item"></div>
            {["READ", "WRITE", "ADMIN"].map((action) => (
              <div className="permissions-header-item" key={action}>
                {action}
              </div>
            ))}
          </div>
          <div className="permissions-rows">
            {[
              "CHAT",
              "LEAD",
              "DASHBOARD",
              "ACCOUNT",
              "NOTIFICATION",
              "TASK"
            ].map((category) => (
              <div className="permissions-row" key={category}>
                <div className="permissions-category">{category}</div>
                {["READ", "WRITE", "ADMIN"].map((action) => {
                  const role = `${category}_${action}`
                  return (
                    <div className="permissions-toggle" key={role}>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isRoleActive(role)}
                          onChange={() =>
                            handleToggleChange(role, isRoleActive(role))
                          }
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <UserGroupComponent
          userId={employee.id}
          roles={roles}
          onChange={fetchRoles}
        />
      </div>
    </div>
  )
}

export default ToggleComponent
