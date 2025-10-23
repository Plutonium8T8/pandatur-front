import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { useUser } from "@hooks";
import { showServerError } from "@utils";
import { MEDIA_TYPE } from "@app-constants";
import { SocketContext } from "../contexts/SocketContext";

const FORMAT_MEDIA = [
  MEDIA_TYPE.AUDIO,
  MEDIA_TYPE.VIDEO,
  MEDIA_TYPE.IMAGE,
  MEDIA_TYPE.FILE,
  MEDIA_TYPE.CALL,
  MEDIA_TYPE.EMAIL,
];

const getMediaFileMessages = (messageList) => {
  return messageList.filter((msg) => FORMAT_MEDIA.includes(msg.mtype));
};

export const useMessages = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { onEvent, offEvent } = useContext(SocketContext);

  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renderReady, setRenderReady] = useState(true); // флаг готовности рендеринга
  const [lastMessage, setLastMessage] = useState();
  const [mediaFiles, setMediaFiles] = useState([]);
  const { userId } = useUser();

  const getUserMessages = useCallback(async (id) => {
    setLoading(true);
    setRenderReady(false); // Сбрасываем флаг готовности рендеринга
    try {
      const response = await api.messages.messagesTicketById(id);
      const data = Array.isArray(response?.messages) ? response.messages : [];
      const logsData = Array.isArray(response?.logs) ? response.logs : [];
      const notesData = Array.isArray(response?.notes) ? response.notes : [];

      setMessages(data);
      setLogs(logsData);
      setNotes(notesData);

      const sortedMessages = data.filter(
        ({ sender_id }) => sender_id !== 1 && sender_id !== userId
      );
      setLastMessage(sortedMessages[sortedMessages.length - 1]);
      setMediaFiles(getMediaFileMessages(data));
      
      // Используем requestAnimationFrame вместо setTimeout для более точной синхронизации
      requestAnimationFrame(() => {
        setRenderReady(true);
      });
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
      setRenderReady(true);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, userId]);

  const markMessageRead = (id) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.ticket_id === id) {
          return {
            ...msg,
            seen_by: JSON.stringify({ [userId]: true }),
            seen_at: new Date().toISOString(),
          };
        }
        return msg;
      })
    );
  };

  const updateMessage = (message) => {
    setMessages((prevMessages) => {
      if (!message?.message_id) {
        // Если нет message_id - просто добавляем (старая логика для совместимости)
        return [...prevMessages, message];
      }

      // Ищем существующее сообщение по message_id
      const existingIndex = prevMessages.findIndex(
        (msg) => Number(msg.message_id) === Number(message.message_id)
      );

      // Если сообщение существует - обновляем его (мердж данных)
      if (existingIndex !== -1) {
        const updated = [...prevMessages];
        const existingMsg = updated[existingIndex];
        
        // Мерджим данные: сохраняем все поля из старого + добавляем/перезаписываем из нового
        // Особенно важно для звонков: сначала приходит без URL записи, потом с URL
        updated[existingIndex] = {
          ...existingMsg,
          ...message,
          // Убеждаемся, что call_metadata всегда актуальный
          call_metadata: message.call_metadata || existingMsg.call_metadata,
        };
        
        return updated;
      }

      // Если сообщения нет - добавляем новое в конец списка
      return [...prevMessages, message];
    });
    
    // Обновляем mediaFiles если это медиа-сообщение
    if (FORMAT_MEDIA.includes(message.mtype)) {
      setMediaFiles((prevMedia) => {
        const existingIndex = prevMedia.findIndex(
          (msg) => Number(msg.message_id) === Number(message.message_id)
        );
        
        if (existingIndex !== -1) {
          const updated = [...prevMedia];
          updated[existingIndex] = { ...updated[existingIndex], ...message };
          return updated;
        }
        
        return [...prevMedia, message];
      });
    }
  };

  const markMessageSeen = (id, seenAt) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.ticket_id === id ? { ...msg, seen_at: seenAt } : msg
      )
    );
  };

  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const handleNoteDelete = (evt) => {
      const noteId = Number(evt?.data?.note_id);
      if (!noteId) return;
      setNotes((prev) => prev.filter((n) => Number(n.id) !== noteId));
    };

    const unsub = onEvent("ticket_note_delete", handleNoteDelete);
    return () => {
      offEvent("ticket_note_delete", handleNoteDelete);
      typeof unsub === "function" && unsub();
    };
  }, [onEvent, offEvent]);

  return useMemo(
    () => ({
      messages,
      logs,
      notes,
      lastMessage,
      loading,
      renderReady,
      mediaFiles,
      getUserMessages,
      markMessageRead,
      updateMessage,
      markMessageSeen,
      setMessages,
      setLogs,
      setNotes,
    }),
    [messages, logs, notes, lastMessage, mediaFiles, loading, renderReady, getUserMessages]
  );
};
