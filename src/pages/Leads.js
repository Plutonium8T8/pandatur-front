import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Divider, Modal } from "@mantine/core";
import {
  useDOMElementHeight,
  useApp,
  useDebounce,
  useConfirmPopup,
} from "@hooks";
import { priorityOptions } from "../FormOptions";
import { workflowOptions as defaultWorkflowOptions } from "../FormOptions/workflowOptions";
import { LeadTable } from "@components/LeadsComponent/LeadTable";
import { showServerError, getTotalPages, getLanguageByKey } from "@utils";
import { api } from "../api";
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
    groupTitleForApi,
    workflowOptions,
    kanbanSearchTerm,
    setKanbanSearchTerm,
    setKanbanTickets,
    kanbanSpinner,
    kanbanFilterActive,
    setKanbanFilterActive,
    kanbanFilters,
    setKanbanFilters,
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
  const [selectedWorkflow, setSelectedWorkflow] = useState(filteredWorkflows);
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false);
  const [hardTicketFilters, setHardTicketFilters] = useState({});
  const [isOpenKanbanFilterModal, setIsOpenKanbanFilterModal] = useState(false);
  const [isOpenListFilterModal, setIsOpenListFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN);
  const isSearching = !!kanbanSearchTerm?.trim();
  const visibleTickets =
    isSearching || kanbanSpinner || kanbanFilterActive
      ? kanbanTickets
      : tickets;

  const currentFetchTickets = kanbanSearchTerm?.trim() ? fetchKanbanTickets : fetchTickets;

  const debouncedSearch = useDebounce(searchTerm);
  const deleteBulkLeads = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"),
  });

  useEffect(() => {
    if (ticketId) setIsChatOpen(true);
  }, [ticketId]);

  useEffect(() => {
    if (viewMode === VIEW_MODE.LIST) {
      fetchHardTickets(currentPage);
    }
  }, [hardTicketFilters, groupTitleForApi, workflowOptions, currentPage, viewMode]);

  useEffect(() => {
    if (viewMode === VIEW_MODE.LIST) {
      const timeout = setTimeout(() => {
        setHardTicketFilters((prev) => ({
          ...prev,
          search: searchTerm.trim(),
        }));
        setCurrentPage(1);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [searchTerm]);

  useEffect(() => {
    const isReady = groupTitleForApi && workflowOptions.length;
    if (!isReady) return;

    if (kanbanSearchTerm?.trim()) {
      const timeout = setTimeout(() => {
        fetchKanbanTickets();
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      setKanbanTickets([]);
      setKanbanFilterActive(false);
    }
  }, [kanbanSearchTerm, groupTitleForApi, workflowOptions]);

  const fetchHardTickets = async (page = 1) => {
    if (!groupTitleForApi || !workflowOptions.length) return;
    try {
      setLoading(true);
      const response = await api.tickets.filters({
        page,
        type: HARD_TICKET,
        sort_by: SORT_BY,
        order: ORDER,
        group_title: groupTitleForApi,
        attributes: {
          ...hardTicketFilters,
          workflow: hardTicketFilters.workflow ?? workflowOptions,
        },
      });
      setHardTickets(response.data);
      setTotalLeads(response.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

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
        setSelectedTickets([]);
        enqueueSnackbar(getLanguageByKey("Leadurile au fost șterse cu succes"), {
          variant: "success",
        });
        fetchHardTickets(currentPage);
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
      workflow: defaultWorkflowOptions[0],
      service_reference: "",
      technician_id: 0,
    });
    setIsOpenAddLeadModal(true);
  };

  const handleChangeViewMode = (mode) => {
    setViewMode(mode);
    if (mode === VIEW_MODE.LIST) {
      setCurrentPage(1);
    }
  };

  const handleApplyFiltersHardTicket = (selectedFilters) => {
    const merged = { ...hardTicketFilters, ...selectedFilters };
    setHardTicketFilters(merged);
    setCurrentPage(1);
    setIsOpenListFilterModal(false);
  };

  const handleApplyFilterLightTicket = (selectedFilters) => {
    setLightTicketFilters(selectedFilters);
    setKanbanFilters(selectedFilters);
    setKanbanFilterActive(true);
    fetchKanbanTickets(selectedFilters);
    setIsOpenKanbanFilterModal(false);
  };

  const handlePaginationWorkflow = (page) => {
    setCurrentPage(page);
  };

  const toggleSelectAll = (ids) => {
    setSelectedTickets((prev) =>
      prev.length === ids.length ? [] : ids
    );
  };

  return (
    <>
      <RefLeadsHeader
        onChangeViewMode={handleChangeViewMode}
        ref={refLeadsHeader}
        openCreateTicketModal={openCreateTicketModal}
        setSearchTerm={viewMode === VIEW_MODE.KANBAN ? setKanbanSearchTerm : setSearchTerm}
        searchTerm={viewMode === VIEW_MODE.KANBAN ? kanbanSearchTerm : searchTerm}
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
        totalTicketsFiltered={totalLeads}
        hasOpenFiltersModal={isOpenKanbanFilterModal || isOpenListFilterModal}
        tickets={viewMode === VIEW_MODE.LIST ? hardTickets : tickets}
      />

      <div style={{ "--leads-filter-height": `${leadsFilterHeight}px` }} className="leads-container">
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
            onToggleAll={toggleSelectAll}
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
        height="100%"
        onClose={closeChatModal}
      >
        <SingleChat id={ticketId} onClose={closeChatModal} />
      </MantineModal>

      <Modal
        opened={isOpenAddLeadModal}
        onClose={() => setIsOpenAddLeadModal(false)}
        title={getLanguageByKey("Adaugă lead")}
        withCloseButton
        centered
        size="lg"
      >
        <AddLeadModal
          open
          onClose={() => setIsOpenAddLeadModal(false)}
          selectedGroupTitle={groupTitleForApi}
          fetchTickets={() => fetchHardTickets(currentPage)}
        />
      </Modal>

      <Modal
        opened={isOpenKanbanFilterModal}
        onClose={() => setIsOpenKanbanFilterModal(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="xl"
        styles={{
          content: {
            height: "800px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
          },
        }}
      >
        <LeadsKanbanFilter
          initialData={kanbanFilters}
          systemWorkflow={selectedWorkflow}
          loading={loading}
          onClose={() => setIsOpenKanbanFilterModal(false)}
          onApplyWorkflowFilters={setSelectedWorkflow}
          onSubmitTicket={handleApplyFilterLightTicket}
        />
      </Modal>

      <Modal
        opened={isOpenListFilterModal}
        onClose={() => setIsOpenListFilterModal(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="xl"
        styles={{
          content: {
            height: "800px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
          },
        }}
      >
        <LeadsTableFilter
          initialData={hardTicketFilters}
          loading={loading}
          onClose={() => setIsOpenListFilterModal(false)}
          onSubmitTicket={handleApplyFiltersHardTicket}
          onResetFilters={() => {
            setHardTicketFilters({});
            setCurrentPage(1);
          }}
        />
      </Modal>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getLanguageByKey("Editarea tichetelor în grup")}
        withCloseButton
        centered
        size="xl"
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
      </Modal>
    </>
  );
};
