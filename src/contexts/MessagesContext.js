import React, { createContext, useEffect } from "react";
import { useMessages, useSocket, useUser } from "@hooks";
import { TYPE_SOCKET_EVENTS } from "@app-constants";

export const MessagesContext = createContext();

const ERROR_PREFIX = "❗️❗️❗️Mesajul nu poate fi trimis";

export const MessagesProvider = ({ children }) => {
  const messages = useMessages();
  const { sendedValue } = useSocket();
  const { userId } = useUser();

  const handleIncomingMessage = (message) => {
    const incoming = message.data;

    if (Number(incoming.sender_id) !== Number(userId) && Number(incoming.sender_id) !== 1) {
      messages.updateMessage(incoming);
      return;
    }

    if (!incoming.message?.startsWith(ERROR_PREFIX)) return;

    messages.setMessages((prev) => {
      const index = prev.findIndex((m) => {
        const isPending = m.messageStatus === "PENDING";
        const sameSender = Number(m.sender_id) === Number(incoming.sender_id);
        const sameTicket = Number(m.ticket_id) === Number(incoming.ticket_id);
        const originalText = m.message?.trim();
        const fullText = incoming.message?.trim();
        const errorIncludesOriginal = fullText.includes(originalText);
        return isPending && sameSender && sameTicket && errorIncludesOriginal;
      });

      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...incoming,
          messageStatus: "ERROR",
          id: prev[index].id || Math.random().toString(),
        };
        return updated;
      }

      return prev;
    });
  };

  useEffect(() => {
    if (sendedValue?.type === TYPE_SOCKET_EVENTS.MESSAGE) {
      handleIncomingMessage(sendedValue);
    }
  }, [sendedValue]);

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};

