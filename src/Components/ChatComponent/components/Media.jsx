import { Box, Flex, Image, Badge, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey, formattedDate } from "../../utils";
import { MEDIA_TYPE } from "../renderContent";
import { Empty } from "../../Empty";
import { FALLBACK_IMAGE } from "../../../app-constants";
import { File } from "../../File";
import { Audio } from "../../Audio";

const { colors } = DEFAULT_THEME;

/**
 *
 * @param {string} dateTime
 * @returns {string}
 */
const getTimeFormat = (dateTime) => {
  const { formateDate, formateTime } = formattedDate(dateTime);
  return `${formateDate} ${formateTime}`;
};

const renderMediaContent = (type, message) => {
  const MEDIA_CONTENT = {
    [MEDIA_TYPE.IMAGE]: (
      <Image
        radius="md"
        src={message}
        fallbackSrc={FALLBACK_IMAGE}
        onClick={() => {
          window.open(message, "_blank");
        }}
      />
    ),
    [MEDIA_TYPE.VIDEO]: (
      <video controls className="video-preview">
        <source src={message} type="video/mp4" />
        {getLanguageByKey("Acest browser nu suporta video")}
      </video>
    ),
    [MEDIA_TYPE.AUDIO]: <Audio src={message} />,
    [MEDIA_TYPE.FILE]: (
      <File
        bg={colors.gray[2]}
        src={message}
        label={`${message.slice(0, 15)}...`}
      />
    ),
    [MEDIA_TYPE.CALL]: <Audio src={message} />,
  };

  return MEDIA_CONTENT[type];
};

export const Media = ({ messages }) => {
  return (
    <>
      {messages.length ? (
        messages.map((msg, index) => {
          return (
            <Flex
              direction="column"
              align="center"
              mt={index ? "md" : "0"}
              key={msg.id}
            >
              <Box mb="5" ta="center">
                <Badge c="black" size="lg" bg={colors.gray[2]}>
                  {getTimeFormat(msg.time_sent)}
                </Badge>
              </Box>

              {renderMediaContent(msg.mtype, msg.message)}
            </Flex>
          );
        })
      ) : (
        <Empty />
      )}
    </>
  );
};
