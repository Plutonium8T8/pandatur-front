import { useEffect, useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { extractNumbers, showServerError, getFullName } from "@utils";
import { useMessagesContext } from "./useMessagesContext";
import { useApp } from "./useApp";

const normalizeClients = (clientList) => {
  const platformsByClient = clientList.map(({ id, ...platforms }) => {
    return Object.entries(platforms)
      .filter(([, platformValue]) => Boolean(platformValue))
      .map(([platform, platformValue]) => {
        const identifier = getFullName(id.name, id.surname) || `#${id.id}`;
        return {
          label: `${identifier} - ${platform}`,
          value: `${id.id}-${platform}`,

          payload: {
            id: id.id,
            platform,
            name: id.name,
            surname: id.surname,
            phone: id.phone,
          },
        };
      });
  });

  return platformsByClient.flat();
};
export const useFetchTicketChat = (id) => {
  const { enqueueSnackbar } = useSnackbar();
  const { tickets, chatFilteredTickets } = useApp();

  const [personalInfo, setPersonalInfo] = useState({});
  const [messageSendersByPlatform, setMessageSendersByPlatform] = useState();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});

  const { lastMessage } = useMessagesContext();

  const changeUser = (userId, platform) => {
    const user = messageSendersByPlatform?.find(
      ({ payload }) => payload.id === userId && payload.platform === platform,
    );

    setSelectedUser(user);
  };

  const getLightTicketInfo = useCallback(async () => {
    setLoading(true);
    try {
      const ticket = await api.tickets.ticket.getLightById(id);
      setPersonalInfo(ticket);
      const clientList = extractNumbers(ticket.client_id);
      const clients = await Promise.all(
        clientList.map((clientId) => api.users.getUsersClientById(clientId)),
      );

      const clientsPlatform = normalizeClients(clients) || [];

      if (lastMessage) {
        const { client_id, platform } = lastMessage;

        const currentClient =
          clientsPlatform.find(
            ({ payload }) =>
              payload.id === client_id && payload.platform === platform,
          ) || clientsPlatform[0] || {};

        setSelectedUser(currentClient);

      } else {
        setSelectedUser(clientsPlatform[0] || {});
      }

      setMessageSendersByPlatform(normalizeClients(clients) || []);
    } catch (e) {
      enqueueSnackbar(showServerError(e), {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id, enqueueSnackbar, lastMessage]);

  useEffect(() => {
    if (id) {
      getLightTicketInfo();
    }
  }, [id, getLightTicketInfo]);

  // Простая проверка существования тикета в AppContext (для отладки)
  // useEffect(() => {
  //   if (id && (tickets.length > 0 || chatFilteredTickets.length > 0)) {
  //     const foundInMainTickets = tickets.some(t => t.id === id);
  //     const foundInChatFiltered = chatFilteredTickets.some(t => t.id === id);
  //     
  //     console.log(`🔍 Ticket ${id} status:`, {
  //       foundInMainTickets,
  //       foundInChatFiltered,
  //       totalTickets: tickets.length,
  //       totalChatFiltered: chatFilteredTickets.length
  //     });
  //   }
  // }, [tickets, chatFilteredTickets, id]);

  // Слушаем кастомное событие ticketUpdated
  useEffect(() => {
    const handleTicketUpdate = (event) => {
      const { ticketId } = event.detail;
      
      // console.log(`📨 Received ticketUpdated event for ticket ${ticketId}`);
      
      if (Number(ticketId) === Number(id)) {
        console.log(`🔄 Syncing ticket ${id} data from server...`);
        
        // Делаем запрос на получение актуальных данных тикета
        getLightTicketInfo();
      }
    };

    window.addEventListener('ticketUpdated', handleTicketUpdate);
    
    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdate);
    };
  }, [id, getLightTicketInfo]);

  return {
    personalInfo,
    messageSendersByPlatform,
    loading,
    selectedUser,
    changeUser,
    setPersonalInfo,
    setMessageSendersByPlatform,
    setSelectedUser,
    getTicket: getLightTicketInfo,
  };
};
