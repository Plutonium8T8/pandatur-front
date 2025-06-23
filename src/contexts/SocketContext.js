import React, { createContext, useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { getLanguageByKey } from "@utils";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const socketRef = useRef(null);
  const [val, setVal] = useState(null);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      socket = new WebSocket(process.env.REACT_APP_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[SOCKET] Соединение установлено");
        enqueueSnackbar(getLanguageByKey("socketConnectionEstablished"), {
          variant: "success",
        });
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setVal(message);
        } catch (err) {
          console.error("[SOCKET] Ошибка при парсинге сообщения:", event.data);
        }
      };

      socket.onerror = () => {
        enqueueSnackbar(getLanguageByKey("unexpectedSocketErrorDetected"), {
          variant: "info",
        });
      };

      socket.onclose = () => {
        reconnectTimer = setTimeout(connect, 10000);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimer);
    };
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
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
