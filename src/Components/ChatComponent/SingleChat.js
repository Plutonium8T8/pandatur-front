import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useFetchTicketChat, useMessagesContext } from "@hooks";
import { getFullName } from "@utils";
import Can from "@components/CanComponent/Can";

const SingleChat = ({ technicians, ticketId, onClose, tasks = [] }) => {
  const { setTickets, tickets } = useApp();
  const { getUserMessages } = useMessagesContext();

  const {
    ticketData,
    messageSendersByPlatform,
    loading,
    selectedUser,
    changeUser,
    setTicketData,
    setMessageSendersByPlatform,
    setSelectedUser,
  } = useFetchTicketChat(ticketId);

  const responsibleId = ticketData?.technician_id?.toString() ?? null;

  useEffect(() => {
    if (ticketId) {
      getUserMessages(Number(ticketId));
    }
  }, [ticketId]);

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
            personalInfo={ticketData}
            messageSendersByPlatform={messageSendersByPlatform || []}
            onChangeSelectedUser={changeUser}
            loading={loading}
            technicians={technicians}
            unseenCount={unseenCount}
          />
        </Flex>
      </Can>
      <Can permission={{ module: "chat", action: "edit" }} context={{ responsibleId }}>
        <ChatExtraInfo
          technicians={technicians}
          selectedUser={selectedUser}
          ticketId={ticketId}
          updatedTicket={ticketData}
          onUpdatePersonalInfo={(payload, values) => {
            const identifier =
              getFullName(values.name, values.surname) || `#${payload.id}`;
            const clientTicketList = ticketData.clients.map((client) =>
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
                ticket.id === ticketData.id
                  ? { ...ticket, ...ticketData, clients: clientTicketList }
                  : ticket,
              ),
            );
            setTicketData((prev) => ({
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
