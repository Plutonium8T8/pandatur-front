import React, { useState, useEffect, useRef } from "react";
import { Flex, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useApp, useUser } from "../../../../hooks";
import { api } from "../../../../api";
import { getLanguageByKey, MESSAGES_STATUS } from "../../../utils";
import TaskListOverlay from "../../../Task/TaskListOverlay";
import { Spin } from "../../../Spin";
import { ChatInput } from "../ChatInput";
import { GroupedMessages } from "../GroupedMessages";
import { DD_MM_YYYY__HH_mm_ss, PLATFORMS } from "../../../../app-constants";
import "./ChatMessages.css";

const getSendedMessage = (msj, currentMsj, statusMessage) => {
  return msj.sender_id === currentMsj.sender_id &&
    msj.message === currentMsj.message &&
    msj.time_sent === currentMsj.time_sent
    ? { ...msj, messageStatus: statusMessage }
    : msj;
};

export const ChatMessages = ({
  selectTicketId,
  selectedClient,
  personalInfo,
  messageSendersByPlatform,
  onChangeSelectedUser,
  loading,
  technicians,
}) => {
  const { userId } = useUser();
  const { messages } = useApp();

  const messageContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);

  const sendMessage = async (metadataMsj) => {
    try {
      messages.setMessages((prevMessages) => [
        ...prevMessages,
        { ...metadataMsj, seenAt: false },
      ]);

      let apiUrl = api.messages.send.create;

      if (metadataMsj.platform === PLATFORMS.TELEGRAM) {
        apiUrl = api.messages.send.telegram;
      } else if (metadataMsj.platform === PLATFORMS.VIBER) {
        apiUrl = api.messages.send.viber;
      }

      await apiUrl(metadataMsj);

      messages.setMessages((prev) => {
        return prev.map((msj) =>
          getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.SUCCESS),
        );
      });
    } catch (error) {
      messages.setMessages((prev) => {
        return prev.map((msj) =>
          getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.ERROR),
        );
      });
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
  }, [messages.list, selectTicketId]);

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
    if (messages.loading) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      );
    }

    if (selectTicketId) {
      return (
        <GroupedMessages
          personalInfo={personalInfo}
          selectTicketId={selectTicketId}
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
      >
        {renderMessagesContent()}
      </Flex>

      {selectTicketId && !messages.loading && (
        <>
          <TaskListOverlay
            ticketId={selectTicketId}
            userId={userId}
            creatingTask={creatingTask}
            setCreatingTask={setCreatingTask}
          />
          <ChatInput
            loading={loading}
            id={selectTicketId}
            clientList={messageSendersByPlatform}
            currentClient={selectedClient}
            onCreateTask={() => setCreatingTask(true)}
            onSendMessage={(value) => {
              if (!selectedClient.payload) {
                return;
              }
              sendMessage({
                sender_id: Number(userId),
                client_id: selectedClient.payload?.id,
                platform: selectedClient.payload?.platform,
                ticket_id: selectTicketId,
                time_sent: dayjs().format(DD_MM_YYYY__HH_mm_ss),
                messageStatus: MESSAGES_STATUS.PENDING,
                ...value,
              });
            }}
            onChangeClient={(value) => {
              if (!value) return;
              const [clientId, platform] = value.split("-");
              const selectUserId = Number(clientId);

              onChangeSelectedUser(selectUserId, platform);
            }}
          />
        </>
      )}
    </Flex>
  );
};
