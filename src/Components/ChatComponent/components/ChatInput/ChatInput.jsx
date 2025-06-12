import {
  Textarea,
  Flex,
  ActionIcon,
  Box,
  Button,
  Select,
  Loader,
  FileButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaTasks } from "react-icons/fa";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile } from "react-icons/lu";
import { RiAttachment2 } from "react-icons/ri";
import { getLanguageByKey, socialMediaIcons } from "../../../utils";
import { templateOptions } from "../../../../FormOptions";
import { useUploadMediaFile } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import { useApp, useSocket, useUser } from "@hooks";
import Can from "../../../CanComponent/Can";
import { api } from "../../../../api";

import "./ChatInput.css";

const pandaNumbersWhatsup = [
  { value: "37360991919", label: "37360991919 - MD / PT_MD" },
  { value: "40720949119", label: "40720949119 - RO / PT_IASI" },
  { value: "40728932931", label: "40728932931 - RO / PT_BUC" },
  { value: "40721205105", label: "40721205105 - RO / PT_BR" },
];

const pandaNumbersViber = [
  { value: "37360991919", label: "37360991919 - MD / PT_MD" }
];

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  clientList,
  onChangeClient,
  currentClient,
  loading,
  onCreateTask,
  ticketId,
  unseenCount,
}) => {
  const [opened, handlers] = useDisclosure(false);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [template, setTemplate] = useState();
  const [url, setUrl] = useState({});
  const [pandaNumber, setPandaNumber] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [ticket, setTicket] = useState(null);

  const { uploadFile } = useUploadMediaFile();
  const { userId } = useUser();
  const { seenMessages } = useSocket();
  const { markMessagesAsRead } = useApp();

  const isWhatsApp = currentClient?.payload?.platform?.toUpperCase() === "WHATSAPP";
  const isViber = currentClient?.payload?.platform?.toUpperCase() === "VIBER";

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      try {
        const data = await api.tickets.getById(ticketId);
        setTicket(data);
      } catch (e) {
        console.error("Failed to fetch ticket", e);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleEmojiClickButton = (event) => {
    const rect = event.target.getBoundingClientRect();
    const emojiPickerHeight = 450;

    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX,
    });

    setShowEmojiPicker((prev) => !prev);
  };

  const handleFile = async (file) => {
    handlers.open();
    const url = await uploadFile(file);
    handlers.close();

    const mediaType = getMediaType(file.type);

    if (url) {
      setUrl({
        media_url: url,
        media_type: mediaType,
        last_message_type: mediaType,
      });
      setMessage(url);
    }
  };

  const clearState = () => {
    setMessage("");
    setTemplate(null);
    setUrl(null);
  };

  const sendMessage = () => {
    const isChatWithPhone = isWhatsApp || isViber;
    const trimmedMessage = message.trim();
    const mediaType = url?.media_type;
    const isMedia = mediaType && mediaType !== "text";

    if ((isMedia && url?.media_url) || (!isMedia && trimmedMessage)) {
      const payload = {
        ...url,
        message: isMedia ? url.media_url : trimmedMessage,
        panda_number: isChatWithPhone ? pandaNumber : undefined,
        client_phone: isChatWithPhone ? currentClient?.payload?.phone : undefined,
      };

      if (!isMedia) {
        payload.message_text = isChatWithPhone ? trimmedMessage : undefined;
      }

      onSendMessage(payload);
      clearState();
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const handleMarkAsRead = () => {
    if (ticketId && unseenCount > 0) {
      seenMessages(ticketId, userId);
      markMessagesAsRead(ticketId, unseenCount);
    }
  };

  const handleMarkActionResolved = async () => {
    if (!ticketId || ticket?.action_needed === undefined) return;

    const newValue = String(!ticket.action_needed);

    try {
      await api.tickets.updateById({ id: ticketId, action_needed: newValue });
      setTicket((prev) => ({ ...prev, action_needed: !prev.action_needed }));
    } catch (e) {
      console.error("Failed to update action_needed", e);
    }
  };

  return (
    <>
      <Box className="chat-input" p="16">
        <Flex w="100%" gap="xs" mb="xs" align="center">
          {socialMediaIcons[currentClient?.payload?.platform] && (
            <Flex>{socialMediaIcons[currentClient.payload.platform]}</Flex>
          )}
          {loading ? (
            <Loader size="xs" />
          ) : (
            <Select
              className="w-full"
              onChange={onChangeClient}
              placeholder={getLanguageByKey("selectUser")}
              value={currentClient?.value}
              data={clientList}
            />
          )}

          {isWhatsApp && (
            <Select
              className="w-full"
              placeholder={getLanguageByKey("select_sender_number")}
              value={pandaNumber}
              onChange={setPandaNumber}
              data={pandaNumbersWhatsup}
            />
          )}

          {isViber && (
            <Select
              className="w-full"
              placeholder={getLanguageByKey("select_sender_number_viber")}
              value={pandaNumber}
              onChange={setPandaNumber}
              data={pandaNumbersViber}
            />
          )}

          <Select
            searchable
            onChange={(value) => {
              setMessage(value ? templateOptions[value] : "");
              setTemplate(value);
            }}
            className="w-full"
            value={template}
            placeholder={getLanguageByKey("select_message_template")}
            data={Object.keys(templateOptions).map((key) => ({
              value: key,
              label: key,
            }))}
          />
        </Flex>

        <Textarea
          autosize
          minRows={6}
          maxRows={8}
          w="100%"
          mb="xs"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={getLanguageByKey("Introduceți mesaj")}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          styles={{
            input: {
              border: isDragOver ? "2px dashed #69db7c" : undefined,
              backgroundColor: isDragOver ? "#ebfbee" : undefined,
            },
          }}
        />

        <Flex align="center" justify="space-between">
          <Flex gap="xs">
            <Button
              disabled={
                !message.trim() ||
                !currentClient?.payload ||
                currentClient.payload.platform === "sipuni" ||
                (isWhatsApp && !pandaNumber) ||
                (isViber && !pandaNumber)
              }
              variant="filled"
              onClick={sendMessage}
              loading={opened}
            >
              {getLanguageByKey("Trimite")}
            </Button>

            <Button onClick={clearState} variant="default">
              {getLanguageByKey("Anulează")}
            </Button>

            {unseenCount > 0 && (
              <Button onClick={handleMarkAsRead} variant="outline">
                {getLanguageByKey("ReadChat")}
              </Button>
            )}

            {typeof ticket?.action_needed === "boolean" && (
              <Button
                onClick={handleMarkActionResolved}
                variant="light"
                color={ticket.action_needed ? "orange" : "green"}
              >
                {getLanguageByKey(
                  ticket.action_needed ? "NeedAnswer" : "NoNeedAnswer"
                )}
              </Button>
            )}
          </Flex>

          <Flex>
            <FileButton
              onChange={handleFile}
              accept="image/*,video/*,audio/*, .pdf"
            >
              {(props) => (
                <ActionIcon {...props} c="black" bg="white">
                  <RiAttachment2 size={20} />
                </ActionIcon>
              )}
            </FileButton>

            <ActionIcon onClick={handleEmojiClickButton} c="black" bg="white">
              <LuSmile size={20} />
            </ActionIcon>

            <Can permission={{ module: "TASK", action: "CREATE" }}>
              <ActionIcon
                onClick={onCreateTask}
                c="black"
                bg="white"
                title={getLanguageByKey("New Task")}
              >
                <FaTasks size={20} />
              </ActionIcon>
            </Can>
          </Flex>
        </Flex>
      </Box>

      {showEmojiPicker &&
        createPortal(
          <div
            className="emoji-picker-popup"
            style={{
              position: "absolute",
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left,
              zIndex: 1000,
            }}
            onMouseEnter={() => setShowEmojiPicker(true)}
            onMouseLeave={() => setShowEmojiPicker(false)}
          >
            <EmojiPicker
              onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
            />
          </div>,
          document.body
        )}
    </>
  );
};
