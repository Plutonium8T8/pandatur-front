import { useState, useEffect, useRef, useCallback } from "react";
import { Flex, Text, Paper } from "@mantine/core";
import dayjs from "dayjs";
import { useUser, useMessagesContext } from "@hooks";
import { api } from "@api";
import { getLanguageByKey, MESSAGES_STATUS } from "@utils";
import { Spin } from "@components";
import { YYYY_MM_DD_HH_mm_ss } from "@app-constants";
import { ChatInput } from "../ChatInput";
import TaskListOverlay from "../../../Task/TaskListOverlay";
import { GroupedMessages } from "../GroupedMessages";
import { InlineNoteComposer } from "../../../InlineNoteComposer";
import { TicketParticipants } from "../../../TicketParticipants";
import { getPageIdByPlatformAndGroup } from "../../../../constants/webhookPagesConfig";
import "./ChatMessages.css";

const getSendedMessage = (msj, currentMsj, statusMessage) => {
  // Проверяем точное совпадение по ключевым полям
  const isExactMatch = msj.sender_id === currentMsj.sender_id &&
    msj.message === currentMsj.message &&
    msj.time_sent === currentMsj.time_sent &&
    msj.ticket_id === currentMsj.ticket_id;

  if (isExactMatch) {
    return { ...msj, messageStatus: statusMessage };
  }

  // Fallback: ищем PENDING сообщение от того же пользователя в том же тикете
  const isPendingMatch = msj.sender_id === currentMsj.sender_id &&
    msj.ticket_id === currentMsj.ticket_id &&
    msj.messageStatus === MESSAGES_STATUS.PENDING;

  if (isPendingMatch) {
    console.log("🔄 Found PENDING message for status update:", {
      from: "PENDING",
      to: statusMessage,
      message: msj.message?.substring(0, 50) + "..."
    });
    return { ...msj, messageStatus: statusMessage };
  }

  return msj;
};

