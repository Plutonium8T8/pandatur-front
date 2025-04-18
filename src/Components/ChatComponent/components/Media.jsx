import { Box, Flex, Image, Badge, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey, formattedDate } from "../../utils";
import { Empty } from "../../Empty";
import { FALLBACK_IMAGE } from "../../../app-constants";

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

export const Media = ({ messages }) => {
  return (
    <>
      {messages.length ? (
        messages.map((msg, index) => (
          <Flex direction="column" align="center" mt="md" key={index}>
            <Box mt="5" mb="5" ta="center">
              <Badge c="black" size="lg" bg={colors.gray[2]}>
                {getTimeFormat(msg.time_sent)}
              </Badge>
            </Box>

            {msg.mtype === "image" ? (
              <Image
                mt="5"
                mb="5"
                radius="md"
                src={msg.message}
                fallbackSrc={FALLBACK_IMAGE}
                alt=""
                onClick={() => {
                  window.open(msg.message, "_blank");
                }}
              />
            ) : msg.mtype === "video" ? (
              <video controls className="video-preview">
                <source src={msg.message} type="video/mp4" />
                {getLanguageByKey("Acest browser nu suporta video")}
              </video>
            ) : msg.mtype === "audio" ? (
              <audio controls>
                <source src={msg.message} type="audio/ogg" />
                {getLanguageByKey("Acest browser nu suporta audio")}
              </audio>
            ) : msg.mtype === "file" ? (
              <a href={msg.message} target="_blank" rel="noopener noreferrer">
                {getLanguageByKey("Deschide file") || "Открыть файл"}
              </a>
            ) : null}
          </Flex>
        ))
      ) : (
        <Empty />
      )}
    </>
  );
};
