import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useClientContacts, useMessagesContext } from "@hooks";
import { useGetTechniciansList } from "../hooks";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";

export const Chat = () => {
  const { tickets } = useApp();
  const { messages } = useMessagesContext();
  const { ticketId: ticketIdParam } = useParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

  const currentTicket = useMemo(() => {
    const found = tickets?.find((t) => t.id === ticketId);
    return found;
  }, [tickets, ticketId]);

  // Получаем последнее сообщение от клиента для автоматического выбора контакта
  const lastMessage = useMemo(() => {
    if (!messages || messages.length === 0 || !ticketId) {
      return null;
    }
    
    // Фильтруем сообщения только для текущего тикета
    const currentTicketMessages = messages.filter(msg => msg.ticket_id === ticketId);
    
    if (currentTicketMessages.length === 0) {
      return null;
    }
    
    // Ищем последнее сообщение от клиента (где sender_id === client_id)
    for (let i = currentTicketMessages.length - 1; i >= 0; i--) {
      const msg = currentTicketMessages[i];
      if (msg.sender_id === msg.client_id) {
        return msg;
      }
    }
    
    // Если не нашли сообщение от клиента, возвращаем последнее сообщение текущего тикета
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
  } = useClientContacts(ticketId, lastMessage, currentTicket?.group_title);

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex w="100%" h="100%" className="chat-container">
        {isChatListVisible && <ChatList ticketId={ticketId} />}
        

        <Can
          permission={{ module: "chat", action: "edit" }}
          context={{ responsibleId }}
        >
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
              ticketId={ticketId}
              selectedClient={selectedClient}
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
              unseenCount={currentTicket?.unseen_count || 0}
            />
          </Flex>
        </Can>

        {!isNaN(ticketId) && (
          <Can
            permission={{ module: "chat", action: "edit" }}
            context={{ responsibleId }}
          >
            <ChatExtraInfo
              selectedClient={selectedClient}
              ticketId={ticketId}
              updatedTicket={currentTicket}
              onUpdateClientData={updateClientData}
            />
          </Can>
        )}
      </Flex>
    </Flex>
  );
};
