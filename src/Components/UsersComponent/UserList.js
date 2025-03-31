import { RcTable } from "../RcTable"
import { Button, Menu, Checkbox } from "@mantine/core"
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoPencil,
  IoTrash
} from "react-icons/io5"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { useState } from "react"

const UserList = ({
  users,
  loading,
  fetchUsers = () => {},
  handleDeleteUser = () => {},
  openEditUser = () => {}
}) => {
  const language = localStorage.getItem("language") || "RO"
  const { enqueueSnackbar } = useSnackbar()

  const [selectedIds, setSelectedIds] = useState([])

  const extractId = (u) => u.id?.user?.id || u.id?.id || u.id

  const allIds = users.map(extractId).filter(Boolean)
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))

  const toggleSelect = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const newStatus = (!currentStatus).toString()

      await api.technicianDetails.patchSingleTechnician(id, {
        status: newStatus
      })

      fetchUsers()
      enqueueSnackbar(
        currentStatus
          ? translations["Utilizator dezactivat"][language]
          : translations["Utilizator activat"][language],
        { variant: "success" }
      )
    } catch (err) {
      console.error("Ошибка при смене статуса:", err)
      enqueueSnackbar(
        translations["Eroare la actualizarea statusului"][language],
        { variant: "error" }
      )
    }
  }

  const handleToggleStatusSelected = async () => {
    const promises = selectedIds.map(async (id) => {
      try {
        const user = users.find((u) => extractId(u) === id)
        if (!user) return
        const currentStatus = user.status
        const newStatus = (!currentStatus).toString()
        await api.technicianDetails.patchSingleTechnician(id, {
          status: newStatus
        })
      } catch (err) {
        console.error(`Ошибка при обновлении статуса пользователя ${id}:`, err)
      }
    })

    await Promise.all(promises)
    enqueueSnackbar("Статусы пользователей обновлены", { variant: "success" })
    fetchUsers()
    setSelectedIds([])
  }

  const handleDeleteSelected = async () => {
    const promises = selectedIds.map(async (id) => {
      try {
        await api.technicianDetails.deleteTechnician(id)
      } catch (err) {
        console.error(`Ошибка при удалении пользователя ${id}:`, err)
      }
    })

    await Promise.all(promises)
    enqueueSnackbar("Пользователи удалены", { variant: "success" })
    fetchUsers()
    setSelectedIds([])
  }

  const columns = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={selectedIds.length > 0 && !allSelected}
          onChange={toggleSelectAll}
        />
      ),
      dataIndex: "select",
      key: "select",
      width: 50,
      render: (_, row) => {
        const rowId = extractId(row)
        return (
          <Checkbox
            checked={selectedIds.includes(rowId)}
            onChange={() => toggleSelect(rowId)}
          />
        )
      }
    },
    {
      title: translations["ID"][language],
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => id?.user?.id || id?.id || "—"
    },
    {
      title: translations["Nume complet"][language],
      dataIndex: "fullName",
      key: "fullName",
      width: 250
    },
    {
      title: translations["Grup"][language],
      dataIndex: "groups",
      key: "groups",
      width: 200,
      render: (groups) => groups?.join(", ") || "—"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250
    },
    {
      title: translations["Rol"][language],
      dataIndex: "roles",
      key: "roles",
      width: 250,
      render: (roles) => roles?.map((r) => r.role).join(", ") || "—"
    },
    {
      title: translations["Status"][language],
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) =>
        status
          ? translations["Activ"][language]
          : translations["Inactiv"][language]
    },
    {
      title: translations["Acțiune"][language],
      dataIndex: "action",
      key: "action",
      width: 150,
      align: "center",
      render: (_, row) => (
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <Button variant="default" className="action-button-task">
              <IoEllipsisHorizontal size={18} />
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IoCheckmarkCircle size={16} />}
              onClick={() => toggleUserStatus(row.id, row.status)}
            >
              {row.status
                ? translations["Dezactivați"][language]
                : translations["Activați"][language]}
            </Menu.Item>

            <Menu.Item
              leftSection={<IoPencil size={16} />}
              onClick={() => openEditUser(row)}
            >
              {translations["Modificați"][language]}
            </Menu.Item>

            <Menu.Item
              leftSection={<IoTrash size={16} />}
              onClick={() => handleDeleteUser(row.id)}
              color="red"
            >
              {translations["Ștergeți"][language]}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )
    }
  ]

  return (
    <>
      {selectedIds.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Button
            variant="light"
            color="blue"
            onClick={handleToggleStatusSelected}
          >
            {translations["Activați/Inactivați"][language] || "Toggle status"}
          </Button>
          <Button variant="light" color="red" onClick={handleDeleteSelected}>
            {translations["Ștergeți selectați"][language] || "Delete selected"}
          </Button>
        </div>
      )}

      <RcTable
        columns={columns}
        data={users}
        loading={loading}
        bordered
        selectedRow={[]}
        pagination={false}
        rowKey={(record) => extractId(record) || `temp-${Math.random()}`}
      />
    </>
  )
}

export default UserList
