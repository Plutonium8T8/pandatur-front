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
  DEFAULT_THEME,
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

const { colors } = DEFAULT_THEME;

const MAX_TAGS_COUNT = 2;

const renderTags = (tags) => {
  const tagList = parseTags(tags).slice(0, MAX_TAGS_COUNT);
  const isTags = tagList.some(Boolean);
  return isTags ? tagList.map((tag, index) => <Tag key={index} size="xs">{tag}</Tag>) : null;
};

export const priorityTagColors = {
  joasă: "green",
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

  return (
    <Link to={`/leads/${ticket.id}`}>
      <Card
        withBorder
        radius="md"
        pos="relative"
        bg={isMyTicket ? "#e7f5ff" : "#f8f9fa"}
        p="8px"
        style={{
          borderColor: isMyTicket ? "#339af0" : undefined,
          borderWidth: isMyTicket ? "2px" : undefined,
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
                src={ticket?.clients?.[0]?.photo || ticket?.photo_url || DEFAULT_PHOTO}
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
                    c={colors.dark[7]}
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
                  c={colors.gray[5]}
                  style={{
                    fontSize: '10px',
                    flexShrink: 0
                  }}
                >
                  #{ticket.id}
                </Text>
              </Flex>

              {/* Дата создания под именем тикета */}
              <Text
                size="xs"
                c={colors.black}
                style={{ fontSize: '14px', marginTop: '2px' }}
              >
                {parseServerDate(ticket.creation_date)?.format(YYYY_MM_DD)}
              </Text>

              {/* Номер телефона клиента */}
              {ticket?.clients?.[0]?.phone && (
                <Text
                  size="xs"
                  c={colors.dark[6]}
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
              c={colors.black}
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
              {ticket.last_message}
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
                <FaHeadphones size={12} color={colors.gray[6]} />
                <Text
                  size="xs"
                  c={colors.gray[7]}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '11px'
                  }}
                >
                  {technician.label}
                </Text>
              </Flex>
            ) : (
              <Box />
            )}

            {/* Task placeholder */}
            <Text
              size="xs"
              c={colors.gray[5]}
              style={{ fontSize: '10px' }}
            >
              Task
            </Text>
          </Flex>
        </Box>
      </Card>
    </Link>
  );
};
