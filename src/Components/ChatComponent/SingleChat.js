import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useFetchTicketChat } from "../../hooks";
import { getFullName } from "../utils";

const SingleChat = ({ id, onClose, tasks = [] }) => {
  const { setTickets, messages } = useApp();

  const {
    personalInfo,
    messageSendersByPlatform,
    loading,
    selectedUser,
    changeUser,
    setPersonalInfo,
    setMessageSendersByPlatform,
    setSelectedUser,
  } = useFetchTicketChat(id);

  useEffect(() => {
    if (id) {
      messages.getUserMessages(Number(id));
    }
  }, [id]);

  return (
    <div className="chat-container">
      <Box pos="absolute" left="10px" top="16px">
        <ActionIcon onClick={onClose} variant="default">
          <FaArrowLeft size="12" />
        </ActionIcon>
      </Box>

      <Flex w="70%">
        <ChatMessages
          selectedClient={selectedUser}
          selectTicketId={id ? Number(id) : undefined}
          personalInfo={personalInfo}
          messageSendersByPlatform={messageSendersByPlatform || []}
          onChangeSelectedUser={changeUser}
          loading={loading}
        />
      </Flex>

      <ChatExtraInfo
        selectedUser={selectedUser}
        ticketId={id}
        selectTicketId={id}
        updatedTicket={personalInfo}
        onUpdatePersonalInfo={(payload, values) => {
          const identifier =
            getFullName(values.name, values.surname) || `#${payload.id}`;
          const clientTicketList = personalInfo.clients.map((client) =>
            client.id === payload.id
              ? {
                ...client,
                ...values,
              }
              : client,
          );

          setSelectedUser((prev) => ({
            ...prev,
            label: identifier,
            payload: { ...prev.payload, ...values },
          }));

          setMessageSendersByPlatform((prev) =>
            prev.map((client) => {
              return client.payload.id === payload.id &&
                client.payload.platform === payload.platform
                ? {
                  ...client,
                  label: `${identifier} - ${payload.platform}`,
                  payload: { ...payload, ...values },
                }
                : client;
            }),
          );

          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === personalInfo.id
                ? { ...ticket, ...personalInfo, clients: clientTicketList }
                : ticket,
            ),
          );

          setPersonalInfo((prev) => {
            return {
              ...prev,
              clients: clientTicketList,
            };
          });
        }}
        mediaFiles={messages.mediaFiles}
      />
    </div>
  );
};

export default SingleChat;
