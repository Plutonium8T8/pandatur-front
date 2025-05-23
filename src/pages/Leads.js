import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Divider } from "@mantine/core";
import {
  useDOMElementHeight,
  useApp,
  useDebounce,
  useConfirmPopup,
} from "@hooks";
import { priorityOptions } from "../FormOptions";
import { workflowOptions } from "../FormOptions/workflowOptions";
import { LeadTable } from "@components/LeadsComponent/LeadTable";
import { showServerError, getTotalPages, getLanguageByKey } from "@utils";
import { api } from "@api";
import SingleChat from "@components/ChatComponent/SingleChat";
import { Spin } from "@components";
import { RefLeadsHeader } from "@components/LeadsComponent/LeadsHeader";
import {
  SpinnerRightBottom,
  MantineModal,
  WorkflowColumns,
  AddLeadModal,
} from "@components";
import { ManageLeadInfoTabs } from "@components/LeadsComponent/ManageLeadInfoTabs";
import { VIEW_MODE, filteredWorkflows } from "@components/LeadsComponent/utils";
import { LeadsKanbanFilter } from "@components/LeadsComponent/LeadsKanbanFilter";
import { LeadsTableFilter } from "@components/LeadsComponent/LeadsTableFilter";
import "../css/SnackBarComponent.css";

const SORT_BY = "creation_date";
const ORDER = "DESC";
const HARD_TICKET = "hard";
const NUMBER_PAGE = 1;

