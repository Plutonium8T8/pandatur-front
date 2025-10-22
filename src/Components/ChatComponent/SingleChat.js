import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useClientContacts, useMessagesContext } from "@hooks";
import Can from "@components/CanComponent/Can";

const SingleChat = ({ technicians, ticketId, onClose, tasks = [] }) => {
  const { tickets } = useApp();
  const { getUserMessages, messages } = useMessagesContext();

  const currentTicket = tickets.find(t => t.id === Number(ticketId));
  
  // Получаем последнее сообщение для автоматического выбора контакта
  const lastMessage = React.useMemo(() => {
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  const {
    platformOptions,
    selectedPlatform,
    changePlatform,
    contactOptions,
    changeContact,
    selectedClient,
    selectedPageId,
    changePageId,
    loading,
    updateClientData,
  } = useClientContacts(ticketId, lastMessage);

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

  useEffect(() => {
    if (ticketId) {
      getUserMessages(Number(ticketId));
    }
  }, [ticketId, getUserMessages]);

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
            selectedClient={selectedClient}
            ticketId={ticketId ? Number(ticketId) : undefined}
            personalInfo={currentTicket}
            platformOptions={platformOptions}
            selectedPlatform={selectedPlatform}
            changePlatform={changePlatform}
            contactOptions={contactOptions}
            changeContact={changeContact}
            selectedPageId={selectedPageId}
            changePageId={changePageId}
            loading={loading}
            technicians={technicians}
            unseenCount={unseenCount}
          />
        </Flex>
      </Can>
      <Can permission={{ module: "chat", action: "edit" }} context={{ responsibleId }}>
        <ChatExtraInfo
          selectedClient={selectedClient}
          ticketId={ticketId}
          updatedTicket={currentTicket}
          onUpdateClientData={updateClientData}
        />
      </Can>
    </div>
  );
};

export default SingleChat;
