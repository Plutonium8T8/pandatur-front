import { Text, Box, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey, isStoreFile } from "../utils";
import { Audio } from "../Audio";
import { File } from "../File";
import { MEDIA_TYPE } from "../../app-constants";
import { Image as CheckedImage } from "../Image";

const { colors } = DEFAULT_THEME;

const spliceMessage = (message) => {
  return `${message.slice(0, 15)}...`;
};

const textMessageStyle = {
  wordWrap: "break-word",
  overflowWrap: "break-word",
  wordBreak: "break-word",
};

export const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return MEDIA_TYPE.IMAGE;
  if (mimeType.startsWith("video/")) return MEDIA_TYPE.VIDEO;
  if (mimeType.startsWith("audio/")) return MEDIA_TYPE.AUDIO;
  return "file";
};

export const renderContent = (msg) => {
  if (!msg.message?.trim()) {
    return (
      <div style={textMessageStyle}>
        {getLanguageByKey("Mesajul lipseste")}
      </div>
    );
  }

  const type = msg.mtype || msg.media_type;

  switch (type) {
    case MEDIA_TYPE.IMAGE:
      return (
        <CheckedImage
          url={msg.message}
          style={{ maxWidth: 500, maxHeight: 500 }}
          renderFallbackImage={() => (
            <Text c="red" size="xs">
              {getLanguageByKey("failToLoadImage")}
            </Text>
          )}
        />
      );

    case MEDIA_TYPE.VIDEO:
      return (
        <video
          controls
          style={{ borderRadius: 8, maxWidth: 500, maxHeight: 500 }}
        >
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

    case MEDIA_TYPE.IG_REEL:
      return (
        <video
          controls
          style={{ borderRadius: "8", maxWidth: 500, maxHeight: 500 }}
        >
          <source src={msg.message} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );

    case MEDIA_TYPE.SHARE: {
      const isImage = msg.message.match(/\.(jpeg|jpg|png|webp|gif|photo)$/i);

      return isImage ? (
        <CheckedImage
          url={msg.message}
          style={{ maxWidth: 500, maxHeight: 500 }}
          renderFallbackImage={() => (
            <Text c="red" size="xs">
              {getLanguageByKey("failToLoadImage")}
            </Text>
          )}
        />
      ) : (
        <Text>{msg.message}</Text>
      );
    }

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