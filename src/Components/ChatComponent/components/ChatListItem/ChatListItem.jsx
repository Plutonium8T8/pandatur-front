import { Box, Flex, Image, Text, Badge, Divider } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { HiSpeakerWave } from "react-icons/hi2";
import { FaFingerprint } from "react-icons/fa6";
import { IoIosVideocam } from "react-icons/io";
import { IoCall } from "react-icons/io5";
import { FiLink2 } from "react-icons/fi";
import { TbPhoto } from "react-icons/tb";
import { GrAttachment } from "react-icons/gr";
import { useMessagesContext } from "@hooks";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE } from "@app-constants";
import { Tag } from "@components";
import { priorityTagColors, parseServerDate, getLanguageByKey } from "@utils";
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
};

export const ChatListItem = ({ chat, style, selectTicketId }) => {
  const navigate = useNavigate();
  const { getUserMessages } = useMessagesContext();

  const formatDate = parseServerDate(chat.time_sent);

  const choseChat = async (id) => {
    await getUserMessages(id);
    navigate(`/chat/${id}`);
  };

  return (
    <div style={style}>
      <Box
        py="10px"
        pr="16px"
        pl="24px"
        key={chat.id}
        className={`chat-item ${chat.id === selectTicketId ? "active" : ""} pointer`}
        onClick={() => choseChat(chat.id)}
        data-ticket-id={chat.id}
        pos="relative"
      >
        {chat.unseen_count > 0 && (
          <Box pos="absolute" right="16px" className="right">
            <Badge size="md" bg="red" circle className="right-count">
              {chat.unseen_count}
            </Badge>
          </Box>
        )}

        <Flex gap="12" align="center" w="100%">
          <Image
            w={36}
            h={36}
            radius="50%"
            fallbackSrc={DEFAULT_PHOTO}
          />

          <Box w="75%">
            <Text truncate>{chat.contact || "-"}</Text>

            <Flex gap="12">
              <Flex align="center" gap="4">
                <FaFingerprint />
                <Text>{chat.id || "-"}</Text>
              </Flex>

              <Divider orientation="vertical" />
              <Tag type={priorityTagColors[chat.priority]}>{chat.priority}</Tag>
            </Flex>
          </Box>
        </Flex>

        <Flex justify="space-between" gap="6">
          <Box mt="4px" w="80%">
            {MESSAGE_INDICATOR[chat.last_message_type] || (
              <Text h="20px" c="dimmed" size="sm" truncate>
                {chat.last_message}
              </Text>
            )}
          </Box>
          <Text size="sm" c="dimmed">
            {formatDate ? formatDate.format(HH_mm) : null}
          </Text>
        </Flex>
      </Box>

      <Divider />
    </div>
  );
};
