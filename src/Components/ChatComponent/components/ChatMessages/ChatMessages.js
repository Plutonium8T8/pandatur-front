import React, { useState, useEffect, useRef } from "react";
import { Flex, Text } from "@mantine/core";
import { useSnackbar } from "notistack";
import { useApp, useUser } from "../../../../hooks";
import { api } from "../../../../api";
import TaskListOverlay from "../../../Task/Components/TicketTask/TaskListOverlay";
import { getLanguageByKey, showServerError } from "../../../utils";
import { Spin } from "../../../Spin";
import { ChatInput } from "..";
import { getMediaType } from "../../utils";
import { GroupedMessages } from "../GroupedMessages";
import { DD_MM_YYYY__HH_mm_ss } from "../../../../app-constants";
import dayjs from "dayjs";
import "./ChatMessages.css";

// TODO: Add loading from `AppContext`
export const ChatMessages = ({
  selectTicketId,
  selectedClient,
  isLoading,
  personalInfo,
  messageSendersByPlatform,
  onChangeSelectedUser,
}) => {
  const { userId } = useUser();
  const { messages, setMessages } = useApp();
  const { enqueueSnackbar } = useSnackbar();

  const messageContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await api.messages.upload(formData);

      return data;
    } catch (error) {
      enqueueSnackbar(getLanguageByKey("file_upload_failed"), {
        variant: "error",
      });
    }
  };

  const sendMessage = async (selectedFile, platform, inputValue) => {
    try {
      const messageData = {
        sender_id: Number(userId),
        client_id: selectedClient.payload?.id,
        platform: platform,
        message: inputValue.trim(),
        media_type: null,
        ticket_id: selectTicketId,
        time_sent: dayjs().format(DD_MM_YYYY__HH_mm_ss),
        media_url: "",
        isError: false,
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        { ...messageData, seenAt: false },
      ]);

      if (selectedFile) {
        const uploadResponse = await uploadFile(selectedFile);

        if (!uploadResponse || !uploadResponse.url) {
          enqueueSnackbar(getLanguageByKey("file_upload_failed"), {
            variant: "error",
          });
          return;
        }

        messageData.media_url = uploadResponse.url;
        messageData.media_type = getMediaType(selectedFile.type);
      }

      let apiUrl = api.messages.send.create;

      if (platform === "telegram") {
        apiUrl = api.messages.send.telegram;
      } else if (platform === "viber") {
        apiUrl = api.messages.send.viber;
      }

      await apiUrl(messageData);
    } catch (error) {
      const messageData = {
        sender_id: Number(userId),
        client_id: selectedClient.payload?.id,
        platform: platform,
        message: inputValue.trim(),
        media_type: null,
        ticket_id: selectTicketId,
        time_sent: dayjs().format(DD_MM_YYYY__HH_mm_ss),
        media_url: "",
        isError: true,
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        { ...messageData, seenAt: false },
      ]);
      enqueueSnackbar(showServerError(error), { variant: "error" });
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
  }, [messages, selectTicketId]);

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

  return (
    <Flex w="100%" direction="column" className="chat-area">
      <Flex
        h="100vh"
        p="16"
        direction="column"
        className="chat-messages"
        ref={messageContainerRef}
      >
        {isLoading ? (
          <Flex h="100%" align="center" justify="center">
            <Spin />
          </Flex>
        ) : selectTicketId ? (
          <GroupedMessages
            personalInfo={personalInfo}
            selectTicketId={selectTicketId}
          />
        ) : (
          <Flex h="100%" align="center" justify="center">
            <Text size="lg" c="dimmed">
              {getLanguageByKey("Alege lead")}
            </Text>
          </Flex>
        )}
      </Flex>

      {selectTicketId && !isLoading && (
        <TaskListOverlay ticketId={selectTicketId} userId={userId} />
      )}

      {selectTicketId && !isLoading && (
        <ChatInput
          id={selectTicketId}
          clientList={messageSendersByPlatform}
          currentClient={selectedClient}
          onSendMessage={(value) => {
            if (!selectedClient) {
              return;
            }
            sendMessage(null, selectedClient.payload?.platform, value);
          }}
          onHandleFileSelect={(file) =>
            sendMessage(file, selectedClient.payload?.platform)
          }
          onChangeClient={(value) => {
            if (!value) return;
            const [clientId, platform] = value.split("-");
            const selectUserId = Number(clientId);

            onChangeSelectedUser(selectUserId, platform);
          }}
        />
      )}
    </Flex>
  );
};
