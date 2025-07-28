/* eslint-disable react-hooks/exhaustive-deps */
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
import { showServerError, getTotalPages, getLanguageByKey } from "../Components/utils";
import { api } from "../api";
import { VIEW_MODE, filteredWorkflows } from "@components/LeadsComponent/utils";
import { FaTrash, FaEdit, FaList } from "react-icons/fa";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { parseFiltersFromUrl } from "../Components/utils/parseFiltersFromUrl";
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
  const [params] = useSearchParams();
  const didLoadGlobalTicketsRef = useRef(false);
  const [filtersReady, setFiltersReady] = useState(false);

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
  const isGroupTitleSyncedRef = useRef(false);

  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN);
  const isSearching = !!kanbanSearchTerm?.trim();

  const currentSearch = viewMode === VIEW_MODE.KANBAN ? kanbanSearchTerm : searchTerm;
  const debouncedSearch = useDebounce(currentSearch);
  const deleteBulkLeads = useConfirmPopup({ subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"), });
  const [perPage, setPerPage] = useState(50);

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
          attributes: {
            ...attributes,
            ...(search?.trim() ? { search: search.trim() } : {}),
          },
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
    if (viewMode === VIEW_MODE.LIST && filtersReady) {
      fetchHardTickets(currentPage);
    }
  }, [hardTicketFilters, groupTitleForApi, workflowOptions, currentPage, viewMode, filtersReady, perPage]);

  useEffect(() => {
    if (!filtersReady || !groupTitleForApi) return;

    if (viewMode === VIEW_MODE.KANBAN && debouncedSearch.trim()) {
      setKanbanFilterActive(true);
      fetchKanbanTickets({
        ...kanbanFilters,
        search: debouncedSearch.trim(),
      });
      return;
    }

    if (viewMode === VIEW_MODE.KANBAN && !debouncedSearch.trim()) {
      setKanbanTickets([]);
      setKanbanFilterActive(false);
      return;
    }

    if (viewMode === VIEW_MODE.LIST) {
      setHardTicketFilters((prev) => ({
        ...prev,
        search: debouncedSearch.trim(),
      }));
      setCurrentPage(1);
    }
  }, [debouncedSearch, viewMode]);

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

      const { search, group_title, workflow, type, view, ...restFilters } = hardTicketFilters;

      const response = await api.tickets.filters({
        page,
        type: "hard",
        group_title: groupTitleForApi,
        sort_by: "creation_date",
        order: "DESC",
        limit: perPage,
        attributes: {
          ...restFilters,
          workflow: effectiveWorkflow,
          ...(search?.trim() ? { search: search.trim() } : {}),
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
    const upperMode = mode.toUpperCase();
    setViewMode(upperMode);
    setSearchParams(() => {
      const newParams = new URLSearchParams();
      newParams.set("view", upperMode);
      return newParams;
    });

    if (upperMode === VIEW_MODE.LIST) {
      setCurrentPage(1);
      setHardTicketFilters({});
      setSearchTerm("");
    } else {
      setKanbanFilters({});
      setKanbanSearchTerm("");
      setKanbanFilterActive(false);
      setKanbanTickets([]);
      if (!didLoadGlobalTicketsRef.current) {
        fetchTickets().then(() => {
          didLoadGlobalTicketsRef.current = true;
        });
      }
    }
  };

  useEffect(() => {
    didLoadGlobalTicketsRef.current = false;
  }, [groupTitleForApi]);


  useEffect(() => {
    const urlView = searchParams.get("view");
    const urlViewUpper = urlView ? urlView.toUpperCase() : undefined;
    if (urlViewUpper && urlViewUpper !== viewMode) {
      setViewMode(urlViewUpper);
    }
  }, [searchParams]);

  const handleApplyFiltersHardTicket = (selectedFilters) => {
    const hasWorkflow = selectedFilters.workflow && selectedFilters.workflow.length > 0;

    const workflow =
      typeof selectedFilters.workflow === "string"
        ? [selectedFilters.workflow]
        : selectedFilters.workflow;

    const merged = {
      ...hardTicketFilters,
      ...selectedFilters,
      workflow: hasWorkflow ? workflow : workflowOptions,
    };

    setHardTicketFilters(merged);
    setCurrentPage(1);
    setIsOpenListFilterModal(false);
  };

  const handleApplyFilterLightTicket = (selectedFilters) => {
    setLightTicketFilters(selectedFilters);
    setKanbanFilters(selectedFilters);
    setKanbanFilterActive(true);
    setIsOpenKanbanFilterModal(false);
    didLoadGlobalTicketsRef.current = false;

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

      newParams.set("type", "light");
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
    const isReady = groupTitleForApi && workflowOptions.length;
    if (!isReady) return;

    const parsedFilters = parseFiltersFromUrl(searchParams);
    const urlGroupTitle = parsedFilters.group_title;
    const type = searchParams.get("type");
    const hasUrlFilters = Object.keys(parsedFilters).length > 0;

    if (
      urlGroupTitle &&
      accessibleGroupTitles.includes(urlGroupTitle) &&
      customGroupTitle !== urlGroupTitle
    ) {
      setCustomGroupTitle(urlGroupTitle);
      isGroupTitleSyncedRef.current = true;
      return;
    }

    if (
      isGroupTitleSyncedRef.current &&
      urlGroupTitle &&
      customGroupTitle === urlGroupTitle
    ) {
      if (type === "light" && viewMode === VIEW_MODE.KANBAN) {
        setKanbanFilters(parsedFilters);
        setKanbanFilterActive(true);
        fetchKanbanTickets(parsedFilters);
        setChoiceWorkflow(parsedFilters.workflow || []);
      } else if (type === "hard" && viewMode === VIEW_MODE.LIST) {
        setHardTicketFilters(parsedFilters);
      }

      isGroupTitleSyncedRef.current = false;
      return;
    }

    if (
      !isGroupTitleSyncedRef.current &&
      customGroupTitle === urlGroupTitle &&
      hasUrlFilters
    ) {
      if (type === "light" && viewMode === VIEW_MODE.KANBAN) {
        setKanbanFilters(parsedFilters);
        setKanbanFilterActive(true);
        fetchKanbanTickets(parsedFilters);
        setChoiceWorkflow(parsedFilters.workflow || []);
      } else if (type === "hard" && viewMode === VIEW_MODE.LIST) {
        setHardTicketFilters(parsedFilters);
      }
    }

    if (type === "light" && !hasUrlFilters) {
      setKanbanTickets([]);
      setKanbanFilterActive(false);
    }
  }, [
    searchParams.toString(),
    groupTitleForApi,
    workflowOptions,
    customGroupTitle,
    viewMode,
  ]);

  useEffect(() => {
    const type = params.get("type");
    if (type === "hard") {
      const parsedFilters = parseFiltersFromUrl(params);
      handleApplyFiltersHardTicket(parsedFilters);
      setFiltersReady(true);
    } else {
      setFiltersReady(true);
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
                onChange={(e) => {
                  const value = e.target.value;
                  if (viewMode === VIEW_MODE.KANBAN) {
                    setKanbanSearchTerm(value);
                  } else {
                    setSearchTerm(value);
                  }
                }}
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
                onChange={(val) => {
                  setCustomGroupTitle(val);

                  if (viewMode === VIEW_MODE.LIST) {
                    setCurrentPage(1);
                    setHardTicketFilters({});
                  } else {
                    setKanbanFilters({});
                    setKanbanSearchTerm("");
                    setKanbanFilterActive(false);
                    setKanbanTickets([]);
                    didLoadGlobalTicketsRef.current = false;
                  }
                }}
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
            totalLeadsPages={getTotalPages(totalLeads, perPage)}
            onChangePagination={handlePaginationWorkflow}
            perPage={perPage}
            setPerPage={val => {
              setPerPage(val);
              setCurrentPage(1);
            }}
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
          fetchTickets={fetchTickets}
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
