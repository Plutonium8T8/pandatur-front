import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Divider, Modal, Button, ActionIcon, Input, SegmentedControl, Flex, Select } from "@mantine/core";
import { useDOMElementHeight, useApp, useDebounce, useConfirmPopup, useGetTechniciansList } from "@hooks";
import { priorityOptions, groupTitleOptions } from "../FormOptions";
import { workflowOptions as defaultWorkflowOptions } from "../FormOptions/workflowOptions";
import { SpinnerRightBottom, MantineModal, AddLeadModal, PageHeader, Spin } from "@components";
import { useSearchParams } from "react-router-dom";
import { WorkflowColumns } from "../Components/Workflow/WorkflowColumns";
import { ManageLeadInfoTabs } from "@components/LeadsComponent/ManageLeadInfoTabs";
import { LeadsTableFilter } from "../Components/LeadsComponent/LeadsTableFilter";
import { LeadsKanbanFilter } from "../Components/LeadsComponent/LeadsKanbanFilter";
import SingleChat from "@components/ChatComponent/SingleChat";
import { LeadTable } from "../Components/LeadsComponent/LeadTable/LeadTable";
import Can from "../Components/CanComponent/Can";
import { showServerError, getTotalPages, getLanguageByKey } from "@utils";
import { api } from "../api";
import { VIEW_MODE, filteredWorkflows } from "@components/LeadsComponent/utils";
import { FaTrash, FaEdit, FaList } from "react-icons/fa";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { LuFilter } from "react-icons/lu";
import "../css/SnackBarComponent.css";
import "../Components/LeadsComponent/LeadsHeader/LeadsFilter.css"

