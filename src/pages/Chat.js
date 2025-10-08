import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useFetchTicketChat } from "@hooks";
import { useGetTechniciansList } from "../hooks";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { getFullName } from "@utils";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";

export const Chat = () => {
  const { tickets, setTickets } = useApp();
  const { ticketId: ticketIdParam } = useParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

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

  const currentChat = useMemo(
    () => tickets?.find((t) => t.id === ticketId),
    [tickets, ticketId]
  );

  const responsibleId = personalInfo?.technician_id?.toString() ?? null;

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex w="100%" h="100%" className="chat-container">
        {isChatListVisible && <ChatList ticketId={ticketId} />}

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
              ticketId={ticketId}
              selectedClient={selectedUser}
              personalInfo={personalInfo}
              messageSendersByPlatform={messageSendersByPlatform || []}
              onChangeSelectedUser={changeUser}
              loading={loading}
              technicians={technicians}
              unseenCount={currentChat?.unseen_count || 0}
            />
          </Flex>
        </Can>

        {!isNaN(ticketId) && (
          <Can
            permission={{ module: "chat", action: "edit" }}
            context={{ responsibleId }}
          >
            <ChatExtraInfo
              selectedUser={selectedUser}
              ticketId={ticketId}
              updatedTicket={personalInfo}
              onUpdatePersonalInfo={(payload, values) => {
                const identifier =
                  getFullName(values.name, values.surname) || `#${payload.id}`;
                const clientTicketList = personalInfo.clients.map((client) =>
                  client.id === payload.id
                    ? { ...client, ...values }
                    : client
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
                      : client
                  )
                );

                setTickets((prev) =>
                  prev.map((ticket) =>
                    ticket.id === personalInfo.id
                      ? {
                        ...ticket,
                        ...personalInfo,
                        clients: clientTicketList,
                      }
                      : ticket
                  )
                );

                setPersonalInfo((prev) => ({
                  ...prev,
                  clients: clientTicketList,
                }));
              }}
            />
          </Can>
        )}
      </Flex>
    </Flex>
  );
};
