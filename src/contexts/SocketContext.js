import React, { createContext, useEffect, useRef, useState } from "react";
import { api } from "@api";

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
          type: "connect",
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

  const value = {
    socketRef,
    sendedValue: val,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
