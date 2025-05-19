import React, { createContext, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage, useSocket } from "@hooks";
import { api } from "@api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { useWorkflowOptions } from "../hooks/useWorkflowOptions";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

export const AppContext = createContext();

const normalizeLightTickets = (tickets) => {
  return tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));
};

export const AppProvider = ({ children }) => {
  const { sendedValue, socketRef } = useSocket();
  const { enqueueSnackbar } = useSnackbar();
  const { userId } = useUser();
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");

  const { groupTitleForApi, userGroups } = useWorkflowOptions({ groupTitle: "", userId });

  const {
    workflowOptions,
  } = useWorkflowOptions({ groupTitle: groupTitleForApi || "", userId });

  // useEffect(() => {
  //   console.log("[AppContext] userId:", userId);
  //   console.log("[AppContext] groupTitleForApi:", groupTitleForApi);
  //   console.log("[AppContext] userGroups:", userGroups);
  //   console.log("[AppContext] workflowOptions:", workflowOptions);
  // }, [userId, groupTitleForApi, workflowOptions, userGroups]);

  const collapsed = () => {
    changeLocalStorage(storage === "true" ? "false" : "true");
  };

  const markMessagesAsRead = (ticketId, count) => {
    if (!ticketId) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, unseen_count: 0 } : t))
    );
    setUnreadCount((prev) => prev - count);
  };

  const getTicketsListRecursively = async (page) => {
    try {
      const data = await api.tickets.getLightList({ page });
      if (page >= data.total_pages) {
        setSpinnerTickets(false);
        return;
      }
      const totalUnread = data.tickets.reduce((sum, t) => sum + t.unseen_count, 0);
      setUnreadCount((prev) => prev + totalUnread);
      const processed = normalizeLightTickets(data.tickets);
      setTickets((prev) => [...prev, ...processed]);
      getTicketsListRecursively(page + 1);
    } catch (err) {
      enqueueSnackbar(showServerError(err), { variant: "error" });
    }
  };

  const fetchTickets = async () => {
    try {
      setSpinnerTickets(true);
      await getTicketsListRecursively(1);
    } catch (err) {
      enqueueSnackbar(showServerError(err), { variant: "error" });
    }
  };

  const fetchSingleTicket = async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);
      setTickets((prev) => {
        const existing = prev.find((t) => t.id === ticketId);
        return existing
          ? prev.map((t) => (t.id === ticketId ? ticket : t))
          : [...prev, ticket];
      });
      setUnreadCount((prev) => prev + (ticket?.unseen_count || 0));
    } catch (err) {
      enqueueSnackbar(showServerError(err), { variant: "error" });
    }
  };

  const handleWebSocketMessage = (msg) => {
    switch (msg.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message, time_sent, mtype, sender_id } = msg.data;
        setUnreadCount((prev) => prev + 1);
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket_id
              ? {
                ...t,
                unseen_count: t.unseen_count + (sender_id !== userId ? 1 : 0),
                last_message_type: mtype,
                last_message: message,
                time_sent,
              }
              : t
          )
        );
        break;
      }

      case TYPE_SOCKET_EVENTS.SEEN: {
        const { ticket_id } = msg.data;
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket_id ? { ...t, unseen_count: 0 } : t))
        );
        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET: {
        const ticketId = msg.data.ticket_id;
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
            console.warn("WebSocket not connected.");
          }
        }
        break;
      }

      default:
        console.warn("Unhandled WebSocket message type:", msg.type);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

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
        setIsCollapsed: collapsed,
        isCollapsed: storage === "true",
        setUnreadCount,
        workflowOptions,
        groupTitleForApi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
