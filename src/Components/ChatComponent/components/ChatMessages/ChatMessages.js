import { useState, useEffect, useRef } from "react";
import { Flex, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useUser, useMessagesContext } from "@hooks";
import { api } from "@api";
import { getLanguageByKey, MESSAGES_STATUS } from "@utils";
import { Spin } from "@components";
import { DD_MM_YYYY__HH_mm_ss } from "@app-constants";
import { ChatInput } from "../ChatInput";
import TaskListOverlay from "../../../Task/TaskListOverlay";
import { GroupedMessages } from "../GroupedMessages";
import "./ChatMessages.css";

const getSendedMessage = (msj, currentMsj, statusMessage) => {
  return msj.sender_id === currentMsj.sender_id &&
    msj.message === currentMsj.message &&
    msj.time_sent === currentMsj.time_sent
    ? { ...msj, messageStatus: statusMessage }
    : msj;
};

export const ChatMessages = ({
  ticketId,
  selectedClient,
  personalInfo,
  messageSendersByPlatform,
  onChangeSelectedUser,
  loading,
  technicians,
}) => {
  const { userId } = useUser();

  const {
    setMessages,
    getUserMessages,
    loading: messagesLoading,
    messages,
  } = useMessagesContext();

  const messageContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);

  const sendMessage = async (metadataMsj) => {
    try {
      const normalizedMessage = {
        ...metadataMsj,
        message: metadataMsj.message || metadataMsj.message_text,
        seenAt: false,
      };

      setMessages((prevMessages) => [...prevMessages, normalizedMessage]);

      let apiUrl = api.messages.send.create;
      const normalizedPlatform = metadataMsj.platform?.toUpperCase?.();

      if (normalizedPlatform === "TELEGRAM") {
        apiUrl = api.messages.send.telegram;
      } else if (normalizedPlatform === "VIBER") {
        apiUrl = api.messages.send.viber;
      } else if (normalizedPlatform === "WHATSAPP") {
        apiUrl = api.messages.send.whatsapp;
      }

      await apiUrl(metadataMsj);

      setMessages((prev) =>
        prev.map((msj) =>
          getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.SUCCESS),
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msj) =>
          getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.ERROR),
        )
      );
    }
  };

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messageContainerRef.current;
      setIsUserAtBottom(scrollHeight - scrollTop <= clientHeight + 50);
    }
  };

  useEffect(() => {
    if (isUserAtBottom && messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
      });
    }
  }, [messages, ticketId]);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (ticketId) {
      getUserMessages(Number(ticketId));
    }
  }, [ticketId]);

  const renderMessagesContent = () => {
    if (messages.error) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Text size="lg" c="red">
            {getLanguageByKey("loadMessagesError")}
          </Text>
        </Flex>
      );
    }
    if (messagesLoading) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      );
    }

    if (ticketId) {
      return (
        <GroupedMessages
          personalInfo={personalInfo}
          ticketId={ticketId}
          technicians={technicians}
        />
      );
    }

    return (
      <Flex h="100%" align="center" justify="center">
        <Text size="lg" c="dimmed">
          {getLanguageByKey("Alege lead")}
        </Text>
      </Flex>
    );
  };

  return (
    <Flex w="100%" direction="column" className="chat-area">
      <Flex
        h="100vh"
        p="16"
        direction="column"
        className="chat-messages"
        ref={messageContainerRef}
        bg="#f9fff9"
      >
        {renderMessagesContent()}
      </Flex>

      {ticketId && !messagesLoading && (
        <>
          <TaskListOverlay
            ticketId={ticketId}
            creatingTask={creatingTask}
            setCreatingTask={setCreatingTask}
          />
          <ChatInput
            loading={loading}
            id={ticketId}
            clientList={messageSendersByPlatform}
            ticketId={ticketId}
            unseenCount={personalInfo?.unseen_count || 0}
            currentClient={selectedClient}
            onCreateTask={() => setCreatingTask(true)}
            onSendMessage={(value) => {
              if (!selectedClient.payload) return;
              sendMessage({
                sender_id: Number(userId),
                client_id: selectedClient.payload.id,
                platform: selectedClient.payload.platform,
                ticket_id: ticketId,
                time_sent: dayjs().format(DD_MM_YYYY__HH_mm_ss),
                messageStatus: MESSAGES_STATUS.PENDING,
                ...value,
              });
            }}
            onChangeClient={(value) => {
              if (!value) return;
              const [clientId, platform] = value.split("-");
              onChangeSelectedUser(Number(clientId), platform);
            }}
          />
        </>
      )}
    </Flex>
  );
};
