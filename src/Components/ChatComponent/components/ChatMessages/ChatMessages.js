import React, { useState, useEffect, useRef } from "react";
import { Flex, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useUser, useFetchTicketChat, useMessagesContext } from "@hooks";
import { api } from "@api";
import { DD_MM_YYYY__HH_mm_ss, PLATFORMS } from "@app-constants";
import { getLanguageByKey, MESSAGES_STATUS } from "@utils";
import TaskListOverlay from "../../../Task/TaskListOverlay";
import { Spin } from "../../../Spin";
import { ChatInput } from "../ChatInput";
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
  id,
  selectedClient,
  personalInfo,
  messageSendersByPlatform,
  onChangeSelectedUser,
  loading,
  technicians,
  tasks = [],
}) => {
  const { userId } = useUser();

  const {
    setMessages,

    getUserMessages,
    error,
    loading: messagesLoading,
  } = useMessagesContext();

  const messageContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);
  const {
    // personalInfo,
    // messageSendersByPlatform,
    // loading,
    // selectedUser,
    // changeUser,
    // setPersonalInfo,
    setMessageSendersByPlatform,
    setSelectedUser,
    // getTicket,
  } = useFetchTicketChat(id);

  const sendMessage = async (metadataMsj) => {
    try {
      setMessages((prevMessages) => [
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

      setMessages((prev) => {
        return prev.map((msj) =>
          getSendedMessage(msj, metadataMsj, MESSAGES_STATUS.SUCCESS),
        );
      });
    } catch (error) {
      setMessages((prev) => {
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
    if (id) {
      setSelectedUser({});
      setMessageSendersByPlatform([]);

      getUserMessages(Number(id));

      // if (!messages?.length) {
      //   getUserMessages(Number(id));
      // }
    }
  }, [id]);

  // useEffect(() => {
  //   if (selectTicketId) {
  //     setSelectedUser({});
  //     setMessageSendersByPlatform([]);

  //     if (messages && !messages.list?.length) {
  //       messages.getUserMessages(Number(selectTicketId));
  //     }
  //   }
  // }, [selectTicketId]);

  // useEffect(() => {
  //   if (isUserAtBottom && messageContainerRef.current) {
  //     messageContainerRef.current.scrollTo({
  //       top: messageContainerRef.current.scrollHeight,
  //     });
  //   }
  // }, [messages, selectTicketId]);

  // useEffect(() => {
  //   const container = messageContainerRef.current;
  //   if (container) {
  //     container.addEventListener("scroll", handleScroll);
  //   }
  //   return () => {
  //     if (container) {
  //       container.removeEventListener("scroll", handleScroll);
  //     }
  //   };
  // }, []);

  const renderMessagesContent = () => {
    if (error) {
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

    if (id) {
      return (
        <GroupedMessages
          personalInfo={personalInfo}
          selectTicketId={Number(id)}
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

      {id && !messagesLoading && (
        <>
          <TaskListOverlay
            ticketId={Number(id)}
            tasks={tasks}
            creatingTask={creatingTask}
            setCreatingTask={setCreatingTask}
            fetchTasks={window.fetchTasksGlobal}
          />

          <ChatInput
            loading={loading}
            id={id}
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
                ticket_id: Number(id),
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
