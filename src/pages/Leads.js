import React, { useState, useMemo, useEffect, useRef, useContext } from "react";
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
import { VIEW_MODE } from "@components/LeadsComponent/utils";
import { LeadsKanbanFilter } from "@components/LeadsComponent/LeadsKanbanFilter";
import { LeadsTableFilter } from "@components/LeadsComponent/LeadsTableFilter";
import { UserContext } from "../contexts/UserContext";
import "../css/SnackBarComponent.css";
import { useWorkflowOptions } from "../hooks/useWorkflowOptions";
import { userGroupsToGroupTitle } from "../Components/utils/workflowUtils";

const SORT_BY = "creation_date";
const ORDER = "DESC";
const HARD_TICKET = "hard";
const LIGHT_TICKET = "light";
const NUMBER_PAGE = 1;

const getTicketsIds = (ticketList) => ticketList.map(({ id }) => id);

const getDefaultGroupTitle = (userGroups) => {
  for (let group of userGroups || []) {
    const mapped = userGroupsToGroupTitle[group.name];
    if (mapped) {
      return Array.isArray(mapped) ? mapped[0] : mapped;
    }
  }
  return "";
};

export const Leads = () => {
  const refLeadsHeader = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const leadsFilterHeight = useDOMElementHeight(refLeadsHeader);
  const { tickets, spinnerTickets } = useApp();
  const { ticketId } = useParams();

  // Получаем userId из контекста (userGroups больше не нужны!)
  const { userId } = useContext(UserContext);

  const [hardTickets, setHardTickets] = useState([]);
  const [filteredTicketIds, setFilteredTicketIds] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(!!ticketId);
  const [groupTitle, setGroupTitle] = useState("");
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false);
  const [hardTicketFilters, setHardTicketFilters] = useState({});
  const [lightTicketFilters, setLightTicketFilters] = useState({});
  const [isOpenKanbanFilterModal, setIsOpenKanbanFilterModal] = useState(false);
  const [isOpenListFilterModal, setIsOpenListFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN);

  // Получаем группы пользователя и опции ворнки из хука
  const { workflowOptions, userGroups: myGroups, groupTitleForApi } = useWorkflowOptions({
    groupTitle,
    userId,
  });

  // Установка groupTitle по дефолту (только после загрузки myGroups)
  useEffect(() => {
    if (!groupTitle && myGroups && myGroups.length > 0) {
      const defaultGroupTitle = getDefaultGroupTitle(myGroups);
      if (defaultGroupTitle) {
        setGroupTitle(defaultGroupTitle);
      }
    }
    // eslint-disable-next-line
  }, [myGroups]);

  const debouncedSearch = useDebounce(searchTerm);
  const deleteBulkLeads = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"),
  });

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (filteredTicketIds === null) return result;
    if (filteredTicketIds.length === 0) return [];
    result = result.filter((ticket) => filteredTicketIds.includes(ticket.id));
    if (workflowOptions.length > 0) {
      result = result.filter((ticket) =>
        workflowOptions.includes(ticket.workflow),
      );
    }
    return result;
  }, [tickets, filteredTicketIds, workflowOptions]);

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
        : [...prev, ticketId],
    );
  };

  const deleteTicket = async () => {
    deleteBulkLeads(async () => {
      try {
        setLoading(true);
        await api.tickets.deleteById(selectedTickets);
        await fetchTickets(
          {
            type: HARD_TICKET,
            page: currentPage,
            attributes: hardTicketFilters,
          },
          ({ data, pagination }) => {
            setHardTickets(data);
            setTotalLeads(pagination?.total || 0);
          },
        );
        setSelectedTickets([]);
        enqueueSnackbar(
          getLanguageByKey("Leadurile au fost șterse cu succes"),
          { variant: "success" },
        );
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

  const fetchTickets = async (
    {
      page,
      type,
      sortBy = SORT_BY,
      order = ORDER,
      attributes = {},
      group_title,
    },
    cb,
    showModalLoading,
  ) => {
    try {
      setLoading(true);
      const tickets = await api.tickets.filters({
        page,
        sort_by: sortBy,
        order: order,
        type,
        attributes,
        group_title,
      });
      cb(tickets);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = (resetSelectedTickets) => {
    setCurrentTicket(null);
    setIsModalOpen(false);

    if (resetSelectedTickets) {
      setSelectedTickets([]);
    }
  };

  const handleApplyFiltersHardTicket = (selectedFilters) => {
    const isReset = Object.keys(selectedFilters).length === 0;

    const mergedHardTicketFilters = isReset
      ? {}
      : {
        ...hardTicketFilters,
        ...selectedFilters,
      };

    fetchTickets(
      {
        attributes: mergedHardTicketFilters,
        page: NUMBER_PAGE,
        type: HARD_TICKET,
      },
      ({ data, pagination }) => {
        setHardTickets(data);
        setHardTicketFilters(mergedHardTicketFilters);
        setTotalLeads(pagination?.total || 0);
        setCurrentPage(1);
        setIsOpenListFilterModal(false);
      },
      true
    );
  };

  const handleApplyFilterLightTicket = (selectedFilters, source = "ticket") => {
    if (source === "message") {
      setLightTicketFilters(selectedFilters);

      fetchTickets(
        {
          page: NUMBER_PAGE,
          type: LIGHT_TICKET,
          attributes: selectedFilters,
        },
        ({ data, pagination }) => {
          setTotalLeads(pagination?.total || 0);
          setFilteredTicketIds(getTicketsIds(data) ?? null);
          setIsOpenKanbanFilterModal(false);
        }
      );

      return;
    }

    const mergedLightTicketFilters = {
      ...lightTicketFilters,
      ...selectedFilters,
    };

    fetchTickets(
      {
        page: NUMBER_PAGE,
        type: LIGHT_TICKET,
        attributes: mergedLightTicketFilters,
      },
      ({ data, pagination }) => {
        setLightTicketFilters(mergedLightTicketFilters);
        setTotalLeads(pagination?.total || 0);
        setFilteredTicketIds(getTicketsIds(data) ?? null);
        setIsOpenKanbanFilterModal(false);
      }
    );
  };

  const handlePaginationWorkflow = (page) => {
    fetchTickets(
      { page, type: HARD_TICKET, attributes: hardTicketFilters },
      ({ data, pagination }) => {
        setHardTickets(data);
        setTotalLeads(pagination?.total || 0);
        setCurrentPage(page);
      },
    );
  };

  const fetchTicketList = () => {
    const isViewModeList = viewMode === VIEW_MODE.LIST;

    fetchTickets(
      {
        type: isViewModeList ? HARD_TICKET : LIGHT_TICKET,
        page: currentPage,
        attributes: {
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(isViewModeList ? hardTicketFilters : lightTicketFilters),
        },
        group_title: groupTitle,      },
      ({ data, pagination }) => {
        setTotalLeads(pagination?.total || 0);

        if (isViewModeList) {
          setHardTickets(data);
        } else {
          setFilteredTicketIds(getTicketsIds(data) ?? null);
        }
      },
    );
  };

  useEffect(() => {
    fetchTicketList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, groupTitle, viewMode]);

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
            return;
          }
          setIsOpenListFilterModal(true);
        }}
        deleteTicket={deleteTicket}
        groupTitle={groupTitle}
        setGroupTitle={setGroupTitle}
        totalTicketsFiltered={totalLeads}
        hasOpenFiltersModal={isOpenKanbanFilterModal || isOpenListFilterModal}
        tickets={viewMode === VIEW_MODE.LIST ? hardTickets : filteredTickets}
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
            fetchTickets={fetchTicketList}
          />
        ) : (
          <WorkflowColumns
            fetchTickets={fetchTicketList}
            selectedWorkflow={workflowOptions}
            tickets={filteredTickets}
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
        fetchTickets={fetchTicketList}
      />

      <MantineModal
        title={getLanguageByKey("Filtrează tichete")}
        open={isOpenKanbanFilterModal}
        onClose={() => setIsOpenKanbanFilterModal(false)}
      >
        <LeadsKanbanFilter
          initialData={lightTicketFilters}
          systemWorkflow={workflowOptions}
          loading={loading}
          onClose={() => setIsOpenKanbanFilterModal(false)}
          onApplyWorkflowFilters={() => { }}
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
        onClose={() => closeModal()}
        title={getLanguageByKey("Editarea tichetelor în grup")}
      >
        <ManageLeadInfoTabs
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
  );
};
