import { useState, useMemo, useEffect, useContext } from "react";
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
  const [lastMessage, setLastMessage] = useState();
  const [mediaFiles, setMediaFiles] = useState([]);
  const { userId } = useUser();

  const getUserMessages = async (id) => {
    setLoading(true);
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
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

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
      // Проверяем, есть ли уже сообщение с таким message_id
      const existingIndex = prevMessages.findIndex(
        (msg) => Number(msg.message_id) === Number(message.message_id)
      );

      // Если сообщение существует - обновляем его
      if (existingIndex !== -1) {
        const updated = [...prevMessages];
        updated[existingIndex] = message;
        return updated;
      }

      // Если сообщения нет - добавляем новое
      return [...prevMessages, message];
    });
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
      mediaFiles,
      getUserMessages,
      markMessageRead,
      updateMessage,
      markMessageSeen,
      setMessages,
      setLogs,
      setNotes,
    }),
    [messages, logs, notes, lastMessage, mediaFiles, loading]
  );
};
