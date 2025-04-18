import { Box, Flex, Image } from "@mantine/core";
import { getLanguageByKey } from "../../utils";
import { DateCell } from "../../DateCell";
import { Empty } from "../../Empty";
import { FALLBACK_IMAGE } from "../../../app-constants";

export const Media = ({ messages }) => {
  return (
    <>
      {messages.length ? (
        messages.map((msg, index) => (
          <Flex direction="column" align="center" mt="md" key={index}>
            <Box mt="5" mb="5" ta="center">
              <DateCell date={msg.time_sent} direction="row" gap="8" />
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
