import React, { useState, useMemo, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDOMElementHeight, useApp } from "../../hooks"
import { priorityOptions } from "../../FormOptions/PriorityOption"
import { workflowOptions } from "../../FormOptions/WorkFlowOption"
import { TicketFilterModal } from "../TicketFilterModal"
import { LeadTable } from "./LeadTable"
import { useDebounce } from "../../hooks"
import { showServerError, getTotalPages, getLanguageByKey } from "../utils"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { Modal } from "../Modal"
import SingleChat from "../ChatComponent/SingleChat"
import { Spin } from "../Spin"
import { RefLeadsFilter } from "./LeadsFilter"
import TicketModal from "./TicketModal/TicketModalComponent"
import "../../App.css"
import "../SnackBarComponent/SnackBarComponent.css"
import { SpinnerRightBottom } from "../SpinnerRightBottom"
import { MantineModal } from "../MantineModal"
import { EditBulkOrSingleLeadTabs } from "./components"
import { VIEW_MODE, filteredWorkflows } from "./utils"
import { WorkflowColumns } from "../WorkflowColumns"

const SORT_BY = "creation_date"
const ORDER = "DESC"
const HARD_TICKET = "hard"
const LIGHT_TICKET = "light"
const NUMBER_PAGE = 1

const normalizeLeadsFilters = (filters, hasWorkflow) => {
  return {
    ...(hasWorkflow && { workflow: filteredWorkflows }),
    ...filters,
    technician_id: filters.technician_id
      ? filters.technician_id.map((t) => parseInt(t.split(":")[0]))
      : []
  }
}

