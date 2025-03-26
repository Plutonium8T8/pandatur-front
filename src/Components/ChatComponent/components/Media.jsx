import { Box, Flex, Image } from "@mantine/core"
import { getLanguageByKey } from "../../utils"
import { DateCell } from "../../DateCell"

const FALLBACK_IMAGE = "https://www.okm.md/_ipx/f_webp&q_75/fallback.webp"

export const Media = ({ messages }) => {
  return (
    <Box h="100%" p="md">
      {messages.map((msg, index) => (
        <Flex direction="column" align="center" mt="md" key={index}>
          <Box mt="6" ta="center" className="sent-time">
            <DateCell date={msg.time_sent} />
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
                window.open(msg.message, "_blank")
              }}
            />
          ) : msg.mtype === "video" ? (
            <video controls className="video-preview">
              <source src={msg.message} type="video/mp4" />
              {getLanguageByKey("Acest browser nu suporta video")}
            </video>
          ) : msg.mtype === "audio" ? (
            <audio controls className="audio-preview">
              <source src={msg.message} type="audio/ogg" />
              {getLanguageByKey("Acest browser nu suporta audio")}
            </audio>
          ) : msg.mtype === "file" ? (
            <a href={msg.message} target="_blank" rel="noopener noreferrer">
              {getLanguageByKey("Deschide file") || "Открыть файл"}
            </a>
          ) : null}
        </Flex>
      ))}
    </Box>
  )
}
