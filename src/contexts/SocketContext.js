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

  const listenersRef = useRef({});

  const onOpenSubscribe = useCallback((cb) => {
    const set = onOpenCallbacksRef.current;
    set.add(cb);
    return () => set.delete(cb);
  }, []);

  const onEvent = useCallback((type, cb) => {
    if (!type || typeof cb !== "function") return () => { };
    const map = listenersRef.current;
    if (!map[type]) map[type] = new Set();
    map[type].add(cb);
    return () => {
      map[type]?.delete(cb);
    };
  }, []);

  const offEvent = useCallback((type, cb) => {
    listenersRef.current[type]?.delete(cb);
  }, []);

  const emit = useCallback((type, data) => {
    const set = listenersRef.current[type];
    if (!set || set.size === 0) return;
    set.forEach((cb) => {
      try { cb(data); } catch { /* игнор */ }
    });
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

  const seenMessages = useCallback((ticketId, userId) => {
    if (!ticketId || !userId) return;
    sendJSON(TYPE_SOCKET_EVENTS.SEEN, { ticket_id: ticketId, sender_id: userId });
  }, [sendJSON]);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        enqueueSnackbar(getLanguageByKey("socketMaxReconnectReached"), { variant: "warning" });
        return;
      }

      try {
        socket = new WebSocket(process.env.REACT_APP_WS_URL);
      } catch {
        reconnectAttempts.current += 1;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        enqueueSnackbar(getLanguageByKey("socketConnectionEstablished"), { variant: "success" });
        onOpenCallbacksRef.current.forEach((cb) => { try { cb(); } catch { } });
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setVal(parsed);
          if (parsed?.type) emit(parsed.type, parsed);
        } catch {
        }
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
      try { socket && socket.close(); } catch { }
      clearTimeout(reconnectTimer);
    };
  }, [enqueueSnackbar, emit]);

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
        onEvent,
        offEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
