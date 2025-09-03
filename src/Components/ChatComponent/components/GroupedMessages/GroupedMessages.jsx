import { useMemo, useState } from "react";
import { Flex, Badge, DEFAULT_THEME, Divider, Text, Button } from "@mantine/core";
import { useMessagesContext } from "@hooks";
import { DD_MM_YYYY, YYYY_MM_DD_HH_mm_ss } from "@app-constants";
import { parseServerDate, getFullName, getLanguageByKey, parseDate } from "@utils";
import dayjs from "dayjs";
import { SendedMessage, ReceivedMessage, MessagesLogItem } from "../Message";
import { socialMediaIcons } from "../../../utils";
import { ChatNoteCard } from "../../../ChatNoteCard";
import { useLiveTicketLogs } from "../../../../hooks/useLiveTicketLogs";
import { useLiveTicketNotes } from "../../../../hooks/useLiveTicketNotes";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;
const MAX_LOGS_COLLAPSED = 5;

const makeNoteKey = (n) =>
  `${n.ticket_id}|${n.technician_id}|${n.type}|${String(n.value ?? "").trim()}|${n.created_at}`;

const LogCluster = ({ logs = [], technicians }) => {
  const [expanded, setExpanded] = useState(false);

  const collapsedStart = Math.max(0, logs.length - MAX_LOGS_COLLAPSED);
  const lastFive = logs.slice(collapsedStart);
  const visible = expanded ? logs : lastFive;
  const hidden = expanded ? 0 : collapsedStart;

  return (
    <Flex direction="column" gap="xs">
      {visible.map((l, i) => {
        const logKey = String(l.id ?? `${l.timestamp}-${i}`);
        return (
          <MessagesLogItem
            key={`log-${logKey}`}
            log={l}
            technicians={technicians}
            isLive={l.isLive}
          />
        );
      })}

      {logs.length > MAX_LOGS_COLLAPSED && (
        <Flex justify="center" mt={4}>
          <Button
            size="xs"
            variant="light"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? getLanguageByKey("Collapse")
              : `${getLanguageByKey("ShowMore")} ${hidden}`}
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export const GroupedMessages = ({ personalInfo, ticketId, technicians, apiNotes = [] }) => {
  const { messages: rawMessages = [], logs: rawLogs = [] } = useMessagesContext();
  const { liveLogs = [] } = useLiveTicketLogs(ticketId);
  const { liveNotes = [] } = useLiveTicketNotes(ticketId);

  const technicianMap = useMemo(() => {
    const map = new Map();
    technicians?.forEach((t) => map.set(t.value, t));
    return map;
  }, [technicians]);

  const clientIds = useMemo(
    () => (personalInfo?.clients || []).map((c) => String(c.id)),
    [personalInfo]
  );

  const messages = rawMessages
    .filter((msg) => Number(msg.ticket_id) === Number(ticketId))
    .map((msg) => ({
      ...msg,
      itemType: "message",
      sortTime: parseDate(msg.time_sent).valueOf(),
      dateDivider: parseServerDate(msg.time_sent).format(DD_MM_YYYY),
      clientId: Array.isArray(msg.client_id) ? msg.client_id[0] : msg.client_id,
      platform: msg.platform?.toLowerCase?.() || "",
    }));

  const mergedLogs = useMemo(() => {
    const map = new Map();

    rawLogs
      .filter((l) => Number(l.ticket_id) === Number(ticketId))
      .forEach((l) => {
        const key = l.id ?? `${l.timestamp}-${l.subject}`;
        map.set(key, { ...l, __live: false });
      });

    (liveLogs || []).forEach((l) => {
      if (Number(l.ticket_id) !== Number(ticketId)) return;
      const key = l.id ?? `${l.timestamp}-${l.subject}`;
      map.set(key, { ...l, __live: true });
    });

    return Array.from(map.values()).map((log) => ({
      ...log,
      itemType: "log",
      sortTime: parseServerDate(log.timestamp).valueOf(),
      dateDivider: parseServerDate(log.timestamp).format(DD_MM_YYYY),
      isLive: !!log.__live,
    }));
  }, [rawLogs, liveLogs, ticketId]);

  const mergedNotes = useMemo(() => {
    const map = new Map();

    (apiNotes || [])
      .filter((n) => Number(n.ticket_id) === Number(ticketId))
      .forEach((n) => {
        const key = makeNoteKey({
          ticket_id: n.ticket_id,
          technician_id: n.technician_id,
          type: n.type,
          value: n.value,
          created_at: n.created_at,
        });
        map.set(key, { ...n, __live: false });
      });

    (liveNotes || []).forEach((n) => {
      if (Number(n.ticket_id) !== Number(ticketId)) return;
      const key = makeNoteKey(n);
      map.set(key, { ...n, __live: true });
    });

    return Array.from(map.values()).map((n) => {
      let ts = dayjs(n.created_at, YYYY_MM_DD_HH_mm_ss, true);
      if (!ts.isValid()) ts = dayjs(n.created_at);
      if (!ts.isValid()) ts = dayjs();

      return {
        ...n,
        itemType: "note",
        sortTime: ts.valueOf(),
        dateDivider: ts.format(DD_MM_YYYY),
        timeCreatedDisplay: ts.format(YYYY_MM_DD_HH_mm_ss),
        isLive: !!n.__live,
      };
    });
  }, [apiNotes, liveNotes, ticketId]);

  const allItems = useMemo(
    () => [...messages, ...mergedLogs, ...mergedNotes].sort((a, b) => a.sortTime - b.sortTime),
    [messages, mergedLogs, mergedNotes]
  );

  const itemsByDate = useMemo(() => {
    const map = {};
    allItems.forEach((item) => {
      if (!map[item.dateDivider]) map[item.dateDivider] = [];
      map[item.dateDivider].push(item);
    });
    return map;
  }, [allItems]);

  const allDates = useMemo(
    () => Object.keys(itemsByDate).sort((a, b) => parseDate(a) - parseDate(b)),
    [itemsByDate]
  );

  return (
    <Flex direction="column" gap="xl" h="100%">
      {allDates.length ? (
        <Flex direction="column" gap="xs">
          {allDates.map((date) => {
            const dayItems = itemsByDate[date];

            const blocks = [];
            let currentMsgBlock = null;
            let currentLogCluster = null;

            const flushMsgBlock = () => {
              if (currentMsgBlock) {
                blocks.push(currentMsgBlock);
                currentMsgBlock = null;
              }
            };
            const flushLogCluster = () => {
              if (currentLogCluster) {
                blocks.push({ logs: currentLogCluster });
                currentLogCluster = null;
              }
            };

            dayItems.forEach((item) => {
              if (item.itemType === "message") {
                flushLogCluster();
                const currentClientId = item.clientId?.toString();
                const currentPlatform = item.platform || "";
                const needNew =
                  !currentMsgBlock ||
                  String(currentMsgBlock.clientId) !== String(currentClientId) ||
                  currentMsgBlock.platform !== currentPlatform;

                if (needNew) {
                  flushMsgBlock();
                  currentMsgBlock = {
                    clientId: Number(currentClientId),
                    platform: currentPlatform,
                    items: [item],
                  };
                } else {
                  currentMsgBlock.items.push(item);
                }
              } else if (item.itemType === "log") {
                flushMsgBlock();
                if (!currentLogCluster) currentLogCluster = [];
                currentLogCluster.push(item);
              } else if (item.itemType === "note") {
                flushMsgBlock();
                flushLogCluster();
                blocks.push({ note: item });
              }
            });

            flushMsgBlock();
            flushLogCluster();

            return (
              <Flex pb="xs" direction="column" gap="md" key={date}>
                <Divider
                  label={<Badge c="black" size="lg" bg={colors.gray[2]}>{date}</Badge>}
                  labelPosition="center"
                />

                {blocks.map((block, i) => {
                  if (block.logs) {
                    return (
                      <LogCluster
                        key={`log-cluster-${date}-${i}`}
                        logs={block.logs}
                        technicians={technicians}
                      />
                    );
                  }

                  if (block.note) {
                    const n = block.note;
                    const tech =
                      technicians?.find?.((t) => Number(t.value) === Number(n.technician_id)) ||
                      { label: `#${n.technician_id}` };

                    return (
                      <ChatNoteCard
                        key={`note-${makeNoteKey(n)}-${i}`}
                        note={n}
                        techLabel={tech.label}
                      />
                    );
                  }

                  const clientInfo = personalInfo?.clients?.find((c) => c.id === block.clientId) || {};
                  const clientName = getFullName(clientInfo.name, clientInfo.surname) || `#${block.clientId}`;
                  const platform = block.platform;
                  const platformIcon = socialMediaIcons[platform] || null;
                  const platformLabel = platform ? platform[0].toUpperCase() + platform.slice(1) : "";

                  return (
                    <Flex direction="column" gap="xs" key={`msgs-${date}-${block.clientId}-${platform}-${i}`}>
                      <Flex justify="center" align="center" gap={6}>
                        <Badge c="black" size="lg" bg={colors.gray[2]} px={12}>
                          {getLanguageByKey("Mesajele clientului")}: {clientName}
                          {platformIcon ? (
                            <span style={{ marginLeft: 8, verticalAlign: "middle" }}>{platformIcon}</span>
                          ) : platformLabel ? (
                            <span style={{ marginLeft: 8, color: "#777" }}>{platformLabel}</span>
                          ) : null}
                        </Badge>
                      </Flex>

                      {block.items.map((msg, idx) => {
                        const senderIdStr = String(msg.sender_id);
                        const msgClientIds = Array.isArray(msg.client_id)
                          ? msg.client_id.map(String)
                          : [String(msg.client_id)];
                        const isClientMessage = msgClientIds.includes(senderIdStr) || clientIds.includes(senderIdStr);

                        const technician = technicianMap.get(Number(msg.sender_id));
                        return isClientMessage ? (
                          <ReceivedMessage
                            key={`${msg.id}-${idx}`}
                            msg={msg}
                            personalInfo={personalInfo}
                            technicians={technicians}
                          />
                        ) : (
                          <SendedMessage
                            key={`${msg.id}-${idx}`}
                            msg={msg}
                            technician={technician}
                            technicians={technicians}
                          />
                        );
                      })}
                    </Flex>
                  );
                })}
              </Flex>
            );
          })}
        </Flex>
      ) : (
        <Flex h="100%" align="center" justify="center">
          <Text c="dimmed">{getLanguageByKey("noConversationStartedForThisLead")}</Text>
        </Flex>
      )}
    </Flex>
  );
};
