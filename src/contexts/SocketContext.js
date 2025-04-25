import React, { createContext, useEffect, useRef, useState } from "react";
import { api } from "@api";
import { TYPE_SOCKET_EVENTS } from "@app-constants";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [val, setVal] = useState(null);

  useEffect(() => {
    socketRef.current = new WebSocket(process.env.REACT_APP_WS_URL);

    socketRef.current.onopen = async () => {
      console.log("Connected to WebSocket");
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      setVal(message);
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socketRef.current.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const getTicketFightIds = async () => {
      try {
        const ids = await api.tickets.filters({
          type: "light",
        });

        const socketMessage = JSON.stringify({
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: ids.data.map(({ id }) => id) },
        });

        socketRef.current.send(socketMessage);
      } catch (e) {}
    };

    const socketInstance = socketRef.current;

    if (socketInstance || socketInstance.readyState === WebSocket.OPEN) {
      getTicketFightIds();
    }
  }, []);

  const seenMessages = (ticketId, userId) => {
    const socketInstance = socketRef.current;
    if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
      const readMessageData = {
        type: TYPE_SOCKET_EVENTS.SEEN,
        data: {
          ticket_id: ticketId,
          sender_id: userId,
        },
      };
      socketInstance.send(JSON.stringify(readMessageData));
    }
  };

  const value = {
    socketRef,
    sendedValue: val,
    seenMessages,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
