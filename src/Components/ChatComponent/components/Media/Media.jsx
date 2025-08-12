import { Flex, Tabs, Text, ActionIcon, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import { getLanguageByKey, showServerError } from "@utils";
import { DD_MM_YYYY__HH_mm_ss } from "@app-constants";
import { api } from "../../../../api";
import { useUploadMediaFile, useConfirmPopup } from "@hooks";
import { getMediaType } from "../../renderContent";
import { renderFile, renderMedia, renderCall } from "./utils";
import { ChatNoteCard } from "../../../ChatNoteCard";
import { FiTrash2 } from "react-icons/fi";
import "./Media.css";

export const Media = ({ messages, id }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile } = useUploadMediaFile();

  const [opened, handlers] = useDisclosure(false);
  const [mediaList, setMediaList] = useState([]);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [uploadTab, setUploadTab] = useState("media");
  const [isDragOver, setIsDragOver] = useState(false);

  const dropRef = useRef(null);

  const confirmDeleteMedia = useConfirmPopup({
    subTitle: getLanguageByKey("confirmDeleteAttachment"),
  });

  const confirmDeleteNote = useConfirmPopup({
    subTitle: getLanguageByKey("confirmDeleteNote") || "Удалить заметку?",
  });

  const deleteAttachment = async (mediaId) => {
    confirmDeleteMedia(async () => {
      try {
        await api.tickets.ticket.deleteMediaById(mediaId);
        await getMediaFiles();
      } catch (e) {
        enqueueSnackbar(showServerError(e), { variant: "error" });
      }
    });
  };

  const deleteNoteById = async (noteId) => {
    confirmDeleteNote(async () => {
      try {
        await api.messages.notes.deleteById(noteId); // <-- проверь, что есть в API
        await getTicketNotes();
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

  const getTicketNotes = async () => {
    setNotesLoading(true);
    try {
      const list = await api.messages.notes.getByTicketId(id);
      setNotes(Array.isArray(list) ? list : []);
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      setNotesLoading(false);
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
    if (id) {
      getMediaFiles();
      getTicketNotes();
    }
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
        enqueueSnackbar(getLanguageByKey("someFilesRejected") || "Некоторые файлы отклонены по типу", {
          variant: "warning",
        });
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
        enqueueSnackbar(getLanguageByKey("someFilesRejected") || "Некоторые файлы отклонены по типу", {
          variant: "warning",
        });
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
      {children}
    </div>
  );

  // нормализация заметки под ChatNoteCard (формат времени)
  const normalizeNote = (n) => ({
    ...n,
    timeCreatedDisplay: dayjs(n.created_at || n.time_created).isValid()
      ? dayjs(n.created_at || n.time_created).format(DD_MM_YYYY__HH_mm_ss)
      : "",
  });

  return (
    <>
      <Tabs h="100%" className="media-tabs" defaultValue="messages-media">
        <Tabs.List>
          <Tabs.Tab h="100%" value="messages-media">
            <Text fw={700} size="sm">{getLanguageByKey("messageAttachments")}</Text>
          </Tabs.Tab>
          <Tabs.Tab value="uploaded-media">
            <Text fw={700} size="sm">{getLanguageByKey("FileNotice")}</Text>
          </Tabs.Tab>
        </Tabs.List>

        {/* Вложения из сообщений (read-only) */}
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

        {/* Загрузки тикета + заметки (с удалением) */}
        <Tabs.Panel h="calc(100% - 36px)" value="uploaded-media">
          <Tabs className="media-tabs" value={uploadTab} onChange={setUploadTab}>
            <Tabs.List>
              <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
              <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
              <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
              <Tabs.Tab value="notes">{getLanguageByKey("Notice") || "Заметки"}</Tabs.Tab>
            </Tabs.List>

            {/* MEDIA */}
            <Tabs.Panel className="media-tabs" h="100%" value="media">
              <DropZone>
                <Flex h="100%" direction="column" mt="md">
                  {renderMedia({
                    media: mediaList,
                    deleteAttachment,     // <- вернул
                    shouldDelete: true,   // <- вернул
                  })}
                </Flex>
              </DropZone>
            </Tabs.Panel>

            {/* FILES */}
            <Tabs.Panel className="media-tabs" h="100%" value="files">
              <DropZone>
                <Flex h="100%" direction="column" mt="md">
                  {renderFile({
                    media: mediaList,
                    deleteAttachment,     // <- вернул
                    shouldDelete: true,   // <- вернул
                  })}
                </Flex>
              </DropZone>
            </Tabs.Panel>

            {/* AUDIO */}
            <Tabs.Panel className="media-tabs" h="100%" value="audio">
              <DropZone>
                <Flex h="100%" direction="column" mt="md">
                  {renderCall({
                    media: mediaList,
                    deleteAttachment,     // <- вернул
                    shouldDelete: true,   // <- вернул
                  })}
                </Flex>
              </DropZone>
            </Tabs.Panel>

            {/* NOTES */}
            <Tabs.Panel className="media-tabs" h="100%" value="notes">
              <Flex direction="column" gap="12" mt="md">
                {notesLoading ? (
                  <Text size="sm">{getLanguageByKey("loading")}...</Text>
                ) : notes.length ? (
                  notes.map((n) => (
                    <Flex key={n.id} align="stretch" gap={8}>
                      <ChatNoteCard
                        note={normalizeNote(n)}
                        techLabel={`#${n.technician_id || ""}`}
                        showActions
                        style={{ flex: 1 }}
                      />
                      <Tooltip label={getLanguageByKey("delete") || "Удалить"}>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => deleteNoteById(n.id)}
                          aria-label="delete-note"
                          mt={4}
                        >
                          <FiTrash2 />
                        </ActionIcon>
                      </Tooltip>
                    </Flex>
                  ))
                ) : (
                  <Text c="dimmed">{getLanguageByKey("noNotesYet") || "Заметок пока нет"}</Text>
                )}
              </Flex>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
