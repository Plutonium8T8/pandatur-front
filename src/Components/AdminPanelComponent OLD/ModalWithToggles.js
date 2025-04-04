import React, { useEffect, useState } from "react"
import "./ModalWithToggles.css"
import ToggleComponent from "./ToggleComponent"
import { api } from "../../api"
import { showServerError } from "../../Components/utils/showServerError"
import { useSnackbar } from "notistack"

const ModalWithToggles = ({ employee, closeModal }) => {
  const [roles, setRoles] = useState([])
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const data = await api.users.getById(employee.id)

      setRoles(data.roles)
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    }
  }

  const sendPermissionToServer = async (role) => {
    try {
      await api.admin.user.createRoles({
        id: employee.id,
        role
      })

      fetchRoles()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    }
  }

  const deletePermissionToServer = async (role) => {
    try {
      await api.admin.user.deleteRoles({
        id: employee.id,
        role
      })

      fetchRoles()
    } catch (error) {
      console.error(`Ошибка при удалении разрешения "${role}":`, error)
    }
  }

  // TODO: Need to review this function
  const handleToggleChange = (permission, isActive) => {
    if (isActive) {
      deletePermissionToServer(permission)
    } else {
      sendPermissionToServer(permission)
    }
  }

  const isRoleActive = (role) => roles.includes(role)

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <ToggleComponent employee={employee} />
      </div>
    </div>
  )
}

export default ModalWithToggles
