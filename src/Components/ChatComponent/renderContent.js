import { Text, Box, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey, isStoreFile } from "../utils";
import { Audio } from "../Audio";
import { File } from "../File";
import { MEDIA_TYPE } from "../../app-constants";
import { Image as CheckedImage } from "../Image";
import { EmailMessage } from "./components/EmailMessage/EmailMessage";

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
  // Определяем URL для медиа контента
  const mediaUrl = msg.media_url || msg.message;
  
  if (!mediaUrl?.trim() && !msg.message?.trim()) {
    return (
      <div style={textMessageStyle}>
        {getLanguageByKey("Mesajul lipseste")}
      </div>
    );
  }

  const type = msg.mtype || msg.media_type || msg.last_message_type;

  switch (type) {
    case MEDIA_TYPE.IMAGE:
      return (
        <CheckedImage
          url={mediaUrl}
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
          <source src={mediaUrl} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );

    case MEDIA_TYPE.AUDIO:
      return <Audio src={mediaUrl} />;

    case MEDIA_TYPE.FILE:
      return (
        <File
          bg={colors.gray[4]}
          label={spliceMessage(mediaUrl)}
          src={mediaUrl}
        />
      );

    case MEDIA_TYPE.IG_REEL:
      return (
        <video
          controls
          style={{ borderRadius: "8", maxWidth: 500, maxHeight: 500 }}
        >
          <source src={mediaUrl} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );

    case MEDIA_TYPE.SHARE: {
      const isImage = mediaUrl.match(/\.(jpeg|jpg|png|webp|gif|photo)$/i);

      return isImage ? (
        <CheckedImage
          url={mediaUrl}
          style={{ maxWidth: 500, maxHeight: 500 }}
          renderFallbackImage={() => (
            <Text c="red" size="xs">
              {getLanguageByKey("failToLoadImage")}
            </Text>
          )}
        />
      ) : (
        <Text>{mediaUrl}</Text>
      );
    }

    case MEDIA_TYPE.EMAIL:
      return <EmailMessage 
        message={msg.message} 
        platform_id={msg.platform_id} 
        page_id={msg.page_id} 
      />;

    default:
      // Для текстовых сообщений используем message, для медиа - mediaUrl
      const displayText = msg.message || mediaUrl;

      return isStoreFile(displayText) ? (
        <File
          bg={colors.gray[4]}
          label={spliceMessage(displayText)}
          src={displayText}
        />
      ) : (
        <Box maw="600px" w="100%">
          <Text
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            truncate
          >
            {displayText}
          </Text>
        </Box>
      );
  }
};