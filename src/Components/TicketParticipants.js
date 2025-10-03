import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Badge, Group, Text, Popover, ScrollArea } from "@mantine/core";
import { SocketContext } from "../contexts/SocketContext";
import { useGetTechniciansList } from "@hooks";
import { getLanguageByKey } from "@utils";

const SERVER = {
    INIT: "ticket_clients",
    JOINED: "ticket_client_joined",
    LEFT: "ticket_client_left",
    ERROR: "error",
};

export const useTicketPresence = (ticketId, clientId) => {
    const { sendedValue, joinTicketRoom, leaveTicketRoom, onOpenSubscribe, socketRef } = useContext(SocketContext);
    const [connected, setConnected] = useState(false);
    const [presence, setPresence] = useState({ ticketId: null, clients: [], total: 0 });
    const joinedRef = useRef({ ticketId: null, clientId: null });

    useEffect(() => {
        const ws = socketRef.current;
        if (!ws) { setConnected(false); return; }
        setConnected(ws.readyState === WebSocket.OPEN);
        const onOpen = () => setConnected(true);
        const onClose = () => setConnected(false);
        ws.addEventListener?.("open", onOpen);
        ws.addEventListener?.("close", onClose);
        return () => {
            ws?.removeEventListener?.("open", onOpen);
            ws?.removeEventListener?.("close", onClose);
        };
    }, [socketRef]);

    useEffect(() => {
        if (!ticketId || !clientId) return;

        const prev = joinedRef.current;
        const sameTicket = String(prev.ticketId) === String(ticketId);
        const sameClient = String(prev.clientId) === String(clientId);

        if (!sameTicket || !sameClient) {
            if (prev.ticketId && prev.clientId && !sameTicket) {
                leaveTicketRoom(prev.ticketId, prev.clientId);
            }
            joinTicketRoom(ticketId, clientId);
            joinedRef.current = { ticketId, clientId };
        }

        return () => {
            const cur = joinedRef.current;
            if (cur.ticketId && cur.clientId) {
                leaveTicketRoom(cur.ticketId, cur.clientId);
                joinedRef.current = { ticketId: null, clientId: null };
            }
        };
    }, [ticketId, clientId, joinTicketRoom, leaveTicketRoom]);

    useEffect(() => {
        if (!ticketId || !clientId) return;
        const unsub = onOpenSubscribe(() => {
            const cur = joinedRef.current;
            if (String(cur.ticketId) === String(ticketId) && String(cur.clientId) === String(clientId)) {
                joinTicketRoom(ticketId, clientId);
            }
        });
        return () => unsub && unsub();
    }, [ticketId, clientId, onOpenSubscribe, joinTicketRoom]);

    useEffect(() => {
        const msg = sendedValue;
        if (!msg || !msg.type) return;
        const { type, data } = msg;
        if (!data || String(data.ticket_id) !== String(ticketId)) return;

        switch (type) {
            case SERVER.INIT: {
                const existing = Array.isArray(data.clients) ? data.clients.map(Number) : [];
                const set = new Set(existing);
                if (clientId != null) set.add(Number(clientId));
                const clients = Array.from(set);
                setPresence({ ticketId: data.ticket_id, clients, total: clients.length });
                break;
            }
            case SERVER.JOINED: {
                setPresence((prev) => {
                    const set = new Set(prev.clients);
                    if (data && data.client_id != null) set.add(Number(data.client_id));
                    const clients = Array.from(set);
                    return { ticketId: data.ticket_id, clients, total: data?.total_clients ?? clients.length };
                });
                break;
            }
            case SERVER.LEFT: {
                setPresence((prev) => {
                    const id = Number(data?.client_id);
                    const clients = prev.clients.filter((x) => x !== id);
                    return { ticketId: data.ticket_id, clients, total: data?.total_clients ?? clients.length };
                });
                break;
            }
            default: break;
        }
    }, [sendedValue, ticketId, clientId]);

    return { connected, clients: presence.clients, total: presence.total };
};

const SYSTEM_ID = 1;
const MAX_INLINE_NAMES = 4;

export const TicketParticipants = ({ ticketId, currentUserId }) => {
    const { technicians } = useGetTechniciansList();
    const { clients, total } = useTicketPresence(ticketId, currentUserId);

    const techMap = useMemo(() => {
        const map = new Map();
        (technicians || []).forEach((t) => map.set(Number(t.value), t));
        return map;
    }, [technicians]);

    const fullNames = useMemo(() => {
        return clients.map((id) => {
            if (Number(id) === SYSTEM_ID) return "System";
            const t = techMap.get(Number(id));
            const base = t?.label || [t?.name, t?.surname].filter(Boolean).join(" ") || `User ${id}`;
            return String(id) === String(currentUserId) ? `${base}` : base;
        });
    }, [clients, techMap, currentUserId]);

    const inline = fullNames.slice(0, MAX_INLINE_NAMES);
    const rest = fullNames.slice(MAX_INLINE_NAMES);
    const hasMore = rest.length > 0;

    return (
        <Group align="center" gap="8" wrap="nowrap" style={{ width: "100%" }}>
            <Badge size="lg" variant="light">{total}</Badge>

            <Text size="sm" c="black" style={{ whiteSpace: "nowrap" }}>
                {getLanguageByKey("inTicket")}:
            </Text>

            {fullNames.length > 0 ? (
                <Text
                    size="sm"
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                        minWidth: 0,
                    }}
                    title={inline.join(", ")}
                >
                    {inline.join(", ")}
                    {hasMore && "…"}
                </Text>
            ) : (
                <Text size="sm" c="dimmed">
                    {getLanguageByKey("noParticipantsInTicket")}
                </Text>
            )}

            {hasMore && (
                <Popover width={320} position="bottom-end" withArrow>
                    <Popover.Target>
                        <Text
                            size="sm"
                            c="blue"
                            style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                            aria-label={getLanguageByKey("showAllParticipants")}
                        >
                            {getLanguageByKey("andMore")} {rest.length}
                        </Text>
                    </Popover.Target>
                    <Popover.Dropdown>
                        <ScrollArea.Autosize mah={220} type="auto">
                            <Text size="sm">{rest.join(", ")}</Text>
                        </ScrollArea.Autosize>
                    </Popover.Dropdown>
                </Popover>
            )}
        </Group>
    );
};
