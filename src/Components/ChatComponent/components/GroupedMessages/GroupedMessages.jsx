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
import { SendedMessage, ReceivedMessage } from "../Message";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;

export const GroupedMessages = ({ personalInfo, ticketId, technicians }) => {
  const { messages } = useMessagesContext();

  const technicianMap = useMemo(() => {
    const map = new Map();
    technicians?.forEach((t) => map.set(t.value, t));
    return map;
  }, [technicians]);

  const sortedMessages = messages
    .filter((msg) => msg.ticket_id === ticketId)
    .sort((a, b) => parseDate(a.time_sent) - parseDate(b.time_sent));

  const groupedMessages = [];
  let lastClientId = null;

  sortedMessages.forEach((msg) => {
    const messageDate = parseServerDate(msg.time_sent).format(DD_MM_YYYY);
    const currentClientId = Array.isArray(msg.client_id)
      ? msg.client_id[0].toString()
      : msg.client_id.toString();

    let lastGroup =
      groupedMessages.length > 0
        ? groupedMessages[groupedMessages.length - 1]
        : null;

    if (
      !lastGroup ||
      lastGroup.date !== messageDate ||
      lastClientId !== currentClientId
    ) {
      lastClientId = currentClientId;
      groupedMessages.push({
        date: messageDate,
        clientId: Number(currentClientId),
        messages: [msg],
        id: `${messageDate}-${Number(currentClientId)}-${msg.id}`,
      });
    } else {
      lastGroup.messages.push(msg);
    }
  });

  const clientIds = (personalInfo?.clients || []).map((c) => c.id);

  return (
    <Flex direction="column" gap="xl" h="100%">
      {groupedMessages.length ? (
        <Flex direction="column" gap="xs">
          {groupedMessages.map(({ date, clientId, messages, id }) => {
            const clientInfo =
              personalInfo?.clients?.find((c) => c.id === clientId) || {};

            const clientName =
              getFullName(clientInfo.name, clientInfo.surname) || `#${clientId}`;

            return (
              <Flex pb="xs" direction="column" gap="md" key={id}>
                <Divider
                  label={
                    <Badge c="black" size="lg" bg={colors.gray[2]}>
                      {date}
                    </Badge>
                  }
                  labelPosition="center"
                />

                <Flex justify="center">
                  <Badge c="black" size="lg" bg={colors.gray[2]}>
                    {getLanguageByKey("Mesajele clientului")}: {clientName}
                  </Badge>
                </Flex>

                <Flex direction="column" gap="xs">
                  {messages.map((msg, index) => {
                    const isClientMessage = clientIds.includes(msg.sender_id);
                    const technician = technicianMap.get(Number(msg.sender_id));

                    return isClientMessage ? (
                      <ReceivedMessage
                        key={`${msg.id}-${index}`}
                        msg={msg}
                        personalInfo={personalInfo}
                        technicians={technicians}
                      />
                    ) : (
                      <SendedMessage
                        key={`${msg.id}-${index}`}
                        msg={msg}
                        technician={technician}
                        technicians={technicians}
                      />
                    );
                  })}
                </Flex>
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
