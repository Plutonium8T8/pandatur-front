import { Flex, Badge, DEFAULT_THEME, Divider, Text } from "@mantine/core";
import { useCallback } from "react";
import { useUser, useApp } from "../../../../hooks";
import { DD_MM_YYYY } from "../../../../app-constants";
import { SendedMessage, ReceivedMessage } from "../Message";
import {
  parseServerDate,
  getFullName,
  getLanguageByKey,
  parseDate,
} from "../../../utils";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;

export const GroupedMessages = ({
  personalInfo,
  selectTicketId,
  technicians,
}) => {
  const { userId } = useUser();
  const { messages } = useApp();

  const getTechnician = useCallback(
    (id) => {
      return technicians?.find(({ value }) => {
        return Number(value) === id;
      });
    },
    [technicians],
  );

  // TODO: Please refactor me
  const sortedMessages = messages.list
    .filter((msg) => msg.ticket_id === selectTicketId)
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
        id: crypto.randomUUID(),
      });
    } else {
      lastGroup.messages.push(msg);
    }
  });

  return (
    <Flex direction="column" gap="xl" h="100%">
      {groupedMessages.length ? (
        groupedMessages.map(({ date, clientId, messages, id }) => {
          const clientInfo =
            personalInfo?.clients?.find(({ id }) => id === clientId) || {};

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
                {messages.map((msg) => {
                  const isMessageSentByMe =
                    msg.sender_id === userId || msg.sender_id === 1;
                  return isMessageSentByMe ? (
                    <SendedMessage
                      key={`${msg.id ?? ""}-${msg.time_sent}`}
                      msg={msg}
                      technician={getTechnician(msg.sender_id)}
                    />
                  ) : (
                    <ReceivedMessage
                      key={`${msg.id ?? ""}-${msg.time_sent}`}
                      msg={msg}
                      personalInfo={personalInfo}
                    />
                  );
                })}
              </Flex>
            </Flex>
          );
        })
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
