import { useState } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { useUser } from "../hooks";
import { parseDate, showServerError } from "../Components/utils";

const FORMAT_MEDIA = ["audio", "video", "image", "file"];

export const getMediaFileMessages = (messageList) => {
  return messageList.filter((msg) => FORMAT_MEDIA.includes(msg.mtype));
};

export const useMessages = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState();
  const [mediaFiles, setMediaFiles] = useState([]);
  const { userId } = useUser();

  const getUserMessages = async (ticket_id) => {
    setLoading(true);
    try {
      const data = await api.messages.messagesTicketById(ticket_id);

      if (Array.isArray(data)) {
        setMessages((prevMessages) => {
          const otherMessages = prevMessages.filter(
            (msg) => msg.ticket_id !== ticket_id,
          );

          return [...otherMessages, ...data];
        });

        const lastMessage =
          data
            .filter(({ sender_id }) => sender_id !== 1 && sender_id !== userId)
            .sort((a, b) => parseDate(b.time_sent) - parseDate(a.time_sent)) ||
          [];

        setLastMessage(lastMessage[0]);
        setMediaFiles(getMediaFileMessages(data));
      }
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
    setMessages((prevMessages) => [...prevMessages, message.data]);
  };

  const markMessageSeen = (id, seenAt) => {
    setMessages((prevMessages) => {
      return prevMessages.map((msg) =>
        msg.ticket_id === id ? { ...msg, seen_at: seenAt } : msg,
      );
    });
  };

  return {
    messages,
    lastMessage,
    loading,
    mediaFiles,
    getUserMessages,
    markMessageRead,
    updateMessage,
    markMessageSeen,
    setMessages,
  };
};
