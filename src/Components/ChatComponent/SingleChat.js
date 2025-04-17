import { FaTimes } from "react-icons/fa";
import React, { useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useFetchTicketChat } from "../../hooks";
import { getFullName } from "../utils";
import "./chat.css";

const SingleChat = ({ id, onClose }) => {
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
      <Box pos="absolute" left="20px" top="20px">
        <ActionIcon onClick={onClose} variant="default">
          <FaTimes />
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
            label: getFullName(values.name, values.surname),
            payload: { ...prev.payload, ...values },
          }));

          setMessageSendersByPlatform((prev) =>
            prev.map((clientMsj) =>
              clientMsj.id === payload.id &&
              clientMsj.platform === payload.platform
                ? {
                    ...clientMsj,
                    label: getFullName(values.name, values.surname),
                    payload: { ...payload, ...values },
                  }
                : clientMsj,
            ),
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
