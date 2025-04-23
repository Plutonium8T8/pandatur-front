import { Flex, FileButton, Button, Tabs, Text, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import { getLanguageByKey, showServerError } from "../../../utils";
import { DD_MM_YYYY__HH_mm_ss } from "../../../../app-constants";
import { api } from "../../../../api";
import { useUploadMediaFile, useConfirmPopup } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import { renderFile, renderMedia, renderCall } from "./utils";
import "./Media.css";

export const Media = ({ messages, id }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile } = useUploadMediaFile();
  const [opened, handlers] = useDisclosure(false);
  const [mediaList, setMediaList] = useState([]);
  const deleteMedia = useConfirmPopup({
    subTitle: getLanguageByKey("confirmDeleteAttachment"),
  });

  const deleteAttachment = async (id) => {
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
      <Tabs
        h="100%"
        className="leads-modal-filter-tabs"
        defaultValue="messages-media"
      >
        <Tabs.List>
          <Tabs.Tab h="100%" value="messages-media">
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
          <Tabs className="leads-modal-filter-tabs" defaultValue="media">
            <Tabs.List>
              <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
              <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
              <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel h="100%" value="media">
              {/* <Box mt="md">{renderMedia(messages)}</Box> */}
            </Tabs.Panel>

            <Tabs.Panel h="100%" value="files">
              <Box mt="md">{renderFile(messages)}</Box>
            </Tabs.Panel>

            <Tabs.Panel h="100%" value="audio">
              <Flex direction="column" mt="md">
                {renderCall(messages)}
              </Flex>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>

        <Tabs.Panel value="uploaded-media">
          <Tabs className="leads-modal-filter-tabs" defaultValue="media">
            <Tabs.List>
              <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
              <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
              <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="media">
              <Flex mt="md" direction="column">
                {renderMedia(mediaList, deleteAttachment, true)}

                <Flex justify="center" mt="md">
                  <FileButton
                    loading={opened}
                    onChange={sendAttachment}
                    accept="image/*,video/*"
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
              </Flex>
            </Tabs.Panel>

            <Tabs.Panel
              className="leads-modal-filter-tabs"
              h="100%"
              value="files"
            >
              <Flex h="100%" mt="md" direction="column">
                {renderFile(mediaList, deleteAttachment, true)}

                <Flex justify="center" mt="md">
                  <FileButton
                    loading={opened}
                    onChange={sendAttachment}
                    accept=".pdf"
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
              </Flex>
            </Tabs.Panel>
            <Tabs.Panel h="100%" value="audio">
              <Flex direction="column" mt="md">
                {renderCall(mediaList, deleteAttachment, true)}

                <Flex justify="center" mt="md">
                  <FileButton
                    loading={opened}
                    onChange={sendAttachment}
                    accept="audio/*"
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
              </Flex>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
