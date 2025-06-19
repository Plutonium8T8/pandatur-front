import { createContext, useState, useEffect, useMemo, useRef } from "react";
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
  const [customGroupTitle, setCustomGroupTitle] = useState(null);

  const [chatFilteredTickets, setChatFilteredTickets] = useState([]);
  const [chatSpinner, setChatSpinner] = useState(false);
  const requestIdRef = useRef(0);

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
        console.error("[AppContext] error get technician list", err);
        setUserGroups([]);
      } finally {
        setLoadingWorkflow(false);
      }
    };
    if (userId) fetchTechnicians();
  }, [userId]);

  const accessibleGroupTitles = useMemo(() => {
    const titles = userGroups.flatMap((group) => userGroupsToGroupTitle[group.name] || []);
    return [...new Set(titles)];
  }, [userGroups]);

  const groupTitleForApi = useMemo(() => {
    if (customGroupTitle) return customGroupTitle;
    return accessibleGroupTitles[0] || null;
  }, [customGroupTitle, accessibleGroupTitles]);

  const isAdmin = useMemo(() => {
    return userGroups.some((g) => g.name === "Admin" || g.name === "IT dep.");
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

        const isFromAnotherUser = String(sender_id) !== String(userId);
        let increment = 0;

        setTickets((prev) => {
          let found = false;

          const updated = prev.map((ticket) => {
            if (ticket.id === ticket_id) {
              found = true;

              const newUnseen = ticket.unseen_count + (isFromAnotherUser ? 1 : 0);
              if (isFromAnotherUser) increment = 1;

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
        break;
      }

      case TYPE_SOCKET_EVENTS.SEEN: {

        const { ticket_id, sender_id } = message.data;
        const isSeenByAnotherUser = String(sender_id) !== String(userId);

        if (isSeenByAnotherUser) {
          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === ticket_id ? { ...ticket, unseen_count: 0 } : ticket
            )
          );
        }

        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET: {
        const { ticket_id, group_title, workflow } = message.data;

        // console.log("[SOCKET] Incoming ticket:", {
        //   ticket_id,
        //   group_title_from_ticket: group_title,
        //   current_groupTitleForApi: groupTitleForApi,
        //   workflow,
        //   workflowOptions,
        // });

        const isMatchingGroup = group_title === groupTitleForApi;
        const isMatchingWorkflow = workflowOptions.includes(workflow);

        if (ticket_id && isMatchingGroup && isMatchingWorkflow) {
          fetchSingleTicket(ticket_id);

          const socketInstance = socketRef.current;
          if (socketInstance?.readyState === WebSocket.OPEN) {
            socketInstance.send(
              JSON.stringify({
                type: TYPE_SOCKET_EVENTS.CONNECT,
                data: { ticket_id: [ticket_id] },
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

        //chat
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
