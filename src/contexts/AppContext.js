import React, { createContext, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage, useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "../Components/utils";

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
  const [selectTicketId, setSelectTicketId] = useState(null);
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

  const getTicketsListRecursively = async (page) => {
    try {
      const data = await api.tickets.getLightList({ page: page });

      if (page >= data.total_pages) {
        setSpinnerTickets(false);
        return;
      }

      const totalUnread = data.tickets.reduce(
        (sum, ticket) => sum + ticket.unseen_count,
        0,
      );

      setUnreadCount((prev) => prev + totalUnread);

      const processedTickets = normalizeLightTickets(data.tickets);
      setTickets((prev) => [...prev, ...processedTickets]);

      getTicketsListRecursively(page + 1);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
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

      return ticket;
    } catch (error) {
      console.error("Ticket request error:", error);
      return null;
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case "message": {
        console.log("New message from WebSocket:", message.data);

        const {
          ticket_id,
          message: msgText,
          time_sent,
          sender_id,
        } = message.data;

        setUnreadCount((prev) => prev + 1);

        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.id === ticket_id
              ? {
                  ...ticket,
                  last_message_type: message.data.mtype,
                  last_message: msgText,
                  time_sent: time_sent,
                  unseen_count:
                    ticket_id === selectTicketId
                      ? 0
                      : ticket.unseen_count + (sender_id !== userId ? 1 : 0),
                }
              : {
                  ...ticket,
                  last_message_type: message.data.mtype,
                },
          ),
        );

        break;
      }
      case "seen": {
        const { ticket_id } = message.data;

        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.id === ticket_id ? { ...ticket, unseen_count: 0 } : ticket,
          ),
        );

        break;
      }

      case "ticket": {
        console.log("A new ticket has arrived:", message.data);

        const ticketId = message.data.ticket_id;

        if (!ticketId) {
          console.warn("Cannot extract ticket id from 'ticket'.");

          break;
        }

        fetchSingleTicket(ticketId);

        const socketInstance = socketRef.current;
        if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
          const socketMessage = JSON.stringify({
            type: "connect",
            data: { ticket_id: [ticketId] },
          });
          socketInstance.send(socketMessage);
        } else {
          console.warn("Error connecting to chat-room, WebSocket is off.");
        }
        break;
      }

      case "pong":
        console.log("Pong received");
        break;
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
        selectTicketId,
        setSelectTicketId,
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