const Leads = () => {
  const refLeadsFilter = useRef()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const leadsFilterHeight = useDOMElementHeight(refLeadsFilter)
  const { tickets, isLoading, setTickets, spinnerTickets } = useApp()
  const { ticketId } = useParams()

  const [hardTickets, setHardTickets] = useState([])

  const [filteredTicketIds, setFilteredTicketIds] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTicket, setCurrentTicket] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalLeads, setTotalLeads] = useState()
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(!!ticketId)
  const [groupTitle, setGroupTitle] = useState("")
  const [selectedWorkflow, setSelectedWorkflow] = useState(filteredWorkflows)
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false)
  const [hardTicketFilters, setHardTicketFilters] = useState({})
  const [lightTicketFilters, setLightTicketFilters] = useState({})

  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN)

  const debouncedSearch = useDebounce(searchTerm)

  const filteredTickets = useMemo(() => {
    let result = tickets
    if (filteredTicketIds === null) return result
    if (filteredTicketIds.length === 0) return []
    result = result.filter((ticket) => filteredTicketIds.includes(ticket.id))
    if (selectedWorkflow.length > 0) {
      result = result.filter((ticket) =>
        selectedWorkflow.includes(ticket.workflow)
      )
    }
    return result
  }, [tickets, filteredTicketIds, selectedWorkflow])

  useEffect(() => {
    if (ticketId) {
      setIsChatOpen(true)
    }
  }, [ticketId])

  const closeChatModal = () => {
    setIsChatOpen(false)
    navigate("/leads") // При закрытии убираем ticketId из URL
  }

  const toggleSelectTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const deleteTicket = async () => {
    const findTicket = tickets.find((ticket) =>
      selectedTickets.includes(ticket.id)
    )
    const newTickets = tickets.filter((ticket) => ticket.id !== findTicket.id)

    try {
      setLoading(true)
      await api.tickets.deleteById(selectedTickets)
      await fetchTickets(
        {
          type: HARD_TICKET,
          page: currentPage,
          attributes: hardTicketFilters
        },
        ({ data, pagination }) => {
          setHardTickets(data)
          setTotalLeads(pagination.total || 0)
        }
      )

      setTickets(newTickets)
      setSelectedTickets([])
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const openCreateTicketModal = () => {
    setCurrentTicket({
      contact: "",
      transport: "",
      country: "",
      priority: priorityOptions[0],
      workflow: workflowOptions[0],
      service_reference: "",
      technician_id: 0
    })
    setIsOpenAddLeadModal(true)
  }

  const fetchTickets = async (
    {
      page,
      type,
      sortBy = SORT_BY,
      order = ORDER,
      attributes = {},
      group_title
    },
    cb,
    showModalLoading
  ) => {
    try {
      if (showModalLoading) {
        setLoadingFilters(true)
      } else {
        setLoading(true)
      }
      const hardTicket = await api.tickets.filters({
        page,
        sort_by: sortBy,
        order: order,
        type,
        attributes,
        group_title
      })

      cb(hardTicket)
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    } finally {
      if (showModalLoading) {
        setLoadingFilters(false)
      } else {
        setLoading(false)
      }
    }
  }

  const closeModal = (resetSelectedTickets) => {
    setCurrentTicket(null)
    setIsModalOpen(false)

    if (resetSelectedTickets) {
      setSelectedTickets([])
    }
  }

  const applyWorkflowFilters = (updatedFilters, ticketIds) => {
    setLightTicketFilters(updatedFilters)

    setSelectedWorkflow(
      Array.isArray(updatedFilters.workflow) ? updatedFilters.workflow : []
    )

    setFilteredTicketIds(ticketIds ?? null)
    setIsFilterOpen(false)
  }

  const handleApplyFiltersHardTicket = (formattedFilters) => {
    fetchTickets(
      { attributes: formattedFilters, page: NUMBER_PAGE, type: HARD_TICKET },
      ({ data, pagination }) => {
        setHardTickets(data)
        setTotalLeads(pagination.total || 0)
        setCurrentPage(1)
        setHardTicketFilters(formattedFilters)
        setIsFilterOpen(false)
      },
      true
    )
  }

  const handleApplyFilterLightTicket = (formattedFilters) => {
    fetchTickets(
      { page: NUMBER_PAGE, type: LIGHT_TICKET, attributes: formattedFilters },
      ({ data, total }) => {
        applyWorkflowFilters(formattedFilters, data)
        setTotalLeads(total)
      }
    )
  }

  const handlePaginationWorkflow = (page) => {
    fetchTickets(
      { page, type: HARD_TICKET, attributes: hardTicketFilters },
      ({ data, pagination }) => {
        setHardTickets(data)
        setTotalLeads(pagination.total || 0)
        setCurrentPage(page)
      }
    )
  }

  const fetchTicketList = () => {
    const isViewModeList = viewMode === VIEW_MODE.LIST

    fetchTickets(
      {
        type: isViewModeList ? HARD_TICKET : LIGHT_TICKET,
        page: currentPage,
        attributes: {
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(isViewModeList ? hardTicketFilters : lightTicketFilters)
        },
        ...(groupTitle && { group_title: groupTitle })
      },
      (response) => {
        const { data, ...rest } = response
        if (isViewModeList) {
          setHardTickets(data)
          setTotalLeads(rest.pagination.total || 0)
          return
        }
        setFilteredTicketIds(data ?? null)
        setTotalLeads(rest.total || 0)
      }
    )
  }

  useEffect(() => {
    fetchTicketList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, groupTitle, viewMode])

  return (
    <>
      <RefLeadsFilter
        onChangeViewMode={setViewMode}
        ref={refLeadsFilter}
        openCreateTicketModal={openCreateTicketModal}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        selectedTickets={selectedTickets}
        onOpenModal={() => setIsModalOpen(true)}
        setIsFilterOpen={setIsFilterOpen}
        deleteTicket={deleteTicket}
        setGroupTitle={setGroupTitle}
        totalTicketsFiltered={totalLeads ?? tickets.length}
        isFilterOpen={isFilterOpen}
      />

      <div
        style={{
          "--leads-filter-height": `${leadsFilterHeight}px`
        }}
        className="dashboard-container"
      >
        {isLoading || loading ? (
          <div className="d-flex align-items-center justify-content-center h-full">
            <Spin />
          </div>
        ) : viewMode === VIEW_MODE.LIST ? (
          <LeadTable
            loading={loading}
            currentPage={currentPage}
            filteredLeads={hardTickets}
            selectedTickets={selectedTickets}
            toggleSelectTicket={toggleSelectTicket}
            totalLeads={getTotalPages(totalLeads)}
            onChangePagination={handlePaginationWorkflow}
            selectTicket={selectedTickets}
          />
        ) : (
          <WorkflowColumns
            selectedWorkflow={selectedWorkflow}
            tickets={filteredTickets}
            searchTerm={debouncedSearch}
            onEditTicket={(ticket) => {
              setCurrentTicket(ticket)
              setIsModalOpen(true)
            }}
          />
        )}
      </div>

      {spinnerTickets && <SpinnerRightBottom />}

      <Modal
        open={isChatOpen}
        onClose={closeChatModal}
        title=""
        width={1850}
        height={1000}
        footer={null}
        showCloseButton={false}
      >
        {ticketId && (
          <SingleChat ticketId={ticketId} onClose={closeChatModal} />
        )}
      </Modal>

      {isOpenAddLeadModal && (
        <TicketModal
          fetchTickets={fetchTicketList}
          selectedGroupTitle={groupTitle}
          ticket={currentTicket}
          onClose={() => setIsOpenAddLeadModal(false)}
          onSave={(updatedTicket) => {
            setTickets((prevTickets) => {
              const isEditing = Boolean(updatedTicket.ticket_id)
              return isEditing
                ? prevTickets.map((ticket) =>
                    ticket.id === updatedTicket.ticket_id
                      ? updatedTicket
                      : ticket
                  )
                : [...prevTickets, updatedTicket]
            })
          }}
        />
      )}

      <MantineModal
        title={getLanguageByKey("Filtrează tichete")}
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      >
        {viewMode === VIEW_MODE.KANBAN ? (
          <TicketFilterModal
            loading={loading}
            onClose={() => setViewMode()}
            onApplyWorkflowFilters={(filters) =>
              applyWorkflowFilters(
                normalizeLeadsFilters(filters),
                filteredTicketIds
              )
            }
            onApplyTicketFilters={(filters) => {
              handleApplyFilterLightTicket(normalizeLeadsFilters(filters, true))
            }}
          />
        ) : (
          <TicketFilterModal
            loading={loading}
            onClose={() => setViewMode()}
            onApplyWorkflowFilters={(filters) =>
              applyWorkflowFilters(
                normalizeLeadsFilters(filters),
                filteredTicketIds
              )
            }
            onApplyTicketFilters={(filters) => {
              handleApplyFiltersHardTicket(normalizeLeadsFilters(filters))
            }}
          />
        )}
      </MantineModal>

      <MantineModal
        open={isModalOpen}
        onClose={() => closeModal()}
        title={getLanguageByKey("Editarea tichetelor în grup")}
      >
        <EditBulkOrSingleLeadTabs
          onClose={closeModal}
          selectedTickets={selectedTickets}
          fetchLeads={fetchTicketList}
          id={
            selectedTickets.length === 1
              ? selectedTickets[0]
              : currentTicket?.id
          }
        />
      </MantineModal>
    </>
  )
}

export default Leads