export const Leads = () => {
  const refLeadsHeader = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const leadsFilterHeight = useDOMElementHeight(refLeadsHeader);
  const {
    tickets,
    kanbanTickets,
    fetchKanbanTickets,
    spinnerTickets,
    setLightTicketFilters,
    fetchTickets,
  } = useApp();
  const { ticketId } = useParams();

  const [hardTickets, setHardTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(!!ticketId);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState(filteredWorkflows);
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false);
  const [hardTicketFilters, setHardTicketFilters] = useState({});
  const [isOpenKanbanFilterModal, setIsOpenKanbanFilterModal] = useState(false);
  const [isOpenListFilterModal, setIsOpenListFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN);
  const visibleTickets = kanbanTickets.length > 0 ? kanbanTickets : tickets;
  const currentFetchTickets = kanbanTickets.length > 0 ? fetchKanbanTickets : fetchTickets;

  const debouncedSearch = useDebounce(searchTerm);
  const deleteBulkLeads = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"),
  });

  useEffect(() => {
    if (ticketId) {
      setIsChatOpen(true);
    }
  }, [ticketId]);

  const closeChatModal = () => {
    setIsChatOpen(false);
    navigate("/leads");
  };

  const toggleSelectTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const deleteTicket = async () => {
    deleteBulkLeads(async () => {
      try {
        setLoading(true);
        await api.tickets.deleteById(selectedTickets);
        await fetchHardTickets(currentPage);
        setSelectedTickets([]);
        enqueueSnackbar(getLanguageByKey("Leadurile au fost șterse cu succes"), {
          variant: "success",
        });
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      } finally {
        setLoading(false);
      }
    });
  };

  const openCreateTicketModal = () => {
    setCurrentTicket({
      contact: "",
      transport: "",
      country: "",
      priority: priorityOptions[0],
      workflow: workflowOptions[0],
      service_reference: "",
      technician_id: 0,
    });
    setIsOpenAddLeadModal(true);
  };

  const fetchHardTickets = async (page) => {
    try {
      setLoading(true);
      const response = await api.tickets.filters({
        page,
        type: HARD_TICKET,
        sort_by: SORT_BY,
        order: ORDER,
        attributes: hardTicketFilters,
      });
      setHardTickets(response.data);
      setTotalLeads(response.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFiltersHardTicket = (selectedFilters) => {
    const merged = { ...hardTicketFilters, ...selectedFilters };
    setHardTicketFilters(merged);
    fetchHardTickets(NUMBER_PAGE);
    setCurrentPage(1);
    setIsOpenListFilterModal(false);
  };

  const handleApplyFilterLightTicket = (selectedFilters) => {
    setLightTicketFilters(selectedFilters);
    fetchTickets();
    setIsOpenKanbanFilterModal(false);
  };

  const handlePaginationWorkflow = (page) => {
    fetchHardTickets(page);
    setCurrentPage(page);
  };

  return (
    <>
      <RefLeadsHeader
        onChangeViewMode={setViewMode}
        ref={refLeadsHeader}
        openCreateTicketModal={openCreateTicketModal}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        selectedTickets={selectedTickets}
        onOpenModal={() => setIsModalOpen(true)}
        setIsFilterOpen={() => {
          if (viewMode === VIEW_MODE.KANBAN) {
            setIsOpenKanbanFilterModal(true);
          } else {
            setIsOpenListFilterModal(true);
          }
        }}
        deleteTicket={deleteTicket}
        setGroupTitle={setGroupTitle}
        totalTicketsFiltered={totalLeads}
        hasOpenFiltersModal={isOpenKanbanFilterModal || isOpenListFilterModal}
        tickets={viewMode === VIEW_MODE.LIST ? hardTickets : tickets}
      />

      <div
        style={{
          "--leads-filter-height": `${leadsFilterHeight}px`,
        }}
        className="leads-container"
      >
        <Divider mb="md" />
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-full">
            <Spin />
          </div>
        ) : viewMode === VIEW_MODE.LIST ? (
          <LeadTable
            currentPage={currentPage}
            filteredLeads={hardTickets}
            selectTicket={selectedTickets}
            onSelectRow={toggleSelectTicket}
            totalLeadsPages={getTotalPages(totalLeads)}
            onChangePagination={handlePaginationWorkflow}
            fetchTickets={() => fetchHardTickets(currentPage)}
          />
        ) : (
          <WorkflowColumns
            fetchTickets={currentFetchTickets}
            selectedWorkflow={selectedWorkflow}
            tickets={visibleTickets}
            searchTerm={debouncedSearch}
            onEditTicket={(ticket) => {
              setCurrentTicket(ticket);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      {spinnerTickets && <SpinnerRightBottom />}

      <MantineModal
        title={false}
        fullScreen
        open={isChatOpen && ticketId}
        withCloseButton={false}
        style={{ padding: 0 }}
        height="100%"
      >
        <SingleChat id={ticketId} onClose={closeChatModal} />
      </MantineModal>

      <AddLeadModal
        open={isOpenAddLeadModal}
        onClose={() => setIsOpenAddLeadModal(false)}
        selectedGroupTitle={groupTitle}
        fetchTickets={fetchTickets}
      />

      <MantineModal
        title={getLanguageByKey("Filtrează tichete")}
        open={isOpenKanbanFilterModal}
        onClose={() => setIsOpenKanbanFilterModal(false)}
      >
        <LeadsKanbanFilter
          initialData={{}}
          systemWorkflow={selectedWorkflow}
          loading={loading}
          onClose={() => setIsOpenKanbanFilterModal(false)}
          onApplyWorkflowFilters={setSelectedWorkflow}
          onSubmitTicket={handleApplyFilterLightTicket}
        />
      </MantineModal>

      <MantineModal
        title={getLanguageByKey("Filtrează tichete")}
        open={isOpenListFilterModal}
        onClose={() => setIsOpenListFilterModal(false)}
      >
        <LeadsTableFilter
          initialData={hardTicketFilters}
          loading={loading}
          onClose={() => setIsOpenListFilterModal(false)}
          onSubmitTicket={handleApplyFiltersHardTicket}
          onResetFilters={() => {
            setHardTicketFilters({});
            handleApplyFiltersHardTicket({});
          }}
        />
      </MantineModal>

      <MantineModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getLanguageByKey("Editarea tichetelor în grup")}
      >
        <ManageLeadInfoTabs
          onClose={() => setIsModalOpen(false)}
          selectedTickets={selectedTickets}
          fetchLeads={() => fetchHardTickets(currentPage)}
          id={
            selectedTickets.length === 1
              ? selectedTickets[0]
              : currentTicket?.id
          }
        />
      </MantineModal>
    </>
  );
};
