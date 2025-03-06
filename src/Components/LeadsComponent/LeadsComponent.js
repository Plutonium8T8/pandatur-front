import React, { useState, useMemo, useEffect, useRef } from "react"
import { SpinnerRightBottom } from "../SpinnerRightBottom"
import { useDOMElementHeight } from "../../hooks"
import { useAppContext } from "../../AppContext"
import { priorityOptions } from "../../FormOptions/PriorityOption"
import { workflowOptions } from "../../FormOptions/WorkFlowOption"
import WorkflowColumn from "./WorkflowColumnComponent"
import TicketModal from "./TicketModal/TicketModalComponent"
import { TicketFilterModal } from "../TicketFilterModal"
import "../../App.css"
import "../SnackBarComponent/SnackBarComponent.css"
import { FaFilter, FaTable, FaColumns, FaTrash, FaEdit } from "react-icons/fa"
import { getLanguageByKey } from "../../Components/utils/getLanguageByKey"
import { LeadTable } from "./LeadTable"
import { Button } from "../Button"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../utils/showServerError"

const SORT_BY = "creation_date"
const ORDER = "DESC"
const HARD_TICKET = "hard"
const LIGHT_TICKET = "light"

const formatFiltersData = (filters) => {
  return {
    ...filters,
    technician_id: filters.technician_id
      ? filters.technician_id.map((t) => parseInt(t.split(":")[0]))
      : []
  }
}

