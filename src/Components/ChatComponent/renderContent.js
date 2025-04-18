import { Text, Box, Image, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey, isStoreFile } from "../utils";
import { Audio } from "../Audio";
import { File } from "../File";

const BROKEN_PHOTO = "/broken.png";

const { colors } = DEFAULT_THEME;

const spliceMessage = (message) => {
  return `${message.slice(0, 15)}...`;
};

export const MEDIA_TYPE = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  FILE: "file",
  URL: "url",
  CALL: "call",
};

export const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return MEDIA_TYPE.IMAGE;
  if (mimeType.startsWith("video/")) return MEDIA_TYPE.VIDEO;
  if (mimeType.startsWith("audio/")) return MEDIA_TYPE.AUDIO;
  return "file";
};

export const renderContent = (msg) => {
  if (!msg.message) {
    return (
      <div className="text-message">{getLanguageByKey("Mesajul lipseste")}</div>
    );
  }
  switch (msg.mtype) {
    case MEDIA_TYPE.IMAGE:
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
    case MEDIA_TYPE.VIDEO:
      return (
        <video controls className="video-preview">
          <source src={msg.message} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );
    case MEDIA_TYPE.AUDIO:
      return <Audio src={msg.message} />;
    case MEDIA_TYPE.FILE:
      return (
        <File
          bg={colors.gray[4]}
          label={spliceMessage(msg.message)}
          src={msg.message}
        />
      );

    default:
      const { message } = msg;

      return isStoreFile(message) ? (
        <File
          bg={colors.gray[4]}
          label={spliceMessage(message)}
          src={message}
        />
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
