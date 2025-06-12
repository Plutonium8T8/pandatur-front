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
      console.log("[SOCKET] Подключение к WebSocket...");
      socket = new WebSocket(process.env.REACT_APP_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[SOCKET] Установлено соединение с WebSocket");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[SOCKET] Получено сообщение:", message);
          setVal(message);
        } catch (err) {
          console.error("[SOCKET] Ошибка при парсинге сообщения:", event.data);
        }
      };

      socket.onerror = (error) => {
        enqueueSnackbar(getLanguageByKey("unexpectedSocketErrorDetected"), {
          variant: "error",
        });
        console.error("[SOCKET] Ошибка WebSocket:", error);
      };

      socket.onclose = (event) => {
        console.warn("[SOCKET] Соединение закрыто. Попытка реконнекта через 1с...", event.reason);
        reconnectTimer = setTimeout(connect, 1000);
      };
    };

    connect();

    return () => {
      if (socket) {
        console.log("[SOCKET] Отключение от WebSocket");
        socket.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, []);

  const seenMessages = (ticketId, userId) => {
    const socketInstance = socketRef.current;

    console.log("[SOCKET] Попытка отправить SEEN:");
    console.log(" - ticketId:", ticketId);
    console.log(" - userId:", userId);
    console.log(" - socket.readyState:", socketInstance?.readyState);

    if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
      const readMessageData = {
        type: TYPE_SOCKET_EVENTS.SEEN,
        data: {
          ticket_id: ticketId,
          sender_id: userId,
        },
      };

      console.log("[SOCKET] Отправка SEEN сообщения:", readMessageData);
      socketInstance.send(JSON.stringify(readMessageData));
    } else {
      console.warn("[SOCKET] WebSocket не готов (не OPEN), SEEN не отправлен");
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