const Leads = () => {
  const refLeadsFilter = useRef()
  const { enqueueSnackbar } = useSnackbar()

  const [hardTickets, setHardTickets] = useState([])
  const { tickets, isLoading, setTickets } = useAppContext()
  const [isTableView, setIsTableView] = useState(false)
  const [filteredTicketIds, setFilteredTicketIds] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTicket, setCurrentTicket] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalLeads, setTotalLeads] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [tableLeadsFilters, setTableLeadsFilters] = useState({})
  const [selectedWorkflow, setSelectedWorkflow] = useState(
    workflowOptions.filter(
      (wf) => wf !== "Realizat cu succes" && wf !== "Închis și nerealizat"
    )
  )
  const leadsFilterHeight = useDOMElementHeight(refLeadsFilter)

  const [filters, setFilters] = useState({
    creation_date: "",
    last_interaction_date: "",
    technician_id: [],
    sender_id: "",
    workflow: selectedWorkflow,
    priority: [],
    tags: "",
    platform: []
  })

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

  const toggleSelectTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const deleteSelectedTickets = () => {
    if (selectedTickets.length === 0) return
    const newTickets = tickets.filter(
      (ticket) => !selectedTickets.includes(ticket.id)
    )
    setTickets(newTickets)
    setSelectedTickets([])
  }

  const editSelectedTickets = () => {
    if (selectedTickets.length === 0) return

    const ticketToEdit = tickets.find(
      (ticket) => ticket.id === selectedTickets[0]
    )
    if (ticketToEdit) {
      setCurrentTicket(ticketToEdit)
      setIsModalOpen(true)
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
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setCurrentTicket(null)
    setIsModalOpen(false)
  }

  const closeTicketModal = () => setIsFilterOpen(false)

  const applyWorkflowFilters = (updatedFilters, ticketIds) => {
    setFilters(updatedFilters)

    setSelectedWorkflow(
      Array.isArray(updatedFilters.workflow) ? updatedFilters.workflow : []
    )

    setFilteredTicketIds(ticketIds !== null ? ticketIds : null)
    closeTicketModal()
  }

  const filtersByHardTickets = async (formattedFilters) => {
    try {
      setLoading(true)
      const ticketData = await api.tickets.filters({
        page: 1,
        sort_by: SORT_BY,
        order: ORDER,
        type: HARD_TICKET,
        attributes: formattedFilters
      })

      setHardTickets(ticketData.data)
      setTotalLeads(ticketData.pagination.total)
      setCurrentPage(1)
      setTableLeadsFilters(formattedFilters)
      closeTicketModal()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = async (formattedFilters, isExternalFilters) => {
    try {
      setLoading(true)
      const ticketData = await api.tickets.filters({
        page: 1,
        sort_by: SORT_BY,
        order: ORDER,
        type: LIGHT_TICKET,
        attributes: formattedFilters
      })
      const ticketIds = ticketData.data

      applyWorkflowFilters(
        formattedFilters,
        ticketIds.length > 0 ? ticketIds : []
      )
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getHardTickets = async () => {
      setLoading(true)
      try {
        const hardTickets = await api.tickets.filters({
          page: currentPage,
          sort_by: SORT_BY,
          order: ORDER,
          type: isTableView ? HARD_TICKET : LIGHT_TICKET,
          attributes: tableLeadsFilters
        })

        setHardTickets(hardTickets.data)
        setTotalLeads(hardTickets.pagination.total)
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" })
      } finally {
        setLoading(false)
      }
    }

    if (isTableView) {
      getHardTickets()
    }
  }, [currentPage, isTableView])

  return (
    <>
      <div ref={refLeadsFilter} className="dashboard-header">
        <div className="header">
          <Button
            variant="primary"
            onClick={openCreateTicketModal}
            className="button-add-ticket"
          >
            {getLanguageByKey("Adaugă lead")}
          </Button>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
            className="search-input"
          />
          <button
            onClick={() => setIsTableView((prev) => !prev)}
            className="d-flex align-items-center gap-4"
          >
            {isTableView ? <FaColumns /> : <FaTable />}
            {getLanguageByKey(isTableView ? "Coloană" : "Listă")}
          </button>

          <div className="ticket-counter-row">
            {getLanguageByKey("Toate tichetele")}: {tickets.length} |{" "}
            {getLanguageByKey("Filtrate")}: {filteredTickets.length}
          </div>

          {selectedTickets.length > 0 && (
            <Button
              variant="danger"
              onClick={deleteSelectedTickets}
              className="d-flex align-items-center gap-8"
            >
              <FaTrash /> {getLanguageByKey("Ștergere")} (
              {selectedTickets.length})
            </Button>
          )}

          {selectedTickets.length > 0 && (
            <Button
              variant="warning"
              onClick={() => editSelectedTickets()}
              className="d-flex align-items-center gap-8"
            >
              <FaEdit /> {getLanguageByKey("Editare")} ({selectedTickets.length}
              )
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => setIsFilterOpen(true)}
            className="button-filter"
          >
            <FaFilter />
            {Object.values(filters).some((value) =>
              Array.isArray(value) ? value.length > 0 : value
            ) && <span className="filter-indicator"></span>}
          </Button>
        </div>
      </div>

      <div
        style={{
          "--leads-filter-height": `${leadsFilterHeight}px`
        }}
        className={`dashboard-container ${isTableView ? "leads-table" : ""}`}
      >
        {isTableView ? (
          <div className="leads-table">
            <LeadTable
              filteredTickets={filteredTickets}
              selectedTickets={selectedTickets}
              setCurrentTicket={setCurrentTicket}
              toggleSelectTicket={toggleSelectTicket}
              filteredLeads={hardTickets}
              totalLeads={totalLeads}
              onChangePagination={setCurrentPage}
              currentPage={currentPage}
              loading={loading}
            />
          </div>
        ) : (
          <div className="container-tickets">
            {workflowOptions
              .filter((workflow) => selectedWorkflow.includes(workflow))
              .map((workflow) => (
                <WorkflowColumn
                  key={workflow}
                  workflow={workflow}
                  tickets={filteredTickets}
                  searchTerm={searchTerm}
                  onEditTicket={(ticket) => {
                    setCurrentTicket(ticket)
                    setIsModalOpen(true)
                  }}
                />
              ))}
          </div>
        )}

        {isLoading && <SpinnerRightBottom />}
        {isModalOpen && currentTicket && (
          <TicketModal
            ticket={currentTicket}
            onClose={closeModal}
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

        <TicketFilterModal
          loading={loading}
          isOpen={isFilterOpen && !isTableView}
          onClose={closeTicketModal}
          onApplyWorkflowFilters={(filters) =>
            applyWorkflowFilters(formatFiltersData(filters), filteredTicketIds)
          }
          onApplyTicketFilters={(filters) => {
            handleApplyFilter(formatFiltersData(filters))
          }}
        />

        <TicketFilterModal
          loading={loading}
          isOpen={isFilterOpen && isTableView}
          onClose={closeTicketModal}
          onApplyWorkflowFilters={closeTicketModal}
          onApplyTicketFilters={(filters) =>
            filtersByHardTickets(formatFiltersData(filters))
          }
        />
      </div>
    </>
  )
}

export default Leads
