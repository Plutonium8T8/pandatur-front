import { Box, Flex, Image, Text, Badge } from "@mantine/core";
import { DEFAULT_PHOTO } from "../../../../app-constants";
import { WorkflowTag } from "../../../Workflow/components";
import dayjs from "dayjs";
import { HH_mm, DD_MM_YYYY__HH_mm_ss } from "../../../../app-constants";
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
        p="5"
        key={chat.id}
        className={`chat-item ${chat.id === selectTicketId ? "active" : ""}`}
        onClick={() => onHandleTicketClick(chat.id)}
        data-ticket-id={chat.id}
        pos="relative"
      >
        {chat.unseen_count > 0 && (
          <Box pos="absolute" right="5px">
            <Badge size="md" bg="red" circle>
              {chat.unseen_count}
            </Badge>
          </Box>
        )}
        <Flex gap="5">
          <Image
            w={50}
            h={50}
            radius="50%"
            src={chat?.photo_url ? chat.photo_url : DEFAULT_PHOTO}
            fallbackSrc={DEFAULT_PHOTO}
          />
          <div>
            <Text>{chat.contact || "no contact"}</Text>
            <Text>{chat.id ? `Lead: #${chat.id}` : "no id"}</Text>
            <WorkflowTag type={chat.workflow || "no workflow"} />
          </div>
        </Flex>

        <Flex justify="space-between" gap="6">
          <Box w="80%">
            <Text truncate>{chat.last_message || "No messages"}</Text>
          </Box>
          <Text>
            {dayjs(chat.time_sent, DD_MM_YYYY__HH_mm_ss).format(HH_mm)}
          </Text>
        </Flex>
      </Box>
    </div>
  );
};
