import React, { createContext, useState, useEffect, useRef } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage, useMessages } from "../hooks";
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
  const {
    messages,
    getUserMessages,
    markMessageRead,
    updateMessage,
    markMessageSeen,
    setMessages,
    lastMessage,
    loading,
    mediaFiles,
    error,
  } = useMessages();
  const socketRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { userId } = useUser();
  const [selectTicketId, setSelectTicketId] = useState(null);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const { storage, changeLocalStorage } = useLocalStorage(
    SIDEBAR_COLLAPSE,
    "false",
  );

  const collapsed = () => {
    changeLocalStorage(storage === "true" ? "false" : "true");
  };

  useEffect(() => {
    let pingInterval;

    if (socketRef.current) {
      pingInterval = setInterval(() => {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          const pingMessage = JSON.stringify({ type: "ping" });
          socketRef.current.send(pingMessage);
        }
      }, 5000);

      return () => {
        clearInterval(pingInterval);
        if (socketRef.current) {
          socketRef.current.onmessage = null;
        }
      };
    }
  }, []);

  const connectToChatRooms = (ticketIds) => {
    const socketInstance = socketRef.current;
    if (!socketInstance || socketInstance.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected or currently unavailable.");
      return;
    }

    if (!ticketIds || ticketIds.length === 0) {
      console.warn("Missing ID for connecting to rooms.");
      return;
    }

    const socketMessage = JSON.stringify({
      type: "connect",
      data: { ticket_id: ticketIds },
    });

    socketInstance.send(socketMessage);
  };

  useEffect(() => {
    if (!socketRef.current) {
      const socketInstance = new WebSocket(process.env.REACT_APP_WS_URL);
      socketRef.current = socketInstance;

      socketInstance.onopen = async () => {
        console.log("Connected to WebSocket");
      };

      socketInstance.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      socketInstance.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socketInstance.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  const markMessagesAsRead = (ticketId, count) => {
    if (!ticketId) return;

    const socketInstance = socketRef.current;

    markMessageRead(ticketId);

    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unseen_count: 0 } : ticket,
      ),
    );

    setUnreadCount((prev) => prev - count);

    if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
      const readMessageData = {
        type: "seen",
        data: {
          ticket_id: ticketId,
          sender_id: Number(userId),
        },
      };
      socketInstance.send(JSON.stringify(readMessageData));
      console.log(`✅ Seen sent for ticket_id=${ticketId}`);
    } else {
      console.warn("WebSocket is not connected, failed to send seen.");
    }
  };

  const getTicketsListRecursively = async (page) => {
    try {
      setTicketError(false);
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

      connectToChatRooms(processedTickets.map((ticket) => ticket.id));

      getTicketsListRecursively(page + 1);
    } catch (error) {
      setSpinnerTickets(false);
      setTicketError(true);
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

  const updateTicket = async (updateData) => {
    try {
      const updatedTicket = await api.tickets.updateById({
        id: [updateData.id],
        ...updateData,
      });

      return updatedTicket;
    } catch (error) {
      console.error("Error updating the ticket:", error.message || error);
      throw error;
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

        const senderId = message.data.sender_id;

        if (Number(senderId) !== userId) {
          updateMessage(message);
        }

        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.id === ticket_id
              ? {
                  ...ticket,
                  last_message: msgText,
                  time_sent: time_sent,
                  unseen_count:
                    ticket_id === selectTicketId
                      ? 0
                      : ticket.unseen_count + (sender_id !== userId ? 1 : 0),
                }
              : ticket,
          ),
        );

        break;
      }
      case "seen": {
        const { ticket_id, seen_at } = message.data;

        markMessageSeen(ticket_id, seen_at);

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

  return (
    <AppContext.Provider
      value={{
        messages: {
          list: messages,
          lastMessage,
          loading,
          mediaFiles,
          error,
          getUserMessages,
          setMessages,
        },
        tickets,
        setTickets,
        selectTicketId,
        setSelectTicketId,
        unreadCount,
        markMessagesAsRead,
        updateTicket,
        fetchTickets,
        socketRef,
        spinnerTickets,
        setIsCollapsed: collapsed,
        isCollapsed: storage === "true",
        ticketError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
