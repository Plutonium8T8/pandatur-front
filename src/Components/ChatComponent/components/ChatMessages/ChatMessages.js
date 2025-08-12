import { useState, useEffect, useRef, useCallback } from "react";
import { Flex, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useUser, useMessagesContext } from "@hooks";
import { api } from "@api";
import { getLanguageByKey, MESSAGES_STATUS } from "@utils";
import { Spin } from "@components";
import { DD_MM_YYYY__HH_mm_ss } from "@app-constants";
import { ChatInput } from "../ChatInput";
import TaskListOverlay from "../../../Task/TaskListOverlay";
import { GroupedMessages } from "../GroupedMessages";
import { InlineNoteComposer } from "../../../InlineNoteComposer";
import "./ChatMessages.css";

const getSendedMessage = (msj, currentMsj, statusMessage) =>
  msj.sender_id === currentMsj.sender_id &&
    msj.message === currentMsj.message &&
    msj.time_sent === currentMsj.time_sent
    ? { ...msj, messageStatus: statusMessage }
    : msj;

export const ChatMessages = ({
  ticketId,
  selectedClient,
  personalInfo,
  messageSendersByPlatform,
  onChangeSelectedUser,
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
    notes: apiNotesFromCtx = [],          // <-- ЗАБИРАЕМ ЗАМЕТКИ ИЗ КОНТЕКСТА
  } = useMessagesContext();

  const messageContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);

  // локальные заметки (пока без API)
  const [localNotes, setLocalNotes] = useState([]);
  const [noteMode, setNoteMode] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const addLocalNote = useCallback(
    (text) => {
      const now = dayjs().format(DD_MM_YYYY__HH_mm_ss);
      setLocalNotes((prev) => [
        ...prev,
        {
          id: `note-${Date.now()}`,
          ticket_id: ticketId,
          text,
          author_id: Number(userId),
          author_name: getLanguageByKey("Вы"),
          time_created: now,
        },
      ]);
    },
    [ticketId, userId]
  );

  // нормализуем локальные заметки к формату API и объединяем
  const mergedNotes = [
    ...apiNotesFromCtx,
    ...localNotes.map((n) => ({
      id: n.id,
      ticket_id: n.ticket_id,
      type: "text",
      value: n.text,
      technician_id: n.author_id,
      created_at: n.time_created,
    })),
  ];

  const sendMessage = useCallback(
    async (metadataMsj) => {
      try {
        const normalizedMessage = {
          ...metadataMsj,
          message: metadataMsj.message || metadataMsj.message_text,
          seenAt: false,
        };

        setMessages((prev) => [...prev, normalizedMessage]);

        let apiUrl = api.messages.send.create;
        const normalizedPlatform = metadataMsj.platform?.toUpperCase?.();

        if (normalizedPlatform === "TELEGRAM") apiUrl = api.messages.send.telegram;
        else if (normalizedPlatform === "VIBER") apiUrl = api.messages.send.viber;
        else if (normalizedPlatform === "WHATSAPP") apiUrl = api.messages.send.whatsapp;

        await apiUrl(metadataMsj);

        setMessages((prev) =>
          prev.map((msj) => getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.SUCCESS))
        );
      } catch {
        setMessages((prev) =>
          prev.map((msj) => getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.ERROR))
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

  // автоскролл при новых сообщениях/заметках
  useEffect(() => {
    if (isUserAtBottom && messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
      });
    }
  }, [messages, ticketId, localNotes, apiNotesFromCtx, isUserAtBottom]);

  // подписка на скролл
  useEffect(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // загрузка при смене тикета
  useEffect(() => {
    if (!ticketId) return;
    getUserMessages(Number(ticketId));
    setLocalNotes([]);
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
          apiNotes={mergedNotes}
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

  const handleSaveNote = useCallback(
    async (text) => {
      setNoteSaving(true);
      try {
        addLocalNote(text);
        setNoteMode(false);
      } finally {
        setNoteSaving(false);
      }
    },
    [addLocalNote]
  );

  return (
    <Flex w="100%" direction="column" className="chat-area">
      <Flex
        h="100vh"
        p="16"
        direction="column"
        className="chat-messages"
        ref={messageContainerRef}
        bg="#f9fff9"
      >
        {renderMessagesContent()}
      </Flex>

      {ticketId && !messagesLoading && (
        <>
          {noteMode && (
            <div style={{ padding: 16 }}>
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

          <ChatInput
            loading={loading}
            id={ticketId}
            clientList={messageSendersByPlatform}
            ticketId={ticketId}
            unseenCount={unseenCount}
            currentClient={selectedClient}
            onCreateTask={() => setCreatingTask(true)}
            onToggleNoteComposer={handleToggleNoteComposer}
            onSendMessage={(value) => {
              if (!selectedClient.payload) return;
              sendMessage({
                sender_id: Number(userId),
                client_id: selectedClient.payload.id,
                platform: selectedClient.payload.platform,
                ticket_id: ticketId,
                time_sent: dayjs().format(DD_MM_YYYY__HH_mm_ss),
                messageStatus: MESSAGES_STATUS.PENDING,
                ...value,
              });
            }}
            onChangeClient={(value) => {
              if (!value) return;
              const [clientId, platform] = value.split("-");
              onChangeSelectedUser(Number(clientId), platform);
            }}
          />
        </>
      )}
    </Flex>
  );
};
