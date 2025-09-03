import { Link } from "react-router-dom";
import { BsThreeDots, BsTagsFill } from "react-icons/bs";
import { FaHeadphones, FaFingerprint } from "react-icons/fa6";
import {
  MdAccessTime,
  MdOutlineLocalPhone,
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
import { parseTags } from "../../../stringUtils";
import { parseServerDate, getLanguageByKey } from "../../utils";
import { Tag } from "../../Tag";
import { DEFAULT_PHOTO, YYYY_MM_DD, HH_mm } from "../../../app-constants";
import Can from "../../CanComponent/Can";

const { colors } = DEFAULT_THEME;

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
  const tags = parseTags(ticket.tags);
  const firstClient = ticket.clients?.[0];
  const responsibleId = String(ticket.technician_id || "");

  return (
    <Link to={`/leads/${ticket.id}`}>
      <Card
        withBorder
        shadow="sm"
        radius="lg"
        pos="relative"
        bg="white"
        p="8px"
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
                  <Box
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    pos="absolute"
                    right="16px"
                    top="16px"
                  >
                    <Menu shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="default">
                          <BsThreeDots />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        {canEdit && (
                          <Menu.Item
                            onClick={() => onEditTicket(ticket)}
                            leftSection={<MdModeEdit />}
                          >
                            {getLanguageByKey("edit")}
                          </Menu.Item>
                        )}

                        {canEdit && canDelete && <Divider />}

                        {canDelete && (
                          <Menu.Item
                            onClick={() => onDeleteTicket(ticket.id)}
                            color="red"
                            leftSection={<MdDelete />}
                          >
                            {getLanguageByKey("delete")}
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Box>
                );
              }}
            </Can>
          )}
        </Can>

        <Box p="8">
          <Flex align="center" gap="xs">
            <Box w="48" h="48">
              <Image
                src={ticket?.photo_url ? ticket.photo_url : DEFAULT_PHOTO}
                fallbackSrc={DEFAULT_PHOTO}
              />
            </Box>

            <Box>
              {(firstClient?.name || firstClient?.surname) && (
                <Text fw="bold" c={colors.dark[4]}>
                  {firstClient.name} {firstClient.surname}
                </Text>
              )}

              {ticket.contact && (
                <Text c={colors.dark[4]}>{ticket.contact}</Text>
              )}

              <Flex c={colors.dark[3]} align="center" gap="4">
                <MdAccessTime />
                <Flex direction="column">
                  <Text size="xs">
                    {parseServerDate(ticket.creation_date)?.format(YYYY_MM_DD)}:{" "}
                    {parseServerDate(ticket.creation_date)?.format(HH_mm)}
                  </Text>
                  <Text size="xs">
                    {parseServerDate(ticket.last_interaction_date)?.format(YYYY_MM_DD)}
                    {ticket.last_interaction_date
                      ? `: ${parseServerDate(ticket.last_interaction_date)?.format(HH_mm)}`
                      : null}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          </Flex>

          <Divider my="xs" />

          <Flex direction="column" gap="8" mb="8">
            <Flex align="center" gap="8">
              <FaFingerprint />
              <Text>{ticket.id}</Text>
            </Flex>

            {firstClient?.phone && (
              <Flex align="center" gap="8">
                <MdOutlineLocalPhone />
                <Text>{firstClient?.phone}</Text>
              </Flex>
            )}
          </Flex>

          {!!tags?.length && (
            <Flex pos="relative" align="center" gap="8">
              <Box w="16px">
                <BsTagsFill size="16" />
              </Box>
              <Flex gap="4px" style={{ overflow: "hidden" }}>
                {tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Flex>
              <Box
                pos="absolute"
                right="0px"
                w="60px"
                h="100%"
                style={{
                  background:
                    "linear-gradient(to right, rgba(255, 255, 255, 0) 0%, #ffffff 80%)",
                }}
              />
            </Flex>
          )}

          {technician?.value && <Divider my="xs" />}

          {technician?.value && (
            <Flex align="center" gap="8">
              <FaHeadphones />
              <Text>
                {technician.label} #{technician.value}
              </Text>
            </Flex>
          )}
        </Box>
      </Card>
    </Link>
  );
};
