import React, { useContext, useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Group, Stack, Text, Tooltip, Flex } from "@mantine/core";
import { SocketContext } from "../contexts/SocketContext";
import { useGetTechniciansList } from "@hooks";
import { getLanguageByKey } from "@utils";

// серверные события
const SERVER = {
    INIT: "ticket_clients",          // { ticket_id, clients: number[], action: 'initial_list' }
    JOINED: "ticket_client_joined",  // { ticket_id, client_id, total_clients }
    LEFT: "ticket_client_left",      // { ticket_id, client_id, total_clients }
    ERROR: "error",
};

// ===== ХУК ПРИСУТСТВИЯ =====
export const useTicketPresence = (ticketId, clientId) => {
    const { sendedValue, joinTicketRoom, leaveTicketRoom, onOpenSubscribe, socketRef } = useContext(SocketContext);
    const [connected, setConnected] = useState(false);
    const [presence, setPresence] = useState({ ticketId: null, clients: [], total: 0 });

    // индикатор online/offline
    useEffect(() => {
        const ws = socketRef.current;
        if (!ws) {
            setConnected(false);
            return;
        }
        setConnected(ws.readyState === WebSocket.OPEN);

        const handleOpen = () => setConnected(true);
        const handleClose = () => setConnected(false);

        ws.addEventListener?.("open", handleOpen);
        ws.addEventListener?.("close", handleClose);

        return () => {
            ws?.removeEventListener?.("open", handleOpen);
            ws?.removeEventListener?.("close", handleClose);
        };
    }, [socketRef]);

    // join/leave комнаты
    useEffect(() => {
        if (!ticketId || !clientId) return;
        joinTicketRoom(ticketId, clientId);
        return () => leaveTicketRoom(ticketId, clientId);
    }, [ticketId, clientId, joinTicketRoom, leaveTicketRoom]);

    // re-join после реконнекта
    useEffect(() => {
        if (!ticketId || !clientId) return;
        const unsub = onOpenSubscribe(() => joinTicketRoom(ticketId, clientId));
        return () => unsub && unsub();
    }, [ticketId, clientId, onOpenSubscribe, joinTicketRoom]);

    // входящие события сервера
    useEffect(() => {
        const msg = sendedValue;
        if (!msg || !msg.type) return;
        const { type, data } = msg;

        if (!data || String(data.ticket_id) !== String(ticketId)) return;

        switch (type) {
            case SERVER.INIT: {
                const existing = Array.isArray(data.clients) ? data.clients.map(Number) : [];
                const set = new Set(existing);
                if (clientId != null) set.add(Number(clientId)); // сервер шлёт список без нас — добавим локально
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
            default:
                break;
        }
    }, [sendedValue, ticketId, clientId]);

    return { connected, clients: presence.clients, total: presence.total };
};

// ===== UI =====
const getInitials = (name, surname) => {
    const n = (name || "").trim();
    const s = (surname || "").trim();
    const a = (n ? n[0] : "") + (s ? s[0] : "");
    return a || "U";
};

const SYSTEM_ID = 1; // показываем "System" при id=1

export const TicketParticipants = ({ ticketId, currentUserId }) => {
    const { technicians, loading: loadingTechs } = useGetTechniciansList(); // [{value,label,name,surname}, ...]
    const { connected, clients, total } = useTicketPresence(ticketId, currentUserId);

    const techMap = useMemo(() => {
        const map = new Map();
        (technicians || []).forEach((t) => map.set(Number(t.value), t));
        return map;
    }, [technicians]);

    const items = useMemo(() => {
        return clients.map((id) => {
            if (Number(id) === SYSTEM_ID) return { id, label: "System", name: "System", surname: "", you: false };
            const t = techMap.get(Number(id));
            const you = String(id) === String(currentUserId);
            return { id, label: t?.label || `User ${id}`, name: t?.name, surname: t?.surname, you };
        });
    }, [clients, techMap, currentUserId]);

    return (
        <Stack gap={6}>
            <Group justify="space-between" align="center">
                <Group gap={8}>
                    <Text fw={600}>{getLanguageByKey("Участники тикета")}</Text>
                    <Badge variant="light">{total}</Badge>
                </Group>
                <Badge color={connected ? "green" : "red"} variant="light">
                    {connected ? getLanguageByKey("online") : getLanguageByKey("offline")}
                </Badge>
            </Group>

            <Flex wrap="wrap" gap={8}>
                {items.map((u) => {
                    const initials = getInitials(u.name, u.surname);
                    const title = u.you ? `${u.label} • ${getLanguageByKey("Вы")}` : u.label;
                    return (
                        <Tooltip key={u.id} label={title} withArrow>
                            <Avatar radius="xl">{initials}</Avatar>
                        </Tooltip>
                    );
                })}
                {!loadingTechs && items.length === 0 && (
                    <Text size="sm" c="dimmed">
                        {getLanguageByKey("Никого нет в тикете")}
                    </Text>
                )}
            </Flex>
        </Stack>
    );
};
