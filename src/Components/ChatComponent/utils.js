import { FaRegFileLines } from "react-icons/fa6";
import { Flex, Text, Box, Image } from "@mantine/core";
import { getLanguageByKey, isStoreFile } from "../utils";

const BROKEN_PHOTO = "/broken.png";

export const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

const renderFile = (source) => {
  return (
    <a href={source} target="_blank" rel="noopener noreferrer">
      <Flex c="black">
        <FaRegFileLines size="24px" />
      </Flex>
    </a>
  );
};

export const renderContent = (msg) => {
  if (!msg.message) {
    return (
      <div className="text-message">{getLanguageByKey("Mesajul lipseste")}</div>
    );
  }
  switch (msg.mtype) {
    case "image":
      return (
        <Image
          fallbackSrc={BROKEN_PHOTO}
          my="5"
          radius="md"
          src={msg.message}
          className="pointer"
          onClick={() => {
            window.open(msg.message, "_blank");
          }}
        />
      );
    case "video":
      return (
        <video controls className="video-preview">
          <source src={msg.message} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );
    case "audio":
      return (
        <audio controls>
          <source src={msg.message} type="audio/ogg" />
          {getLanguageByKey("Acest browser nu suporta audio")}
        </audio>
      );
    case "file":
      return renderFile(msg.message);
    default:
      const { message } = msg;

      return isStoreFile(message) ? (
        renderFile(message)
      ) : (
        <Box maw="600px" w="100%">
          <Text
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            truncate
          >
            {message}
          </Text>
        </Box>
      );
  }
};
