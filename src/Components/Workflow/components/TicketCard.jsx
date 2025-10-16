import { Link } from "react-router-dom";
import { BsThreeDots } from "react-icons/bs";
import { FaHeadphones } from "react-icons/fa6";
import {
  MdModeEdit,
  MdDelete,
} from "react-icons/md";
import {
  Image,
  Box,
  Card,
  Flex,
  Text,
  Divider,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { parseServerDate, getLanguageByKey } from "../../utils";
import { DEFAULT_PHOTO, YYYY_MM_DD } from "../../../app-constants";
import { parseTags } from "../../../stringUtils";
import { Tag } from "../../Tag";
import Can from "../../CanComponent/Can";
import { useUser } from "../../../hooks";

const MAX_TAGS_COUNT = 2;

const renderTags = (tags) => {
  const tagList = parseTags(tags).slice(0, MAX_TAGS_COUNT);
  const isTags = tagList.some(Boolean);
  return isTags ? tagList.map((tag, index) => <Tag key={index} size="xs">{tag}</Tag>) : null;
};

export const priorityTagColors = {
  joasă: "var(--crm-ui-kit-palette-link-primary)",
  medie: "blue",
  înaltă: "yellow",
  critică: "red",
};

export const TicketCard = ({
  ticket,
  onEditTicket,
  technicianList,
  onDeleteTicket,
  technician,
}) => {
  const { user } = useUser();
  const responsibleId = String(ticket.technician_id || "");
  const isMyTicket = user?.id && String(user.id) === responsibleId;

  // Функция для получения превью последнего сообщения
  const getLastMessagePreview = (ticket) => {
    if (!ticket.last_message) return "";
    const messageType = ticket.last_message_type;
    if (messageType === "email") {
      return `📧 ${getLanguageByKey("Email")}`;
    }
    return ticket.last_message;
  };

  return (
    <Link to={`/leads/${ticket.id}`}>
      <Card
        withBorder
        radius="md"
        pos="relative"
        p="8px"
        className={isMyTicket ? "ticket-card-my-ticket" : ""}
        style={{
          color: "var(--crm-ui-kit-palette-text-primary)",
          transition: "background-color 0.2s ease, border-color 0.2s ease"
        }}
      >
        <Box
          w="8"
          h="100%"
          pos="absolute"
          top="0"
          left="0"
          bg={priorityTagColors[ticket.priority] || "gray"}
        />

        <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
          {(canEdit) => (
            <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
              {(canDelete) => {
                if (!canEdit && !canDelete) return null;

                return (
                  <div
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "16px",
                      zIndex: 10,
                      pointerEvents: "auto"
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Menu shadow="md">
                      <Menu.Target>
                        <ActionIcon
                          variant="default"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <BsThreeDots />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        {canEdit && (
                          <Menu.Item
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditTicket(ticket);
                            }}
                            leftSection={<MdModeEdit />}
                          >
                            {getLanguageByKey("edit")}
                          </Menu.Item>
                        )}

                        {canEdit && canDelete && <Divider />}

                        {canDelete && (
                          <Menu.Item
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteTicket(ticket.id);
                            }}
                            color="red"
                            leftSection={<MdDelete />}
                          >
                            {getLanguageByKey("delete")}
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                );
              }}
            </Can>
          )}
        </Can>

        <Box p={4} pos="relative">
          {/* Фото и основная информация */}
          <Flex align="flex-start" gap="xs" >
            <Box w="48" h="48" style={{ flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}>
              <Image
                // src={ticket?.clients?.[0]?.photo || ticket?.photo_url || DEFAULT_PHOTO}
                fallbackSrc={DEFAULT_PHOTO}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              {/* Contact (имя тикета) и номер */}
              <Flex align="center" gap="4">
                {ticket.contact && (
                  <Text
                    fw="600"
                    c="var(--crm-ui-kit-palette-text-primary)"
                    size="sm"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {ticket.contact}
                  </Text>
                )}
                <Text
                  size="xs"
                  c="var(--crm-ui-kit-palette-text-secondary-light)"
                  style={{
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  #{ticket.id}
                </Text>
              </Flex>

              {/* Дата создания под именем тикета */}
              <Text
                size="xs"
                c="var(--crm-ui-kit-palette-text-secondary-dark)"
                style={{ fontSize: '14px', marginTop: '2px' }}
              >
                {parseServerDate(ticket.creation_date)?.format(YYYY_MM_DD)}
              </Text>

              {/* Номер телефона клиента */}
              {ticket?.clients?.[0]?.phone && (
                <Text
                  size="xs"
                  c="var(--crm-ui-kit-palette-text-primary)"
                  style={{ fontSize: '14px', marginTop: '2px' }}
                  fw="bold"
                >
                  {ticket.clients[0].phone}
                </Text>
              )}
            </Box>
          </Flex>

          {/* Last messages */}
          {ticket.last_message && (
            <Text
              size="xs"
              c="var(--crm-ui-kit-palette-text-secondary-light)"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
                fontSize: '12px',
              }}
            >
              {getLastMessagePreview(ticket)}
            </Text>
          )}

          {/* Tags */}
          {ticket.tags && (
            <Flex gap="4" wrap="wrap" style={{ marginTop: '4px' }}>
              {renderTags(ticket.tags)}
            </Flex>
          )}

          {/* Ответственный и Task в одной строке */}
          <Flex justify="space-between" align="center">
            {/* Ответственный (Responsabil lead) */}
            {technician?.label ? (
              <Flex align="center" gap="4">
                <FaHeadphones size={12} color="var(--crm-ui-kit-palette-text-secondary-light)" />
                <Text
                  size="sm"
                  c="var(--crm-ui-kit-palette-text-primary)"
                  fw={600}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '12px'
                  }}
                >
                  {technician.label}
                </Text>
              </Flex>
            ) : (
              <Box />
            )}

            {/* Task count */}
            <Text
              size="xs"
              c={ticket.active_task_count > 0 ? (isMyTicket ? "var(--crm-ui-kit-palette-link-primary)" : "var(--crm-ui-kit-palette-text-secondary-light)") : "var(--crm-ui-kit-palette-text-secondary-light)"}
              fw={ticket.active_task_count > 0 ? "bold" : "normal"}
              style={{
                fontSize: '10px',
                backgroundColor: ticket.active_task_count > 0 ? (isMyTicket ? "var(--crm-ui-kit-palette-surface-hover-background-color)" : "var(--crm-ui-kit-palette-background-primary)") : 'transparent',
                padding: ticket.active_task_count > 0 ? '2px 6px' : '0',
                borderRadius: ticket.active_task_count > 0 ? '4px' : '0'
              }}
            >
              {ticket.active_task_count > 0 ? `${ticket.active_task_count} tasks` : 'No tasks'}
            </Text>
          </Flex>
        </Box>
      </Card>
    </Link>
  );
};
