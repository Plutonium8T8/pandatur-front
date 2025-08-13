// SocketProvider.jsx
import React, { createContext, useEffect, useRef, useState, useCallback } from "react";
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

  const onOpenCallbacksRef = useRef(new Set());

  const onOpenSubscribe = useCallback((cb) => {
    const set = onOpenCallbacksRef.current;
    set.add(cb);
    return () => set.delete(cb);
  }, []);

  const safeSend = useCallback((payload) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sendJSON = useCallback((type, data) => safeSend({ type, data }), [safeSend]);

  const joinTicketRoom = useCallback((ticketId, clientId) => {
    if (!ticketId || !clientId) return;
    sendJSON(TYPE_SOCKET_EVENTS.TICKET_JOIN, { ticket_id: ticketId, client_id: clientId });
  }, [sendJSON]);

  const leaveTicketRoom = useCallback((ticketId, clientId) => {
    if (!ticketId || !clientId) return;
    sendJSON(TYPE_SOCKET_EVENTS.TICKET_LEAVE, { ticket_id: ticketId, client_id: clientId });
  }, [sendJSON]);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) return;
      socket = new WebSocket(process.env.REACT_APP_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        enqueueSnackbar(getLanguageByKey("socketConnectionEstablished"), { variant: "success" });
        onOpenCallbacksRef.current.forEach((cb) => { try { cb(); } catch { } });
      };

      socket.onmessage = (event) => {
        try { setVal(JSON.parse(event.data)); } catch { }
      };

      socket.onerror = () => {
        enqueueSnackbar(getLanguageByKey("unexpectedSocketErrorDetected"), { variant: "info" });
      };

      socket.onclose = () => {
        reconnectAttempts.current += 1;
        reconnectTimer = setTimeout(connect, reconnectDelay);
      };
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimer);
    };
  }, [enqueueSnackbar]);

  const seenMessages = useCallback((ticketId, userId) => {
    if (!ticketId || !userId) return;
    sendJSON(TYPE_SOCKET_EVENTS.SEEN, { ticket_id: ticketId, sender_id: userId });
  }, [sendJSON]);

  return (
    <SocketContext.Provider
      value={{
        socketRef,
        sendedValue: val,
        sendJSON,
        joinTicketRoom,
        leaveTicketRoom,
        onOpenSubscribe,
        seenMessages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
