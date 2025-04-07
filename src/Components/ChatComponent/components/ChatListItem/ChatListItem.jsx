import { Box, Flex, Image, Text, Badge, Divider } from "@mantine/core";
import dayjs from "dayjs";
import {
  DEFAULT_PHOTO,
  HH_mm,
  DD_MM_YYYY__HH_mm_ss,
} from "../../../../app-constants";
import { Tag } from "../../../Tag";
import { priorityTagColors } from "../../../utils";
import "./ChatListItem.css";

export const ChatListItem = ({
  chat,
  style,
  onHandleTicketClick,
  selectTicketId,
}) => {
  return (
    <div style={style}>
      <Box
        py="10px"
        pr="16px"
        pl="24px"
        key={chat.id}
        className={`chat-item ${chat.id === selectTicketId ? "active" : ""} pointer`}
        onClick={() => onHandleTicketClick(chat.id)}
        data-ticket-id={chat.id}
        pos="relative"
      >
        {chat.unseen_count > 0 && (
          <Box pos="absolute" right="16px">
            <Badge size="md" bg="red" circle>
              {chat.unseen_count}
            </Badge>
          </Box>
        )}
        <Flex gap="12" align="center">
          <Image
            w={36}
            h={36}
            radius="50%"
            src={chat?.photo_url ? chat.photo_url : DEFAULT_PHOTO}
            fallbackSrc={DEFAULT_PHOTO}
          />
          <div>
            <Text>{chat.contact || "-"}</Text>
            <Flex gap="12">
              <Text>{chat.id ? `#${chat.id}` : "-"}</Text>

              <Divider orientation="vertical" />
              <Tag type={priorityTagColors[chat.priority]}>{chat.priority}</Tag>
            </Flex>
          </div>
        </Flex>

        <Flex justify="space-between" gap="6">
          <Box mt="4px" w="80%">
            <Text h="20px" c="dimmed" size="sm" truncate>
              {chat.last_message}
            </Text>
          </Box>
          <Text size="sm" c="dimmed">
            {dayjs(chat.time_sent, DD_MM_YYYY__HH_mm_ss).format(HH_mm)}
          </Text>
        </Flex>
      </Box>

      <Divider />
    </div>
  );
};
