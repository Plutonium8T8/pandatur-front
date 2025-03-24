import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./LeadTable.css"
import { SpinnerRightBottom } from "../../SpinnerRightBottom"
import { Pagination } from "../../Pagination"
import { getLanguageByKey, cleanValue, showServerError } from "../../utils"
import { TextEllipsis } from "../../TextEllipsis"
import { Checkbox } from "../../Checkbox"
import { Modal } from "../../Modal"
import SingleChat from "../../ChatComponent/SingleChat"
import { useParams, useNavigate } from "react-router-dom"
import { Tag } from "../../Tag"
import { WorkflowTag } from "../../WorkflowTag"
import {
  Flex,
  Paper,
  ActionIcon,
  Modal as MantineModal,
  Text
} from "@mantine/core"
import { RcTable } from "../../RcTable"
import { MdDelete, MdEdit } from "react-icons/md"
import { useSnackbar } from "notistack"
import { api } from "../../../api"
import { useConfirmPopup } from "../../../hooks"
import { EditBulkOrSingleLeadTabs } from "../../LeadsComponent/components"

const renderTags = (tags) => {
  const isTags = tags.some(Boolean)
  return isTags ? tags.map((tag, index) => <Tag key={index}>{tag}</Tag>) : "—"
}

export const LeadTable = ({
  selectedTickets,
  toggleSelectTicket,
  filteredLeads,
  totalLeads,
  onChangePagination,
  currentPage,
  loading,
  selectTicket,
  fetchTickets
}) => {
  const { enqueueSnackbar } = useSnackbar()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [selectedRow, setSelectedRow] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [id, setId] = useState()

  const deleteLead = useConfirmPopup({
    title: getLanguageByKey("Confirmare ștergere"),
    subTitle: getLanguageByKey("Sigur doriți să ștergeți acest lead"),
    loading: isLoading
  })

  const handleDeleteLead = (id) => {
    deleteLead(async () => {
      setIsLoading(true)
      try {
        await api.tickets.deleteById([id])
        enqueueSnackbar(getLanguageByKey("Lead șters cu succes"), {
          variant: "success"
        })
        fetchTickets()
      } catch (error) {
        enqueueSnackbar(showServerError(error), {
          variant: "error"
        })
      } finally {
        setIsLoading(false)
      }
    })
  }

  const rcColumn = [
    {
      width: 100,
      key: "checkbox",
      align: "center",
      render: (row) => {
        return (
          <Checkbox
            checked={selectedRow.includes(row.id)}
            onChange={() => {
              setSelectedRow((prev) =>
                prev.includes(row.id)
                  ? prev.filter((id) => id !== row.id)
                  : [...prev, row.id]
              )
            }}
          />
        )
      }
    },
    {
      title: "ID",
      key: "id",
      align: "center",
      dataIndex: "id",
      width: 100,
      render: (id) => (
        <Link to={`/leads/${id}`} className="row-id">
          #{id}
        </Link>
      )
    },
    {
      title: getLanguageByKey("Nume"),
      key: "name",
      dataIndex: "clients",
      width: 200,
      align: "center",
      render: (row) => (
        <>
          {row?.length
            ? row.map((item) => cleanValue(item.name)).join(", ")
            : cleanValue()}
        </>
      )
    },
    {
      title: getLanguageByKey("Prenume"),
      key: "surname",
      dataIndex: "clients",
      align: "center",
      width: 200,
      render: (row) => (
        <>
          {row?.length
            ? row.map((item) => cleanValue(item.surname)).join(", ")
            : cleanValue()}
        </>
      )
    },
    {
      title: getLanguageByKey("Email"),
      key: "email",
      dataIndex: "clients",
      align: "center",
      width: 200,
      render: (row) => (
        <>
          {row?.length
            ? row.map((item) => cleanValue(item.email)).join(", ")
            : cleanValue()}
        </>
      )
    },
    {
      title: getLanguageByKey("Telefon"),
      dataIndex: "clients",
      align: "center",
      width: 150,
      render: (row) => (
        <>
          {row?.length
            ? row.map((item) => cleanValue(item?.phone)).join(", ")
            : cleanValue()}
        </>
      )
    },
    {
      title: getLanguageByKey("Descriere"),
      dataIndex: "description",
      align: "center",
      width: 250,
      render: (description) =>
        description ? (
          <TextEllipsis rows={3}>{description}</TextEllipsis>
        ) : (
          cleanValue()
        )
    },
    {
      title: getLanguageByKey("Tag-uri"),
      dataIndex: "tags",
      width: 200,
      align: "center",
      render: (tags) => (
        <div style={{ width: 300 }} className="d-flex gap-8 flex-wrap">
          {renderTags(tags)}
        </div>
      )
    },
    {
      title: getLanguageByKey("Prioritate"),
      dataIndex: "priority",
      align: "center",
      width: 100
    },
    {
      title: getLanguageByKey("Workflow"),
      dataIndex: "workflow",
      align: "center",
      width: 150,
      render: (workflow) => <WorkflowTag type={workflow} />
    },
    {
      title: getLanguageByKey("Contact"),
      dataIndex: "contact",
      align: "center",
      width: 200
    },
    {
      title: getLanguageByKey("Data de creare"),
      dataIndex: "creation_date",
      align: "center",
      width: 200
    },
    {
      title: getLanguageByKey("Ultima interacțiune"),
      dataIndex: "last_interaction_date",
      align: "center",
      width: 200
    },
    {
      title: getLanguageByKey("Achitat client"),
      dataIndex: ["ticket_info", "achitat_client"],
      align: "center",
      render: (achitat_client) => cleanValue(achitat_client),
      width: 150
    },
    {
      title: getLanguageByKey("Avans în euro"),
      dataIndex: ["ticket_info", "avans_euro"],
      align: "center",
      render: (avans_euro) => cleanValue(avans_euro),
      width: 150
    },
    {
      title: getLanguageByKey("Comisionul companiei"),
      dataIndex: ["ticket_info", "comision_companie"],
      align: "center",
      render: (comision_companie) => cleanValue(comision_companie),
      width: 200
    },
    {
      title: getLanguageByKey("Buget"),
      dataIndex: ["ticket_info", "buget"],
      align: "center",
      render: (buget) => cleanValue(buget),
      width: 75
    },
    {
      title: getLanguageByKey("Data avansului"),
      dataIndex: ["ticket_info", "data_avansului"],
      align: "center",
      width: 150,
      render: (data_avansului) => cleanValue(data_avansului)
    },
    {
      title: getLanguageByKey("Data cererii de retur"),
      dataIndex: ["ticket_info", "data_cererii_de_retur"],
      align: "center",
      width: 200,
      render: (data_cererii_de_retur) => cleanValue(data_cererii_de_retur)
    },
    {
      title: getLanguageByKey("Data contractului"),
      dataIndex: ["ticket_info", "data_contractului"],
      align: "center",
      width: 200,
      render: (data_contractului) => cleanValue(data_contractului)
    },
    {
      title: getLanguageByKey("Data de plată integrală"),
      dataIndex: ["ticket_info", "data_de_plata_integrala"],
      align: "center",
      width: 200,
      render: (data_de_plata_integrala) => cleanValue(data_de_plata_integrala)
    },
    {
      title: getLanguageByKey("Data plecării"),
      dataIndex: ["ticket_info", "data_plecarii"],
      align: "center",
      width: 200,
      render: (data_plecarii) => cleanValue(data_plecarii)
    },
    {
      title: getLanguageByKey("Data întoarcerii"),
      dataIndex: ["ticket_info", "data_intoarcerii"],
      align: "center",
      width: 200,
      render: (data_intoarcerii) => cleanValue(data_intoarcerii)
    },
    {
      title: getLanguageByKey("Tipul de transport"),
      dataIndex: ["ticket_info", "tip_de_transport"],
      align: "center",
      width: 150,
      render: (tip_de_transport) => cleanValue(tip_de_transport)
    },
    {
      title: getLanguageByKey("Vacanță"),
      dataIndex: ["ticket_info", "vacanta"],
      align: "center",
      width: 200,
      render: (vacanta) => cleanValue(vacanta)
    },
    {
      title: getLanguageByKey("Valuta contului"),
      dataIndex: ["ticket_info", "valuta_contului"],
      align: "center",
      width: 150,
      render: (valuta_contului) => cleanValue(valuta_contului)
    },
    {
      title: getLanguageByKey("Acțiune"),
      fixed: "right",
      width: 85,
      dataIndex: "id",
      render: (id) => (
        <Paper pos="absolute" top="0" right="0" bottom="0" shadow="xs" w="100%">
          <Flex align="center" justify="center" gap="8" h="100%" p="xs">
            <ActionIcon variant="danger" onClick={() => handleDeleteLead(id)}>
              <MdDelete />
            </ActionIcon>
            <ActionIcon variant="outline" onClick={() => setId(id)}>
              <MdEdit />
            </ActionIcon>
          </Flex>
        </Paper>
      )
    }
  ]

  useEffect(() => {
    if (ticketId) {
      setSelectedTicketId(ticketId)
      setIsChatOpen(true)
    }
  }, [ticketId])

  if (loading) {
    return <SpinnerRightBottom />
  }

  const closeChatModal = () => {
    setIsChatOpen(false)
    navigate("/leads")
  }

  return (
    <>
      <RcTable
        rowKey="id"
        columns={rcColumn}
        data={filteredLeads}
        selectedRow={selectedRow}
        bordered
      />

      {!!totalLeads && (
        <Flex p="20" justify="center">
          <Pagination
            totalPages={totalLeads}
            currentPage={currentPage}
            onPaginationChange={onChangePagination}
          />
        </Flex>
      )}

      <Modal
        open={isChatOpen}
        onClose={closeChatModal}
        title=""
        width={1850}
        height={1000}
        footer={null}
        showCloseButton={false}
      >
        {selectedTicketId && (
          <SingleChat ticketId={selectedTicketId} onClose={closeChatModal} />
        )}
      </Modal>

      <MantineModal
        centered
        opened={!!id}
        onClose={() => setId()}
        size="lg"
        title={
          <Text size="xl" fw="bold">
            {getLanguageByKey("Editează ticketul")}
          </Text>
        }
      >
        <EditBulkOrSingleLeadTabs
          onClose={() => setId()}
          selectedTickets={selectedTickets}
          fetchLeads={fetchTickets}
          id={id}
        />
      </MantineModal>
    </>
  )
}
