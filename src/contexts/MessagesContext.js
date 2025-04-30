import React, { createContext, useEffect } from "react";
import { useMessages, useSocket, useUser } from "@hooks";
import { TYPE_SOCKET_EVENTS } from "@app-constants";

export const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const messages = useMessages();
  const { sendedValue } = useSocket();
  const { userId } = useUser();

  const updateMessageContext = (message) => {
    const senderId = message.data.sender_id;

    if (Number(senderId) !== userId) {
      messages.updateMessage(message.data);
    }
  };

  useEffect(() => {
    if (sendedValue?.type === TYPE_SOCKET_EVENTS.MESSAGE) {
      updateMessageContext(sendedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendedValue]);

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};
