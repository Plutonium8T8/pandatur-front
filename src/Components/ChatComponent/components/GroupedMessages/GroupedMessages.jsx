import { Flex, Badge, DEFAULT_THEME, Divider } from "@mantine/core";
import { useUser, useApp } from "../../../../hooks";
import { DD_MM_YYYY } from "../../../../app-constants";
import { SendedMessage, ReceivedMessage } from "../Message";
import { parseServerDate, getFullName, getLanguageByKey } from "../../../utils";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;

const parseDate = (dateString) => {
  if (!dateString) return null;
  const [date, time] = dateString.split(" ");
  if (!date || !time) return null;
  const [day, month, year] = date.split("-");
  return new Date(`${year}-${month}-${day}T${time}`);
};

export const GroupedMessages = ({ personalInfo, selectTicketId }) => {
  const { userId } = useUser();
  const { messages } = useApp();

  // TODO: Please refactor me
  const sortedMessages = messages
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
        clientId: currentClientId,
        messages: [msg],
      });
    } else {
      lastGroup.messages.push(msg);
    }
  });

  return (
    <Flex direction="column" gap="xl">
      {groupedMessages.map(({ date, clientId, messages }, index) => {
        const clientInfo = personalInfo?.clients?.[0] || {};

        const clientName =
          getFullName(clientInfo.name, clientInfo.surname) || `ID: ${clientId}`;

        return (
          <Flex direction="column" gap="md" key={index}>
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
                {getLanguageByKey("Mesajele clientului")} #{clientId} -{" "}
                {clientName}
              </Badge>
            </Flex>
            <Flex direction="column" gap="xs">
              {messages.map((msg) => {
                const isMessageSentByMe =
                  msg.sender_id === userId || msg.sender_id === 1;
                return isMessageSentByMe ? (
                  <SendedMessage msg={msg} />
                ) : (
                  <ReceivedMessage msg={msg} personalInfo={personalInfo} />
                );
              })}
            </Flex>
          </Flex>
        );
      })}
    </Flex>
  );
};
