import { useMemo } from "react";
import { Flex, Badge, DEFAULT_THEME, Divider, Text, Paper } from "@mantine/core";
import { useMessagesContext } from "@hooks";
import { DD_MM_YYYY, DD_MM_YYYY__HH_mm_ss } from "@app-constants";
import {
  parseServerDate,
  getFullName,
  getLanguageByKey,
  parseDate,
} from "@utils";
import dayjs from "dayjs";
import { SendedMessage, ReceivedMessage, MessagesLogItem } from "../Message";
import { socialMediaIcons } from "../../../utils";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;

export const GroupedMessages = ({ personalInfo, ticketId, technicians, localNotes = [] }) => {
  const { messages: rawMessages = [], logs: rawLogs = [] } = useMessagesContext();

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
    .filter((msg) => msg.ticket_id === ticketId)
    .map((msg) => ({
      ...msg,
      itemType: "message",
      sortTime: parseDate(msg.time_sent).valueOf(),
      dateDivider: parseServerDate(msg.time_sent).format(DD_MM_YYYY),
      clientId: Array.isArray(msg.client_id) ? msg.client_id[0] : msg.client_id,
      platform: msg.platform?.toLowerCase?.() || "",
    }));

  const logs = rawLogs
    .filter((log) => log.ticket_id === ticketId)
    .map((log) => ({
      ...log,
      itemType: "log",
      sortTime: parseServerDate(log.timestamp).valueOf(),
      dateDivider: parseServerDate(log.timestamp).format(DD_MM_YYYY),
    }));

  const notes = (localNotes || [])
    .filter((n) => n.ticket_id === ticketId)
    .map((n) => {
      let ts = dayjs(n.time_created, DD_MM_YYYY__HH_mm_ss, true);
      if (!ts.isValid()) ts = dayjs(n.time_created); 
      if (!ts.isValid()) ts = dayjs();              
      return {
        ...n,
        itemType: "note",
        sortTime: ts.valueOf(),
        dateDivider: ts.format(DD_MM_YYYY),
      };
    });

  const allItems = useMemo(() => {
    return [...messages, ...logs, ...notes].sort((a, b) => a.sortTime - b.sortTime);
  }, [messages, logs, notes]);

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

            const clientBlocks = [];
            let lastClientId = null;
            let lastPlatform = null;
            let currentBlock = null;

            dayItems.forEach((item) => {
              if (item.itemType === "message") {
                const currentClientId = item.clientId?.toString();
                const currentPlatform = item.platform || "";
                if (!currentBlock || lastClientId !== currentClientId || lastPlatform !== currentPlatform) {
                  lastClientId = currentClientId;
                  lastPlatform = currentPlatform;
                  currentBlock = { clientId: Number(currentClientId), platform: currentPlatform, items: [item] };
                  clientBlocks.push(currentBlock);
                } else {
                  currentBlock.items.push(item);
                }
              } else if (item.itemType === "log") {
                currentBlock = null;
                lastClientId = null;
                lastPlatform = null;
                clientBlocks.push({ log: item });
              } else if (item.itemType === "note") {
                currentBlock = null;
                lastClientId = null;
                lastPlatform = null;
                clientBlocks.push({ note: item });
              }
            });

            return (
              <Flex pb="xs" direction="column" gap="md" key={date}>
                <Divider
                  label={
                    <Badge c="black" size="lg" bg={colors.gray[2]}>
                      {date}
                    </Badge>
                  }
                  labelPosition="center"
                />

                {clientBlocks.map((block, i) => {
                  if (block.log) {
                    return (
                      <MessagesLogItem
                        key={`log-${block.log.id}-${block.log.timestamp}-${i}`}
                        log={block.log}
                        technicians={technicians}
                      />
                    );
                  }

                  if (block.note) {
                    const n = block.note;
                    return (
                      <Paper
                        key={`note-${n.id}-${i}`}
                        p="10"
                        radius="md"
                        withBorder
                        style={{ background: "#fffbe6", borderColor: "#ffe58f" }}
                      >
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{n.text}</Text>
                        <Text size="xs" c="dimmed" mt={6}>
                          {getLanguageByKey("Заметка")} · {n.author_name || `#${n.author_id}`} · {n.time_created}
                        </Text>
                      </Paper>
                    );
                  }

                  const clientInfo =
                    personalInfo?.clients?.find((c) => c.id === block.clientId) || {};
                  const clientName =
                    getFullName(clientInfo.name, clientInfo.surname) ||
                    `#${block.clientId}`;

                  const platform = block.platform;
                  const platformIcon = socialMediaIcons[platform] || null;
                  const platformLabel = platform
                    ? platform[0].toUpperCase() + platform.slice(1)
                    : "";

                  return (
                    <Flex direction="column" gap="xs" key={`msgs-${date}-${block.clientId}-${platform}-${i}`}>
                      <Flex justify="center" align="center" gap={6}>
                        <Badge c="black" size="lg" bg={colors.gray[2]} px={12}>
                          {getLanguageByKey("Mesajele clientului")}: {clientName}
                          {platformIcon && (
                            <span style={{ marginLeft: 8, verticalAlign: "middle" }}>
                              {platformIcon}
                            </span>
                          )}
                          {!platformIcon && platformLabel && (
                            <span style={{ marginLeft: 8, color: "#777" }}>
                              {platformLabel}
                            </span>
                          )}
                        </Badge>
                      </Flex>
                      {block.items.map((msg, idx) => {
                        const senderIdStr = String(msg.sender_id);
                        const msgClientIds = Array.isArray(msg.client_id)
                          ? msg.client_id.map(String)
                          : [String(msg.client_id)];
                        const isClientMessage =
                          msgClientIds.includes(senderIdStr) ||
                          clientIds.includes(senderIdStr);

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
          <Text c="dimmed">
            {getLanguageByKey("noConversationStartedForThisLead")}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};
