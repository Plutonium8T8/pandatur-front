import React, { useState, useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import "./chat.css";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { FaTimes } from "react-icons/fa";
import { useUser, useApp } from "../../hooks";
import { getMediaFileMessages } from "../utils";

const SingleChat = ({ ticketId, onClose }) => {
  const {
    tickets,
    setTickets,
    messages,
    markMessagesAsRead,
    getClientMessagesSingle,
  } = useApp();
  const { userId } = useUser();
  const [selectTicketId, setSelectTicketId] = useState(
    ticketId ? Number(ticketId) : null,
  );
  const [personalInfo, setPersonalInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");

  useEffect(() => {
    if (ticketId && Number(ticketId) !== selectTicketId) {
      setSelectTicketId(Number(ticketId));
    }
  }, [ticketId]);

  useEffect(() => {
    if (selectTicketId) {
      setIsLoading(true);
      getClientMessagesSingle(selectTicketId).finally(() =>
        setIsLoading(false),
      );
    }
  }, [selectTicketId]);

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
    const updatedTicket =
      tickets.find((ticket) => ticket?.id === selectTicketId) || {};

    setPersonalInfo(updatedTicket);
  }, [tickets, selectTicketId]);

  return (
    <div className="chat-container">
      <Box pos="absolute" left="20px" top="20px">
        <ActionIcon onClick={onClose} variant="default">
          <FaTimes />
        </ActionIcon>
      </Box>

      <Flex w="70%">
        <ChatMessages
          selectTicketId={selectTicketId}
          setSelectedClient={setSelectedClient}
          selectedClient={selectedClient}
          isLoading={isLoading}
          personalInfo={personalInfo}
        />
      </Flex>

      <ChatExtraInfo
        selectedClient={selectedClient}
        ticketId={ticketId}
        selectTicketId={selectTicketId}
        tickets={tickets}
        updatedTicket={personalInfo}
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
        mediaFiles={getMediaFileMessages(messages, selectTicketId)}
      />
    </div>
  );
};

export default SingleChat;
