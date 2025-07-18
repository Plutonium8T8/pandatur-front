import React, { createContext, useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { getLanguageByKey } from "@utils";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const socketRef = useRef(null);
  const [val, setVal] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectDelay = 10000;

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.warn("[SOCKET] Превышено максимальное число попыток подключения");
        return;
      }

      socket = new WebSocket(process.env.REACT_APP_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[SOCKET] Соединение установлено");
        reconnectAttempts.current = 0;
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
        reconnectAttempts.current += 1;
        console.warn(`[SOCKET] Попытка реконнекта #${reconnectAttempts.current}`);
        reconnectTimer = setTimeout(connect, reconnectDelay);
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

    console.log("[SEEN] Попытка отправки seen-сообщения", {
      socketExists: !!socketInstance,
      readyState: socketInstance?.readyState,
      ticketId,
      userId,
    });

    if (!socketInstance) {
      console.warn("[SEEN] socketInstance не существует");
      return;
    }

    if (socketInstance.readyState !== WebSocket.OPEN) {
      console.warn("[SEEN] Сокет не в состоянии OPEN:", socketInstance.readyState);
      return;
    }

    if (!ticketId || !userId) {
      console.warn("[SEEN] ticketId или userId отсутствует", { ticketId, userId });
      return;
    }

    const readMessageData = {
      type: TYPE_SOCKET_EVENTS.SEEN,
      data: {
        ticket_id: ticketId,
        sender_id: userId,
      },
    };

    const payload = JSON.stringify(readMessageData);

    try {
      socketInstance.send(payload);
      console.log("[SEEN] Сообщение отправлено в сокет:", payload);
    } catch (err) {
      console.error("[SEEN] Ошибка при отправке сообщения в сокет:", err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socketRef,
        sendedValue: val,
        seenMessages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
