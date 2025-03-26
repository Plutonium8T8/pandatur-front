import { Box, Flex, Image, Text, Badge } from "@mantine/core"
import { DEFAULT_PHOTO } from "../../../../app-constants"
import { WorkflowTag } from "../../../WorkflowTag"
import "./ChatListItem.css"

const formatDateTime = (dateString) => {
  if (!dateString) return "—"

  const parts = dateString.split(" ")
  if (parts.length !== 2) return "—"

  const [datePart, timePart] = parts
  const [day, month, year] = datePart.split("-")

  if (!day || !month || !year) return "—"

  const formattedDate = new Date(`${year}-${month}-${day}T${timePart}`)

  return (
    formattedDate.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    }) || "—"
  )
}

export const ChatListItem = ({
  chat,
  style,
  onHandleTicketClick,
  selectTicketId
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
            {chat.workflow && <WorkflowTag type={chat.workflow} />}
          </div>
        </Flex>

        <Flex justify="space-between" gap="6">
          <Box w="80%">
            <Text truncate>{chat.last_message || "No messages"}</Text>
          </Box>
          <Text>{formatDateTime(chat.time_sent)}</Text>
        </Flex>
      </Box>
    </div>
  )
}
