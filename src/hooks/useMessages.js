import { useState, useMemo } from "react";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { useUser } from "@hooks";
import { showServerError } from "@utils";
import { MEDIA_TYPE } from "@app-constants";

const FORMAT_MEDIA = [
  MEDIA_TYPE.AUDIO,
  MEDIA_TYPE.VIDEO,
  MEDIA_TYPE.IMAGE,
  MEDIA_TYPE.FILE,
  MEDIA_TYPE.CALL,
];

const getMediaFileMessages = (messageList) => {
  return messageList.filter((msg) => FORMAT_MEDIA.includes(msg.mtype));
};

export const useMessages = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);           // <-- NEW
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
      const notesData = Array.isArray(response?.notes) ? response.notes : []; // <-- NEW

      setMessages(data);
      setLogs(logsData);
      setNotes(notesData);                                                      // <-- NEW

      const sortedMessages = data.filter(
        ({ sender_id }) => sender_id !== 1 && sender_id !== userId,
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
      }),
    );
  };

  const updateMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const markMessageSeen = (id, seenAt) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.ticket_id === id ? { ...msg, seen_at: seenAt } : msg,
      ),
    );
  };

  return useMemo(
    () => ({
      messages,
      logs,
      notes,                 // <-- NEW (экспортируем)
      lastMessage,
      loading,
      mediaFiles,
      getUserMessages,
      markMessageRead,
      updateMessage,
      markMessageSeen,
      setMessages,
      setLogs,
      setNotes,              // <-- опционально, если где-то понадобится править
    }),
    [messages, logs, notes, lastMessage, mediaFiles, loading],
  );
};
