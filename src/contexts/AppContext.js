import React, { createContext, useState, useEffect, useRef } from "react";
import { useSnackbar } from "notistack";
import { useUser, useLocalStorage } from "../hooks";
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
  const socketRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { userId } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [selectTicketId, setSelectTicketId] = useState(null);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
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

  useEffect(() => {
    const unread = messages.filter(
      (msg) =>
        msg.seen_by != null &&
        msg.seen_by === "{}" &&
        msg.sender_id !== 1 &&
        msg.sender_id !== userId,
    );
    setUnreadCount(unread.length);
  }, [messages]);

  const markMessagesAsRead = (ticketId) => {
    if (!ticketId) return;

    const socketInstance = socketRef.current;

    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.ticket_id === ticketId) {
          return {
            ...msg,
            seen_by: JSON.stringify({ [userId]: true }),
            seen_at: new Date().toISOString(),
          };
        }
        return msg;
      }),
    );

    setUnreadMessages((prevUnread) => {
      const updatedUnread = new Map(prevUnread);
      updatedUnread.forEach((msg, msgId) => {
        if (msg.ticket_id === ticketId) {
          updatedUnread.delete(msgId);
        }
      });
      return updatedUnread;
    });

    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unseen_count: 0 } : ticket,
      ),
    );

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
      const data = await api.tickets.getLightList({ page: page });

      if (page >= data.total_pages) {
        setSpinnerTickets(false);
        return;
      }

      const processedTickets = normalizeLightTickets(data.tickets);
      setTickets((prev) => [...prev, ...processedTickets]);

      connectToChatRooms(processedTickets.map((ticket) => ticket.id));

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

  const getClientMessagesSingle = async (ticket_id) => {
    console.log("Updating messages for ticket:", ticket_id);
    try {
      const data = await api.messages.messagesTicketById(ticket_id);

      if (Array.isArray(data)) {
        setMessages((prevMessages) => {
          const otherMessages = prevMessages.filter(
            (msg) => msg.ticket_id !== ticket_id,
          );

          return [...otherMessages, ...data];
        });

        const unseenMessages = data.filter(
          (msg) => msg.seen_by === "{}" && msg.sender_id !== userId,
        );

        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.id === ticket_id
              ? { ...ticket, unseen_count: unseenMessages.length }
              : ticket,
          ),
        );
      }
    } catch (error) {
      console.error("error request messages:", error.message);
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

        setMessages((prevMessages) => [...prevMessages, message.data]);

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

        setUnreadMessages((prevUnread) => {
          const updatedUnread = new Map(prevUnread);

          if (ticket_id === selectTicketId) {
            updatedUnread.forEach((msg, msgId) => {
              if (msg.ticket_id === ticket_id) {
                updatedUnread.delete(msgId);
              }
            });
          } else if (sender_id !== userId) {
            updatedUnread.set(message.data.id, message.data);
          }

          return updatedUnread;
        });

        break;
      }
      case "seen": {
        const { ticket_id, seen_at } = message.data;

        setMessages((prevMessages) => {
          return prevMessages.map((msg) =>
            msg.ticket_id === ticket_id ? { ...msg, seen_at } : msg,
          );
        });

        setUnreadMessages((prevUnreadMessages) => {
          const updatedUnreadMap = new Map(prevUnreadMessages);
          updatedUnreadMap.forEach((msg, msgId) => {
            if (msg.ticket_id === ticket_id) {
              updatedUnreadMap.delete(msgId);
            }
          });
          return updatedUnreadMap;
        });

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
    const totalUnread = tickets.reduce(
      (sum, ticket) => sum + ticket.unseen_count,
      0,
    );

    setUnreadCount(totalUnread);
  }, [tickets, unreadMessages]);

  return (
    <AppContext.Provider
      value={{
        tickets,
        setTickets,
        selectTicketId,
        setSelectTicketId,
        messages,
        setMessages,
        unreadCount,
        markMessagesAsRead,
        updateTicket,
        fetchTickets,
        socketRef,
        getClientMessagesSingle,
        spinnerTickets,
        setIsCollapsed: collapsed,
        isCollapsed: storage === "true",
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
