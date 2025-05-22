import React, { createContext, useState, useEffect, useMemo } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage, useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  userGroupsToGroupTitle,
} from "../Components/utils/workflowUtils";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";
export const AppContext = createContext();

const normalizeLightTickets = (tickets) =>
  tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));

export const AppProvider = ({ children }) => {
  const { sendedValue, socketRef } = useSocket();
  const { enqueueSnackbar } = useSnackbar();
  const { userId } = useUser();
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");

  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(true);
  const [lightTicketFilters, setLightTicketFilters] = useState({});

  const collapsed = () => changeLocalStorage(storage === "true" ? "false" : "true");

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const technicians = await api.users.getTechnicianList();
        const me = technicians.find(
          (t) => t.id?.user?.id && String(t.id.user.id) === String(userId)
        );
        setUserGroups(me?.groups || []);
      } catch (err) {
        console.error("❌ [AppContext] error get technician list", err);
        setUserGroups([]);
      } finally {
        setLoadingWorkflow(false);
      }
    };
    if (userId) fetchTechnicians();
  }, [userId]);

  const groupTitleForApi = useMemo(() => {
    const found = userGroups.find((group) => {
      const mapped = userGroupsToGroupTitle[group.name];
      return mapped && (Array.isArray(mapped) ? mapped.length > 0 : true);
    });
    const mapped = found ? userGroupsToGroupTitle[found.name] : null;
    return Array.isArray(mapped) ? mapped[0] : mapped;
  }, [userGroups]);

  const isAdmin = useMemo(() => {
    return userGroups.some((g) => g.name === "Admin");
  }, [userGroups]);

  const workflowOptions = useMemo(() => {
    if (!groupTitleForApi) return [];
    if (isAdmin) return workflowOptionsByGroupTitle[groupTitleForApi] || [];
    return workflowOptionsLimitedByGroupTitle[groupTitleForApi] || [];
  }, [groupTitleForApi, isAdmin]);

  const markMessagesAsRead = (ticketId, count) => {
    if (!ticketId) return;
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unseen_count: 0 } : ticket
      )
    );
    setUnreadCount((prev) => prev - count);
  };

  const getTicketsListRecursively = async (page = 1) => {
    try {
      const data = await api.tickets.filters({
        page,
        type: "light",
        group_title: groupTitleForApi,
        workflow: workflowOptions,
        attributes: lightTicketFilters, // ✅ фильтры из Leads
      });

      const totalPages = data.pagination?.total_pages || 1;

      const totalUnread = data.tickets.reduce(
        (sum, ticket) => sum + (ticket.unseen_count || 0),
        0
      );

      setUnreadCount((prev) => prev + totalUnread);
      const processedTickets = normalizeLightTickets(data.tickets);
      setTickets((prev) => [...prev, ...processedTickets]);

      if (page < totalPages) {
        await getTicketsListRecursively(page + 1);
      } else {
        setSpinnerTickets(false);
      }
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
      setSpinnerTickets(false);
    }
  };

  const fetchTickets = async () => {
    setSpinnerTickets(true);
    await getTicketsListRecursively(1);
  };

  useEffect(() => {
    if (!loadingWorkflow && groupTitleForApi && workflowOptions.length) {
      fetchTickets();
    }
  }, [loadingWorkflow, groupTitleForApi, workflowOptions, lightTicketFilters]);

  const fetchSingleTicket = async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);
      setTickets((prev) => {
        const exists = prev.find((t) => t.id === ticketId);
        return exists ? prev.map((t) => (t.id === ticketId ? ticket : t)) : [...prev, ticket];
      });
      setUnreadCount((prev) => prev + (ticket?.unseen_count || 0));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message: msgText, time_sent, mtype, sender_id } = message.data;
        setUnreadCount((prev) => prev + 1);
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticket_id
              ? {
                  ...ticket,
                  unseen_count: ticket.unseen_count + (sender_id !== userId ? 1 : 0),
                  last_message_type: mtype,
                  last_message: msgText,
                  time_sent,
                }
              : ticket
          )
        );
        break;
      }
      case TYPE_SOCKET_EVENTS.SEEN: {
        const { ticket_id } = message.data;
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticket_id ? { ...ticket, unseen_count: 0 } : ticket
          )
        );
        break;
      }
      case TYPE_SOCKET_EVENTS.TICKET: {
        const ticketId = message.data.ticket_id;
        if (ticketId) {
          fetchSingleTicket(ticketId);
          const socketInstance = socketRef.current;
          if (socketInstance?.readyState === WebSocket.OPEN) {
            socketInstance.send(
              JSON.stringify({
                type: TYPE_SOCKET_EVENTS.CONNECT,
                data: { ticket_id: [ticketId] },
              })
            );
          } else {
            enqueueSnackbar(getLanguageByKey("errorConnectingToChatRoomWebSocket"), {
              variant: "error",
            });
          }
        }
        break;
      }
      default:
        console.warn("Invalid socket message type:", message.type);
    }
  };

  useEffect(() => {
    if (sendedValue) {
      handleWebSocketMessage(sendedValue);
    }
  }, [sendedValue]);

  return (
    <AppContext.Provider
      value={{
        tickets,
        setTickets,
        unreadCount,
        markMessagesAsRead,
        spinnerTickets,
        isCollapsed: storage === "true",
        setIsCollapsed: collapsed,
        setUnreadCount,
        workflowOptions,
        groupTitleForApi,
        isAdmin,
        userGroups,
        fetchTickets,
        setLightTicketFilters, // ✅ теперь можно использовать в Leads
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
