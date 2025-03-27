import { useState, useEffect } from "react"
import { Flex, Paper, ActionIcon, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import { useSnackbar } from "notistack"
import { MdDelete, MdEdit } from "react-icons/md"
import { useParams, useNavigate } from "react-router-dom"
import { Pagination } from "../../Pagination"
import { getLanguageByKey, cleanValue, showServerError } from "../../utils"
import { TextEllipsis } from "../../TextEllipsis"
import { Checkbox } from "../../Checkbox"
import { Modal } from "../../Modal"
import SingleChat from "../../ChatComponent/SingleChat"
import { Tag } from "../../Tag"
import { WorkflowTag } from "../../Workflow/components"
import { RcTable } from "../../RcTable"
import { api } from "../../../api"
import { useConfirmPopup } from "../../../hooks"
import { ManageLeadInfoTabs } from "../../LeadsComponent/ManageLeadInfoTabs"
import { DateCell } from "../../DateCell"
import { MantineModal } from "../../MantineModal"
import "./LeadTable.css"
import { parseTags } from "../../../stringUtils"

const renderTags = (tags) => {
  const tagList = parseTags(tags)
  const isTags = tagList.some(Boolean)
  return isTags
    ? tagList.map((tag, index) => <Tag key={index}>{tag}</Tag>)
    : "—"
}

const priorityTagColors = {
  joasă: "success",
  medie: "processing",
  înaltă: "warning",
  critică: "danger"
}

export const LeadTable = ({
  selectedTickets,
  onSelectRow,
  filteredLeads,
  totalLeads,
  onChangePagination,
  currentPage,

  selectTicket,
  fetchTickets
}) => {
  const { enqueueSnackbar } = useSnackbar()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [id, setId] = useState()

  const deleteLead = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți acest lead")
  })

  const handleDeleteLead = (id) => {
    deleteLead(async () => {
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
      }
    })
  }

  const rcColumn = [
    {
      width: 100,
      key: "checkbox",
      dataIndex: "id",
      align: "center",
      render: (id) => {
        return (
          <Checkbox
            checked={selectTicket.includes(id)}
            onChange={() => onSelectRow(id)}
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
        <Flex gap="8" wrap="wrap">
          {renderTags(tags)}
        </Flex>
      )
    },
    {
      title: getLanguageByKey("Prioritate"),
      dataIndex: "priority",
      align: "center",
      width: 100,
      render: (priority) => (
        <Tag type={priorityTagColors[priority]}>{priority}</Tag>
      )
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
      width: 200,
      render: (creation_date) => <DateCell date={creation_date} />
    },
    {
      title: getLanguageByKey("Ultima interacțiune"),
      dataIndex: "last_interaction_date",
      align: "center",
      width: 200,
      render: (last_interaction_date) => (
        <DateCell date={last_interaction_date} />
      )
    },
    {
      title: getLanguageByKey("Achitat client"),
      dataIndex: "achitat_client",
      align: "center",
      render: (achitat_client) => cleanValue(achitat_client),
      width: 150
    },
    {
      title: getLanguageByKey("Avans în euro"),
      dataIndex: "avans_euro",
      align: "center",
      render: (avans_euro) => cleanValue(avans_euro),
      width: 150
    },
    {
      title: getLanguageByKey("Comisionul companiei"),
      dataIndex: "comision_companie",
      align: "center",
      render: (comision_companie) => cleanValue(comision_companie),
      width: 200
    },
    {
      title: getLanguageByKey("Buget"),
      dataIndex: "buget",
      align: "center",
      render: (buget) => cleanValue(buget),
      width: 75
    },
    {
      title: getLanguageByKey("Data avansului"),
      dataIndex: "data_avansului",
      align: "center",
      width: 150,
      render: (data_avansului) => <DateCell date={data_avansului} />
    },
    {
      title: getLanguageByKey("Data cererii de retur"),
      dataIndex: "data_cererii_de_retur",
      align: "center",
      width: 200,
      render: (data_cererii_de_retur) => (
        <DateCell date={data_cererii_de_retur} />
      )
    },
    {
      title: getLanguageByKey("Data contractului"),
      dataIndex: "data_contractului",
      align: "center",
      width: 200,
      render: (data_contractului) => <DateCell date={data_contractului} />
    },
    {
      title: getLanguageByKey("Data de plată integrală"),
      dataIndex: "data_de_plata_integrala",
      align: "center",
      width: 200,
      render: (data_de_plata_integrala) => (
        <DateCell date={data_de_plata_integrala} />
      )
    },
    {
      title: getLanguageByKey("Data plecării"),
      dataIndex: "data_plecarii",
      align: "center",
      width: 200,
      render: (data_plecarii) => <DateCell date={data_plecarii} />
    },
    {
      title: getLanguageByKey("Data întoarcerii"),
      dataIndex: "data_intoarcerii",
      align: "center",
      width: 200,
      render: (data_intoarcerii) => <DateCell date={data_intoarcerii} />
    },
    {
      title: getLanguageByKey("Tipul de transport"),
      dataIndex: "tip_de_transport",
      align: "center",
      width: 150,
      render: (tip_de_transport) => cleanValue(tip_de_transport)
    },
    {
      title: getLanguageByKey("Vacanță"),
      dataIndex: "vacanta",
      align: "center",
      width: 200,
      render: (vacanta) => cleanValue(vacanta)
    },
    {
      title: getLanguageByKey("Valuta contului"),
      dataIndex: "f_valuta_contului",
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
        selectedRow={selectTicket}
        bordered
      />

      {!!totalLeads && (
        <Flex p="20" justify="center" className="leads-table-pagination">
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
        <ManageLeadInfoTabs
          onClose={() => setId()}
          fetchLeads={fetchTickets}
          id={id}
        />
      </MantineModal>
    </>
  )
}
