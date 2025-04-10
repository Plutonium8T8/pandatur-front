import React, { useState, useEffect, useRef } from "react";
import { Flex, Select } from "@mantine/core";
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
import "./ChatMessages.css";

const language = localStorage.getItem("language") || "RO";

const parseDate = (dateString) => {
  if (!dateString) return null;
  const [date, time] = dateString.split(" ");
  if (!date || !time) return null;
  const [day, month, year] = date.split("-");
  return new Date(`${year}-${month}-${day}T${time}`);
};

export const ChatMessages = ({
  selectTicketId,
  setSelectedClient,
  selectedClient,
  isLoading,
  personalInfo,
  usersTicket,
}) => {
  const { userId } = useUser();
  const { messages, setMessages, tickets } = useApp();
  const { enqueueSnackbar } = useSnackbar();

  const messageContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("web");
  const [loadingMessage, setLoadingMessage] = useState(false);

  const getLastClientWhoSentMessage = () => {
    if (!Array.isArray(messages) || messages.length === 0) return null;

    const ticketMessages = messages
      .filter(
        (msg) =>
          msg.ticket_id === selectTicketId && Number(msg.sender_id) !== 1,
      )
      .sort((a, b) => parseDate(b.time_sent) - parseDate(a.time_sent));

    return ticketMessages.length > 0 ? ticketMessages[0].client_id : null;
  };

  useEffect(() => {
    const lastClient = getLastClientWhoSentMessage();
    if (lastClient) {
      setSelectedClient(String(lastClient));
    }
  }, [messages, selectTicketId]);

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
        client_id: selectedClient,
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

  const getClientPlatforms = () => {
    const clientId = Number(selectedClient);
    const clientMessages = messages.filter(
      (msg) => Number(msg.client_id) === clientId,
    );

    if (!clientMessages || clientMessages.length === 0) {
      return ["web"];
    }

    const uniquePlatforms = [
      ...new Set(clientMessages.map((msg) => msg.platform)),
    ];
    return uniquePlatforms.length > 0 ? uniquePlatforms : ["web"];
  };
  useEffect(() => {
    const platforms = getClientPlatforms();
    setSelectedPlatform(platforms[0] || "web");
  }, [selectedClient, messages]);

  const getLastMessagePlatform = (clientId) => {
    if (!Array.isArray(messages) || messages.length === 0) return "web";

    const clientMessages = messages
      .filter(
        (msg) =>
          Number(msg.client_id) === Number(clientId) &&
          Number(msg.sender_id) !== 1,
      )
      .sort((a, b) => parseDate(b.time_sent) - parseDate(a.time_sent));

    return clientMessages.length > 0 ? clientMessages[0].platform : "web";
  };

  useEffect(() => {
    if (selectedClient) {
      const lastPlatform = getLastMessagePlatform(selectedClient);

      setSelectedPlatform(lastPlatform || "web");
    }
  }, [selectedClient, messages]);

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

      {selectTicketId && (
        <TaskListOverlay ticketId={selectTicketId} userId={userId} />
      )}

      {selectTicketId && (
        <ChatInput
          loading={loadingMessage}
          id={selectTicketId}
          onSendMessage={(value) => {
            if (!selectedClient) {
              return;
            }
            sendMessage(null, selectedPlatform, value);
          }}
          onHandleFileSelect={(file) => sendMessage(file, selectedPlatform)}
          renderSelectUserPlatform={() => {
            return (
              tickets &&
              tickets.find((ticket) => ticket.id === selectTicketId)
                ?.client_id && (
                <Select
                  size="md"
                  w="100%"
                  value={`${selectedClient}-${selectedPlatform}`}
                  placeholder={translations["Alege client"][language]}
                  data={usersTicket}
                  onChange={(value) => {
                    if (!value) return;
                    const [clientId, platform] = value.split("-");
                    setSelectedClient(clientId);
                    setSelectedPlatform(platform);
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
