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
  Badge,
  CloseButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaTasks, FaEnvelope } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile, LuStickyNote } from "react-icons/lu";
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

const SEND_AS_SINGLE_BATCH = false; // <-- поставь true, если API поддерживает attachments[]

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
  onToggleNoteComposer,
}) => {
  const [opened, handlers] = useDisclosure(false);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [template, setTemplate] = useState();
  const [pandaNumber, setPandaNumber] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailFields, setEmailFields] = useState({ from: "", to: "", subject: "", body: "" });

  // новые состояния для мульти-вложений
  const [attachments, setAttachments] = useState([]); // [{ media_url, media_type, name, size }]
  const textAreaRef = useRef(null);

  const actionNeededInit = useRef(undefined);
  const [actionNeeded, setActionNeeded] = useState(false);

  const { uploadFile } = useUploadMediaFile();
  const { userId } = useUser();
  const { seenMessages, socketRef } = useSocket();
  const { markMessagesAsRead } = useApp();

  const isWhatsApp = currentClient?.payload?.platform?.toUpperCase() === "WHATSAPP";
  const isViber = currentClient?.payload?.platform?.toUpperCase() === "VIBER";
  const isPhoneChat = isWhatsApp || isViber;

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
    if (unseenCount > 0) setActionNeeded(true);
  }, [unseenCount]);

  const handleEmojiClickButton = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const emojiPickerHeight = 450;
    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX,
    });
    setShowEmojiPicker((prev) => !prev);
  };

  // ====== загрузка файлов (кнопка / dnd / paste) ======
  const uploadAndAddFiles = async (files) => {
    if (!files?.length) return;
    handlers.open();
    try {
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) {
          const media_type = getMediaType(file.type);
          setAttachments((prev) => [
            ...prev,
            { media_url: url, media_type, name: file.name, size: file.size },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      handlers.close();
      // после вставки/дропа фокус обратно в текст
      requestAnimationFrame(() => textAreaRef.current?.focus());
    }
  };

  const handleFileButton = async (fileOrFiles) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    await uploadAndAddFiles(files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    await uploadAndAddFiles(files);
  };

  const handlePaste = async (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (!files.length) return; // текст идёт как обычно
    e.preventDefault();
    await uploadAndAddFiles(files);
  };

  const removeAttachment = (url) => {
    setAttachments((prev) => prev.filter((a) => a.media_url !== url));
  };

  // ====== отправка ======
  const clearState = () => {
    setMessage("");
    setAttachments([]);
    setTemplate(null);
  };

  const buildBasePayload = () => ({
    panda_number: isPhoneChat ? pandaNumber : undefined,
    client_phone: isPhoneChat ? currentClient?.payload?.phone : undefined,
  });

  const sendMessage = async () => {
    const trimmedText = message.trim();
    const hasText = !!trimmedText;
    const hasFiles = attachments.length > 0;

    if (!hasText && !hasFiles) return;

    if (SEND_AS_SINGLE_BATCH) {
      // один payload с массивом attachments (если бэкенд поддерживает)
      const payload = {
        ...buildBasePayload(),
        message: hasText ? trimmedText : attachments[0]?.media_url, // fallback
        message_text: isPhoneChat && hasText ? trimmedText : undefined,
        last_message_type: hasFiles ? attachments[0].media_type : "text",
        attachments: attachments.map(({ media_url, media_type, name, size }) => ({
          media_url,
          media_type,
          name,
          size,
        })),
      };
      onSendMessage(payload);
    } else {
      // fallback: шлём последовательно: все файлы отдельными сообщениями + текст (если есть)
      for (const att of attachments) {
        const payloadFile = {
          ...buildBasePayload(),
          message: att.media_url,
          media_url: att.media_url,
          media_type: att.media_type,
          last_message_type: att.media_type,
        };
        // для WA/Viber текст можно дублировать как message_text при необходимости — обычно не нужно
        onSendMessage(payloadFile);
      }
      if (hasText) {
        const payloadText = {
          ...buildBasePayload(),
          message: trimmedText,
          message_text: isPhoneChat ? trimmedText : undefined,
          last_message_type: "text",
        };
        onSendMessage(payloadText);
      }
    }

    clearState();
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

  // предпросмотр вложений (простая сетка)
  const AttachmentsPreview = () => {
    if (!attachments.length) return null;
    return (
      <Flex gap={8} wrap="wrap" mb="xs">
        {attachments.map((att) => {
          const isImage = att.media_type === "image" || att.media_type === "photo" || att.media_type === "image_url";
          return (
            <Box
              key={att.media_url}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--mantine-color-gray-3)",
                background: "#fafafa",
              }}
              title={att.name}
            >
              {isImage ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img
                  src={att.media_url}
                  alt={att.name || "attachment"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Flex w="100%" h="100%" align="center" justify="center">
                  <Badge size="xs">{att.media_type}</Badge>
                </Flex>
              )}
              <CloseButton
                size="sm"
                onClick={() => removeAttachment(att.media_url)}
                style={{ position: "absolute", top: 2, right: 2, background: "white" }}
              />
            </Box>
          );
        })}
      </Flex>
    );
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

            {/* предпросмотр выбранных вложений */}
            <AttachmentsPreview />

            <Textarea
              ref={textAreaRef}
              autosize
              minRows={6}
              maxRows={8}
              w="100%"
              mb="xs"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getLanguageByKey("Introduceți mesaj")}
              onPaste={handlePaste}
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
                    (!message.trim() && attachments.length === 0) ||
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
                  onChange={handleFileButton}
                  accept="image/*,video/*,audio/*,.pdf"
                  multiple // <— выбрать сразу несколько
                >
                  {(props) => (
                    <ActionIcon {...props} c="black" bg="white" title={getLanguageByKey("attachFiles")}>
                      <RiAttachment2 size={20} />
                    </ActionIcon>
                  )}
                </FileButton>

                <ActionIcon onClick={handleEmojiClickButton} c="black" bg="white">
                  <LuSmile size={20} />
                </ActionIcon>

                <ActionIcon
                  onClick={onToggleNoteComposer}
                  c="black"
                  bg="white"
                  title={getLanguageByKey("Заметка")}
                >
                  <LuStickyNote size={20} />
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
