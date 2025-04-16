import { FaTimes } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp } from "../../hooks";
import { normalizeUsersAndPlatforms, getFullName } from "../utils";
import "./chat.css";

const SingleChat = ({ id, onClose }) => {
  const { tickets, setTickets, messages } = useApp();

  const [personalInfo, setPersonalInfo] = useState({});
  const [messageSendersByPlatform, setMessageSendersByPlatform] = useState();
  const [selectedUser, setSelectedUser] = useState({});

  const changeUser = (userId, platform) => {
    const user = messageSendersByPlatform?.find(
      ({ payload }) => payload.id === userId && payload.platform === platform,
    );

    setSelectedUser(user);
  };

  useEffect(() => {
    if (id) {
      const updatedTicket =
        tickets?.find((ticket) => ticket?.id === Number(id)) || {};

      const users = normalizeUsersAndPlatforms(
        updatedTicket.clients,
        messages.list,
      );

      setPersonalInfo(updatedTicket);
      setMessageSendersByPlatform(users);
    }
  }, [tickets, id]);

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
