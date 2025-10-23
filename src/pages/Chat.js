import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useClientContacts, useMessagesContext } from "@hooks";
import { useGetTechniciansList } from "../hooks";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";

export const Chat = () => {
  const { tickets } = useApp();
  const { messages } = useMessagesContext();
  const { ticketId: ticketIdParam } = useParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

  const currentTicket = useMemo(() => {
    const found = tickets?.find((t) => t.id === ticketId);
    return found;
  }, [tickets, ticketId]);

  // Получаем последнее сообщение по времени для автоматического выбора платформы и контакта
  const lastMessage = useMemo(() => {
    const DEBUG_CHAT = false; // Set to true for debugging

    if (!messages || messages.length === 0 || !ticketId) {
      if (DEBUG_CHAT) {
        console.log("[Chat] lastMessage: no messages or ticketId", {
          hasMessages: !!messages,
          messagesCount: messages?.length,
          ticketId
        });
      }
      return null;
    }

    // ⚡ OPTIMIZATION: Используем single-pass для фильтрации и поиска max
    // O(n) вместо O(n) + O(n log n)
    let lastMsg = null;
    let lastMsgTime = 0;
    let filteredCount = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const platform = msg.platform?.toLowerCase();

      // Пропускаем сообщения не для этого тикета или с неподходящей платформой
      if (msg.ticket_id !== ticketId || platform === 'sipuni' || platform === 'mail') {
        continue;
      }

      // Пропускаем сообщения не от клиента (только сообщения от клиента)
      if (msg.sender_id !== msg.client_id) {
        continue;
      }

      filteredCount++;
      const msgTime = new Date(msg.time_sent || msg.created_at || 0).getTime();

      if (msgTime > lastMsgTime) {
        lastMsgTime = msgTime;
        lastMsg = msg;
      }
    }

    if (DEBUG_CHAT) {
      console.log("[Chat] filtered messages for ticket", {
        ticketId,
        totalMessages: messages.length,
        currentTicketMessages: filteredCount,
        allTicketIds: [...new Set(messages.map(m => m.ticket_id))]
      });

      if (lastMsg) {
        console.log("[Chat] lastMessage selected", {
          id: lastMsg.id,
          platform: lastMsg.platform,
          time_sent: lastMsg.time_sent,
          created_at: lastMsg.created_at,
          from_reference: lastMsg.from_reference,
          to_reference: lastMsg.to_reference,
          client_id: lastMsg.client_id,
          sender_id: lastMsg.sender_id,
          ticket_id: lastMsg.ticket_id
        });
      }
    }

    return lastMsg;
  }, [messages, ticketId]);

  const {
    platformOptions,
    selectedPlatform,
    changePlatform,
    contactOptions,
    changeContact,
    selectedClient,
    selectedPageId,
    changePageId,
    loading,
    updateClientData,
  } = useClientContacts(ticketId, lastMessage, currentTicket?.group_title);

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

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
              selectedClient={selectedClient}
              personalInfo={currentTicket}
              platformOptions={platformOptions}
              selectedPlatform={selectedPlatform}
              changePlatform={changePlatform}
              contactOptions={contactOptions}
              changeContact={changeContact}
              selectedPageId={selectedPageId}
              changePageId={changePageId}
              loading={loading}
              technicians={technicians}
              unseenCount={currentTicket?.unseen_count || 0}
            />
          </Flex>
        </Can>

        {!isNaN(ticketId) && (
          <Can
            permission={{ module: "chat", action: "edit" }}
            context={{ responsibleId }}
          >
            <ChatExtraInfo
              selectedClient={selectedClient}
              ticketId={ticketId}
              updatedTicket={currentTicket}
              onUpdateClientData={updateClientData}
            />
          </Can>
        )}
      </Flex>
    </Flex>
  );
};
