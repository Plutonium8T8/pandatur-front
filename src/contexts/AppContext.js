import { createContext, useState, useEffect, useRef, useContext } from "react";
import { useSnackbar } from "notistack";
import { useLocalStorage, useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { usePathnameWatcher } from "../Components/utils/usePathnameWatcher";
import { UserContext } from "./UserContext";
import { useGetTechniciansList } from "../hooks";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

export const AppContext = createContext();

const normalizeLightTickets = (tickets) =>
  tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));

const getLeadsUrlType = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("type");
};

const getLeadsUrlViewMode = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return (params.get("view") || "").toUpperCase();
};

export const AppProvider = ({ children }) => {
  const { sendedValue, socketRef } = useSocket();
  const { enqueueSnackbar } = useSnackbar();
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const [lightTicketFilters, setLightTicketFilters] = useState({});
  const [chatFilteredTickets, setChatFilteredTickets] = useState([]);
  const [chatSpinner, setChatSpinner] = useState(false);
  const requestIdRef = useRef(0);
  
  // Для отслеживания обработанных message_id (чтобы не дублировать счётчик при обновлении сообщений)
  const processedMessageIds = useRef(new Set());
  
  // Получаем данные всех пользователей
  const { technicians } = useGetTechniciansList();

  const {
    userId,
    isAdmin,
    workflowOptions,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
    userGroups,
  } = useContext(UserContext);

  const collapsed = () => changeLocalStorage(storage === "true" ? "false" : "true");

  const markMessagesAsRead = (ticketId, count = 0) => {
    if (!ticketId) return;

    // Находим тикет и получаем количество непрочитанных сообщений
    const ticket = tickets.find(t => t.id === ticketId);
    const unseenCount = ticket?.unseen_count || 0;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return { ...t, unseen_count: 0 };
        }
        return t;
      })
    );

    setChatFilteredTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return { ...t, unseen_count: 0 };
        }
        return t;
      })
    );

    // Уменьшаем общий счетчик на количество прочитанных сообщений
    if (unseenCount > 0) {
      setUnreadCount((prev) => Math.max(0, prev - unseenCount));
    }
  };

  const getTicketsListRecursively = async (page = 1, requestId) => {
    try {
      const excluded = ["Realizat cu succes", "Închis și nerealizat"];
      const baseWorkflow = lightTicketFilters.workflow ?? workflowOptions;
      const filteredWorkflow = baseWorkflow.filter((w) => !excluded.includes(w));

      const data = await api.tickets.filters({
        page,
        type: "light",
        group_title: groupTitleForApi,
        attributes: {
          ...lightTicketFilters,
          workflow: filteredWorkflow,
        },
      });

      if (requestIdRef.current !== requestId) return;

      const totalPages = data.pagination?.total_pages || 1;
      const totalUnread = data.tickets.reduce(
        (sum, ticket) => sum + (ticket.unseen_count || 0),
        0
      );

      setUnreadCount((prev) => prev + totalUnread);
      const processedTickets = normalizeLightTickets(data.tickets);
      setTickets((prev) => [...prev, ...processedTickets]);

      if (page < totalPages) {
        await getTicketsListRecursively(page + 1, requestId);
      } else {
        setSpinnerTickets(false);
      }
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      enqueueSnackbar(showServerError(error), { variant: "error" });
      setSpinnerTickets(false);
    }
  };

  const fetchTickets = async () => {
    const currentRequestId = Date.now();
    requestIdRef.current = currentRequestId;

    setSpinnerTickets(true);
    setTickets([]);
    setUnreadCount(0);

    await getTicketsListRecursively(1, currentRequestId);
  };

  const fetchChatFilteredTickets = async (filters = {}) => {
    setChatSpinner(true);
    setChatFilteredTickets([]);

    try {
      const loadPage = async (page = 1) => {
        const res = await api.tickets.filters({
          page,
          type: "light",
          group_title: groupTitleForApi,
          sort_by: "creation_date",
          order: "DESC",
          attributes: filters,
        });

        const normalized = normalizeLightTickets(res.tickets);
        setChatFilteredTickets((prev) => [...prev, ...normalized]);

        if (page < res.pagination?.total_pages) {
          await loadPage(page + 1);
        } else {
          setChatSpinner(false);
        }
      };

      await loadPage(1);
    } catch (err) {
      enqueueSnackbar(showServerError(err), { variant: "error" });
      setChatSpinner(false);
    }
  };

  const hasLeadsFilterInUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const filterKeys = Array.from(params.keys()).filter(
      (key) => key !== "view" && key !== "type"
    );
    return filterKeys.length > 0;
  };

  useEffect(() => {
    const isLeadsItemView = /^\/leads\/\d+$/.test(window.location.pathname);
    const urlType = getLeadsUrlType();
    const urlViewMode = getLeadsUrlViewMode();

    if (
      groupTitleForApi &&
      workflowOptions.length &&
      !isLeadsItemView &&
      !hasLeadsFilterInUrl() &&
      (!urlType || urlType === "light") &&
      (urlViewMode === "KANBAN" || !urlViewMode)
    ) {
      fetchTickets();
    }
    // eslint-disable-next-line
  }, [groupTitleForApi, workflowOptions, lightTicketFilters]);

  usePathnameWatcher((pathname) => {
    const isLeadsListView = pathname === "/leads";
    const urlType = getLeadsUrlType();

    if (
      isLeadsListView &&
      !spinnerTickets &&
      !tickets.length &&
      groupTitleForApi &&
      workflowOptions.length &&
      !hasLeadsFilterInUrl() &&
      (!urlType || urlType === "light")
    ) {
      fetchTickets();
    }
  });

  const fetchSingleTicket = async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);

      setTickets((prev) => {
        const exists = prev.find((t) => t.id === ticketId);
        
        if (exists) {
          return prev.map((t) => (t.id === ticketId ? ticket : t));
        } else {
          return [...prev, ticket];
        }
      });

      setChatFilteredTickets((prev) => {
        const exists = prev.find((t) => t.id === ticketId);
        
        // Обновляем только существующие тикеты, не добавляем новые
        // Новые тикеты должны проходить через фильтр при повторном применении фильтра
        if (exists) {
          return prev.map((t) => (t.id === ticketId ? ticket : t));
        }
        
        return prev;
      });

      setUnreadCount((prev) => prev + (ticket?.unseen_count || 0));
      
      // Отправляем событие для обновления personalInfo в useFetchTicketChat
      window.dispatchEvent(new CustomEvent('ticketUpdated', { 
        detail: { ticketId } 
      }));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message: msgText, time_sent, mtype, sender_id, message_id } = message.data;

        const isFromAnotherUser = String(sender_id) !== String(userId) && String(sender_id) !== "1";
        
        // Проверяем, было ли это сообщение уже обработано (для избежания дублирования счётчика)
        const isNewMessage = !processedMessageIds.current.has(message_id);
        if (message_id && isNewMessage) {
          processedMessageIds.current.add(message_id);
        }
        
        // Увеличиваем счётчик только для новых сообщений от других пользователей
        const shouldIncrement = isFromAnotherUser && isNewMessage;
        let increment = 0;

        setTickets((prev) => {
          let found = false;

          const updated = prev.map((ticket) => {
            if (ticket.id === ticket_id) {
              found = true;
              const newUnseen = ticket.unseen_count + (shouldIncrement ? 1 : 0);
              if (shouldIncrement) increment = 1;
              return {
                ...ticket,
                unseen_count: newUnseen,
                last_message_type: mtype,
                last_message: msgText,
                time_sent,
              };
            }
            return ticket;
          });

          if (increment > 0 && found) {
            setUnreadCount((prev) => prev + increment);
          }

          return updated;
        });

        setChatFilteredTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticket_id
              ? {
                ...ticket,
                unseen_count: ticket.unseen_count + (shouldIncrement ? 1 : 0),
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
        const { ticket_id, sender_id } = message.data;
        const isSeenByAnotherUser = String(sender_id) !== String(userId);

        if (isSeenByAnotherUser) {
          // Находим тикет и получаем количество непрочитанных сообщений
          const ticket = tickets.find(t => t.id === ticket_id);
          const unseenCount = ticket?.unseen_count || 0;

          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === ticket_id ? { ...ticket, unseen_count: 0 } : ticket
            )
          );

          // Уменьшаем общий счетчик на количество прочитанных сообщений
          if (unseenCount > 0) {
            setUnreadCount((prev) => Math.max(0, prev - unseenCount));
          }
        }

        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET: {
        const { ticket_id, ticket_ids, group_title, workflow } = message.data || {};

        const idsRaw = Array.isArray(ticket_ids)
          ? ticket_ids
          : (ticket_id ? [ticket_id] : []);

        const ids = [...new Set(
          idsRaw
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v))
        )];

        const isMatchingGroup = group_title === groupTitleForApi;
        const isMatchingWorkflow = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

        if (!ids.length || !isMatchingGroup || !isMatchingWorkflow) {
          break;
        }

        ids.forEach((id) => {
          try {
            fetchSingleTicket(id);
          } catch (e) {
          }
        });

        const socketInstance = socketRef.current;
        if (socketInstance?.readyState === WebSocket.OPEN) {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            socketInstance.send(
              JSON.stringify({
                type: TYPE_SOCKET_EVENTS.CONNECT,
                data: { ticket_id: chunk },
              })
            );
          }
        } else {
          enqueueSnackbar(getLanguageByKey("errorConnectingToChatRoomWebSocket"), {
            variant: "error",
          });
        }

        break;
      }


      // case TYPE_SOCKET_EVENTS.TICKET_UPDATE: {
      //   const { ticket_id, ticket_ids } = message.data || {};

      //   const idsRaw = Array.isArray(ticket_ids)
      //     ? ticket_ids
      //     : (ticket_id ? [ticket_id] : []);

      //   const ids = [...new Set(
      //     idsRaw
      //       .map((v) => Number(v))
      //       .filter((v) => Number.isFinite(v))
      //   )];

      //   if (!ids.length) {
      //     break;
      //   }

      //   // console.log("🔄 TICKET_UPDATE received:", {
      //   //   ids,
      //   //   timestamp: new Date().toISOString()
      //   // });

      //   // Проверяем, есть ли тикеты в нашем списке и обновляем их
      //   ids.forEach((id) => {
      //     const existsInTickets = tickets.some(t => t.id === id);
      //     const existsInChatFiltered = chatFilteredTickets.some(t => t.id === id);
          
      //   // console.log(`🔍 Checking ticket ${id}:`, {
      //   //   existsInTickets,
      //   //   existsInChatFiltered,
      //   //   shouldUpdate: existsInTickets || existsInChatFiltered,
      //   //   totalTickets: tickets.length,
      //   //   totalChatFiltered: chatFilteredTickets.length
      //   // });

      //     if (existsInTickets || existsInChatFiltered) {
      //       try {
      //         fetchSingleTicket(id);
      //       } catch (e) {
      //         console.error(`❌ Failed to fetch updated ticket ${id}:`, e);
      //       }
      //     } else {
      //       try {
      //         fetchSingleTicket(id);
      //       } catch (e) {
      //         console.error(`❌ Failed to fetch updated ticket ${id}:`, e);
      //       }
      //     }
      //   });

      //   break;
      // }

      default:
        // console.warn("Invalid socket message type:", message.type);
    }
  };

  useEffect(() => {
    if (sendedValue) {
      handleWebSocketMessage(sendedValue);
    }
    // eslint-disable-next-line
  }, [sendedValue]);

  useEffect(() => {
    const connectToWebSocketRooms = async () => {
      if (!groupTitleForApi || !workflowOptions.length || !socketRef.current) return;

      try {
        const res = await api.tickets.filters({
          type: "id",
          group_title: groupTitleForApi,
          attributes: { workflow: workflowOptions },
        });

        const ticketIds = res?.data?.filter(Boolean) || [];
        if (!ticketIds.length) return;

        const socketMessage = JSON.stringify({
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: ticketIds },
        });

        const trySend = () => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(socketMessage);
          } else {
            setTimeout(trySend, 500);
          }
        };

        trySend();
      } catch (e) {
        // console.error("error get id for connect chat room", e);
      }
    };

    connectToWebSocketRooms();
    // eslint-disable-next-line
  }, [groupTitleForApi, workflowOptions, socketRef]);

  useEffect(() => {
    if (!socketRef?.current || !groupTitleForApi || !workflowOptions.length) return;

    const socket = socketRef.current;

    const handleReconnect = async () => {
      try {
        const res = await api.tickets.filters({
          type: "id",
          group_title: groupTitleForApi,
          attributes: { workflow: workflowOptions },
        });

        const ticketIds = res?.data?.filter(Boolean) || [];
        if (!ticketIds.length) return;

        const socketMessage = JSON.stringify({
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: ticketIds },
        });

        socket.send(socketMessage);
        // console.log("[Socket] Reconnected and rejoined chat rooms");
      } catch (e) {
        // console.error("[Socket] Failed to reconnect to chat rooms", e);
      }
    };

    if (socket.readyState === WebSocket.OPEN) {
      handleReconnect();
    } else {
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          handleReconnect();
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupTitleForApi, workflowOptions]);

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
        setLightTicketFilters,
        accessibleGroupTitles,
        setCustomGroupTitle,
        customGroupTitle,

        // chat
        chatFilteredTickets,
        fetchChatFilteredTickets,
        setChatFilteredTickets,
        chatSpinner,
        
        // technicians
        technicians,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
