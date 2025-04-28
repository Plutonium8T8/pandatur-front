import React, { createContext, useEffect } from "react";
import { useMessages, useSocket, useUser } from "@hooks";
import { TYPE_SOCKET_EVENTS } from "@app-constants";

export const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const messages = useMessages();
  const { sendedValue } = useSocket();
  const { userId } = useUser();

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        console.log("New message from WebSocket:", message.data);

        const senderId = message.data.sender_id;

        if (Number(senderId) !== userId) {
          messages.updateMessage(message.data);
        }

        break;
      }

      default:
        console.warn("Invalid message_type from socket:", message.type);
    }
  };

  useEffect(() => {
    if (sendedValue) {
      handleWebSocketMessage(sendedValue);
    }
  }, [sendedValue]);

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};
