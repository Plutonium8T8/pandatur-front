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
  const { getUserMessages, messages } = useMessagesContext();
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
      console.log("[SingleChat] lastMessage: no messages or ticketId", { 
        hasMessages: !!messages, 
        messagesCount: messages?.length, 
        ticketId 
      });
      return null;
    }
    
    // Фильтруем сообщения только для текущего тикета и исключаем sipuni/mail
    const currentTicketId = Number(ticketId);
    const currentTicketMessages = messages.filter(msg => {
      const platform = msg.platform?.toLowerCase();
      return msg.ticket_id === currentTicketId && platform !== 'sipuni' && platform !== 'mail';
    });
    
    console.log("[SingleChat] filtered messages for ticket", { 
      ticketId: currentTicketId, 
      totalMessages: messages.length,
      currentTicketMessages: currentTicketMessages.length,
      allTicketIds: [...new Set(messages.map(m => m.ticket_id))]
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
    
    const lastMsg = sortedMessages[0];
    console.log("[SingleChat] lastMessage selected", {
      id: lastMsg?.id,
      platform: lastMsg?.platform,
      time_sent: lastMsg?.time_sent,
      created_at: lastMsg?.created_at,
      from_reference: lastMsg?.from_reference,
      to_reference: lastMsg?.to_reference,
      client_id: lastMsg?.client_id,
      sender_id: lastMsg?.sender_id,
      ticket_id: lastMsg?.ticket_id
    });
    
    return lastMsg;
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
  } = useClientContacts(Number(ticketId), lastMessage, currentTicket?.group_title);

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
            loading={loading || isLoadingTicket}
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
