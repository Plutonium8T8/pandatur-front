import {
  Textarea,
  Flex,
  ActionIcon,
  Box,
  Button,
  Select,
  Loader,
  FileButton,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaTasks, FaEnvelope } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
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
import { TYPE_SOCKET_EVENTS } from "@app-constants";
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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailFields, setEmailFields] = useState({ from: "", to: "", subject: "", body: "" });

  const actionNeededInit = useRef(undefined);
  const [actionNeeded, setActionNeeded] = useState(false);

  const { uploadFile } = useUploadMediaFile();
  const { userId } = useUser();
  const { seenMessages, socketRef } = useSocket();
  const { markMessagesAsRead } = useApp();

  const isWhatsApp = currentClient?.payload?.platform?.toUpperCase() === "WHATSAPP";
  const isViber = currentClient?.payload?.platform?.toUpperCase() === "VIBER";

  useEffect(() => {
    if (!ticketId) return;
    let mounted = true;
    const fetchTicket = async () => {
      try {
        const data = await api.tickets.getById(ticketId);
        if (mounted) {
          setTicket(data);
          setActionNeeded(Boolean(data.action_needed));
          actionNeededInit.current = Boolean(data.action_needed);
        }
      } catch (e) {
        console.error("Failed to fetch ticket", e);
      }
    };
    fetchTicket();
    return () => { mounted = false; };
  }, [ticketId]);

  useEffect(() => {
    if (actionNeededInit.current === undefined && ticket) {
      setActionNeeded(Boolean(ticket.action_needed));
      actionNeededInit.current = Boolean(ticket.action_needed);
    }
  }, [ticket, ticketId]);

  useEffect(() => {
    if (unseenCount > 0) {
      setActionNeeded(true);
    }
  }, [unseenCount]);

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
    if (!ticketId) return;
    if (socketRef?.current?.readyState === WebSocket.OPEN) {
      const connectPayload = {
        type: TYPE_SOCKET_EVENTS.CONNECT,
        data: { ticket_id: [ticketId] },
      };
      socketRef.current.send(JSON.stringify(connectPayload));
      console.log("[READ] CONNECT отправлен вручную для тикета:", ticketId);
    } else {
      console.warn("[READ] Сокет не готов к CONNECT");
    }
    seenMessages(ticketId, userId);
    markMessagesAsRead(ticketId, unseenCount);
  };

  const handleMarkActionResolved = async () => {
    if (!ticketId) return;
    const newValue = !actionNeeded;
    try {
      await api.tickets.updateById({
        id: ticketId,
        action_needed: newValue ? "true" : "false",
      });
      setActionNeeded(newValue);
      setTicket((prev) => ({ ...prev, action_needed: newValue }));
      actionNeededInit.current = newValue;
    } catch (e) {
      console.error("Failed to update action_needed", e);
    }
    handleMarkAsRead();
  };

  const sendEmail = async () => {
    try {
      await api.messages.send.email({
        ticket_id: ticketId,
        ...emailFields,
      });
      setShowEmailForm(false);
      setEmailFields({ from: "", to: "", subject: "", body: "" });
    } catch (e) {
      console.error("Failed to send email", e);
    }
  };

  return (
    <>
      <Box className="chat-input" p="16">
        {!showEmailForm ? (
          <>
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

                <Flex gap="xs">
                  <Button
                    onClick={handleMarkAsRead}
                    variant={unseenCount > 0 ? "filled" : "light"}
                    color={unseenCount > 0 ? "red" : "green"}
                  >
                    {unseenCount > 0
                      ? getLanguageByKey("ReadChat")
                      : getLanguageByKey("ChatRead")}
                  </Button>
                </Flex>

                <Button
                  onClick={handleMarkActionResolved}
                  variant="light"
                  color={actionNeeded ? "orange" : "green"}
                >
                  {getLanguageByKey(
                    actionNeeded ? "Acțiune necesară" : "Nu acțiune necesară"
                  )}
                </Button>
              </Flex>

              <Flex>
                <ActionIcon
                  onClick={() => setShowEmailForm(true)}
                  c="black"
                  bg="white"
                  title="Trimite Email"
                >
                  <FaEnvelope size={20} />
                </ActionIcon>

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
          </>
        ) : (
          <>
            <Flex justify="space-between" mb="xs">
              <Button variant="default" onClick={() => setShowEmailForm(false)}>
                ← {getLanguageByKey("Înapoi la chat")}
              </Button>
            </Flex>
            <Flex direction="column" gap="xs">
              <TextInput
                placeholder="From"
                value={emailFields.from}
                onChange={(e) =>
                  setEmailFields((prev) => ({ ...prev, from: e.target.value }))
                }
              />
              <TextInput
                placeholder="To"
                value={emailFields.to}
                onChange={(e) =>
                  setEmailFields((prev) => ({ ...prev, to: e.target.value }))
                }
              />
              <TextInput
                placeholder="Subject"
                value={emailFields.subject}
                onChange={(e) =>
                  setEmailFields((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
              <Textarea
                placeholder="Text"
                minRows={4}
                value={emailFields.body}
                onChange={(e) =>
                  setEmailFields((prev) => ({ ...prev, body: e.target.value }))
                }
              />
              <Button onClick={sendEmail}>{getLanguageByKey("Trimite Email")}</Button>
            </Flex>
          </>
        )}
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
