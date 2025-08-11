import { Flex, FileButton, Button, Tabs, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useCallback, useRef } from "react";
import { IoMdAdd } from "react-icons/io";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import { getLanguageByKey, showServerError } from "@utils";
import { DD_MM_YYYY__HH_mm_ss } from "@app-constants";
import { api } from "../../../../api";
import { useUploadMediaFile, useConfirmPopup } from "@hooks";
import { getMediaType } from "../../renderContent";
import { renderFile, renderMedia, renderCall } from "./utils";
import "./Media.css";

export const Media = ({ messages, id }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile } = useUploadMediaFile();

  const [opened, handlers] = useDisclosure(false);
  const [mediaList, setMediaList] = useState([]);
  const [uploadTab, setUploadTab] = useState("media");
  const [isDragOver, setIsDragOver] = useState(false);

  const dropRef = useRef(null);

  const deleteMedia = useConfirmPopup({
    subTitle: getLanguageByKey("confirmDeleteAttachment"),
  });

  const deleteAttachment = async (mediaId) => {
    deleteMedia(async () => {
      try {
        await api.tickets.ticket.deleteMediaById(mediaId);
        await getMediaFiles();
      } catch (e) {
        enqueueSnackbar(showServerError(e), { variant: "error" });
      }
    });
  };

  const getMediaFiles = async () => {
    handlers.open();
    try {
      const list = await api.tickets.ticket.getMediaListByTicketId(id);
      setMediaList(list || []);
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      handlers.close();
    }
  };

  const sendAttachment = async (file) => {
    if (!file) return;
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
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      handlers.close();
    }
  };

  useEffect(() => {
    if (id) getMediaFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getAcceptForTab = (tab) => {
    if (tab === "media") return "image/*,video/*";
    if (tab === "files") return ".pdf";
    if (tab === "audio") return "audio/*";
    return "*";
  };

  const isAccepted = (file, tab) => {
    if (tab === "files") return /\.pdf$/i.test(file.name);
    if (tab === "media") return file.type.startsWith("image/") || file.type.startsWith("video/");
    if (tab === "audio") return file.type.startsWith("audio/");
    return true;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!opened) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (opened) return;

      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;

      const accepted = files.filter((f) => isAccepted(f, uploadTab));
      const rejected = files.filter((f) => !isAccepted(f, uploadTab));

      if (rejected.length) {
        enqueueSnackbar(
          getLanguageByKey("someFilesRejected") || "Некоторые файлы отклонены по типу",
          { variant: "warning" }
        );
      }

      for (const file of accepted) {
        await sendAttachment(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadTab, opened, id]
  );

  const handlePaste = useCallback(
    async (e) => {
      if (opened) return;
      const files = Array.from(e.clipboardData?.files || []);
      if (!files.length) return;

      const accepted = files.filter((f) => isAccepted(f, uploadTab));
      const rejected = files.filter((f) => !isAccepted(f, uploadTab));

      if (rejected.length) {
        enqueueSnackbar(
          getLanguageByKey("someFilesRejected") || "Некоторые файлы отклонены по типу",
          { variant: "warning" }
        );
      }

      for (const file of accepted) {
        await sendAttachment(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadTab, opened, id]
  );

  const DropZone = ({ children }) => (
    <div
      ref={dropRef}
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        outline: isDragOver ? "2px dashed var(--mantine-color-blue-6)" : "2px dashed transparent",
        borderRadius: 12,
        transition: "outline-color .15s ease",
      }}
    >
      {isDragOver && (
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            textAlign: "center",
            padding: 12,
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          {getLanguageByKey("dragOrPasteToUpload") || "Перетащите или вставьте файлы сюда"}
        </div>
      )}
      {children}
    </div>
  );

  return (
    <>
      <Tabs h="100%" className="media-tabs" defaultValue="messages-media">
        <Tabs.List>
          <Tabs.Tab h="100%" value="messages-media">
            <Text fw={700} size="sm">{getLanguageByKey("messageAttachments")}</Text>
          </Tabs.Tab>
          <Tabs.Tab value="uploaded-media">
            <Text fw={700} size="sm">{getLanguageByKey("uploadedFiles")}</Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel h="calc(100% - 36px)" value="messages-media">
          <Tabs className="media-tabs" defaultValue="media">
            <Tabs.List>
              <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
              <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
              <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel className="media-tabs" h="100%" value="media">
              <Flex h="100%" direction="column" mt="md">
                {renderMedia({ media: messages })}
              </Flex>
            </Tabs.Panel>
            <Tabs.Panel className="media-tabs" h="100%" value="files">
              <Flex h="100%" direction="column" mt="md">
                {renderFile({ media: messages })}
              </Flex>
            </Tabs.Panel>
            <Tabs.Panel className="media-tabs" h="100%" value="audio">
              <Flex h="100%" direction="column" mt="md">
                {renderCall({ media: messages })}
              </Flex>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>

        <Tabs.Panel h="calc(100% - 36px)" value="uploaded-media">
          <Tabs className="media-tabs" value={uploadTab} onChange={setUploadTab}>
            <Tabs.List>
              <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
              <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
              <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel className="media-tabs" h="100%" value="media">
              <DropZone>
                <Flex h="100%" mt="md" direction="column">
                  {renderMedia({
                    media: mediaList,
                    deleteAttachment,
                    shouldDelete: true,
                    renderAddAttachments: () => (
                      <FileButton onChange={sendAttachment} accept={getAcceptForTab("media")}>
                        {(props) => (
                          <Button
                            leftSection={<IoMdAdd size={16} />}
                            variant="outline"
                            loading={opened}
                            disabled={opened || props.disabled}
                            {...props}
                          >
                            {getLanguageByKey("addMedia")}
                          </Button>
                        )}
                      </FileButton>
                    ),
                  })}
                </Flex>
              </DropZone>
            </Tabs.Panel>

            <Tabs.Panel className="media-tabs" h="100%" value="files">
              <DropZone>
                <Flex h="100%" mt="md" direction="column">
                  {renderFile({
                    media: mediaList,
                    deleteAttachment,
                    shouldDelete: true,
                    renderAddAttachments: () => (
                      <FileButton onChange={sendAttachment} accept={getAcceptForTab("files")}>
                        {(props) => (
                          <Button
                            leftSection={<IoMdAdd size={16} />}
                            variant="outline"
                            loading={opened}
                            disabled={opened || props.disabled}
                            {...props}
                          >
                            {getLanguageByKey("addMedia")}
                          </Button>
                        )}
                      </FileButton>
                    ),
                  })}
                </Flex>
              </DropZone>
            </Tabs.Panel>

            <Tabs.Panel className="media-tabs" h="100%" value="audio">
              <DropZone>
                <Flex h="100%" direction="column" mt="md">
                  {renderCall({
                    media: mediaList,
                    deleteAttachment,
                    shouldDelete: true,
                    renderAddAttachments: () => (
                      <FileButton onChange={sendAttachment} accept={getAcceptForTab("audio")}>
                        {(props) => (
                          <Button
                            leftSection={<IoMdAdd size={16} />}
                            variant="outline"
                            loading={opened}
                            disabled={opened || props.disabled}
                            {...props}
                          >
                            {getLanguageByKey("addMedia")}
                          </Button>
                        )}
                      </FileButton>
                    ),
                  })}
                </Flex>
              </DropZone>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
