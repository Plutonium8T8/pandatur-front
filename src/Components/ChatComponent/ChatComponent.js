import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useUser } from "../../hooks";
import ChatExtraInfo from "./ChatExtraInfo";
import ChatList from "./ChatList";
import {
  getFullName,
  capitalizeFirstLetter,
  getMediaFileMessages,
} from "../utils";
import { ChatMessages } from "./components";
import "./chat.css";

const parseDate = (dateString) => {
  if (!dateString) return null;
  const [date, time] = dateString.split(" ");
  if (!date || !time) return null;
  const [day, month, year] = date.split("-");
  return new Date(`${year}-${month}-${day}T${time}`);
};

const ChatComponent = () => {
  const {
    tickets,
    setTickets,
    messages,
    markMessagesAsRead,
    getClientMessagesSingle,
  } = useApp();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { userId } = useUser();
  const [selectTicketId, setSelectTicketId] = useState(
    ticketId ? Number(ticketId) : null,
  );
  const [personalInfo, setPersonalInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChatListVisible, setIsChatListVisible] = useState(true);
  const [selectedUser, setSelectedUser] = useState({});
  const [messageSendersByPlatform, setMessageSendersByPlatform] = useState();

  const getLastClientWhoSentMessage = () => {
    if (!Array.isArray(messages) || messages.length === 0) return null;

    const ticketMessages = messages
      .filter(
        (msg) =>
          msg.ticket_id === selectTicketId && Number(msg.sender_id) !== 1,
      )
      .sort((a, b) => parseDate(b.time_sent) - parseDate(a.time_sent));

    return ticketMessages.length > 0 ? ticketMessages[0] : null;
  };

  useEffect(() => {
    if (!selectTicketId || !messages.length) return;

    const unreadMessages = messages.filter(
      (msg) =>
        msg.ticket_id === selectTicketId &&
        msg.seen_by === "{}" &&
        msg.sender_id !== userId,
    );

    if (unreadMessages.length > 0) {
      markMessagesAsRead(selectTicketId);
    }
  }, [selectTicketId, messages, userId]);

  useEffect(() => {
    const lastMessage = getLastClientWhoSentMessage();

    const ticketById =
      tickets.find((ticket) => ticket.id === selectTicketId) || {};

    const users =
      ticketById.clients
        ?.map(({ id, name, surname, phone }) => {
          const platformsMessagesClient = messages
            .filter((msg) => msg.client_id === id)
            .map(({ platform }) => platform);
          return [...new Set(platformsMessagesClient)].map((platform) => ({
            value: `${id}-${platform}`,
            label: `${getFullName(name, surname) || `#${id}`} - ${capitalizeFirstLetter(platform)}`,
            payload: { id, platform, name, surname, phone },
          }));
        })
        ?.flat() || [];

    if (lastMessage) {
      const { platform, client_id } = lastMessage;

      const selectedUser = users.find(
        ({ payload }) =>
          payload.id === client_id && payload.platform === platform,
      );
      setSelectedUser(selectedUser || {});
    } else {
      setSelectedUser(users[0] || {});
    }

    setPersonalInfo(ticketById);
    setMessageSendersByPlatform(users);
  }, [tickets, selectTicketId]);

  const handleSelectTicket = (ticketId) => {
    if (selectTicketId !== ticketId) {
      setSelectTicketId(ticketId);
      navigate(`/chat/${ticketId}`);
    }
  };

  useEffect(() => {
    if (!selectTicketId) return;

    setIsLoading(true);

    getClientMessagesSingle(selectTicketId).finally(() => {
      setIsLoading(false);
    });
  }, [selectTicketId]);

  useEffect(() => {
    if (ticketId && Number(ticketId) !== selectTicketId) {
      setSelectTicketId(Number(ticketId));
    }
  }, [ticketId]);

  const changeUser = (userId, platform) => {
    const user = messageSendersByPlatform.find(
      ({ payload }) => payload.id === userId && payload.platform === platform,
    );

    setSelectedUser(user);
  };

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex
        w="100%"
        h="100%"
        className={`chat-container ${isChatListVisible ? "" : "chat-hidden"}`}
      >
        {isChatListVisible && (
          <ChatList
            selectTicketId={selectTicketId}
            setSelectTicketId={handleSelectTicket}
          />
        )}

        <Flex pos="relative" style={{ flex: "1 1 0" }}>
          <Box pos="absolute" left="10px" top="16px" style={{ zIndex: 999 }}>
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
            isLoading={isLoading}
            personalInfo={personalInfo}
            messageSendersByPlatform={messageSendersByPlatform}
            onChangeSelectedUser={changeUser}
          />
        </Flex>

        {selectTicketId && (
          <ChatExtraInfo
            selectedUser={selectedUser}
            ticketId={ticketId}
            selectTicketId={selectTicketId}
            onUpdatePersonalInfo={(values) => {
              const firstClient = personalInfo.clients[0];
              const clients = (personalInfo.clients = [
                { ...firstClient, ...values },
                ...personalInfo.clients.slice(1),
              ]);
              setTickets((prev) =>
                prev.map((ticket) =>
                  ticket.id === personalInfo.id
                    ? { ...ticket, ...personalInfo, clients }
                    : ticket,
                ),
              );

              setPersonalInfo((prev) => {
                return {
                  ...prev,
                  clients: clients,
                };
              });
            }}
            updatedTicket={personalInfo}
            mediaFiles={getMediaFileMessages(messages, selectTicketId)}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default ChatComponent;
