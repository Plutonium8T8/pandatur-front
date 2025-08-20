import { createContext, useState, useEffect, useRef, useContext } from "react";
import { useSnackbar } from "notistack";
import { useLocalStorage, useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { usePathnameWatcher } from "../Components/utils/usePathnameWatcher";
import { UserContext } from "./UserContext";

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

  const recalcUnreadFrom = (arr) => {
    const sum = Array.isArray(arr)
      ? arr.reduce((acc, t) => acc + (t?.unseen_count || 0), 0)
      : 0;
    setUnreadCount(sum);
  };

  const markMessagesAsRead = (ticketId) => {
    if (!ticketId) return;

    setTickets((prev) => {
      const next = prev.map((t) =>
        t.id === ticketId ? { ...t, unseen_count: 0 } : t
      );
      recalcUnreadFrom(next);
      return next;
    });

    setChatFilteredTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, unseen_count: 0 } : t))
    );
  };

  const getTicketsListRecursively = async (page = 1, requestId) => {
    try {
      const excluded = ["Realizat cu succes", "Închis și nerealizat", "Auxiliar"];
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

      // если уже стартовал новый запрос — всё, что пришло, игнорируем
      if (requestIdRef.current !== requestId) return;

      const processedTickets = normalizeLightTickets(data.tickets);

      setTickets((prev) => {
        const next = [...prev, ...processedTickets];
        recalcUnreadFrom(next);
        return next;
      });

      const totalPages = data.pagination?.total_pages || 1;

      if (page < totalPages) {
        if (requestIdRef.current === requestId) {
          await getTicketsListRecursively(page + 1, requestId);
        }
      } else {
        if (requestIdRef.current === requestId) {
          setSpinnerTickets(false);
        }
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
      const normalized = normalizeLightTickets([ticket])[0];

      setTickets((prev) => {
        const exists = prev.find((t) => t.id === ticketId);
        const next = exists
          ? prev.map((t) => (t.id === ticketId ? normalized : t))
          : [...prev, normalized];
        recalcUnreadFrom(next);
        return next;
      });
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message: msgText, time_sent, mtype, sender_id } = message.data;
        const isFromAnotherUser = String(sender_id) !== String(userId);

        setTickets((prev) => {
          let found = false;
          const updated = prev.map((ticket) => {
            if (ticket.id === ticket_id) {
              found = true;
              const newUnseen = ticket.unseen_count + (isFromAnotherUser ? 1 : 0);
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

          if (!found && isFromAnotherUser) {
            fetchSingleTicket(ticket_id).catch(() => { });
          }

          recalcUnreadFrom(updated);
          return updated;
        });

        setChatFilteredTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticket_id
              ? {
                ...ticket,
                unseen_count: ticket.unseen_count + (isFromAnotherUser ? 1 : 0),
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
          setTickets((prev) => {
            const next = prev.map((ticket) =>
              ticket.id === ticket_id ? { ...ticket, unseen_count: 0 } : ticket
            );
            recalcUnreadFrom(next);
            return next;
          });
        }

        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET: {
        const { ticket_id, ticket_ids, group_title, workflow } = message.data || {};

        const idsRaw = Array.isArray(ticket_ids) ? ticket_ids : (ticket_id ? [ticket_id] : []);
        const ids = [...new Set(idsRaw.map((v) => Number(v)).filter((v) => Number.isFinite(v)))];

        const isMatchingGroup = group_title === groupTitleForApi;
        const isMatchingWorkflow = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

        if (!ids.length || !isMatchingGroup || !isMatchingWorkflow) {
          break;
        }

        ids.forEach((id) => {
          try {
            fetchSingleTicket(id);
          } catch (e) { }
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

      default:
        console.warn("Invalid socket message type:", message.type);
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
        console.error("error get id for connect chat room", e);
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
        console.log("[Socket] Reconnected and rejoined chat rooms");
      } catch (e) {
        console.error("[Socket] Failed to reconnect to chat rooms", e);
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
  }, [socketRef?.current, groupTitleForApi, workflowOptions]);

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
