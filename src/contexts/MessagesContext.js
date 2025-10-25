import React, { createContext, useEffect } from "react";
import { useMessages, useSocket, useUser } from "@hooks";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";

export const MessagesContext = createContext();

const ERROR_PREFIX = "❗️❗️❗️Mesajul nu poate fi trimis";

export const MessagesProvider = ({ children }) => {
  const messages = useMessages();
  const { sendedValue } = useSocket();
  const { userId } = useUser();

  const handleIncomingMessage = (message) => {
    const incoming = message.data;

    // Для звонков: всегда обновляем сообщение (независимо от sender_id)
    // Потому что звонок сначала приходит без записи, потом с URL записи
    const isCall = incoming.mtype === MEDIA_TYPE.CALL;
    
    // Для сообщений от других пользователей: добавляем/обновляем
    const isFromAnotherUser = Number(incoming.sender_id) !== Number(userId) && Number(incoming.sender_id) !== 1;
    
    // Для сообщений от системы (sender_id = 1): всегда добавляем
    const isFromSystem = Number(incoming.sender_id) === 1;
    
    // ВАЖНО: НЕ добавляем сообщения от текущего пользователя через сокет,
    // так как они уже добавлены при отправке через API
    const shouldUpdate = isCall || isFromAnotherUser || isFromSystem;
    
    if (shouldUpdate) {
      messages.updateMessage(incoming);
      return;
    }

    // Обработка ошибок для сообщений текущего пользователя
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

  // Слушаем события от AppContext для обновления сообщений
  useEffect(() => {
    const handleNewMessageFromSocket = (event) => {
      const messageData = event.detail;
      if (messageData) {
        handleIncomingMessage({ data: messageData });
      }
    };

    window.addEventListener('newMessageFromSocket', handleNewMessageFromSocket);
    
    return () => {
      window.removeEventListener('newMessageFromSocket', handleNewMessageFromSocket);
    };
  }, []);

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};

