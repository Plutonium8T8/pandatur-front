import { useMemo, useState } from "react";
import { Flex, Divider, Text, Box, Button } from "@mantine/core";
import { useMessagesContext } from "@hooks";
import { YYYY_MM_DD_HH_mm_ss, MEDIA_TYPE } from "@app-constants";
import { getLanguageByKey } from "@utils";
import dayjs from "dayjs";
import { SendedMessage, ReceivedMessage } from "../Message";
import { ChatNoteCard } from "../../../ChatNoteCard";
import { useLiveTicketLogs } from "../../../../hooks/useLiveTicketLogs";
import { useLiveTicketNotes } from "../../../../hooks/useLiveTicketNotes";
import BackTabs from "../BackTabs/BackTabs";
import LogCluster from "../LogCluster/LogCluster";
import "./GroupedMessages.css";


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


export const GroupedMessages = ({ personalInfo, ticketId, technicians, apiNotes = [] }) => {
  const { messages: rawMessages = [], logs: rawLogs = [] } = useMessagesContext();
  const { liveLogs = [] } = useLiveTicketLogs(ticketId);
  const { liveNotes = [] } = useLiveTicketNotes(ticketId);

  // ОПТИМИЗАЦИЯ: Количество показываемых email сообщений
  const [visibleEmailCount, setVisibleEmailCount] = useState(10);

  const technicianMap = useMemo(() => {
    const map = new Map();
    technicians?.forEach((t) => map.set(t.value, t));
    return map;
  }, [technicians]);

  const clientIds = useMemo(
    () => (personalInfo?.clients || []).map((c) => String(c.id)),
    [personalInfo]
  );

  // ОПТИМИЗАЦИЯ: Подсчет email сообщений и фильтрация
  const { emailMessages, nonEmailMessages, totalEmailCount } = useMemo(() => {
    const ticketMessages = rawMessages.filter((msg) => Number(msg.ticket_id) === Number(ticketId));
    
    const emails = [];
    const nonEmails = [];
    
    ticketMessages.forEach((msg) => {
      const messageType = msg.mtype || msg.media_type || msg.last_message_type;
      if (messageType === MEDIA_TYPE.EMAIL) {
        emails.push(msg);
      } else {
        nonEmails.push(msg);
      }
    });

    // Сортируем email по времени (от новых к старым)
    emails.sort((a, b) => {
      const timeA = toDate(a.time_sent)?.getTime() || 0;
      const timeB = toDate(b.time_sent)?.getTime() || 0;
      return timeB - timeA;
    });

    // Берем только последние N email
    const visibleEmails = emails.slice(0, visibleEmailCount);

    return {
      emailMessages: visibleEmails,
      nonEmailMessages: nonEmails,
      totalEmailCount: emails.length,
    };
  }, [rawMessages, ticketId, visibleEmailCount]);

  // Объединяем отфильтрованные email с остальными сообщениями
  const messages = useMemo(() => {
    const allMessages = [...emailMessages, ...nonEmailMessages].map((msg) => {
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
    
    // Логируем звонки для отладки
    const calls = allMessages.filter(m => m.mtype === MEDIA_TYPE.CALL);
    if (calls.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`📊 GroupedMessages: Всего звонков в списке: ${calls.length}`, 
        calls.map(c => ({
          id: c.message_id,
          status: c.call_metadata?.status,
          time: c.time_sent,
          hasRecording: !!c.message
        }))
      );
    }
    
    return allMessages;
  }, [emailMessages, nonEmailMessages]);

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

  // Количество скрытых email сообщений
  const hiddenEmailCount = totalEmailCount - visibleEmailCount;

  return (
    <Flex direction="column" gap="xl" h="100%">
      {/* Кнопка загрузить еще email (если есть скрытые) */}
      {hiddenEmailCount > 0 && (
        <Flex justify="center" pt="md">
          <Button
            variant="light"
            size="sm"
            onClick={() => setVisibleEmailCount(prev => prev + 10)}
          >
            {getLanguageByKey("Load more emails")} ({hiddenEmailCount})
          </Button>
        </Flex>
      )}

      {allDates.length ? (
        <Flex direction="column" gap="xs">
          {allDates.map((date) => {
            const dayItems = itemsByDate[date];
            const blocks = createDialogBlocks(dayItems);

            return (
              <Flex pb="xs" direction="column" gap="md" key={date}>
                <Divider
                  color="var(--crm-ui-kit-palette-border-default)"
                  label={
                    <Box
                      px="sm"
                      py={4}
                      style={{
                        backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)",
                        color: "var(--crm-ui-kit-palette-text-primary)",
                        fontWeight: 500,
                        fontSize: "14px",
                        borderRadius: "16px",
                        border: "1px solid var(--crm-ui-kit-palette-border-default)"
                      }}
                    >
                      {date}
                    </Box>
                  }
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
                        style={{
                          backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
                          borderRadius: "12px",
                          border: "1px solid var(--crm-ui-kit-palette-border-default)",
                          position: "relative",
                        }}
                      >
                        {/* Иллюзия открытых вкладок позади */}
                        <BackTabs />

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
                            
                            // Создаем уникальный ключ на основе message_id
                            // Для сообщений без message_id используем id или комбинацию полей
                            const messageKey = msg.message_id 
                              ? `msg-${msg.message_id}` 
                              : `${msg.id || 'temp'}-${msg.time_sent}`;
                            
                            return isClientMessage ? (
                              <ReceivedMessage
                                key={messageKey}
                                msg={msg}
                                personalInfo={personalInfo}
                                technicians={technicians}
                              />
                            ) : (
                              <SendedMessage
                                key={messageKey}
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
