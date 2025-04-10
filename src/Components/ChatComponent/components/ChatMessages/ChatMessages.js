import React, { useState, useEffect, useRef } from "react";
import { Flex } from "@mantine/core";
import { useSnackbar } from "notistack";
import { useApp, useUser } from "../../../../hooks";
import { api } from "../../../../api";
import TaskListOverlay from "../../../Task/Components/TicketTask/TaskListOverlay";
import { translations } from "../../../utils/translations";
import { getLanguageByKey, showServerError } from "../../../utils";
import { Spin } from "../../../Spin";
import { ChatInput } from "..";
import { getMediaType } from "../../utils";
import { GroupedMessages } from "../GroupedMessages";
import { getFullName } from "../../../utils";
import "./ChatMessages.css";

const language = localStorage.getItem("language") || "RO";

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
  const [loadingMessage, setLoadingMessage] = useState(false);

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
    setLoadingMessage(true);
    try {
      const messageData = {
        sender_id: Number(userId),
        client_id: selectedClient.payload?.id,
        platform: platform,
        message: inputValue.trim(),
        media_type: null,
        media_url: "",
      };

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

      setMessages((prevMessages) => [
        ...prevMessages,
        { ...messageData, seenAt: false },
      ]);

      await apiUrl(messageData);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoadingMessage(false);
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
          <div className="empty-chat">
            <p>{translations["Alege lead"][language]}</p>
          </div>
        )}
      </Flex>

      {selectTicketId && !isLoading && (
        <TaskListOverlay ticketId={selectTicketId} userId={userId} />
      )}

      {selectTicketId && !isLoading && (
        <ChatInput
          loading={loadingMessage}
          onSendMessage={(value) => {
            if (!selectedClient) {
              return;
            }
            sendMessage(null, selectedClient.payload?.platform, value);
          }}
          onHandleFileSelect={(file) =>
            sendMessage(file, selectedClient.payload?.platform)
          }
          renderSelectUserPlatform={() => {
            return (
              messageSendersByPlatform && (
                <Select
                  size="md"
                  w="100%"
                  value={`${selectedClient.payload?.id}-${selectedClient.payload?.platform}`}
                  placeholder={translations["Alege client"][language]}
                  data={messageSendersByPlatform}
                  onChange={(value) => {
                    if (!value) return;
                    const [clientId, platform] = value.split("-");
                    const selectUserId = Number(clientId);

                    onChangeSelectedUser(selectUserId, platform);
                  }}
                />
              )
            );
          }}
        />
      )}
    </Flex>
  );
};
