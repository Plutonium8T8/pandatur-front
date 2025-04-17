import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useFetchTicketChat } from "../../hooks";
import ChatExtraInfo from "./ChatExtraInfo";
import ChatList from "./ChatList";
import { getFullName } from "../utils";
import { ChatMessages } from "./components";
import "./chat.css";

const ChatComponent = () => {
  const { setTickets, messages } = useApp();
  const { ticketId } = useParams();
  const [selectTicketId, setSelectTicketId] = useState(
    ticketId ? Number(ticketId) : null,
  );
  const [isChatListVisible, setIsChatListVisible] = useState(true);

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

  useEffect(() => {
    if (ticketId) {
      setSelectedUser({});
      setMessageSendersByPlatform([]);
      if (Number(ticketId) !== selectTicketId) {
        setSelectTicketId(Number(ticketId));
      }

      if (!messages?.list.length) {
        messages.getUserMessages(Number(ticketId));
      }
    }
  }, [ticketId]);

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex
        w="100%"
        h="100%"
        className={`chat-container ${isChatListVisible ? "" : "chat-hidden"}`}
      >
        {isChatListVisible && <ChatList selectTicketId={selectTicketId} />}

        <Flex pos="relative" style={{ flex: "1 1 0" }}>
          <Box pos="absolute" left="10px" top="16px" style={{ zIndex: 1 }}>
            <ActionIcon
              variant="default"
              onClick={() => setIsChatListVisible((prev) => !prev)}
            >
              {isChatListVisible ? (
                <FaArrowLeft size="12" />
              ) : (
                <FaArrowRight size="12" />
              )}
            </ActionIcon>
          </Box>

          <ChatMessages
            selectTicketId={selectTicketId}
            selectedClient={selectedUser}
            personalInfo={personalInfo}
            messageSendersByPlatform={messageSendersByPlatform || []}
            onChangeSelectedUser={changeUser}
            loading={loading}
          />
        </Flex>

        {ticketId && (
          <ChatExtraInfo
            selectedUser={selectedUser}
            ticketId={ticketId}
            selectTicketId={selectTicketId}
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
            updatedTicket={personalInfo}
            mediaFiles={messages.mediaFiles}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default ChatComponent;
