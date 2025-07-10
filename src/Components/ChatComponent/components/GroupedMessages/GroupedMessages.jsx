import { useMemo } from "react";
import { Flex, Badge, DEFAULT_THEME, Divider, Text } from "@mantine/core";
import { useMessagesContext } from "@hooks";
import { DD_MM_YYYY } from "@app-constants";
import {
  parseServerDate,
  getFullName,
  getLanguageByKey,
  parseDate,
} from "@utils";
import { SendedMessage, ReceivedMessage, MessagesLogItem } from "../Message";
import { socialMediaIcons } from "../../../utils";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;

export const GroupedMessages = ({ personalInfo, ticketId, technicians }) => {
  const { messages: rawMessages = [], logs: rawLogs = [] } = useMessagesContext();

  const technicianMap = useMemo(() => {
    const map = new Map();
    technicians?.forEach((t) => map.set(t.value, t));
    return map;
  }, [technicians]);

  const clientIds = useMemo(
    () => (personalInfo?.clients || []).map((c) => c.id),
    [personalInfo]
  );

  const messages = rawMessages
    .filter((msg) => msg.ticket_id === ticketId)
    .map((msg) => ({
      ...msg,
      itemType: "message",
      sortTime: parseDate(msg.time_sent).valueOf(),
      dateDivider: parseServerDate(msg.time_sent).format(DD_MM_YYYY),
      clientId: Array.isArray(msg.client_id)
        ? msg.client_id[0]
        : msg.client_id,
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

  const allItems = useMemo(() => {
    return [...messages, ...logs].sort((a, b) => a.sortTime - b.sortTime);
  }, [messages, logs]);

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

            dayItems.forEach((item, idx) => {
              if (item.itemType === "message") {
                const currentClientId = item.clientId?.toString();
                const currentPlatform = item.platform || "";
                if (
                  !currentBlock ||
                  lastClientId !== currentClientId ||
                  lastPlatform !== currentPlatform
                ) {
                  lastClientId = currentClientId;
                  lastPlatform = currentPlatform;
                  currentBlock = {
                    clientId: Number(currentClientId),
                    platform: currentPlatform,
                    items: [item],
                  };
                  clientBlocks.push(currentBlock);
                } else {
                  currentBlock.items.push(item);
                }
              } else {
                currentBlock = null;
                lastClientId = null;
                lastPlatform = null;
                clientBlocks.push({ log: item });
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
                        key={`log-${block.log.id}-${block.log.timestamp}`}
                        log={block.log}
                        technicians={technicians}
                      />
                    );
                  }

                  const clientInfo =
                    personalInfo?.clients?.find(
                      (c) => c.id === block.clientId
                    ) || {};
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
                        const isClientMessage = clientIds.includes(msg.sender_id);
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
