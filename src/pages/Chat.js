import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useFetchTicketChat, useGetTechniciansList } from "@hooks";
import ChatExtraInfo from "@components/ChatComponent/ChatExtraInfo";
import ChatList from "@components/ChatComponent/ChatList";
import { getFullName } from "@utils";
import { ChatMessages } from "@components/ChatComponent/components";
import Can from "@components/CanComponent/Can";

export const Chat = () => {
  const { setTickets } = useApp();
  const { ticketId } = useParams();
  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

  const ticketIdToNumber = ticketId ? Number(ticketId) : undefined;

  const {
    personalInfo,
    messageSendersByPlatform,
    loading,
    selectedUser,
    changeUser,
    setPersonalInfo,
    setMessageSendersByPlatform,
    setSelectedUser,
  } = useFetchTicketChat(ticketId);

  const responsibleId = personalInfo?.technician_id?.toString() ?? null;

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex w="100%" h="100%" className="chat-container">
        {isChatListVisible && (
          <ChatList selectTicketId={ticketIdToNumber} />
        )}

        <Can
          permission={{ module: "chat", action: "edit" }}
          context={{ responsibleId }}
        >
          <Flex pos="relative" style={{ flex: "1 1 0" }}>
            <Box pos="absolute" left="10px" top="16px" style={{ zIndex: 1 }}>
              <ActionIcon
                variant="default"
                onClick={() => setIsChatListVisible((prev) => !prev)}
              >
                {isChatListVisible ? (
                  <FaArrowLeft size="12" />
                ) : (
                  <FaArrowRight size="12" />
                )}
              </ActionIcon>
            </Box>

            <ChatMessages
              selectTicketId={ticketIdToNumber}
              selectedClient={selectedUser}
              personalInfo={personalInfo}
              messageSendersByPlatform={messageSendersByPlatform || []}
              onChangeSelectedUser={changeUser}
              loading={loading}
              technicians={technicians}
            />
          </Flex>
        </Can>

        {ticketId && (
          <Can
            permission={{ module: "chat", action: "edit" }}
            context={{ responsibleId }}
          >
            <ChatExtraInfo
              selectedUser={selectedUser}
              ticketId={ticketId}
              selectTicketId={ticketIdToNumber}
              onUpdatePersonalInfo={(payload, values) => {
                const identifier =
                  getFullName(values.name, values.surname) || `#${payload.id}`;
                const clientTicketList = personalInfo.clients.map((client) =>
                  client.id === payload.id
                    ? { ...client, ...values }
                    : client,
                );

                setSelectedUser((prev) => ({
                  ...prev,
                  label: identifier,
                  payload: { ...prev.payload, ...values },
                }));

                setMessageSendersByPlatform((prev) =>
                  prev.map((client) =>
                    client.payload.id === payload.id &&
                      client.payload.platform === payload.platform
                      ? {
                        ...client,
                        label: `${identifier} - ${payload.platform}`,
                        payload: { ...payload, ...values },
                      }
                      : client,
                  ),
                );

                setTickets((prev) =>
                  prev.map((ticket) =>
                    ticket.id === personalInfo.id
                      ? { ...ticket, ...personalInfo, clients: clientTicketList }
                      : ticket,
                  ),
                );

                setPersonalInfo((prev) => ({
                  ...prev,
                  clients: clientTicketList,
                }));
              }}
              updatedTicket={personalInfo}
            />
          </Can>
        )}
      </Flex>
    </Flex>
  );
};
