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
  const { getUserMessages, messages, loading: messagesLoading, renderReady } = useMessagesContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  
  // Staged rendering flags - control what appears when
  const [renderStage, setRenderStage] = useState({
    dataLoaded: false,      // Stage 1: Data fetched
    selectorsReady: false,  // Stage 2: Selectors identified and rendered
    tasksReady: false,      // Stage 3: Tasks rendered
    messagesReady: false    // Stage 4: Messages rendered
  });

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
    refetch,
  } = useClientContacts(Number(ticketId), lastMessage, currentTicket?.group_title);

  // STAGED RENDERING FLOW:
  // Stage 1: Data loaded (messages + tasks fetched)
  // Stage 2: Selectors ready (identified and rendered)
  // Stage 3: Tasks ready (rendered)
  // Stage 4: Messages ready (rendered)
  
  useEffect(() => {
    // Reset stages when ticket changes
    setRenderStage({
      dataLoaded: false,
      selectorsReady: false,
      tasksReady: false,
      messagesReady: false
    });
  }, [ticketId]);
  
  // Stage 1: Check if data is loaded
  useEffect(() => {
    const dataLoaded = !messagesLoading && !loading && !isLoadingTicket;
    
    if (dataLoaded && !renderStage.dataLoaded) {
      console.log('[Stage 1] Data loaded - messages and tasks fetched');
      setRenderStage(prev => ({ ...prev, dataLoaded: true }));
    }
  }, [messagesLoading, loading, isLoadingTicket, renderStage.dataLoaded]);
  
  // Stage 2: Check if selectors are ready (identified)
  useEffect(() => {
    if (!renderStage.dataLoaded) return;
    
    const selectorsPopulated = platformOptions.length === 0 || 
      (selectedPlatform && selectedPageId && selectedClient?.value);
    const selectorsReady = selectionReady && selectorsPopulated;
    
    if (selectorsReady && !renderStage.selectorsReady) {
      console.log('[Stage 2] Selectors identified - rendering selectors');
      // Small delay to let selector state stabilize
      setTimeout(() => {
        setRenderStage(prev => ({ ...prev, selectorsReady: true }));
      }, 50);
    }
  }, [renderStage.dataLoaded, renderStage.selectorsReady, selectionReady, platformOptions.length, selectedPlatform, selectedPageId, selectedClient?.value]);
  
  // Stage 3: Render tasks after selectors
  useEffect(() => {
    if (!renderStage.selectorsReady || renderStage.tasksReady) return;
    
    console.log('[Stage 3] Rendering tasks');
    // Small delay for smooth transition
    setTimeout(() => {
      setRenderStage(prev => ({ ...prev, tasksReady: true }));
    }, 100);
  }, [renderStage.selectorsReady, renderStage.tasksReady]);
  
  // Stage 4: Render messages after tasks
  useEffect(() => {
    if (!renderStage.tasksReady || renderStage.messagesReady) return;
    
    console.log('[Stage 4] Rendering messages');
    // Small delay for smooth transition
    setTimeout(() => {
      setRenderStage(prev => ({ ...prev, messagesReady: true }));
    }, 100);
  }, [renderStage.tasksReady, renderStage.messagesReady]);

  // Show loading spinner until at least selectors are ready
  const isFullyLoading = !renderStage.selectorsReady;

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

  // Слушаем событие обновления тикета (добавление клиента/контакта)
  useEffect(() => {
    const handleTicketUpdate = (event) => {
      if (event.detail?.ticketId === Number(ticketId)) {
        console.log('[SingleChat] Ticket updated, refreshing selectors...');
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
            renderStage={renderStage}
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
