import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useFetchTicketChat, useMessagesContext } from "@hooks";
import { getFullName } from "@utils";
import Can from "@components/CanComponent/Can";

const SingleChat = ({ technicians, ticketId, onClose, tasks = [] }) => {
  const { setTickets, tickets } = useApp(); // добавили tickets!
  const { getUserMessages } = useMessagesContext();

  const {
    personalInfo,
    messageSendersByPlatform,
    loading,
    selectedUser,
    changeUser,
    setPersonalInfo,
    setMessageSendersByPlatform,
    setSelectedUser,
  } = useFetchTicketChat(ticketId);

  const responsibleId = personalInfo?.technician_id?.toString() ?? null;

  useEffect(() => {
    if (ticketId) {
      getUserMessages(Number(ticketId));
    }
  }, [ticketId]);

  // Всегда актуальное значение!
  const unseenCount = tickets.find(t => t.id === Number(ticketId))?.unseen_count;

  return (
    <div className="chat-container">
      <Box pos="absolute" left="10px" top="16px">
        <ActionIcon onClick={onClose} variant="default">
          <FaArrowLeft size="12" />
        </ActionIcon>
      </Box>
      <Can permission={{ module: "chat", action: "edit" }} context={{ responsibleId }}>
        <Flex w="70%">
          <ChatMessages
            selectedClient={selectedUser}
            ticketId={ticketId ? Number(ticketId) : undefined}
            personalInfo={personalInfo}
            messageSendersByPlatform={messageSendersByPlatform || []}
            onChangeSelectedUser={changeUser}
            loading={loading}
            technicians={technicians}
            unseenCount={unseenCount} // <- пробрасываем сюда
          />
        </Flex>
      </Can>
      <Can permission={{ module: "chat", action: "edit" }} context={{ responsibleId }}>
        <ChatExtraInfo
          technicians={technicians}
          selectedUser={selectedUser}
          ticketId={ticketId}
          updatedTicket={personalInfo}
          onUpdatePersonalInfo={(payload, values) => {
            const identifier =
              getFullName(values.name, values.surname) || `#${payload.id}`;
            const clientTicketList = personalInfo.clients.map((client) =>
              client.id === payload.id
                ? { ...client, ...values }
                : client,
            );
            setSelectedUser((prev) => ({
              ...prev,
              label: identifier,
              payload: { ...prev.payload, ...values },
            }));
            setMessageSendersByPlatform((prev) =>
              prev.map((client) =>
                client.payload.id === payload.id &&
                  client.payload.platform === payload.platform
                  ? {
                    ...client,
                    label: `${identifier} - ${payload.platform}`,
                    payload: { ...payload, ...values },
                  }
                  : client,
              ),
            );
            setTickets((prev) =>
              prev.map((ticket) =>
                ticket.id === personalInfo.id
                  ? { ...ticket, ...personalInfo, clients: clientTicketList }
                  : ticket,
              ),
            );
            setPersonalInfo((prev) => ({
              ...prev,
              clients: clientTicketList,
            }));
          }}
        />
      </Can>
    </div>
  );
};

export default SingleChat;
