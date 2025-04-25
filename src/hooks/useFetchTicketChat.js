import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { extractNumbers, showServerError, getFullName } from "@utils";
import { useMessagesContext } from "@hooks";

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

  const [personalInfo, setPersonalInfo] = useState({});
  const [messageSendersByPlatform, setMessageSendersByPlatform] = useState();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});

  const { messages } = useMessagesContext();

  const changeUser = (userId, platform) => {
    const user = messageSendersByPlatform?.find(
      ({ payload }) => payload.id === userId && payload.platform === platform,
    );

    setSelectedUser(user);
  };

  const getLightTicketInfo = async () => {
    const { lastMessage } = messages;

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
          ) || {};

        setSelectedUser(currentClient || {});
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
  };

  // useEffect(() => {
  //   if (id) {
  //     getLightTicketInfo();
  //   }
  // }, [id, messages.lastMessage]);

  useEffect(() => {
    if (id) {
      getLightTicketInfo();
    }
  }, [id]);

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
