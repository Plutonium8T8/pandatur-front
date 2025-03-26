import { RcTable } from "../RcTable"
import { Button, Menu } from "@mantine/core"
import {
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoPencil,
  IoTrash
} from "react-icons/io5"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { useSnackbar } from "notistack"

const UserList = ({
  users,
  loading,
  fetchUsers = () => {},
  handleDeleteUser = () => {},
  openEditUser = () => {}
}) => {
  const language = localStorage.getItem("language") || "RO"
  const { enqueueSnackbar } = useSnackbar()

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

  const columns = [
    {
      title: translations["ID"][language],
      dataIndex: "id",
      key: "id",
      width: 100
    },
    {
      title: translations["Nume complet"][language],
      dataIndex: "fullname",
      key: "fullname",
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
    <RcTable
      columns={columns}
      data={users}
      loading={loading}
      bordered
      selectedRow={[]}
      pagination={false}
      rowKey="id"
    />
  )
}

export default UserList
