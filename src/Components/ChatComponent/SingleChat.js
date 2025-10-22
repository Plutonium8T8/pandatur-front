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
  
  // Получаем последнее сообщение от клиента для автоматического выбора контакта
  const lastMessage = React.useMemo(() => {
    if (!messages || messages.length === 0 || !ticketId) {
      console.log('⚠️ No messages or ticketId:', {
        messagesLength: messages?.length || 0,
        ticketId
      });
      return null;
    }
    
    // Фильтруем сообщения только для текущего тикета
    const currentTicketId = Number(ticketId);
    const currentTicketMessages = messages.filter(msg => msg.ticket_id === currentTicketId);
    
    if (currentTicketMessages.length === 0) {
      console.log('⚠️ No messages for current ticket:', currentTicketId);
      return null;
    }
    
    // Ищем последнее сообщение от клиента (где sender_id === client_id)
    for (let i = currentTicketMessages.length - 1; i >= 0; i--) {
      const msg = currentTicketMessages[i];
      if (msg.sender_id === msg.client_id) {
        console.log('📨 Found last client message:', {
          id: msg.id,
          ticket_id: msg.ticket_id,
          platform: msg.platform,
          client_id: msg.client_id,
          message: msg.message?.substring(0, 50)
        });
        return msg;
      }
    }
    
    // Если не нашли сообщение от клиента, возвращаем последнее сообщение текущего тикета
    console.log('⚠️ No client messages found, using last message of current ticket');
    return currentTicketMessages[currentTicketMessages.length - 1];
  }, [messages, ticketId]);

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
