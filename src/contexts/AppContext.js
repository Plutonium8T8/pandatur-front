import React, { createContext, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage, useSocket } from "@hooks";
import { api } from "@api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { useWorkflowOptions } from "@hooks/useWorkflowOptions";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

export const AppContext = createContext();

const normalizeTickets = (tickets) =>
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
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const [groupTitle, setGroupTitle] = useState(null);
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");

  const {
    groupTitleForApi,
    workflowOptions,
    isAdmin,
  } = useWorkflowOptions({ userId, groupTitle });

  const collapsed = () => {
    changeLocalStorage(storage === "true" ? "false" : "true");
  };

  const markMessagesAsRead = (ticketId, count) => {
    if (!ticketId) return;
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unseen_count: 0 } : ticket,
      ),
    );
    setUnreadCount((prev) => prev - count);
  };

  const getFilteredTicketsRecursively = async (startPage, groupTitle) => {
    let page = startPage;
    let allTickets = [];
    let totalUnread = 0;

    try {
      while (true) {
        const res = await api.tickets.filter({ group_title: groupTitle, page });
        const pageTickets = res?.tickets || [];
        const totalPages = res?.pagination?.total_pages || 1;

        totalUnread += pageTickets.reduce((sum, t) => sum + (t.unseen_count || 0), 0);
        allTickets = [...allTickets, ...normalizeTickets(pageTickets)];

        if (page >= totalPages) break;
        page++;
      }

      setTickets(allTickets);
      setUnreadCount(totalUnread);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setSpinnerTickets(false);
    }
  };

  const fetchTickets = async () => {
    if (!groupTitleForApi) return;
    setSpinnerTickets(true);
    setTickets([]);
    setUnreadCount(0);
    await getFilteredTicketsRecursively(1, groupTitleForApi);
  };

  const fetchSingleTicket = async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getById(ticketId);
      if (!ticket) return;
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === ticketId);
        return exists
          ? prev.map((t) => (t.id === ticketId ? ticket : t))
          : [...prev, ticket];
      });
      setUnreadCount((prev) => prev + (ticket.unseen_count || 0));
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
                unseen_count:
                  ticket.unseen_count + (sender_id !== userId ? 1 : 0),
                last_message_type: mtype,
                last_message: msgText,
                time_sent,
              }
              : ticket,
          ),
        );
        break;
      }

      case TYPE_SOCKET_EVENTS.SEEN: {
        const { ticket_id } = message.data;
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticket_id ? { ...ticket, unseen_count: 0 } : ticket,
          ),
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
              }),
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
        console.warn("Invalid message_type from socket:", message.type);
    }
  };

  useEffect(() => {
    if (groupTitleForApi) fetchTickets();
  }, [groupTitleForApi]);

  useEffect(() => {
    if (sendedValue) handleWebSocketMessage(sendedValue);
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
        isAdmin,
        groupTitle,
        setGroupTitle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
