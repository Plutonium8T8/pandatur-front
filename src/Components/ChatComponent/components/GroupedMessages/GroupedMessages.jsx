import { useMemo, useState } from "react";
import { Flex, Badge, DEFAULT_THEME, Divider, Text, Button, Box } from "@mantine/core";
import { useMessagesContext } from "@hooks";
import { YYYY_MM_DD_HH_mm_ss } from "@app-constants";
import { getLanguageByKey } from "@utils";
import dayjs from "dayjs";
import { SendedMessage, ReceivedMessage, MessagesLogItem } from "../Message";
import { ChatNoteCard } from "../../../ChatNoteCard";
import { useLiveTicketLogs } from "../../../../hooks/useLiveTicketLogs";
import { useLiveTicketNotes } from "../../../../hooks/useLiveTicketNotes";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;
const MAX_LOGS_COLLAPSED = 5;

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(val).trim().replace(" ", "T").replace(/Z$/, "");
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

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
          <Button size="xs" variant="light" onClick={() => setExpanded((v) => !v)}>
            {expanded ? getLanguageByKey("Collapse") : `${getLanguageByKey("ShowMore")} ${hidden}`}
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

  // сообщения
  const messages = rawMessages
    .filter((msg) => Number(msg.ticket_id) === Number(ticketId))
    .map((msg) => {
      const d = toDate(msg.time_sent) || new Date(0);
      const dj = dayjs(d);
      return {
        ...msg,
        itemType: "message",
        sortTime: dj.valueOf(),
        dateDivider: dj.format("DD.MM.YYYY"),
        clientId: Array.isArray(msg.client_id) ? msg.client_id[0] : msg.client_id,
        platform: msg.platform?.toLowerCase?.() || "",
      };
    });

  // логи (мердж статики и live)
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

    return Array.from(map.values()).map((log) => {
      const d = toDate(log.timestamp) || new Date();
      const dj = dayjs(d);
      return {
        ...log,
        itemType: "log",
        sortTime: dj.valueOf(),
        dateDivider: dj.format("DD.MM.YYYY"),
        isLive: !!log.__live,
      };
    });
  }, [rawLogs, liveLogs, ticketId]);

  // заметки (мердж статики и live)
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
      const d = toDate(n.created_at) || new Date();
      const dj = dayjs(d);
      return {
        ...n,
        itemType: "note",
        sortTime: dj.valueOf(),
        dateDivider: dj.format("DD.MM.YYYY"),
        timeCreatedDisplay: dj.format(YYYY_MM_DD_HH_mm_ss),
        isLive: !!n.__live,
      };
    });
  }, [apiNotes, liveNotes, ticketId]);

  // общий список и сортировка
  const allItems = useMemo(
    () => [...messages, ...mergedLogs, ...mergedNotes].sort((a, b) => a.sortTime - b.sortTime),
    [messages, mergedLogs, mergedNotes]
  );

  // группировка по dateDivider
  const itemsByDate = useMemo(() => {
    const map = {};
    allItems.forEach((item) => {
      if (!map[item.dateDivider]) map[item.dateDivider] = [];
      map[item.dateDivider].push(item);
    });
    return map;
  }, [allItems]);

  // отсортированный список дат
  const allDates = useMemo(() => {
    return Object.keys(itemsByDate).sort(
      (a, b) => dayjs(a, "DD.MM.YYYY", true).valueOf() - dayjs(b, "DD.MM.YYYY", true).valueOf()
    );
  }, [itemsByDate]);

  // Функция для создания диалоговых блоков
  const createDialogBlocks = (dayItems) => {
    const blocks = [];
    let currentDialogBlock = null;
    let currentLogCluster = null;

    const flushDialogBlock = () => {
      if (currentDialogBlock) {
        blocks.push(currentDialogBlock);
        currentDialogBlock = null;
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
        // Прерываем лог-кластер при появлении сообщения
        flushLogCluster();

        // Определяем, нужно ли создать новый диалоговый блок
        const needNewDialog = !currentDialogBlock;

        if (needNewDialog) {
          flushDialogBlock();
          currentDialogBlock = {
            type: "dialog",
            items: [item],
            startTime: item.sortTime,
          };
        } else {
          // Добавляем сообщение в текущий диалоговый блок
          currentDialogBlock.items.push(item);
        }
      } else if (item.itemType === "log") {
        // Прерываем диалоговый блок при появлении лога
        flushDialogBlock();
        if (!currentLogCluster) currentLogCluster = [];
        currentLogCluster.push(item);
      } else if (item.itemType === "note") {
        // Прерываем диалоговый блок и лог-кластер при появлении заметки
        flushDialogBlock();
        flushLogCluster();
        blocks.push({ note: item });
      }
    });

    // Завершаем последние блоки
    flushDialogBlock();
    flushLogCluster();

    return blocks;
  };

  return (
    <Flex direction="column" gap="xl" h="100%">
      {allDates.length ? (
        <Flex direction="column" gap="xs">
          {allDates.map((date) => {
            const dayItems = itemsByDate[date];
            const blocks = createDialogBlocks(dayItems);

            return (
              <Flex pb="xs" direction="column" gap="md" key={date}>
                <Divider
                  label={<Badge c="black" size="lg" bg={colors.gray[2]}>{date}</Badge>}
                  labelPosition="center"
                />

                {blocks.map((block, i) => {
                  // Системные логи
                  if (block.logs) {
                    return (
                      <LogCluster
                        key={`log-cluster-${date}-${i}`}
                        logs={block.logs}
                        technicians={technicians}
                      />
                    );
                  }

                  // Системные заметки
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

                  // Диалоговый блок
                  if (block.type === "dialog") {

                    return (
                      <Box
                        key={`dialog-${date}-${i}`}
                        p="md"
                        mb="md"
                        style={{
                          backgroundColor: "#e9ecef",
                          borderRadius: "12px",
                          border: "1px solid #dee2e6",
                        }}
                      >

                        {/* Сообщения в диалоговом блоке */}
                        <Flex direction="column" gap="xs">
                          {block.items.map((msg, idx) => {
                            const senderIdStr = String(msg.sender_id);
                            const msgClientIds = Array.isArray(msg.client_id)
                              ? msg.client_id.map(String)
                              : [String(msg.client_id)];
                            const isClientMessage =
                              msgClientIds.includes(senderIdStr) || clientIds.includes(senderIdStr);

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
                      </Box>
                    );
                  }

                  return null;
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
