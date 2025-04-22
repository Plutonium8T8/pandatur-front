import {
  Flex,
  Image,
  Badge,
  DEFAULT_THEME,
  FileButton,
  Button,
  Divider,
  Box,
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
  }, [id]);

  return (
    <>
      {mediaList.map((media, index) => (
        <Flex direction="column" align="center" key={media.id}>
          <Divider
            w="100%"
            label={
              <Badge c="black" size="lg" bg={colors.gray[2]}>
                {getTimeFormat(media.time_sent)}
              </Badge>
            }
            my="md"
            labelPosition="center"
          />

          {renderMediaContent(media.mtype, media.url)}
        </Flex>
      ))}

      {messages.map((msg, index) => {
        return (
          <Flex direction="column" align="center">
            <Divider
              w="100%"
              my="md"
              label={
                <Badge c="black" size="lg" bg={colors.gray[2]}>
                  {getTimeFormat(msg.time_sent)}
                </Badge>
              }
              labelPosition="center"
            />

            {renderMediaContent(msg.mtype, msg.message)}
          </Flex>
        );
      })}

      {(!!messages.length || !!mediaList.length) && (
        <Flex mt="md" justify="center">
          <FileButton
            loading={opened}
            onChange={sendAttachment}
            accept="image/*,video/*,audio/*,.pdf"
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

      {!messages.length && !mediaList.length && (
        <>
          <Flex
            h="100%"
            align="center"
            direction="column"
            justify="center"
            gap="md"
          >
            <Empty
              renderEmptyContent={(content) => (
                <Flex
                  direction="column"
                  align="center"
                  c={DEFAULT_THEME.colors.dark[2]}
                >
                  {content}
                </Flex>
              )}
            />
            <FileButton
              loading={opened}
              onChange={sendAttachment}
              accept="image/*,video/*,audio/*,.pdf"
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
        </>
      )}
    </>
  );
};
