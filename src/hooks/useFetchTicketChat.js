import { useEffect, useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { extractNumbers, showServerError, getFullName } from "@utils";
import { useMessagesContext } from "./useMessagesContext";

const normalizeClients = (clientList) => {
  const platformsByClient = clientList.map((client) => {
    // Проверяем структуру данных клиента
    let clientData, platforms;
    
    if (client.id && typeof client.id === 'object' && client.id.id) {
      // Стандартная структура: { id: { id: 123, name: "...", ... }, telegram: "...", whatsapp: "..." }
      clientData = client.id;
      platforms = { ...client };
      delete platforms.id;
      
      // Если все платформы null, но есть email в имени клиента или отдельное поле email, создаем email платформу
      const hasActivePlatforms = Object.values(platforms).some(Boolean);
      
      if (!hasActivePlatforms) {
        if (clientData.name && clientData.name.includes('@')) {
          platforms.email = clientData.name;
        } else if (clientData.email) {
          platforms.email = clientData.email;
        } else if (client.email) {
          platforms.email = client.email;
        } else if (clientData.name && clientData.surname) {
          // Если есть имя и фамилия, но нет email, создаем платформу "client" для отображения
          platforms.client = `${clientData.name} ${clientData.surname}`;
        }
      }
    } else {
      // Альтернативная структура: { id: 123, name: "...", email: "...", phone: "..." }
      clientData = client;
      platforms = {};
      
      // Определяем платформу по типу данных
      if (client.email) {
        platforms.email = client.email;
      }
      if (client.phone) {
        platforms.whatsapp = client.phone;
        platforms.viber = client.phone;
      }
      if (client.telegram) {
        platforms.telegram = client.telegram;
      }
      
      // Если у клиента есть email в имени, но нет активных платформ, создаем email платформу
      if (!Object.values(platforms).some(Boolean) && client.name && client.name.includes('@')) {
        platforms.email = client.name;
      }
    }
    
    return Object.entries(platforms)
      .filter(([, platformValue]) => Boolean(platformValue))
      .map(([platform, platformValue]) => {
        const identifier = getFullName(clientData.name, clientData.surname) || 
                          clientData.email || 
                          `#${clientData.id}`;
        
        return {
          label: `${identifier} - ${platform}`,
          value: `${clientData.id}-${platform}`,
          payload: {
            id: clientData.id,
            platform,
            name: clientData.name || clientData.email || "",
            surname: clientData.surname || "",
            phone: clientData.phone || "",
            email: clientData.email || clientData.user?.email || "",
          },
        };
      });
  });

  return platformsByClient.flat();
};
export const useFetchTicketChat = (id) => {
  const { enqueueSnackbar } = useSnackbar();

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
        clientList.map(async (clientId) => {
          try {
            const clientData = await api.users.getUsersClientById(clientId);
            return clientData;
          } catch (error) {
            // Если API не работает, используем данные из тикета
            const ticketClient = ticket.clients?.find(c => c.id === clientId);
            if (ticketClient) {
              return ticketClient;
            }
            return null;
          }
        }),
      );

      const clientsPlatform = normalizeClients(clients.filter(Boolean)) || [];

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
      
      if (Number(ticketId) === Number(id)) {
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