export const ChatMessages = ({
  ticketId,
  selectedClient,
  personalInfo,
  platformOptions,
  selectedPlatform,
  changePlatform,
  contactOptions,
  changeContact,
  selectedPageId,
  changePageId,
  loading,
  technicians,
  unseenCount = 0,
}) => {
  const { userId } = useUser();

  const {
    setMessages,
    getUserMessages,
    loading: messagesLoading,
    messages,
    notes: apiNotesFromCtx = [],
  } = useMessagesContext();

  const messageContainerRef = useRef(null);
  const contentRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);
  const isFirstLoadRef = useRef(true); // Флаг первой загрузки

  const [noteMode, setNoteMode] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const sendMessage = useCallback(
    async (metadataMsj) => {
      const normalizedMessage = {
        ...metadataMsj,
        message: metadataMsj.message || metadataMsj.message_text,
        seenAt: false,
      };

      // Сразу добавляем сообщение с PENDING статусом
      setMessages((prev) => [...prev, normalizedMessage]);

      try {
        let apiUrl = api.messages.send.create;
        const normalizedPlatform = metadataMsj.platform?.toUpperCase?.();

        if (normalizedPlatform === "TELEGRAM") apiUrl = api.messages.send.telegram;
        else if (normalizedPlatform === "VIBER") apiUrl = api.messages.send.viber;
        else if (normalizedPlatform === "WHATSAPP") apiUrl = api.messages.send.whatsapp;

        // Отправляем на сервер
        const response = await apiUrl(metadataMsj);

        console.log("📤 Server response:", response);

        // Проверяем статус ответа сервера
        const isSuccess = response?.status === "success" || response?.status === "ok";

        console.log("✅ Message status check:", {
          responseStatus: response?.status,
          isSuccess,
          willUpdateTo: isSuccess ? "SUCCESS" : "ERROR"
        });

        if (isSuccess) {
          // Обновляем статус на SUCCESS
          setMessages((prev) =>
            prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.SUCCESS))
          );
        } else {
          // Если статус не success, оставляем PENDING или ставим ERROR
          setMessages((prev) =>
            prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.ERROR))
          );
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        // При ошибке API обновляем статус на ERROR
        setMessages((prev) =>
          prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.ERROR))
        );
      }
    },
    [setMessages]
  );

  const handleScroll = useCallback(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setIsUserAtBottom(scrollHeight - scrollTop <= clientHeight + 50);
  }, []);

  useEffect(() => {
    if (isUserAtBottom && messageContainerRef.current) {
      // При первой загрузке - мгновенный скролл, потом - плавный
      const behavior = isFirstLoadRef.current ? 'instant' : 'smooth';
      
      // Добавляем небольшую задержку чтобы контент успел отрендериться
      requestAnimationFrame(() => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTo({
            top: messageContainerRef.current.scrollHeight,
            behavior: behavior,
          });
        }
      });
      
      // После первого скролла снимаем флаг
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
    }
  }, [messages, ticketId, apiNotesFromCtx, isUserAtBottom]);

  useEffect(() => {
    const container = messageContainerRef.current;
    const contentEl = contentRef.current;
    if (!container || !contentEl) return;

    const ro = new ResizeObserver(() => {
      if (isUserAtBottom) {
        const behavior = isFirstLoadRef.current ? 'instant' : 'smooth';
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTo({ 
              top: container.scrollHeight,
              behavior: behavior,
            });
          }
        });
      }
    });

    ro.observe(contentEl);
    return () => ro.disconnect();
  }, [isUserAtBottom]);

  useEffect(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!ticketId) return;
    // При смене тикета сбрасываем флаг первой загрузки
    isFirstLoadRef.current = true;
    getUserMessages(Number(ticketId));
    setNoteMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const renderMessagesContent = () => {
    if (messages.error) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Text size="lg" c="red">{getLanguageByKey("loadMessagesError")}</Text>
        </Flex>
      );
    }
    if (messagesLoading) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      );
    }

    if (ticketId) {
      return (
        <GroupedMessages
          personalInfo={personalInfo}
          ticketId={ticketId}
          technicians={technicians}
          apiNotes={apiNotesFromCtx}
        />
      );
    }

    return (
      <Flex h="100%" align="center" justify="center">
        <Text size="lg" c="dimmed">{getLanguageByKey("Alege lead")}</Text>
      </Flex>
    );
  };

  const handleToggleNoteComposer = useCallback(() => {
    setNoteMode((v) => !v);
  }, []);

  return (
    <Flex w="100%" h="100%" direction="column" className="chat-area">
      {ticketId && (
        <Paper p="8" style={{ margin: "12px 0px 12px 42px", flexShrink: 0 }}>
          <TicketParticipants ticketId={ticketId} currentUserId={Number(userId)} />
        </Paper>
      )}

      <Flex
        direction="column"
        className="chat-messages"
        ref={messageContainerRef}
        style={{ flex: 1, overflow: 'auto' }}
      >
        <div ref={contentRef} style={{ padding: '16px', paddingBottom: '32px' }}>
          {renderMessagesContent()}
        </div>
      </Flex>

      {ticketId && !messagesLoading && (
        <>
          {noteMode && (
            <div style={{ padding: 16, flexShrink: 0 }}>
              <InlineNoteComposer
                ticketId={ticketId}
                technicianId={Number(userId)}
                loading={noteSaving}
                onCancel={() => setNoteMode(false)}
                onSave={async () => {
                  setNoteSaving(true);
                  try {
                    await getUserMessages(Number(ticketId));
                    setNoteMode(false);
                  } finally {
                    setNoteSaving(false);
                  }
                }}
              />
            </div>
          )}

          <TaskListOverlay
            ticketId={ticketId}
            creatingTask={creatingTask}
            setCreatingTask={setCreatingTask}
          />

          <div style={{ flexShrink: 0 }}>
            <ChatInput
              loading={loading}
              id={ticketId}
              platformOptions={platformOptions}
              selectedPlatform={selectedPlatform}
              changePlatform={changePlatform}
              contactOptions={contactOptions}
              changeContact={changeContact}
              selectedPageId={selectedPageId}
              changePageId={changePageId}
              ticketId={ticketId}
              unseenCount={unseenCount}
              currentClient={selectedClient}
              personalInfo={personalInfo}
              onCreateTask={() => setCreatingTask(true)}
              onToggleNoteComposer={handleToggleNoteComposer}
              onSendMessage={(value) => {
                if (!selectedClient.payload) return;
                
                // Получаем page_id из конфигурации по платформе и group_title тикета
                const pandaPageId = getPageIdByPlatformAndGroup(
                  selectedClient.payload.platform,
                  personalInfo?.group_title
                );
                
                sendMessage({
                  sender_id: Number(userId),
                  client_id: selectedClient.payload.client_id,
                  platform: selectedClient.payload.platform,
                  page_id: pandaPageId, // page_id Panda из конфигурации
                  contact_value: selectedClient.payload.contact_value, // ID клиента (куда отправляем)
                  ticket_id: ticketId,
                  time_sent: dayjs().format(YYYY_MM_DD_HH_mm_ss),
                  messageStatus: MESSAGES_STATUS.PENDING,
                  ...value,
                });
              }}
            />
          </div>
        </>
      )}
    </Flex>
  );
};
