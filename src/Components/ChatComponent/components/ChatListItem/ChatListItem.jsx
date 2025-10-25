import { Box, Flex, Image, Text, Badge, Divider, Menu, ActionIcon } from "@mantine/core";
import { Link } from "react-router-dom";
import { HiSpeakerWave } from "react-icons/hi2";
import { FaFingerprint } from "react-icons/fa6";
import { IoIosVideocam } from "react-icons/io";
import { IoCall } from "react-icons/io5";
import { FiLink2 } from "react-icons/fi";
import { TbPhoto } from "react-icons/tb";
import { GrAttachment } from "react-icons/gr";
import { FaEnvelope } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { IoCheckmarkDone } from "react-icons/io5";
import { MdPendingActions } from "react-icons/md";
import { useState, useEffect } from "react";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE, TYPE_SOCKET_EVENTS } from "@app-constants";
import { Tag } from "@components";
import { priorityTagColors, parseServerDate, getLanguageByKey } from "@utils";
import { useSocket, useApp, useUser } from "@hooks";
import { api } from "../../../../api";
import "./ChatListItem.css";

const MESSAGE_INDICATOR = {
  [MEDIA_TYPE.IMAGE]: (
    <Flex c="dimmed" align="center" gap="8">
      <TbPhoto />
      <Text h="20px" size="sm">
        {getLanguageByKey("photo")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.VIDEO]: (
    <Flex c="dimmed" align="center" gap="8">
      <IoIosVideocam />
      <Text h="20px" size="sm">
        {getLanguageByKey("video")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.AUDIO]: (
    <Flex c="dimmed" align="center" gap="8">
      <HiSpeakerWave />
      <Text h="20px" size="sm">
        {getLanguageByKey("audio")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.FILE]: (
    <Flex c="dimmed" align="center" gap="8">
      <GrAttachment />
      <Text h="20px" size="sm">
        {getLanguageByKey("file")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.URL]: (
    <Flex c="dimmed" align="center" gap="8">
      <FiLink2 />
      <Text h="20px" size="sm">
        {getLanguageByKey("link")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.CALL]: (
    <Flex c="dimmed" align="center" gap="8">
      <IoCall />
      <Text h="20px" size="sm">
        {getLanguageByKey("call")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.EMAIL]: (
    <Flex c="dimmed" align="center" gap="8">
      <FaEnvelope />
      <Text h="20px" size="sm">
        {getLanguageByKey("email")}
      </Text>
    </Flex>
  ),
};

export const ChatListItem = ({ chat, style, selectTicketId }) => {
  const formatDate = parseServerDate(chat.time_sent);
  const [actionNeeded, setActionNeeded] = useState(chat.action_needed);

  const { userId } = useUser();
  const { seenMessages, socketRef } = useSocket();
  const { markMessagesAsRead, getTicketById } = useApp();

  // Получаем актуальное состояние action_needed из AppContext при загрузке
  useEffect(() => {
    const currentTicket = getTicketById(chat.id);
    if (currentTicket && currentTicket.action_needed !== actionNeeded) {
      console.log("🔄 ChatListItem: Syncing actionNeeded from AppContext:", {
        ticketId: chat.id,
        localActionNeeded: actionNeeded,
        serverActionNeeded: currentTicket.action_needed
      });
      setActionNeeded(Boolean(currentTicket.action_needed));
    }
  }, [chat.id, getTicketById, actionNeeded]);

  // Слушаем обновления тикета через WebSocket
  useEffect(() => {
    const handleTicketUpdate = (event) => {
      const { ticketId: updatedTicketId } = event.detail;
      if (updatedTicketId === chat.id) {
        // Получаем обновленные данные тикета из AppContext
        const updatedTicket = getTicketById(chat.id);
        if (updatedTicket) {
          console.log("🔄 ChatListItem: Ticket updated via WebSocket:", {
            ticketId: chat.id,
            localActionNeeded: actionNeeded,
            serverActionNeeded: updatedTicket.action_needed,
            unseen_count: updatedTicket.unseen_count
          });
          // Обновляем локальное состояние из сервера
          setActionNeeded(Boolean(updatedTicket.action_needed));
        }
      }
    };

    window.addEventListener('ticketUpdated', handleTicketUpdate);
    
    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdate);
    };
  }, [chat.id, getTicketById, actionNeeded]);

  // Получаем фото пользователя - сначала из тикета, потом из клиентов
  const getUserPhoto = () => {
    // Если есть фото в тикете
    if (chat.photo_url && chat.photo_url.trim() !== "") {
      return chat.photo_url;
    }

    // Если есть клиенты с фото
    if (chat.clients && chat.clients.length > 0) {
      const clientWithPhoto = chat.clients.find(client => client.photo && client.photo.trim() !== "");
      if (clientWithPhoto) {
        return clientWithPhoto.photo;
      }
    }

    // Возвращаем null для использования fallback
    return null;
  };

  const userPhoto = getUserPhoto();

  // Обработчик для пометки чата как прочитанного
  // ВАЖНО: НЕ меняет action_needed - только читает сообщения
  const handleMarkAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!chat.id) return;

    console.log("📖 ChatListItem: Marking chat as read:", {
      ticketId: chat.id,
      currentActionNeeded: actionNeeded,
      unseenCount: chat.unseen_count
    });

    try {
      // Отправляем CONNECT через сокет
      if (socketRef?.current?.readyState === WebSocket.OPEN) {
        const connectPayload = {
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: [chat.id] },
        };
        socketRef.current.send(JSON.stringify(connectPayload));
      }

      // Помечаем сообщения как прочитанные
      seenMessages(chat.id, userId);
      markMessagesAsRead(chat.id, chat.unseen_count || 0);
      
      // НЕ меняем action_needed - только читаем чат
      console.log("✅ ChatListItem: Chat marked as read, actionNeeded remains:", actionNeeded);
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  // Обработчик для переключения флага "Не нужна акция"
  const handleToggleActionNeeded = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!chat.id) return;

    try {
      const newValue = !actionNeeded;
      await api.tickets.updateById({
        id: chat.id,
        action_needed: newValue ? "true" : "false",
      });
      // НЕ меняем локальное состояние - ждем TICKET_UPDATE от сервера
      console.log("🔄 NeedAnswer clicked, waiting for TICKET_UPDATE from server");
      
      // Отправляем SEEN событие через сокет (как в ChatInput)
      if (socketRef?.current?.readyState === WebSocket.OPEN) {
        const connectPayload = {
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: [chat.id] },
        };
        socketRef.current.send(JSON.stringify(connectPayload));
        console.log("[SEEN] CONNECT отправлен для тикета:", chat.id);
      }
      
      // Помечаем сообщения как прочитанные
      seenMessages(chat.id, userId);
      markMessagesAsRead(chat.id, chat.unseen_count || 0);
    } catch (error) {
      console.error("Failed to update action_needed:", error);
    }
  };

  return (
    <div style={style}>
      <Link to={`/chat/${chat.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          py="10px"
          pr="10px"
          pl="10px"
          key={chat.id}
          className={`chat-item ${chat.id === selectTicketId ? "active" : ""} pointer`}
          data-ticket-id={chat.id}
          pos="relative"
        >
          {/* Индикатор непрочитанных сообщений */}
          {chat.unseen_count > 0 && (
            <Box pos="absolute" right="6px" className="right">
              <Badge size="md" bg="red" circle className="right-count">
                {chat.unseen_count}
              </Badge>
            </Box>
          )}

          <Flex gap="12" align="center" w="100%">
            <Image
              w={46}
              h={46}
              radius="50%"
              src={userPhoto}
              fallbackSrc={DEFAULT_PHOTO}
            />

            <Box w="75%">
              <Flex align="center" gap="4">
                <Text truncate>{chat.contact || "-"}</Text>

                {/* Меню с тремя точками рядом с именем */}
                <Menu position="bottom-start" withinPortal>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <BsThreeDots size={14} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IoCheckmarkDone size={16} />}
                      onClick={handleMarkAsRead}
                    >
                      {getLanguageByKey("ReadChat")}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<MdPendingActions size={16} />}
                      onClick={handleToggleActionNeeded}
                      color={actionNeeded ? "orange" : "gray"}
                    >
                      {getLanguageByKey("NeedAnswer")}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Flex>

              <Flex gap="12">
                <Flex align="center" gap="4">
                  <FaFingerprint />
                  <Text>{chat.id || "-"}</Text>
                </Flex>

                {/* <Divider orientation="vertical" />
              <Tag type={priorityTagColors[chat.priority]}>{chat.priority}</Tag> */}
              </Flex>
            </Box>
          </Flex>

          <Flex justify="space-between" gap="6" align="center">
            <Box mt="4px" w="60%">
              {MESSAGE_INDICATOR[chat.last_message_type] || (
                <Text h="20px" c="dimmed" size="sm" truncate>
                  {chat.last_message}
                </Text>
              )}
            </Box>
            <Text size="sm" c="dimmed">
              {formatDate ? formatDate.format("DD.MM.YYYY")
                : null}
            </Text>
            <Text size="sm" c="dimmed">
              {formatDate ? formatDate.format(HH_mm)
                : null}
            </Text>
          </Flex>
        </Box>
      </Link>

      <Divider color="var(--crm-ui-kit-palette-border-default)" />
    </div>
  );
};
