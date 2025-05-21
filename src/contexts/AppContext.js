import React, { createContext, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage, useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS } from "@app-constants";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

export const AppContext = createContext();

const normalizeLightTickets = (tickets) => {
  const ticketList = tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));

  return ticketList;
};

export const AppProvider = ({ children }) => {
  const { sendedValue, socketRef } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { userId } = useUser();
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const { storage, changeLocalStorage } = useLocalStorage(
    SIDEBAR_COLLAPSE,
    "false",
  );

  const collapsed = () => {
    changeLocalStorage(storage === "true" ? "false" : "true");
  };

  const markMessagesAsRead = (ticketId, count) => {
    if (!ticketId) return;

    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unseen_count: 0 } : ticket,
      ),
    );

    setUnreadCount((prev) => prev - count);
  };

  const getTicketsListRecursively = async (page = 1) => {
    try {
      console.log("📥 [fetchTickets] Fetching page", page);
      const data = await api.tickets.filters({
        page,
        type: "light",
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
    try {
      setSpinnerTickets(true);
      await getTicketsListRecursively(1);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const fetchSingleTicket = async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);

      setTickets((prevTickets) => {
        const existingTicket = prevTickets.find((t) => t.id === ticketId);
        if (existingTicket) {
          return prevTickets.map((t) => (t.id === ticketId ? ticket : t));
        } else {
          return [...prevTickets, ticket];
        }
      });

      setUnreadCount((prev) => prev + ticket?.unseen_count || 0);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        console.log("New message from WebSocket:", message.data);

        const {
          ticket_id,
          message: msgText,
          time_sent,
          mtype,
          sender_id,
        } = message.data;

        setUnreadCount((prev) => prev + 1);

        setTickets((prev) => {
          return prev.map((ticket) => {
            return ticket.id === ticket_id
              ? {
                ...ticket,
                unseen_count:
                  ticket.unseen_count + (sender_id !== userId ? 1 : 0),
                last_message_type: mtype,
                last_message: msgText,
                time_sent: time_sent,
              }
              : ticket;
          });
        });

        break;
      }
      case TYPE_SOCKET_EVENTS.SEEN: {
        const { ticket_id } = message.data;

        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
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
          if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
            const socketMessage = JSON.stringify({
              type: TYPE_SOCKET_EVENTS.CONNECT,
              data: { ticket_id: [ticketId] },
            });
            socketInstance.send(socketMessage);
          } else {
            enqueueSnackbar(
              getLanguageByKey("errorConnectingToChatRoomWebSocket"),
              { variant: "error" },
            );
            console.warn("Error connecting to chat-room, WebSocket is off.");
          }
        }
        break;
      }

      default:
        console.warn("Invalid message_type from socket:", message.type);
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};