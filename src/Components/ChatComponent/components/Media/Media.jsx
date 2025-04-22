import {
  Flex,
  Image,
  Badge,
  DEFAULT_THEME,
  FileButton,
  Button,
  Divider,
  Tabs,
  Box,
  ActionIcon,
  Text,
} from "@mantine/core";
import { IoClose } from "react-icons/io5";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import {
  getLanguageByKey,
  formattedDate,
  showServerError,
} from "../../../utils";
import { Empty } from "../../../Empty";
import {
  FALLBACK_IMAGE,
  MEDIA_TYPE,
  DD_MM_YYYY__HH_mm_ss,
} from "../../../../app-constants";
import { File } from "../../../File";
import { Audio } from "../../../Audio";
import { api } from "../../../../api";
import { useUploadMediaFile, useConfirmPopup } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import "./Media.css";

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

export const Media = ({ messages, id }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile } = useUploadMediaFile();
  const [opened, handlers] = useDisclosure(false);
  const [mediaList, setMediaList] = useState([]);
  const deleteMedia = useConfirmPopup({
    subTitle: getLanguageByKey("confirmDeleteAttachment"),
  });

  const renderMediaContent = (type, message, id, shouldDelete) => {
    const MEDIA_CONTENT = {
      [MEDIA_TYPE.IMAGE]: (
        <Box
          className="media-wrapper"
          style={{
            boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          }}
          pos="relative"
        >
          {id && (
            <Box
              onClick={() => deleteMediaFile(id)}
              pos="absolute"
              className="media-wrapper-delete-btn"
              bg="white"
              right="10px"
              top="10px"
            >
              <ActionIcon variant="danger">
                <IoClose />
              </ActionIcon>
            </Box>
          )}
          <Image
            radius="md"
            src={message}
            fallbackSrc={FALLBACK_IMAGE}
            onClick={() => {
              window.open(message, "_blank");
            }}
          />
        </Box>
      ),
      [MEDIA_TYPE.VIDEO]: (
        <Box
          className="media-wrapper"
          style={{
            boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          }}
          pos="relative"
        >
          {id && (
            <Box
              onClick={() => deleteMediaFile(id)}
              pos="absolute"
              className="media-wrapper-delete-btn"
              bg="white"
              right="10px"
              top="10px"
            >
              <ActionIcon variant="danger">
                <IoClose />
              </ActionIcon>
            </Box>
          )}
          <video controls className="video-preview">
            <source src={message} type="video/mp4" />
            {getLanguageByKey("Acest browser nu suporta video")}
          </video>
        </Box>
      ),
      [MEDIA_TYPE.AUDIO]: <Audio src={message} />,
      [MEDIA_TYPE.FILE]: (
        <Box pos="relative" className="media-wrapper">
          {id && (
            <Box
              onClick={() => deleteMediaFile(id)}
              pos="absolute"
              className="media-wrapper-delete-btn"
              bg="white"
              right="10px"
              top="10px"
            >
              <ActionIcon variant="danger">
                <IoClose />
              </ActionIcon>
            </Box>
          )}
          <File
            bg={colors.gray[2]}
            src={message}
            label={`${message.slice(0, 15)}...`}
          />
        </Box>
      ),
      [MEDIA_TYPE.CALL]: <Audio src={message} />,
    };

    return MEDIA_CONTENT[type];
  };

  const deleteMediaFile = async (id) => {
    deleteMedia(async () => {
      try {
        await api.tickets.ticket.deleteMediaById(id);
        await getMediaFiles();
      } catch (e) {
        enqueueSnackbar(showServerError(e), {
          variant: "error",
        });
      }
    });
  };

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
      <Tabs defaultValue="messages-media">
        <Tabs.List>
          <Tabs.Tab value="messages-media">
            <Text fw={700} size="sm">
              {getLanguageByKey("messageAttachments")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="uploaded-media">
            <Text fw={700} size="sm">
              {getLanguageByKey("uploadedFiles")}
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel h="100%" value="messages-media">
          <>
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

            {!messages.length && <Empty />}
          </>
        </Tabs.Panel>

        <Tabs.Panel value="uploaded-media">
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

              {renderMediaContent(media.mtype, media.url, media.id)}
            </Flex>
          ))}

          {!mediaList.length && <Empty />}

          <Flex justify="center" mt="md">
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
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
