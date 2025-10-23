import React, { useState, useMemo, useEffect } from "react";
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
  const { messages, loading: messagesLoading, renderReady } = useMessagesContext();
  const { ticketId: ticketIdParam } = useParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const currentTicket = useMemo(() => {
    const found = tickets?.find((t) => t.id === ticketId);
    return found;
  }, [tickets, ticketId]);

  // Получаем последнее сообщение по времени для автоматического выбора платформы и контакта
  const lastMessage = useMemo(() => {
    if (!messages || messages.length === 0 || !ticketId) {
      return null;
    }
    
    // Фильтруем сообщения только для текущего тикета и исключаем sipuni/mail
    const currentTicketMessages = messages.filter(msg => {
      const platform = msg.platform?.toLowerCase();
      return msg.ticket_id === ticketId && 
             platform !== 'sipuni' && 
             platform !== 'mail';
    });
    
    if (currentTicketMessages.length === 0) {
      return null;
    }
    
    // Сортируем по времени и берем последнее
    const sortedMessages = [...currentTicketMessages].sort((a, b) => {
      const timeA = new Date(a.time_sent || a.created_at || 0);
      const timeB = new Date(b.time_sent || b.created_at || 0);
      return timeB - timeA; // От новых к старым
    });
    
    return sortedMessages[0];
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
    selectionReady,
    updateClientData,
    refetch,
  } = useClientContacts(ticketId, lastMessage, currentTicket?.group_title);

  // SIMPLIFIED APPROACH: Keep loading overlay until EVERYTHING is stable
  useEffect(() => {
    const allDataLoaded = !messagesLoading && !loading;
    const selectorsPopulated = platformOptions.length === 0 || 
      (selectedPlatform && selectedPageId && selectedClient?.value);
    const readyToShow = allDataLoaded && selectionReady && selectorsPopulated;
    
    // When everything is ready, wait 100ms for any final state updates, then show
    if (readyToShow && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesLoading, loading, selectionReady, platformOptions.length, selectedPlatform, selectedPageId, selectedClient?.value, isInitialLoad]);

  // Simple boolean - if isInitialLoad is true, show spinner, otherwise show content
  const isFullyLoading = isInitialLoad;

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

  // Сбрасываем флаг начальной загрузки при смене тикета
  useEffect(() => {
    if (ticketId) {
      setIsInitialLoad(true);
    }
  }, [ticketId]);

  // Слушаем событие обновления тикета (добавление клиента/контакта)
  useEffect(() => {
    const handleTicketUpdate = (event) => {
      if (event.detail?.ticketId === ticketId) {
        console.log('[Chat] Ticket updated, refreshing selectors...');
        // Обновляем селекторы чтобы включить новые контакты
        if (refetch) {
          refetch();
        }
      }
    };

    window.addEventListener('ticketUpdated', handleTicketUpdate);

    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdate);
    };
  }, [ticketId, refetch]);

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
              loading={isFullyLoading}
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
