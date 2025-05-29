import { useEffect, useState, useMemo } from "react";
import { Flex, Badge, DEFAULT_THEME, Divider, Text } from "@mantine/core";
import { useMessagesContext } from "@hooks";
import { DD_MM_YYYY } from "@app-constants";
import {
  parseServerDate,
  getFullName,
  getLanguageByKey,
  parseDate,
  showServerError,
} from "@utils";
import { api } from "@api";
import { SendedMessage, ReceivedMessage } from "../Message";
import "./GroupedMessages.css";

const { colors } = DEFAULT_THEME;

export const GroupedMessages = ({ personalInfo, selectTicketId }) => {
  const { messages } = useMessagesContext();
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await api.users.getTechnicianList();
        const formatted = data.map((item) => ({
          value: Number(item.id.id),
          label: `${item.id.surname} ${item.id.name}`,
        }));
        setTechnicians(formatted);
      } catch (err) {
        showServerError(err);
      }
    };

    fetchTechnicians();
  }, []);

  const technicianMap = useMemo(() => {
    const map = new Map();
    technicians.forEach((t) => map.set(t.value, t));
    return map;
  }, [technicians]);

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
                  {messages.map((msg) => {
                    const isClientMessage = clientIds.includes(msg.sender_id);
                    const technician = technicianMap.get(Number(msg.sender_id));

                    return isClientMessage ? (
                      <ReceivedMessage
                        key={`${msg.id ?? ""}-${msg.time_sent}`}
                        msg={msg}
                        personalInfo={personalInfo}
                      />
                    ) : (
                      <SendedMessage
                        key={`${msg.id ?? ""}-${msg.time_sent}`}
                        msg={msg}
                        technician={technician}
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
