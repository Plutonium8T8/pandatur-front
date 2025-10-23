import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect, useState, useCallback } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useClientContacts, useMessagesContext } from "@hooks";
import Can from "@components/CanComponent/Can";
import { api } from "../../api";
import { showServerError } from "../utils";
import { useSnackbar } from "notistack";

const SingleChat = ({ technicians, ticketId, onClose, tasks = [] }) => {
  const { tickets, setTickets } = useApp();
  const { getUserMessages, messages, loading: messagesLoading } = useMessagesContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  const currentTicket = tickets.find(t => t.id === Number(ticketId));

  // Функция загрузки конкретного тикета
  const fetchSingleTicket = useCallback(async (ticketId) => {
    if (!ticketId) return;
    
    setIsLoadingTicket(true);
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);
      
      // Добавляем тикет в глобальное состояние, если его там нет
      setTickets(prev => {
        const exists = prev.find(t => t.id === Number(ticketId));
        if (!exists) {
          return [...prev, ticket];
        }
        return prev;
      });
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoadingTicket(false);
    }
  }, [setTickets, enqueueSnackbar]);
  
  // Получаем последнее сообщение по времени для автоматического выбора платформы и контакта
  const lastMessage = React.useMemo(() => {
    if (!messages || messages.length === 0 || !ticketId) {
      return null;
    }
    
    // Фильтруем сообщения только для текущего тикета и исключаем sipuni/mail
    const currentTicketId = Number(ticketId);
    const currentTicketMessages = messages.filter(msg => {
      const platform = msg.platform?.toLowerCase();
      return msg.ticket_id === currentTicketId && 
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
  } = useClientContacts(Number(ticketId), lastMessage, currentTicket?.group_title);

  // Комбинированный loading: ждём загрузки сообщений, контактов и завершения автовыборов
  const isFullyLoading = messagesLoading || loading || !selectionReady || isLoadingTicket;

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

  useEffect(() => {
    if (ticketId) {
      getUserMessages(Number(ticketId));
    }
  }, [ticketId, getUserMessages]);

  // Загружаем тикет, если его нет в глобальном состоянии
  useEffect(() => {
    if (ticketId && !currentTicket) {
      fetchSingleTicket(Number(ticketId));
    }
  }, [ticketId, currentTicket, fetchSingleTicket]);

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
            loading={isFullyLoading}
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