export const Leads = () => {
  const refLeadsHeader = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const leadsFilterHeight = useDOMElementHeight(refLeadsHeader);
  const {
    tickets,
    spinnerTickets,
    setLightTicketFilters,
    fetchTickets,
    groupTitleForApi,
    workflowOptions,
    isCollapsed,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle
  } = useApp();
  const { ticketId } = useParams();
  const { technicians } = useGetTechniciansList();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [kanbanTickets, setKanbanTickets] = useState([]);
  const [kanbanFilters, setKanbanFilters] = useState({});
  const [kanbanSearchTerm, setKanbanSearchTerm] = useState("");
  const [kanbanSpinner, setKanbanSpinner] = useState(false);
  const [kanbanFilterActive, setKanbanFilterActive] = useState(false);
  const [choiceWorkflow, setChoiceWorkflow] = useState([]);

  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN);
  const isSearching = !!kanbanSearchTerm?.trim();

  const debouncedSearch = useDebounce(searchTerm);
  const deleteBulkLeads = useConfirmPopup({ subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"), });

  const fetchKanbanTickets = async (filters = {}) => {
    setKanbanSpinner(true);
    setKanbanFilters(filters);
    setKanbanTickets([]);

    let currentPage = 1;
    let totalPages = 1;

    try {
      const { group_title, search, ...attributes } = filters;

      while (currentPage <= totalPages) {
        const res = await api.tickets.filters({
          page: currentPage,
          type: "light",
          group_title: group_title || groupTitleForApi,
          ...(search?.trim() ? { search: search.trim() } : {}),
          attributes,
        });

        const normalized = res.tickets.map(t => ({
          ...t,
          last_message: t.last_message || getLanguageByKey("no_messages"),
          time_sent: t.time_sent || null,
          unseen_count: t.unseen_count || 0,
        }));

        setKanbanTickets(prev => [...prev, ...normalized]);

        totalPages = res.pagination?.total_pages || 1;
        currentPage += 1;
      }
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      setKanbanSpinner(false);
    }
  };

  const visibleTickets =
    isSearching || kanbanSpinner || kanbanFilterActive
      ? kanbanTickets
      : tickets;

  const currentFetchTickets = kanbanSearchTerm?.trim()
    ? fetchKanbanTickets
    : fetchTickets;

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

      const excludedWorkflows = ["Realizat cu succes", "Închis și nerealizat", "Auxiliar"];
      const isSearchingInList = !!searchTerm?.trim();

      const effectiveWorkflow =
        hardTicketFilters.workflow?.length > 0
          ? hardTicketFilters.workflow
          : isSearchingInList
            ? workflowOptions
            : workflowOptions.filter((w) => !excludedWorkflows.includes(w));

      const { search, group_title, workflow, ...restFilters } = hardTicketFilters;

      const response = await api.tickets.filters({
        page,
        type: "hard",
        group_title: groupTitleForApi,
        sort_by: "creation_date",
        order: "DESC",
        ...(search?.trim() ? { search: search.trim() } : {}),
        attributes: {
          ...restFilters,
          workflow: effectiveWorkflow,
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

  useEffect(() => {
    const urlView = searchParams.get("view");
    if (urlView === VIEW_MODE.LIST || urlView === VIEW_MODE.KANBAN) {
      setViewMode(urlView);
    }
  }, []);

  const handleChangeViewMode = (mode) => {
    setViewMode(mode);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("view", mode);
      return newParams;
    });

    if (mode === VIEW_MODE.LIST) {
      setCurrentPage(1);
    }
  };

  const handleApplyFiltersHardTicket = (selectedFilters) => {
    const hasWorkflow = selectedFilters.workflow && selectedFilters.workflow.length > 0;

    const merged = {
      ...hardTicketFilters,
      ...selectedFilters,
      workflow: hasWorkflow ? selectedFilters.workflow : workflowOptions,
    };

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

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);

      for (const key of Array.from(newParams.keys())) {
        if (key !== "view") {
          newParams.delete(key);
        }
      }

      Object.entries(selectedFilters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (!Array.isArray(value) || value.length > 0)
        ) {
          newParams.set(key, JSON.stringify(value));
        }
      });

      return newParams;
    });
  };

  const handlePaginationWorkflow = (page) => {
    setCurrentPage(page);
  };

  const toggleSelectAll = (ids) => {
    setSelectedTickets((prev) =>
      prev.length === ids.length ? [] : ids
    );
  };

  const groupTitleSelectData = groupTitleOptions.filter((option) =>
    accessibleGroupTitles.includes(option.value)
  );

  const selectedTicket = (viewMode === VIEW_MODE.LIST ? hardTickets : visibleTickets).find(
    (t) => t.id === selectedTickets?.[0]
  );
  const responsibleId = selectedTicket?.technician_id
    ? String(selectedTicket.technician_id)
    : undefined;

  const hasHardFilters = Object.values(hardTicketFilters).some(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      (!Array.isArray(v) || v.length > 0) &&
      (typeof v !== "object" || Object.keys(v).length > 0)
  );

  useEffect(() => {
    const urlView = searchParams.get("view");
    if (urlView === VIEW_MODE.LIST || urlView === VIEW_MODE.KANBAN) {
      setViewMode(urlView);
    }

    const filtersFromUrl = {};
    for (const [key, value] of searchParams.entries()) {
      if (key !== "view" && value) {
        try {
          filtersFromUrl[key] = JSON.parse(value);
        } catch {
          filtersFromUrl[key] = value;
        }
      }
    }

    const hasAnyFilters = Object.keys(filtersFromUrl).length > 0;

    if (hasAnyFilters) {
      if (urlView === VIEW_MODE.LIST) {
        setHardTicketFilters(filtersFromUrl);
      } else {
        setKanbanFilters(filtersFromUrl);
        setKanbanFilterActive(true);
        fetchKanbanTickets(filtersFromUrl);
      }
    }
  }, []);

  return (
    <>
      <Flex
        ref={refLeadsHeader}
        style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
        className="leads-header-container"
      >
        <PageHeader
          count={viewMode === VIEW_MODE.LIST ? totalLeads : visibleTickets.length}
          title={getLanguageByKey("Leads")}
          extraInfo={
            <>
              {selectedTickets.length > 0 && (
                <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
                  <Button variant="danger" leftSection={<FaTrash size={16} />} onClick={deleteTicket}>
                    {getLanguageByKey("Ștergere")} ({selectedTickets.length})
                  </Button>
                </Can>
              )}
              {selectedTickets.length > 0 && (
                <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
                  <Button variant="warning" leftSection={<FaEdit size={16} />} onClick={() => setIsModalOpen(true)}>
                    {getLanguageByKey("Editare")} ({selectedTickets.length})
                  </Button>
                </Can>
              )}
              <ActionIcon
                variant={
                  viewMode === VIEW_MODE.KANBAN
                    ? kanbanFilterActive
                      ? "filled"
                      : "default"
                    : hasHardFilters
                      ? "filled"
                      : "default"
                }
                size="36"
                onClick={() => {
                  if (viewMode === VIEW_MODE.KANBAN) {
                    setIsOpenKanbanFilterModal(true);
                  } else {
                    setIsOpenListFilterModal(true);
                  }
                }}
              >
                <LuFilter size={16} />
              </ActionIcon>
              <Input
                value={viewMode === VIEW_MODE.KANBAN ? kanbanSearchTerm : searchTerm}
                onChange={(e) =>
                  (viewMode === VIEW_MODE.KANBAN ? setKanbanSearchTerm : setSearchTerm)(e.target.value)
                }
                placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
                className="min-w-300"
                rightSectionPointerEvents="all"
                rightSection={
                  (viewMode === VIEW_MODE.KANBAN ? kanbanSearchTerm : searchTerm) && (
                    <IoMdClose
                      className="pointer"
                      onClick={() =>
                        (viewMode === VIEW_MODE.KANBAN ? setKanbanSearchTerm : setSearchTerm)("")
                      }
                    />
                  )
                }
              />
              <Select
                placeholder={getLanguageByKey("filter_by_group")}
                value={customGroupTitle ?? groupTitleForApi}
                data={groupTitleSelectData}
                onChange={setCustomGroupTitle}
              />
              <SegmentedControl
                onChange={handleChangeViewMode}
                value={viewMode}
                data={[
                  { value: VIEW_MODE.KANBAN, label: <TbLayoutKanbanFilled /> },
                  { value: VIEW_MODE.LIST, label: <FaList /> },
                ]}
              />
              <Can permission={{ module: "leads", action: "create" }}>
                <Button onClick={openCreateTicketModal} leftSection={<IoMdAdd size={16} />}>
                  {getLanguageByKey("Adaugă lead")}
                </Button>
              </Can>
            </>
          }
        />
      </Flex>

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
            kanbanFilterActive={kanbanFilterActive}
            fetchTickets={currentFetchTickets}
            selectedWorkflow={choiceWorkflow}
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
      {kanbanSpinner && viewMode === VIEW_MODE.KANBAN && <SpinnerRightBottom />}

      <MantineModal
        title={false}
        fullScreen
        open={isChatOpen && ticketId}
        withCloseButton={false}
        height="100%"
        onClose={closeChatModal}
      >
        <SingleChat ticketId={ticketId} onClose={closeChatModal} technicians={technicians} />
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
            height: "900px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: "1",
            overflowY: "auto",
          },
        }}
      >
        <LeadsKanbanFilter
          initialData={kanbanFilters}
          systemWorkflow={kanbanFilterActive ? selectedWorkflow : []}
          loading={loading}
          onClose={() => setIsOpenKanbanFilterModal(false)}
          onApplyWorkflowFilters={setSelectedWorkflow}
          onSubmitTicket={handleApplyFilterLightTicket}
          fetchKanbanTickets={fetchKanbanTickets}
          setKanbanFilterActive={setKanbanFilterActive}
          setKanbanFilters={setKanbanFilters}
          setKanbanTickets={setKanbanTickets}
          onWorkflowSelected={(workflow) => setChoiceWorkflow(workflow)}
          groupTitleForApi={groupTitleForApi}
          kanbanSearchTerm={kanbanSearchTerm}
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
            height: "900px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
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
          groupTitleForApi={groupTitleForApi}
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
