import {
  Textarea,
  Flex,
  ActionIcon,
  Box,
  Button,
  Select,
  Loader,
  FileButton,
  Badge,
  CloseButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaTasks, FaEnvelope } from "react-icons/fa";
import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile, LuStickyNote } from "react-icons/lu";
import { RiAttachment2 } from "react-icons/ri";
import { getLanguageByKey, socialMediaIcons } from "../../../utils";
import { getEmailsByGroupTitle } from "../../../utils/emailUtils";
import { getPandaNumbersByGroupTitle } from "../../../utils/pandaNumbersUtils";
import { templateOptions } from "../../../../FormOptions";
import { useUploadMediaFile } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import { useApp, useSocket, useUser } from "@hooks";
import Can from "../../../CanComponent/Can";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { api } from "../../../../api";
import { EmailForm } from "../EmailForm/EmailForm";
import { getPagesByType } from "../../../../constants/webhookPagesConfig";
import "./ChatInput.css";

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  platformOptions,
  selectedPlatform,
  changePlatform,
  contactOptions,
  changeContact,
  selectedPageId,
  changePageId,
  currentClient,
  loading,
  onCreateTask,
  ticketId,
  unseenCount,
  onToggleNoteComposer,
  personalInfo,
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

  const [attachments, setAttachments] = useState([]);
  const textAreaRef = useRef(null);

  const [actionNeeded, setActionNeeded] = useState(false);

  const { uploadFile } = useUploadMediaFile();
  const { userId } = useUser();
  const { seenMessages, socketRef } = useSocket();
  const { markMessagesAsRead } = useApp();

  // Получаем данные о воронке и email адресах
  const groupTitle = personalInfo?.group_title || "";
  const fromEmails = getEmailsByGroupTitle(groupTitle);

  // Мемоизированные списки номеров панды по воронке
  const whatsappNumbers = useMemo(() =>
    getPandaNumbersByGroupTitle(groupTitle, 'whatsapp'),
    [groupTitle]
  );

  const viberNumbers = useMemo(() =>
    getPandaNumbersByGroupTitle(groupTitle, 'viber'),
    [groupTitle]
  );

  const telegramNumbers = useMemo(() =>
    getPandaNumbersByGroupTitle(groupTitle, 'telegram'),
    [groupTitle]
  );

  const isWhatsApp = currentClient?.payload?.platform?.toUpperCase() === "WHATSAPP";
  const isViber = currentClient?.payload?.platform?.toUpperCase() === "VIBER";
  const isTelegram = currentClient?.payload?.platform?.toUpperCase() === "TELEGRAM";

  // Получаем список page_id для выбранной платформы
  const pageIdOptions = useMemo(() => {
    if (!selectedPlatform) return [];
    
    const pages = getPagesByType(selectedPlatform);
    return pages.map(page => ({
      value: page.page_id,
      label: `${page.page_name} (${page.group_title})`
    }));
  }, [selectedPlatform]);

  // Автоматически выбираем первый подходящий номер при изменении воронки
  useEffect(() => {
    if (!pandaNumber && (isWhatsApp || isViber || isTelegram)) {
      const currentNumbers = isViber ? viberNumbers : (isTelegram ? telegramNumbers : whatsappNumbers);
      if (currentNumbers.length > 0) {
        setPandaNumber(currentNumbers[0].value);
      }
    }
  }, [groupTitle, isWhatsApp, isViber, isTelegram, whatsappNumbers, viberNumbers, telegramNumbers, pandaNumber]);
  const isPhoneChat = isWhatsApp || isViber;
  const needsPandaNumber = isWhatsApp || isViber || isTelegram;

  // Устанавливаем actionNeeded из тикета при загрузке
  useEffect(() => {
    if (ticket) {
      console.log("🎫 Setting actionNeeded from ticket:", {
        ticketId,
        action_needed: ticket.action_needed,
        action_needed_type: typeof ticket.action_needed
      });
      setActionNeeded(Boolean(ticket.action_needed));
      console.log("✅ Set actionNeeded from ticket:", Boolean(ticket.action_needed));
    }
  }, [ticket, ticketId]);

  // Устанавливаем actionNeeded = true если есть непрочитанные сообщения
  useEffect(() => {
    // console.log("👀 unseenCount changed:", { 
    //   unseenCount, 
    //   currentActionNeeded: actionNeeded,
    //   ticketActionNeeded: ticket?.action_needed
    // });

    if (unseenCount > 0) {
      // console.log("✅ Setting actionNeeded = true due to unseenCount:", unseenCount);
      setActionNeeded(true);
    }
  }, [unseenCount, actionNeeded, ticket?.action_needed]);

  const handleEmojiClickButton = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const emojiPickerHeight = 450;
    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX,
    });
    setShowEmojiPicker((prev) => !prev);
  };

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
    if (!files.length) return;
    e.preventDefault();
    await uploadAndAddFiles(files);
  };

  const removeAttachment = (url) => {
    setAttachments((prev) => prev.filter((a) => a.media_url !== url));
  };

  const clearState = () => {
    setMessage("");
    setAttachments([]);
    setTemplate(null);
  };

  const buildBasePayload = () => ({
    panda_number: needsPandaNumber ? pandaNumber : undefined,
    client_phone: isPhoneChat ? currentClient?.payload?.phone : undefined,
  });

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

  const sendMessage = async () => {
    const trimmedText = message.trim();
    const hasText = !!trimmedText;
    const hasFiles = attachments.length > 0;

    if (!hasText && !hasFiles) return;

    try {
      // Отправляем каждый медиа файл отдельным сообщением
      for (const att of attachments) {
        const payloadFile = {
          ...buildBasePayload(),
          media_url: att.media_url,
          message_text: null,
          last_message_type: att.media_type,
        };
        await Promise.resolve(onSendMessage(payloadFile));
      }

      // Отправляем текст отдельным сообщением (если есть)
      if (hasText) {
        const payloadText = {
          ...buildBasePayload(),
          media_url: null,
          message_text: trimmedText,
          last_message_type: "text",
        };
        await Promise.resolve(onSendMessage(payloadText));
      }

      handleMarkAsRead();
      clearState();
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleMarkActionResolved = async () => {
    if (!ticketId) return;
    const newValue = !actionNeeded;
    console.log("🔄 Toggling action_needed:", {
      current: actionNeeded,
      new: newValue,
      ticketId
    });

    try {
      await api.tickets.updateById({
        id: ticketId,
        action_needed: newValue ? "true" : "false",
      });
      setActionNeeded(newValue);
      setTicket((prev) => ({ ...prev, action_needed: newValue }));
      console.log("✅ Successfully updated action_needed to:", newValue);
    } catch (e) {
      console.error("Failed to update action_needed", e);
    }
    handleMarkAsRead();
  };

  const handleEmailSend = async (emailData) => {
    try {
      console.log("Email sent successfully:", emailData);
      setShowEmailForm(false);
      // ✅ email тоже считаем реакцией — помечаем чат прочитанным
      handleMarkAsRead();
    } catch (e) {
      console.error("Failed to process email response", e);
    }
  };

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
                background: "var(--crm-ui-kit-palette-background-default)",
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
                style={{ position: "absolute", top: 2, right: 2, background: "var(--crm-ui-kit-palette-background-primary)" }}
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
              {/* {socialMediaIcons[currentClient?.payload?.platform] && (
                <Flex>{socialMediaIcons[currentClient.payload.platform]}</Flex>
              )} */}
              {loading ? (
                <Loader size="xs" />
              ) : (
                <Flex direction="column" gap="xs" w="100%">
                  {/* Первый ряд: Platform + Template */}
                  <Flex gap="md" w="100%">
                    {/* 1. Platform select */}
                    <Select
                      onChange={changePlatform}
                      className="w-full"
                      placeholder="Выберите платформу"
                      value={selectedPlatform}
                      data={platformOptions}
                      searchable
                      clearable
                      label="Платформа"
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px'
                        }
                      }}
                    />
                    
                    {/* 2. Template select */}
                    <Select
                      searchable
                      label="Шаблон"
                      className="w-full"
                      onChange={(value) => {
                        setMessage(value ? templateOptions[value] : "");
                        setTemplate(value);
                      }}
                      value={template}
                      placeholder={getLanguageByKey("select_message_template")}
                      data={Object.keys(templateOptions).map((key) => ({
                        value: key,
                        label: key,
                      }))}
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px'
                        }
                      }}
                    />
                  </Flex>
                  
                  {/* Второй ряд: User pick number + Void select */}
                  <Flex gap="md" w="100%">
                    {/* 3. User pick number (contact) */}
                    <Select
                      onChange={changeContact}
                      placeholder="Выберите контакт"
                      value={currentClient?.value}
                      data={contactOptions}
                      label="Контакт"
                      className="w-full"
                      searchable
                      clearable
                      disabled={!selectedPlatform}
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px'
                        }
                      }}
                    />
                    
                    {/* 4. Page ID select */}
                    <Select
                      searchable
                      label="Страница Panda"
                      placeholder="Выберите страницу"
                      value={selectedPageId}
                      onChange={changePageId}
                      data={pageIdOptions}
                      className="w-full"
                      disabled={!selectedPlatform}
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px',
                        }
                      }}
                    />
                  </Flex>
                </Flex>
              )}
              {isWhatsApp && (
                <Select
                  className="w-full"
                  placeholder={getLanguageByKey("select_sender_number")}
                  value={pandaNumber}
                  onChange={setPandaNumber}
                  data={whatsappNumbers}
                />
              )}
              {isViber && (
                <Select
                  className="w-full"
                  placeholder={getLanguageByKey("select_sender_number_viber")}
                  value={pandaNumber}
                  onChange={setPandaNumber}
                  data={viberNumbers}
                />
              )}
              {isTelegram && (
                <Select
                  className="w-full"
                  placeholder={getLanguageByKey("select_sender_number_telegram")}
                  value={pandaNumber}
                  onChange={setPandaNumber}
                  data={telegramNumbers}
                />
              )}
            </Flex>

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
                    (isViber && !pandaNumber) ||
                    (isTelegram && !pandaNumber)
                  }
                  variant="filled"
                  onClick={sendMessage}
                  loading={opened}
                >
                  {getLanguageByKey("Trimite")}
                </Button>

                <Button 
                  onClick={clearState} 
                  variant="default" 
                  color="gray"
                  styles={{
                    root: {
                      backgroundColor: 'var(--mantine-color-gray-2) !important',
                      color: 'var(--mantine-color-gray-7) !important',
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-gray-3) !important',
                      }
                    }
                  }}
                >
                  {getLanguageByKey("Anulează")}
                </Button>

                <Flex gap="xs">
                  <Button
                    onClick={handleMarkAsRead}
                    variant="filled"
                    styles={{
                      root: unseenCount > 0 ? {
                        backgroundColor: 'var(--mantine-color-red-6) !important',
                        color: 'white !important',
                        '&:hover': {
                          backgroundColor: 'var(--mantine-color-red-7) !important',
                        }
                      } : {
                        backgroundColor: 'var(--crm-ui-kit-palette-link-primary) !important',
                        color: 'white !important',
                        '&:hover': {
                          backgroundColor: 'var(--crm-ui-kit-palette-link-hover-primary) !important',
                        }
                      }
                    }}
                  >
                    {unseenCount > 0
                      ? getLanguageByKey("ReadChat")
                      : getLanguageByKey("ChatRead")}
                  </Button>
                </Flex>

                <Button
                  onClick={handleMarkActionResolved}
                  variant="filled"
                  styles={{
                    root: actionNeeded ? {
                      backgroundColor: 'var(--mantine-color-orange-6) !important',
                      color: 'white !important',
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-orange-7) !important',
                      }
                    } : {
                      backgroundColor: 'var(--crm-ui-kit-palette-link-primary) !important',
                      color: 'white !important',
                      '&:hover': {
                        backgroundColor: 'var(--crm-ui-kit-palette-link-hover-primary) !important',
                      }
                    }
                  }}
                >
                  {getLanguageByKey(
                    actionNeeded ? "Acțiune necesară" : "Nu acțiune necesară"
                  )}
                </Button>
              </Flex>

              <Flex gap="xs">
                <ActionIcon
                  onClick={() => setShowEmailForm(true)}
                  variant="default"
                  title="Trimite Email"
                >
                  <FaEnvelope size={20} />
                </ActionIcon>

                <FileButton
                  onChange={handleFileButton}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
                  multiple
                  title={getLanguageByKey("attachFiles")}
                >
                  {(props) => (
                    <ActionIcon {...props} variant="default" title={getLanguageByKey("attachFiles")}>
                      <RiAttachment2 size={20} />
                    </ActionIcon>
                  )}
                </FileButton>

                <ActionIcon onClick={handleEmojiClickButton} variant="default">
                  <LuSmile size={20} />
                </ActionIcon>

                <ActionIcon
                  onClick={onToggleNoteComposer}
                  variant="default"
                  title={getLanguageByKey("Заметка")}
                >
                  <LuStickyNote size={20} />
                </ActionIcon>

                <Can permission={{ module: "TASK", action: "CREATE" }}>
                  <ActionIcon
                    onClick={onCreateTask}
                    variant="default"
                    title={getLanguageByKey("New Task")}
                  >
                    <FaTasks size={20} />
                  </ActionIcon>
                </Can>
              </Flex>
            </Flex>
          </>
        ) : (
          <EmailForm
            onSend={handleEmailSend}
            onCancel={() => setShowEmailForm(false)}
            ticketId={ticketId}
            clientEmail={currentClient?.payload?.email}
            ticketClients={platformOptions}
            groupTitle={groupTitle}
            fromEmails={fromEmails}
          />
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
