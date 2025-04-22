import {
  Box,
  Flex,
  Image,
  Badge,
  DEFAULT_THEME,
  FileButton,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import { getLanguageByKey, formattedDate, showServerError } from "../../utils";
import { Empty } from "../../Empty";
import {
  FALLBACK_IMAGE,
  MEDIA_TYPE,
  DD_MM_YYYY__HH_mm_ss,
} from "../../../app-constants";
import { File } from "../../File";
import { Audio } from "../../Audio";
import { api } from "../../../api";
import { useUploadMediaFile } from "../../../hooks";
import { getMediaType } from "../renderContent";

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

export const Media = ({ messages, id }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile } = useUploadMediaFile();
  const [opened, handlers] = useDisclosure(false);
  const [mediaList, setMediaList] = useState([]);

  const getMediaFiles = async () => {
    handlers.open();

    try {
      const mediaList = await api.tickets.ticket.getMediaListByTicketId(id);
      setMediaList(mediaList);
    } catch (e) {
      enqueueSnackbar(showServerError(e), {
        variant: "error",
      });
    } finally {
      handlers.close();
    }
  };

  const sendAttachment = async (file) => {
    handlers.open();
    try {
      const url = await uploadFile(file);

      if (url) {
        await api.tickets.ticket.uploadMedia({
          url,
          ticket_id: id,
          time_sent: dayjs().format(DD_MM_YYYY__HH_mm_ss),
          mtype: getMediaType(file.type),
        });

        await getMediaFiles();
      }
    } catch (e) {
      enqueueSnackbar(showServerError(e), {
        variant: "error",
      });
    } finally {
      handlers.close();
    }
  };

  useEffect(() => {
    getMediaFiles();
  }, []);

  return (
    <>
      {messages.length ? (
        <Flex direction="column" align="center" gap="md">
          {messages.map((msg, index) => {
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
          })}

          {mediaList.map((media, index) => (
            <Flex
              direction="column"
              align="center"
              mt={index ? "md" : "0"}
              key={media.id}
            >
              <Box mb="5" ta="center">
                <Badge c="black" size="lg" bg={colors.gray[2]}>
                  {getTimeFormat(media.time_sent)}
                </Badge>
              </Box>

              {renderMediaContent(media.mtype, media.url)}
            </Flex>
          ))}

          <FileButton
            loading={opened}
            onChange={sendAttachment}
            accept="image/*,video/*,audio/*"
          >
            {(props) => (
              <Button
                leftSection={<IoMdAdd size={16} />}
                variant="outline"
                {...props}
              >
                {getLanguageByKey("addMedia")}
              </Button>
            )}
          </FileButton>
        </Flex>
      ) : (
        <Flex
          h="100%"
          direction="column"
          gap="md"
          justify="center"
          align="center"
        >
          <Empty renderEmptyContent={(content) => content} />
          <FileButton
            loading={opened}
            onChange={sendAttachment}
            accept="image/*,video/*,audio/*"
          >
            {(props) => (
              <Button
                leftSection={<IoMdAdd size={16} />}
                variant="outline"
                {...props}
              >
                {getLanguageByKey("addMedia")}
              </Button>
            )}
          </FileButton>
        </Flex>
      )}
    </>
  );
};
